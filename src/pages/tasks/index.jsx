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
import {
  createTasks,
  deleteTasks,
  updateTasks,
  bulkDeleteTasks,
  deleteActivity,
} from "services/tasks.service";
import { useQueryClient } from "@tanstack/react-query";
import { useTasks, useTasksAll, useTasksById } from "hooks/useTasks";
import { canCreate, canDelete, canEdit, canGlobal } from "utils/permissions";
const TaskPage = () => {
  const navigate = useNavigate();
  // EspoCRM-style URL params: /Task/<action>/<id?>
  const { action: urlAction, id: urlId } = useParams();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [mode, setMode] = useState("view");
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    assignUser: "",
    startDate: "",
    endDate: "",
    dateType: "",
  });
  const canCreateTask = canCreate("Task");
  const canEditTask = canEdit("Task");
  const canDeleteTask = canDelete("Task");
  const canExportTask = canGlobal("exportPermission");
  const canMassUpdateTask = canGlobal("massUpdatePermission") && canEditTask;
  const queryClient = useQueryClient();
  const { data, isLoading } = useTasks();
  const { data: allTasksData } = useTasksAll({ limit, page,filters });
  const tasks = allTasksData?.list || [];
  const total = allTasksData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Drawer state derived from URL — single source of truth.
  // /tasks                  → drawer closed
  // /Task/view/:id          → drawer open, view mode, record :id
  // /Task/edit/:id          → drawer open, edit mode, record :id
  // /Task/create            → drawer open, add mode (drawer's create flow uses "add")
  // /Task/mass-update       → drawer open, mass-update mode (uses selectedDeals)
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
      // Minimal placeholder so useTasksById fires; drawer renders from
      // selectedDealData (the fetched record), so no promote step is needed.
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


  const handleDealClick = (deal) => {
    navigate(`/Task/view/${deal.id}`);
  };
  const { data: selectedDealData } = useTasksById(
    selectedDeal?.id,
    isDrawerOpen && !!selectedDeal?.id
  );



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

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleAddLeads = () => {
    if (!canCreateTask) return;
    navigate("/Task/create");
  };

  const handleDrawerClose = () => {
    // Replace so browser-back doesn't re-open the drawer you just closed.
    navigate("/tasks", { replace: true });
  };

  const handleCreateLead = async (payload) => {
    if (!canCreateTask) return;
    try {
      await createTasks(payload); // API
      queryClient.invalidateQueries(["tasks"]);
      toast.success("Task created successfully");
    } catch (err) {
      console.error("Task creationd failed", err);
    }
  };

  const handleUpdateTasks = async (id, payload) => {
    if (!canEditTask) return;
    await updateTasks(id, payload);
    queryClient.invalidateQueries(["tasks"]);
  };
  const handleBulkUpdateTasks = async (ids, payload) => {
    if (!canMassUpdateTask) return;
    try {
      toast.loading("Updating tasks...", { id: "bulk-update" });

      await Promise.all(ids.map((id) => updateTasks(id, payload)));
      queryClient.invalidateQueries(["tasks"]);
      toast.success(`${ids.length} tasks updated`, { id: "bulk-update" });
      setSelectedDeals([]);
    } catch (err) {
      console.error(err);
      toast.error("Mass update failed", { id: "bulk-update" });
    }
  };

  //deletion delete
  const handleDeleteLead = async (id) => {
    if (!canDeleteTask) return;
    try {
      toast.loading("Deleting task...", { id: "delete-task" });
      await deleteTasks(id); // API call
      queryClient.invalidateQueries(["tasks"]);
      toast.success("Task deleted successfully", {
        id: "delete-task",
      });
    } catch (err) {
      console.error("Delete failed", err);
    }
  };
  const handleBulkDelete = async () => {
    if (!canDeleteTask) return;
    if (!selectedDeals.length) {
      toast.error("Please select at least one task");
      return;
    }

    const ok = window.confirm(`Delete ${selectedDeals.length} selected tasks?`);
    if (!ok) return;

    try {
      toast.loading("Deleting tasks...", { id: "bulk-delete" });

      await bulkDeleteTasks(selectedDeals);
      // ✅ Remove from UI
      queryClient.invalidateQueries(["tasks"]);

      // ✅ Clear selection
      setSelectedDeals([]);

      toast.success("Tasks deleted successfully", {
        id: "bulk-delete",
      });
    } catch (err) {
      console.error("Bulk delete failed", err);
      toast.error("Failed to delete tasks", {
        id: "bulk-delete",
      });
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
    if (isSelected) {
      const currentPageDeals = tasks.map((deal) => deal.id);

      setSelectedDeals([...new Set([...selectedDeals, ...currentPageDeals])]);
    } else {
      const currentPageDeals = tasks.map((deal) => deal.id);
      setSelectedDeals(
        selectedDeals?.filter((id) => !currentPageDeals?.includes(id)),
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
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "",
      priority: "",
      assignUser: "",
      startDate: "",
      endDate: "",
      dateType: "",
    });
    setCurrentPage(1);
  };

  const handleBulkAction = (action) => {
    if (!selectedDeals.length) {
      toast.error("Please select at least one task");
      return;
    }
    if (action === "export") {
      if (!canExportTask) return;
      if (!selectedDeals.length) {
        toast.error("Select at least one lead");
        return;
      }

      const selectedRows = tasks.filter((deal) =>
        selectedDeals.includes(deal.id),
      );

      exportLeadsToCSV(selectedRows, "selected_leads");
      return;
    }

    if (action === "delete") {
      if (!canDeleteTask) return;
      handleBulkDelete();
    }

    if (action === "massupdate") {
      if (!canMassUpdateTask) return;
      navigate("/Task/mass-update");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPage(1);
  }, [filters]);

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
                  Tasks
                </h1>
                <p className="text-muted-foreground mt-1">
                  Easily create, assign, and track tasks to ensure every
                  activity is completed on time and nothing is missed in your
                  workflow
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {canExportTask && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      exportLeadsToCSV(tasks, "all_leads")
                    }
                  >
                    <Icon name="Download" size={16} className="mr-2" />
                    Export All
                  </Button>
                )}
                {canCreateTask && (
                  <Button onClick={handleAddLeads} className="linearbg-1 text-white hover:text-white">
                    <Icon name="Plus" size={16} className="mr-2" />
                    New Tasks
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
              canDelete={canDeleteTask}
              canExport={canExportTask}
              canMassUpdate={canMassUpdateTask}
            />

            {/* Deals Table */}
            <DealsTable
              deals={tasks}
              selectedDeals={selectedDeals}
              onSelectDeal={handleSelectDeal}
              onSelectAll={handleSelectAll}
              onDealClick={handleDealClick}
              sortConfig={sortConfig}
              onSort={handleSort}
              onDelete={handleDeleteLead}
              isLoading={isLoading}
              canEdit={canEditTask}
              canDelete={canDeleteTask}
            />

            {/* Pagination */}
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={limit}
              onPageChange={(p) => setPage(p)}
              onItemsPerPageChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </div>
        </main>

        {/* Deal Drawer */}
        <DealDrawer
          deal={selectedDealData}
          mode={mode}
          isOpen={isDrawerOpen}
          onCreate={handleCreateLead}
          onUpdate={handleUpdateTasks}
          onClose={handleDrawerClose}
          onDelete={handleDeleteActivity}
          selectedIds={selectedDeals}
          onBulkUpdate={handleBulkUpdateTasks} // 👈 NEW
        />
      </div>
    </>
  );
};

export default TaskPage;
