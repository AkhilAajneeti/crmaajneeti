import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import toast from "react-hot-toast";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import DealsTable from "./components/DealsTable";
import DealsFilters from "./components/DealsFilters";
import DealDrawer from "./components/DealDrawer";
import Papa from "papaparse";
import TablePagination from "./components/TablePagination";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import ConfirmDeleteModal from "./components/ConfirmDeleteModal";

import { useKnowledge, useKnowledgeById } from "hooks/useKnowledge";
import { createArticle, deleteArticle, updateArticle } from "services/knowledge.service";

const KnowledgeBase = () => {
  const navigate = useNavigate();
  // EspoCRM-style URL params: /KnowledgeBaseArticle/<action>/<id?>
  const { action: urlAction, id: urlId } = useParams();

  const queryClient = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState("view");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { data: leadsDetails } = useKnowledgeById(selectedDeal?.id, mode);

  // Drawer state derived from URL — single source of truth.
  // /knowledge-base                          → drawer closed
  // /KnowledgeBaseArticle/view/:id           → drawer open, view mode, record :id
  // /KnowledgeBaseArticle/edit/:id           → drawer open, edit mode, record :id
  // /KnowledgeBaseArticle/create             → drawer open, add mode (drawer's create flow uses "add")
  // /KnowledgeBaseArticle/mass-update        → drawer open, mass-update mode (uses selectedDeals)
  useEffect(() => {
    if (urlAction === "create") {
      setSelectedDeal(null);
      setMode("add");
      setIsDrawerOpen(true);
    } else if (urlAction === "mass-update") {
      setSelectedDeal(null);
      setMode("mass-update");
      setIsDrawerOpen(true);
    } else if (urlId) {
      // Minimal placeholder; the promote effect below upgrades it once the
      // full record arrives — needed because the drawer's setFormData(deal)
      // reads field values directly from this object.
      setSelectedDeal((current) =>
        current?.id === urlId ? current : { id: urlId }
      );
      setMode(urlAction === "edit" ? "edit" : "view");
      setIsDrawerOpen(true);
    } else {
      setIsDrawerOpen(false);
      setSelectedDeal(null);
      setMode("view");
    }
  }, [urlAction, urlId]);

  // When arriving via a deep link, promote the {id} placeholder to the full
  // record once useKnowledgeById resolves — so the drawer's edit-form init
  // sees real values instead of just {id}.
  useEffect(() => {
    if (!urlId || !leadsDetails || leadsDetails.id !== urlId) return;
    setSelectedDeal((current) => {
      if (current?.id === urlId && !current.name) return leadsDetails;
      return current;
    });
  }, [leadsDetails, urlId]);

  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    language: "",
    assignUser: "",
    dateType: "",
    closeDateFrom: "",
    closeDateTo: "",     // 👈 for "Last X Days", "After X Days"
  });
  const { data: leadsData, isLoading } = useKnowledge({ limit, page, filters });
  const createLeadMutation = useMutation({
    mutationFn: createArticle,
    onSuccess: () => {
      toast.success("article created");
      queryClient.invalidateQueries({ queryKey: ["article"], exact: false });
    },
  });
  const deleteArticleMutation = useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries(["article"]);
    },
  });
  // fetch leads
  const leads = leadsData?.list || [];
  const total = leadsData?.total || 0;
  const exportLeadsToCSV = (rows, fileName = "article_export") => {
    if (!rows || rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = rows.map((lead) => ({
      Name: item?.name || "",
      Status: item?.status || "",
      Language: item?.language || "",
      "Assigned User": item?.assignedUserName || "",
      "Created At": item?.createdAt || "",
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}_${new Date().toISOString().split("T")[0]}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };



  const totalPages = Math.ceil(total / limit);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleAddArticle = () => {
    navigate("/KnowledgeBaseArticle/create");
  };

  const handleDealClick = (deal) => {
    // Set the full record first so the drawer has data immediately;
    // the URL effect sees the matching id and won't overwrite with a placeholder.
    setSelectedDeal(deal);
    navigate(`/KnowledgeBaseArticle/view/${deal.id}`);
  };

  const handleDrawerClose = () => {
    // Replace so browser-back doesn't re-open the drawer you just closed.
    navigate("/knowledge-base", { replace: true });
  };
  const handleCreateArticle = async (payload) => {
    try {
      createLeadMutation.mutate(payload);
    } catch (err) {
      console.error("Article creationd failed", err);
    }
  };

  const handleUpdateArticle = async (id, payload) => {
    try {
      await updateArticle(id, payload);

      toast.success("Article updated ✏️");

      queryClient.invalidateQueries(["article"]);
    } catch (err) {
      console.error(err);
      toast.error("Update failed ❌");
    }
  };

  const handleDeleteArticle = (id) => {
    toast.loading("Deleting article...", { id: "delete" });

    deleteArticleMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Article deleted ✅", { id: "delete" });
        queryClient.invalidateQueries(["article"]);
      },
      onError: () => {
        toast.error("Delete failed ❌", { id: "delete" });
      },
    });
  };


  const handleSelectDeal = (dealId, isSelected) => {
    if (isSelected) {
      setSelectedDeals([...selectedDeals, dealId]);
    } else {
      setSelectedDeals(selectedDeals?.filter((id) => id !== dealId));
    }
  };

  const handleSelectAll = (isSelected) => {
    const currentPageDeals = leads.map((deal) => deal.id);

    if (isSelected) {
      setSelectedDeals([...new Set([...selectedDeals, ...currentPageDeals])]);
    } else {
      setSelectedDeals(
        selectedDeals.filter((id) => !currentPageDeals.includes(id))
      );
    }
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig?.key === key && prevConfig?.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "",
      language: "",
      assignUser: "",
      dateType: "",
      closeDateFrom: "",
      closeDateTo: "",
    });
    setPage(1);
  };
  const handleBulkAction = (action) => {
    if (action === "mass-update") {
      if (!selectedDeals.length) {
        toast.error("Select at least one Article");
        return;
      }
      navigate("/KnowledgeBaseArticle/mass-update");
      return;
    }

    if (action === "export") {
      if (!selectedDeals.length) {
        toast.error("Select at least one lead");
        return;
      }

      const selectedRows = leads.filter((deal) =>
        selectedDeals.includes(deal.id),
      );

      exportLeadsToCSV(selectedRows, "selected_leads");
      return;
    }

    if (action === "delete") {
      if (!selectedDeals.length) {
        toast.error("Select at least one lead");
        return;
      }

      setShowDeleteConfirm(true);
      return;
    }

    if (action === "stage" || action === "owner") {
      // later mass update drawer
    }
  };
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      return Promise.all(ids.map((id) => deleteArticle(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["article"]);
      toast.success("Selected article deleted");
    },
  });
  const handleConfirmBulkDelete = () => {
    if (!selectedDeals.length) {
      toast.error("No Article selected");
      return;
    }

    toast.loading("Deleting Article...", { id: "bulk-delete" });

    bulkDeleteMutation.mutate(selectedDeals, {
      onSuccess: () => {
        toast.success("Selected Article deleted", { id: "bulk-delete" });
        setSelectedDeals([]);
        setShowDeleteConfirm(false);
      },
      onError: () => {
        toast.error("Failed to delete leads", { id: "bulk-delete" });
      },
    });
  };

  const handleBulkUpdateArticle = async (payload) => {
    try {
      toast.loading("Updating article...", { id: "bulk-update" });

      await Promise.all(selectedDeals.map((id) => updateArticle(id, payload)));

      toast.success(`${selectedDeals.length} article updated`, {
        id: "bulk-update",
      });

      // setarticle(data.list);
      queryClient.invalidateQueries(["article"]);

      setSelectedDeals([]);
      setIsDrawerOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Mass update failed", { id: "bulk-update" });
    }
  };


  return (
    <>
      <Helmet>
        <title>Knowledge Base - Aajneeti Connect ltd</title>
        <meta
          name="description"
          content="Manage and track your sales deals with comprehensive filtering and pipeline management tools."
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
        <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />

        <main className="lg:ml-64 pt-16">
          <div className="p-4 lg:p-6">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Knowledge Base
                </h1>
                <p className="text-muted-foreground mt-1">
                  Empower your team with structured knowledge management
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  className="linearbg-1 text-white hover:text-white"
                  variant="outline"
                  onClick={() =>
                    exportLeadsToCSV(article, "all_Article")
                  }
                >
                  <Icon name="Download" size={16} className="mr-2" />
                  Export All
                </Button>

                <Button
                  onClick={handleAddArticle}
                  className="linearbg-1 text-white hover:text-white"
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  Create Article
                </Button>
              </div>
            </div>

            {/* Filters */}
            <DealsFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              dealCount={total}
              onBulkAction={handleBulkAction}
              selectedCount={selectedDeals?.length}
              toggleAnalytics={() => setShowAnalytics((prev) => !prev)}

            />


            {/* Deals Table */}
            <DealsTable
              deals={leads}
              selectedDeals={selectedDeals}
              onSelectDeal={handleSelectDeal}
              onSelectAll={handleSelectAll}
              onDealClick={handleDealClick}
              sortConfig={sortConfig}
              onSort={handleSort}
              onDelete={handleDeleteArticle}
              isLoading={isLoading}
              page={page}
              setPage={setPage}
            />

            {/* Pagination */}
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={limit}
              onPageChange={(p) => setPage(p)}
              onItemsPerPageChange={(val) => {
                setLimit(val);
                setPage(1);
              }}
            />

            {/* Deal Drawer */}
            <DealDrawer

              leadsDetails={leadsDetails}
              deal={selectedDeal}
              mode={mode}
              isOpen={isDrawerOpen}
              onCreate={handleCreateArticle}
              onUpdate={handleUpdateArticle}
              onClose={handleDrawerClose}

              onBulkUpdate={handleBulkUpdateArticle}
              selectedIds={selectedDeals}
            />

            <ConfirmDeleteModal
              open={showDeleteConfirm}
              title="Delete Selected Articles"
              description={`Are you sure you want to delete ${selectedDeals.length} article(s)? This action cannot be undone.`}
              onCancel={() => setShowDeleteConfirm(false)}
              onConfirm={handleConfirmBulkDelete}
            />
          </div>
        </main>
      </div>
    </>
  );
};

export default KnowledgeBase;
