import React, { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet";
import toast from "react-hot-toast";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import DealsTable from "./components/DealsTable";
import DealsFilters from "./components/DealsFilters";
import DealDrawer from "./components/DealDrawer";
import TablePagination from "./components/TablePagination";
import { deleteActivity } from "services/leads.service";
import { useMeetings } from "hooks/useMeetings";
import { useMeeting } from "hooks/useMeeting";
import { useQueryClient } from "@tanstack/react-query";

import {
  bulkDeleteMeeting,
  createMeeting,
  deleteMeeting,
  updateMeeting,
} from "services/meeting.service";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";

const MeetingPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState([]);
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mode, setMode] = useState("view");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const { data, isLoading } = useMeetings();

  const leads = data?.list || [];
  const loading = isLoading;
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    assignUser: "",
    closeDateFrom: "",
    closeDateTo: "",
  });
  const { data: selectedDealData } = useMeeting(
    selectedDeal?.id,
    isDrawerOpen && !!selectedDeal?.id,
  );
  // Mock deals data
  const handleDealClick = (deal) => {
    setSelectedDeal(deal);
    setMode("view");
    setIsDrawerOpen(true);
  };
  // Filter and sort deals
  const filteredAndSortedDeals = useMemo(() => {
    let filtered = leads?.filter((deal) => {
      const search = filters?.search?.toLowerCase();

      const matchesSearch =
        !search ||
        deal?.name?.toLowerCase()?.includes(search) ||
        deal?.parentName?.toLowerCase()?.includes(search);

      const matchesStatus =
        !filters?.status || deal?.status === filters?.status;
      const matchesAssignUser =
        !filters.assignUser ||
        String(deal.assignedUserId) === String(filters.assignUser);

      const matchesCreatedFrom =
        !filters?.closeDateFrom ||
        new Date(deal?.createdAt) >= new Date(filters?.closeDateFrom);

      const matchesCreatedTo =
        !filters?.closeDateTo ||
        new Date(deal?.createdAt) <= new Date(filters?.closeDateTo);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAssignUser &&
        matchesCreatedFrom &&
        matchesCreatedTo
      );
    });

    // ✅ SAFE SORTING
    if (sortConfig?.key) {
      filtered.sort((a, b) => {
        let aValue = a?.[sortConfig.key];
        let bValue = b?.[sortConfig.key];

        if (sortConfig.key === "opportunityAmount") {
          aValue = Number(aValue ?? 0);
          bValue = Number(bValue ?? 0);
        } else if (sortConfig.key === "createdAt") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [leads, filters, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedDeals?.length / itemsPerPage);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleAddMeeting = () => {
    setSelectedDeal(null);
    setMode("add");
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedDeal(null);
    // setIsEditing(false);
  };

  const handleCreateMeeting = async (payload) => {
    try {
      await createMeeting(payload); // API
      queryClient.invalidateQueries(["meetings"]);
      toast.success("Meeting created successfully");
    } catch (err) {
      console.error("Meeting creationd failed", err);
    }
  };

  const handleUpdateMeeting = async (id, payload) => {
    await updateMeeting(id, payload);
    queryClient.invalidateQueries(["meetings"]);
  };

  const handleDeleteMeeting = async (id) => {
    try {
      toast.loading("Deleting meeting...", { id: "delete-lead" });
      await deleteMeeting(id);
      queryClient.invalidateQueries(["meetings"]);
      toast.success("Meeting deleted successfully", {
        id: "delete-lead",
      });
    } catch (err) {
      toast.error("Delete failed", { id: "delete-lead" });
    }
  };

  const handleDeleteActivity = async (id) => {
    try {
      await deleteActivity(id); // API call
      queryClient.invalidateQueries(["meetings"]);
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
      const currentPageDeals = filteredAndSortedDeals
        ?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        ?.map((deal) => deal?.id);
      setSelectedDeals([...new Set([...selectedDeals, ...currentPageDeals])]);
    } else {
      const currentPageDeals = filteredAndSortedDeals
        ?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        ?.map((deal) => deal?.id);
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
      stage: "",
      owner: "",
      minValue: "",
      maxValue: "",
      closeDateFrom: "",
      closeDateTo: "",
    });
    setCurrentPage(1);
  };

  const handleBulkAction = (action) => {
    if (action === "mass-update") {
      if (!selectedDeals.length) {
        toast.error("Select at least one lead");
        return;
      }
      setSelectedDeal(null);

      setMode("mass-update");
      setIsDrawerOpen(true);

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
  };
  const handleConfirmBulkDelete = async () => {
    try {
      toast.loading("Deleting meetings...", { id: "bulk-delete" });

      await bulkDeleteMeeting(selectedDeals);
      queryClient.invalidateQueries(["meetings"]);
      setSelectedDeals([]);
      setShowDeleteConfirm(false);

      toast.success("Selected meetings deleted", {
        id: "bulk-delete",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete meetings", {
        id: "bulk-delete",
      });
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };
  const handleBulkUpdateMeet = async (payload) => {
    try {
      toast.loading("Updating meeting...", { id: "bulk-update" });

      await Promise.all(selectedDeals.map((id) => updateMeeting(id, payload)));

      toast.success(`${selectedDeals.length} leads updated`, {
        id: "bulk-update",
      });

      queryClient.invalidateQueries(["meetings"]);

      setSelectedDeals([]);
      setIsDrawerOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Mass update failed", { id: "bulk-update" });
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <>
      <Helmet>
        <title>Meetings - Aajneeti Connect ltd</title>
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
                  Meetings
                </h1>
                <p className="text-muted-foreground mt-1">
                  Track and manage your meetings
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button onClick={handleAddMeeting} className="linearbg-1 text-white hover:text-white">
                  <Icon name="Plus" size={16} className="mr-2" />
                  New Meeting
                </Button>
              </div>
            </div>

            {/* Filters */}
            <DealsFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              dealCount={filteredAndSortedDeals?.length}
              onBulkAction={handleBulkAction}
              selectedCount={selectedDeals?.length}
            />

            {/* Deals Table */}
            <DealsTable
              deals={filteredAndSortedDeals}
              selectedDeals={selectedDeals}
              onSelectDeal={handleSelectDeal}
              onSelectAll={handleSelectAll}
              onDealClick={handleDealClick}
              sortConfig={sortConfig}
              onSort={handleSort}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onDelete={handleDeleteMeeting}
              isLoading={loading}
            />

            {/* Pagination */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAndSortedDeals?.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </main>

        {/* Deal Drawer */}
        <DealDrawer
          deal={selectedDealData}
          selectedIds={selectedDeals}
          mode={mode}
          isOpen={isDrawerOpen}
          onCreate={handleCreateMeeting}
          onUpdate={handleUpdateMeeting}
          onClose={handleDrawerClose}
          onDelete={handleDeleteActivity}
          onBulkUpdate={handleBulkUpdateMeet}
        />
        <ConfirmDeleteModal
          open={showDeleteConfirm}
          title="Delete Selected Leads"
          description={`Are you sure you want to delete ${selectedDeals.length} lead(s)? This action cannot be undone.`}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmBulkDelete}
        />
      </div>
    </>
  );
};

export default MeetingPage;
