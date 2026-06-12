import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import PipelineColumn from "./components/PipelineColumn";
import PipelineFilters from "./components/PipelineFilters";
import AddDealModal from "./components/AddDealModal";
import PipelineStats from "./components/PipelineStats";
import PipelineSummaryAlert from "./components/PipelineSummaryAlert";
import VersionHistoryModal from "./components/VersionHistoryModal";
import toast from "react-hot-toast";
import { Droppable, Draggable, DragDropContext } from "@hello-pangea/dnd";
import { Helmet } from "react-helmet";
import { usePipelineData } from "./hooks/usePipelineData";
import { usePipelineFilters } from "./hooks/usePipelineFilters";
import { COLUMN_IDS, DEFAULT_FILTERS } from "./utils/pipelineConstants";

const Pipeline = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [selectedDealForHistory, setSelectedDealForHistory] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);

  // Pipeline data + filters — single source of truth lives in the store and
  // React Query; this hook owns the cNextContact fetch, classification, and
  // optimistic mutations.
  const { deals, dealsByColumn, refetch, deleteDeal } = usePipelineData();
  const { filters, setFilter, clearFilters } = usePipelineFilters();

  // Count of filter values that differ from their default — feeds the
  // PipelineFilters header badge + "Clear All" button visibility.
  const activeFilterCount = useMemo(
    () =>
      Object.keys(DEFAULT_FILTERS).reduce((count, key) => {
        const cur = filters?.[key];
        if (cur && cur !== DEFAULT_FILTERS[key]) return count + 1;
        return count;
      }, 0),
    [filters]
  );

  // Derive the six KPI counts directly from dealsByColumn. No extra network
  // round-trips — the classifier has already bucketed every lead, and the
  // summary alert + stat cards just want the column lengths.
  const stats = useMemo(
    () => ({
      overdue: dealsByColumn?.[COLUMN_IDS.OVERDUE]?.length || 0,
      dueToday: dealsByColumn?.[COLUMN_IDS.DUE_TODAY]?.length || 0,
      upcoming: dealsByColumn?.[COLUMN_IDS.UPCOMING]?.length || 0,
      active: dealsByColumn?.[COLUMN_IDS.ACTIVE]?.length || 0,
      stale: dealsByColumn?.[COLUMN_IDS.STALE]?.length || 0,
      budgetIssue: dealsByColumn?.[COLUMN_IDS.BUDGET_ISSUE]?.length || 0,
    }),
    [dealsByColumn]
  );

  // Pipeline columns — IDs come from COLUMN_IDS so they match what
  // dealsByColumn returns from the classifier. name/color are kept in the
  // shape PipelineColumn already consumes.
  const pipelineSections = [
    { id: COLUMN_IDS.OVERDUE, name: "Overdue", color: "red" },
    { id: COLUMN_IDS.DUE_TODAY, name: "Due Today", color: "amber" },
    { id: COLUMN_IDS.UPCOMING, name: "Upcoming", color: "blue" },
    { id: COLUMN_IDS.ACTIVE, name: "Active", color: "green" },
    { id: COLUMN_IDS.BUDGET_ISSUE, name: "Budget Issue", color: "orange" },
    { id: COLUMN_IDS.STALE, name: "Stale", color: "gray" },
  ];


  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleAddDeal = (stageId = null) => {
    setSelectedStage(stageId);
    setIsAddDealModalOpen(true);
  };
  const handleVersionModal = () => {
    setIsVersionModalOpen(true);
    setSelectedDealForHistory(null); // board level history
  };

  // After AddDealModal saves a new lead, just refetch — the new record will
  // come back through the classifier and land in the right column.
  const handleSaveDeal = () => {
    refetch();
  };

  // Columns are derived from cNextContact / status, so dragging a card
  // between columns shouldn't quietly mutate local state (we don't keep any).
  // To "move" a deal, the user should reschedule its follow-up date —
  // wire that to `reschedule(id, newDateTime)` from usePipelineData when the
  // UI surface for it exists. For now, no-op.
  const handleDragEnd = () => {};

  const handleEditDeal = (deal) => {
    console.log("Edit deal:", deal);
    // Implement edit functionality
  };

  const handleDeleteDeal = async (dealId) => {
    if (!window.confirm("Are you sure you want to delete this deal?")) return;
    // deleteDeal is the optimistic mutation — store hides the row first,
    // toast + RQ invalidation are handled inside the hook.
    try {
      await deleteDeal(dealId);
    } catch {
      /* toast already fired in the mutation's onError */
    }
  };

  // Clone is a real API create. The UI for it lives elsewhere; refetch on
  // success so the new record appears.
  const handleCloneDeal = () => {
    refetch();
  };

  // PipelineFilters writes one field at a time — pass through to the store's
  // atomic setter.
  const handleFilterChange = (key, value) => {
    setFilter(key, value);
  };

  const handleResetFilters = () => {
    clearFilters();
  };

  const handleOpenVersionHistory = (dealId) => {
    setSelectedDealForHistory(dealId);
    setIsVersionModalOpen(true);
  };

  // dealsByColumn comes from the classifier; client-side filters are already
  // applied inside usePipelineData, so no extra filtering is needed here.
  const getDealsBySection = (sectionId) => dealsByColumn?.[sectionId] || [];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Pipeline - Aajneeti Connect ltd</title>
        <meta
          name="description"
          content="Manage and track your sales deals with comprehensive filtering and pipeline management tools."
        />
      </Helmet>

      <Header
        onMenuToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Sales Pipeline
              </h1>
              <p className="text-muted-foreground">
                Track follow-ups, manage urgency and never miss a lead.
              </p>
            </div>
          </div>

          {/* "What needs you today" banner — auto-hides when there's no urgent work */}
          <PipelineSummaryAlert stats={stats} />

          {/* Pipeline Stats — six urgency cards derived from dealsByColumn */}
          <PipelineStats stats={stats} />
          <PipelineFilters
            filters={filters}
            deals={deals}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            activeFilterCount={activeFilterCount}
          />

          {/* Pipeline Board */}
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Icon name="Kanban" size={24} className="text-primary" />
                <div>
                  <h2 className="text-xl font-bold text-card-foreground">
                    Pipeline Board
                  </h2>
                </div>
              </div>
            </div>

            {/* Kanban Board with Horizontal Scroll */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="overflow-x-auto">
                <div className="flex gap-6 min-h-[600px] w-max min-w-full">
                  {pipelineSections?.map((stage, index) => (
                    <motion.div
                      key={stage.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex-shrink-0 w-80 h-full"
                    >
                      <Droppable droppableId={stage.id}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="h-full"
                          >
                            <PipelineColumn
                              stage={stage}
                              deals={getDealsBySection(stage.id)}
                              onViewHistory={handleOpenVersionHistory}
                              onAddDeal={handleAddDeal}
                              onEditDeal={handleEditDeal}
                              onDeleteDeal={handleDeleteDeal}
                              onCloneDeal={handleCloneDeal}
                            />
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </motion.div>
                  ))}
                </div>
              </div>
            </DragDropContext>

            {/* Mobile Pipeline View */}
            <div className="hidden">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Icon name="Smartphone" size={24} className="text-primary" />
                  <div>
                    <h3 className="text-lg font-bold text-card-foreground">
                      Mobile Pipeline View
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Switch to landscape mode or use a larger screen for the
                      full Kanban board experience.
                    </p>
                  </div>
                </div>

                {/* Stage Tabs for Mobile */}
                <div className="space-y-4">
                  {pipelineSections?.map((section) => {
                    const stageDeals = getDealsBySection(section?.id);
                    return (
                      <div
                        key={section?.id}
                        className="border border-border rounded-lg p-4 bg-muted/20"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-card-foreground text-base">
                            {section?.name}
                          </h4>
                          <span className="text-sm font-medium text-foreground bg-background px-2 py-1 rounded-full">
                            {stageDeals?.length} deal
                            {stageDeals?.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="text-base font-semibold text-primary">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                          })?.format(
                            stageDeals?.reduce(
                              (sum, deal) => sum + deal?.value,
                              0,
                            ),
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Add Deal Modal */}
      <AddDealModal
        isOpen={isAddDealModalOpen}
        onClose={() => setIsAddDealModalOpen(false)}
        onSave={handleSaveDeal}
        initialStage={selectedStage}
      />
      <VersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        dealId={selectedDealForHistory}
      />
    </div>
  );
};

export default Pipeline;
