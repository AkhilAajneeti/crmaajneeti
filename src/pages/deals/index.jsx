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
import { useLeads, useNewLeads } from "hooks/useLeads";
import { useMetaData } from "hooks/useMetaData";
import { useLeadDetails } from "hooks/useLeadDetails";
import { canCreate, canDelete, canEdit, canGlobal } from "utils/permissions";

// List view-state (filters/page/limit/sort) is persisted per browser-tab session
// so it survives the remount that happens when the drawer route opens/closes.
// Cleared only when the user explicitly clears filters.
const LEADS_VIEW_KEY = "leads_view_state";
const loadLeadsView = () => {
  try {
    return JSON.parse(sessionStorage.getItem(LEADS_VIEW_KEY)) || {};
  } catch {
    return {};
  }
};

const DealsPage = () => {
  const navigate = useNavigate();
  // EspoCRM-style URL params: /Lead/<action>/<id?>
  const { action: urlAction, id: urlId } = useParams();

  const queryClient = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [limit, setLimit] = useState(() => loadLeadsView().limit ?? 20);
  const [page, setPage] = useState(() => loadLeadsView().page ?? 1);
  const [mode, setMode] = useState("view");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const canCreateLead = canCreate("Lead");
  const canEditLead = canEdit("Lead");
  const canDeleteLead = canDelete("Lead");
  const canExportLead = canGlobal("exportPermission");
  const canMassUpdateLead = canGlobal("massUpdatePermission") && canEditLead;

  // const { data: metaData } = useMetaData();
  const { data: leadsDetails } = useLeadDetails(selectedDeal?.id, mode);

  // Drawer state derived from URL — single source of truth.
  // /leads                  → drawer closed
  // /Lead/view/:id          → drawer open, view mode, record :id
  // /Lead/edit/:id          → drawer open, edit mode, record :id
  // /Lead/create            → drawer open, add mode (drawer's create flow uses "add")
  // /Lead/mass-update       → drawer open, mass-update mode (uses selectedDeals)
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
      // Minimal placeholder so useLeadDetails fires; promoted to full record below.
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

  // When arriving via a deep link, promote the minimal {id} placeholder
  // into the full record once useLeadDetails resolves — so the drawer's
  // form-init (setFormData(deal)) sees real values instead of just {id}.
  useEffect(() => {
    if (!urlId || !leadsDetails || leadsDetails.id !== urlId) return;
    setSelectedDeal((current) => {
      if (current?.id === urlId && !current.name) return leadsDetails;
      return current;
    });
  }, [leadsDetails, urlId]);

  const [sortConfig, setSortConfig] = useState(
    () => loadLeadsView().sortConfig || { key: "createdAt", direction: "desc" }
  );
  const [filters, setFilters] = useState(
    () =>
      loadLeadsView().filters || {
        search: "",
        status: "",
        sector: "",
        projectName: "",
        source: "",
        assignUser: "",
        dateType: "",
        closeDateFrom: "",
        closeDateTo: "",
        xDays: "",
      }
  );

  // Persist the list view-state so it survives the drawer-route remount.
  useEffect(() => {
    sessionStorage.setItem(
      LEADS_VIEW_KEY,
      JSON.stringify({ filters, page, limit, sortConfig })
    );
  }, [filters, page, limit, sortConfig]);

  const { data: leadsData, isLoading } = useNewLeads({ limit, page, filters });
  const createLeadMutation = useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      toast.success("Lead created");
      queryClient.invalidateQueries({ queryKey: ["leads"], exact: false });
    },
  });
  const deleteLeadMutation = useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries(["leads"]);
    },
  });
  // fetch leads
  const leads = leadsData?.list || [];
  // const source = metaData?.sources || [];
  // const status = metaData?.status || [];
  // const industry = metaData?.industries || [];
  const total = leadsData?.total || 0;
  const exportLeadsToCSV = (rows, fileName = "leads_export") => {
    if (!rows || rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = rows.map((lead) => ({
      Name: lead?.name || "",
      Email: lead?.emailAddress || "",
      Phone: lead?.phoneNumber || "",
      Status: lead?.status || "",
      Source: lead?.source || "",
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
    if (!canCreateLead) return;
    navigate("/Lead/create");
  };

  const handleDealClick = (deal) => {
    // Set the full record first so the drawer has data immediately;
    // the URL effect sees the matching id and won't overwrite with a placeholder.
    setSelectedDeal(deal);
    navigate(`/Lead/view/${deal.id}`);
  };

  const handleDrawerClose = () => {
    // Replace so browser-back doesn't re-open the drawer you just closed.
    navigate("/leads", { replace: true });
  };
  const handleCreateLead = async (payload) => {
    if (!canCreateLead) return;
    try {
      createLeadMutation.mutate(payload);
    } catch (err) {
      console.error("Lead creationd failed", err);
      throw err;
    }
  };

  // const handleUpdateLead = async (id, payload) => {
  //   if (!canEditLead) return;
  //   await updateLead(id, payload);
  // };
  const handleUpdateLead = async (id, payload) => {
    if (!canEditLead) return;

    try {
      await updateLead(id, payload);

      toast.success("Lead updated successfully");

      queryClient.invalidateQueries({ queryKey: ["leads"], exact: false });
    } catch (err) {
      console.error("Lead update failed", err);

      toast.error("Lead update failed");

      throw err;
    }
  };

  const handleDeleteLead = async (id) => {
    if (!canDeleteLead) return;
    try {
      toast.loading("Deleting lead...", { id: "delete-lead" });
      deleteLeadMutation.mutate(id);
    } catch (err) {
      console.error("Delete failed", err);
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
      source: "",
      sector: "",
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
      if (!canMassUpdateLead) return;
      if (!selectedDeals.length) {
        toast.error("Select at least one lead");
        return;
      }
      navigate("/Lead/mass-update");
      return;
    }

    if (action === "export") {
      if (!canExportLead) return;
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
      if (!canDeleteLead) return;
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
      if (!canMassUpdateLead) return;
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
        <title>Leads - Aajneeti Connect ltd</title>
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
                  Leads
                </h1>
                <p className="text-muted-foreground mt-1">
                  Track and manage your sales opportunities
                </p>
              </div>
              <div className="flex items-center justify-end space-x-3">
                {canExportLead && (
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
                )}

                {canCreateLead && (
                  <Button
                    onClick={handleAddLeads}
                    className="linearbg-1 text-white hover:text-white"
                  >
                    <Icon name="Plus" size={16} className="mr-2" />
                    New Lead
                  </Button>
                )}
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
              canDelete={canDeleteLead}
              canExport={canExportLead}
              canMassUpdate={canMassUpdateLead}

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
                {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <IndustryChart leads={leads} />

                  <MultiLineChart leads={leads} />

                  <StatusChart leads={leads} />

                  <AssignedUserChart leads={leads} />
                </div> */}
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
              onDelete={handleDeleteLead}
              isLoading={isLoading}
              page={page}
              setPage={setPage}
              canEdit={canEditLead}
              canDelete={canDeleteLead}
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
              // status={status}
              // industry={industry}
              // source={source}
              leadsDetails={leadsDetails}
              deal={selectedDeal}
              mode={mode}
              isOpen={isDrawerOpen}
              onCreate={handleCreateLead}
              onUpdate={handleUpdateLead}
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

export default DealsPage;
