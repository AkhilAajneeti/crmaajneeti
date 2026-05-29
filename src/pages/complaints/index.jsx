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
import {
  createLead,
  deleteActivity,
  deleteLead,
  updateLead,
} from "services/leads.service";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import StatusChart from "./components/charts/StatusChart";
import IndustryChart from "./components/charts/IndustryChart";
import AssignedUserChart from "./components/charts/AssignedUserChart";
import MultiLineChart from "pages/dashboard/components/MultiLineChart";

import { useMetaData } from "hooks/useMetaData";

import { useComplaint, useComplaintById } from "hooks/useComplaint";
import { createComplaint, deleteComplaint, updateComplaint } from "services/complaint.service";

const Complaints = () => {
  const navigate = useNavigate();
  // EspoCRM-style URL params: /Case/<action>/<id?>
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

  const { data: metaData } = useMetaData();
  const { data: leadsDetails } = useComplaintById(selectedDeal?.id, mode);

  // Drawer state derived from URL — single source of truth.
  // /complaints                  → drawer closed
  // /Case/view/:id               → drawer open, view mode, record :id
  // /Case/edit/:id               → drawer open, edit mode, record :id
  // /Case/create                 → drawer open, add mode (drawer's create flow uses "add")
  // /Case/mass-update            → drawer open, mass-update mode (uses selectedDeals)
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
  // record once useComplaintById resolves — so the drawer's edit-form init
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
    projectName: "",
    priority: "",
    assignUser: "",
    dateType: "",        // 👈 NEW (today, before, between, etc.)
    closeDateFrom: "",
    closeDateTo: "",
    xDays: ""            // 👈 for "Last X Days", "After X Days"
  });
  const { data: leadsData, isLoading } = useComplaint({ limit, page, filters });
  const createLeadMutation = useMutation({
    mutationFn: createComplaint,
    onSuccess: () => {
      toast.success("Complaint created");
      queryClient.invalidateQueries({ queryKey: ["complaint"], exact: false });
    },
  });

  // fetch complaint
  const leads = leadsData?.list || [];

  const total = leadsData?.total || 0;
  const exportLeadsToCSV = (rows, fileName = "complaint_export") => {
    if (!rows || rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = rows.map((lead) => ({
      Name: lead?.name || "",
      Email: lead?.emailAddress || "",
      Phone: lead?.phoneNumber || "",
      Status: lead?.status || "",
      Priority: lead?.priority || "",
      "Project Name": lead?.cProjectName || "",
      "Assigned User": lead?.assignedUserName || "",
      "Next Contact": lead?.cNextContact || "",
      "Created At": lead?.createdAt || "",
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

  const handleAddLeads = () => {
    navigate("/Case/create");
  };

  const handleDealClick = (deal) => {
    // Set the full record first so the drawer has data immediately;
    // the URL effect sees the matching id and won't overwrite with a placeholder.
    setSelectedDeal(deal);
    navigate(`/Case/view/${deal.id}`);
  };

  const handleDrawerClose = () => {
    // Replace so browser-back doesn't re-open the drawer you just closed.
    navigate("/complaints", { replace: true });
  };
  const handleCreateComplaint = async (payload) => {
    try {
      createLeadMutation.mutate(payload);
    } catch (err) {
      console.error("Lead creationd failed", err);
    }
  };

  const handleUpdateComplaint = async (id, payload) => {
    try {
      await updateComplaint(id, payload);

      toast.success("Complaint updated ✅");

      queryClient.invalidateQueries(["complaint"]); // 🔥 refresh list
    } catch (error) {
      console.error(error);
      toast.error("Update failed ❌");
    }
  };

  const handleDeleteComplaint = async (id) => {
    try {
      toast.loading("Deleting complaint...", { id: "delete" });

      await deleteComplaint(id);

      toast.success("Complaint deleted ✅", { id: "delete" });

      queryClient.invalidateQueries(["complaint"]);
    } catch (err) {
      console.error(err);
      toast.error("Delete failed ❌", { id: "delete" });
    }
  };
  const handleDeleteActivity = async (id) => {
    try {
      await deleteActivity(id); // API call
      toast.success("Activity deleted successfully");
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleSelectDeal = (dealId, isSelected) => {
    if (isSelected) {
      setSelectedDeals([...selectedDeals, dealId]);
    } else {
      setSelectedDeals(selectedDeals?.filter((id) => id !== dealId));
    }
  };

  const handleSelectAll = (isSelected) => {
    const currentPageDeals = deals.map((deal) => deal.id);

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
      projectName: "",
      priority: "",
      assignUser: "",
      dateType: "",        // 👈 NEW (today, before, between, etc.)
      closeDateFrom: "",
      closeDateTo: "",
      xDays: ""
    });
    setPage(1);
  };
  const handleBulkAction = (action) => {
    if (action === "mass-update") {
      if (!selectedDeals.length) {
        toast.error("Select at least one lead");
        return;
      }
      navigate("/Case/mass-update");
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
      return Promise.all(ids.map((id) => deleteLead(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leads"]);
      toast.success("Selected leads deleted");
    },
  });
  const handleConfirmBulkDelete = () => {
    if (!selectedDeals.length) {
      toast.error("No leads selected");
      return;
    }

    toast.loading("Deleting leads...", { id: "bulk-delete" });

    bulkDeleteMutation.mutate(selectedDeals, {
      onSuccess: () => {
        toast.success("Selected leads deleted", { id: "bulk-delete" });
        setSelectedDeals([]);
        setShowDeleteConfirm(false);
      },
      onError: () => {
        toast.error("Failed to delete leads", { id: "bulk-delete" });
      },
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setPage(1);
  };
  const handleBulkUpdateLeads = async (payload) => {
    try {
      toast.loading("Updating leads...", { id: "bulk-update" });

      await Promise.all(selectedDeals.map((id) => updateLead(id, payload)));

      toast.success(`${selectedDeals.length} leads updated`, {
        id: "bulk-update",
      });

      // setLeads(data.list);
      queryClient.invalidateQueries(["leads"]);

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
        <title>Complaints - Aajneeti Connect ltd</title>
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
                  Complaints
                </h1>
                <p className="text-muted-foreground mt-1">
                  Monitor, prioritize, and resolve customer issues in one place
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  className="linearbg-1 text-white hover:text-white"
                  variant="outline"
                  onClick={() =>
                    exportLeadsToCSV(leads, "all_leads")
                  }
                >
                  <Icon name="Download" size={16} className="mr-2" />
                  Export All
                </Button>

                <Button
                  onClick={handleAddLeads}
                  className="linearbg-1 text-white hover:text-white"
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  Create Complaint
                </Button>
              </div>
            </div>

            {/* Filters */}
            <DealsFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              total={total}
              onBulkAction={handleBulkAction}
              selectedCount={selectedDeals?.length}
              toggleAnalytics={() => setShowAnalytics((prev) => !prev)}

            />
            {/* chartsAnanlysis */}
            {showAnalytics && (
              <div className="bg-card border border-border rounded-lg p-5 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Lead Analytics</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAnalytics((prev) => !prev)}
                  >
                    <Icon name="X" size={20} />
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <IndustryChart leads={leads} />

                  <MultiLineChart leads={leads} />

                  <StatusChart leads={leads} />

                  <AssignedUserChart leads={leads} />
                </div>
              </div>
            )}

            {/* Deals Table */}
            <DealsTable
              deals={leads}
              selectedDeals={selectedDeals}
              onSelectDeal={handleSelectDeal}
              onSelectAll={handleSelectAll}
              onDealClick={handleDealClick}
              sortConfig={sortConfig}
              onSort={handleSort}
              onDelete={handleDeleteComplaint}
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
              onCreate={handleCreateComplaint}
              onUpdate={handleUpdateComplaint}
              onClose={handleDrawerClose}
              onDelete={handleDeleteActivity}
              onBulkUpdate={handleBulkUpdateLeads}
              selectedIds={selectedDeals}
            />

            <ConfirmDeleteModal
              open={showDeleteConfirm}
              title="Delete Selected Leads"
              description={`Are you sure you want to delete ${selectedDeals.length} lead(s)? This action cannot be undone.`}
              onCancel={() => setShowDeleteConfirm(false)}
              onConfirm={handleConfirmBulkDelete}
            />
          </div>
        </main>
      </div>
    </>
  );
};

export default Complaints;
