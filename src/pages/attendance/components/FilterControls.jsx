import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useUsers } from "hooks/useUsers";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Per-month seasonal color for inactive pills. Full literal class strings so
// Tailwind's JIT keeps them (dynamic `bg-${x}` would get purged).
const MONTH_THEMES = [
  { tint: "bg-sky-50 text-sky-700 border-sky-200 hover:border-sky-300", dot: "bg-sky-500" },        // Jan
  { tint: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:border-cyan-300", dot: "bg-cyan-500" },    // Feb
  { tint: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300", dot: "bg-emerald-500" }, // Mar
  { tint: "bg-green-50 text-green-700 border-green-200 hover:border-green-300", dot: "bg-green-500" }, // Apr
  { tint: "bg-lime-50 text-lime-700 border-lime-200 hover:border-lime-300", dot: "bg-lime-500" },     // May
  { tint: "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300", dot: "bg-amber-500" }, // Jun
  { tint: "bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-300", dot: "bg-orange-500" }, // Jul
  { tint: "bg-red-50 text-red-700 border-red-200 hover:border-red-300", dot: "bg-red-500" },          // Aug
  { tint: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:border-yellow-300", dot: "bg-yellow-500" }, // Sep
  { tint: "bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300", dot: "bg-rose-500" },     // Oct
  { tint: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-300", dot: "bg-indigo-500" }, // Nov
  { tint: "bg-violet-50 text-violet-700 border-violet-200 hover:border-violet-300", dot: "bg-violet-500" }, // Dec
];

// Per-status color for inactive status pills (full literal classes for JIT).
const STATUS_THEMES = {
  Approved: { tint: "bg-green-50 text-green-700 border-green-200 hover:border-green-300", dot: "bg-green-500" },
  Pending: { tint: "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300", dot: "bg-amber-500" },
  Rejected: { tint: "bg-red-50 text-red-700 border-red-200 hover:border-red-300", dot: "bg-red-500" },
  LWP: { tint: "bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-300", dot: "bg-purple-500" },
};
const DEFAULT_STATUS_THEME = {
  tint: "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300",
  dot: "bg-slate-500",
};

const FilterControls = ({
  filters,
  onFiltersChange,
  status,
  onClearFilters,
  dealCount,
  bulkActions,
  selectedCount,
  toggleAnalytics,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  // Shared cached users query — every filter bar and drawer reads the same
  // entry, so this no longer refetches /User on each mount.
  const { data: usersData } = useUsers();
  const assignUser = usersData?.list || [];

  const daysOptions = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last7Days" },

    { label: "Before", value: "before" },
    { label: "After", value: "after" },

    { label: "Between", value: "between" },
    { label: "This Month", value: "currentMonth" },
    { label: "Last Month", value: "lastMonth" },
  ];
  const requestOptions = [
    { value: "SLC", label: "Contribution Credit" },
    { value: "Short Leave", label: "Short Leave" },
    { value: "Leave", label: "Leave" },
    { value: "Half Day", label: "Half Day" },
  ];

  const handleFilterChange = (key, value) => {
    const updated = {
      ...filters,
      [key]: value,
    };
    // Removing/changing the date filter clears its dependent date inputs
    // (and the month pill selection, since both drive the same date dimension).
    if (key === "dateType") {
      updated.closeDateFrom = "";
      updated.closeDateTo = "";
      updated.month = "";
    }
    onFiltersChange(updated);
  };

  // Month quick-filter: reuses the shared date dimension (dateType="month").
  // Clicking the active month again clears it (shows all records).
  const handleMonthSelect = (monthIndex) => {
    const isActive =
      filters?.dateType === "month" && Number(filters?.month) === monthIndex;
    onFiltersChange({
      ...filters,
      dateType: isActive ? "" : "month",
      month: isActive ? "" : monthIndex,
      // month owns its own range → clear the manual date inputs
      closeDateFrom: "",
      closeDateTo: "",
    });
  };

  // Show pills for Jan through the current month of the current year.
  const monthPills = MONTH_NAMES.slice(0, new Date().getMonth() + 1).map(
    (label, index) => ({ index, label })
  );

  // Status quick-filter: clicking the active status again clears it.
  const handleStatusSelect = (value) => {
    handleFilterChange("status", filters?.status === value ? "" : value);
  };

  const handleBulkActionSelect = (action) => {
    bulkActions(action);
    setShowBulkActions(false);
  };
  const showDateInputs = ["between", "after", "before"].includes(filters?.dateType);
  const assignUserOptions = assignUser.map((acc) => ({
    value: acc.id, // 👈 important (ID use karo)
    label: acc.name,
  }));
  const statusOptions = status
    .filter((item) => item !== "")
    .map((item) => ({
      value: item,
      label: item,
    }));

  // Active-filter chips (removable). The date sub-inputs are represented by the
  // single "dateType" chip — removing it also clears the date inputs.
  const optionLabel = (options, value) =>
    options?.find((o) => o.value === value)?.label || value;

  const getFilterChipLabel = (key, value) => {
    switch (key) {
      case "search":
        return `Search: "${value}"`;
      case "status":
        return `Status: ${optionLabel(statusOptions, value)}`;
      case "requestType":
        return `Type: ${optionLabel(requestOptions, value)}`;
      case "dateType":
        if (value === "month") {
          return `Month: ${MONTH_NAMES[Number(filters.month)] || ""}`;
        }
        return `Date: ${optionLabel(daysOptions, value)}`;
      case "createdById": {
        // The user list loads async — until it resolves, show a placeholder
        // instead of flashing the raw id; it becomes the name once loaded.
        const found = assignUserOptions.find((o) => o.value === value);
        return `Created By: ${found ? found.label : "…"}`;
      }
      case "assignedUserId": {
        const found = assignUserOptions.find((o) => o.value === value);
        return `Manager: ${found ? found.label : "…"}`;
      }
      default:
        return `${key}: ${value}`;
    }
  };

  const CHIP_KEYS = [
    "search",
    "status",
    "requestType",
    "dateType",
    "createdById",
    "assignedUserId",
  ];
  const activeChips = CHIP_KEYS.filter((key) => filters?.[key]).map((key) => ({
    key,
    label: getFilterChipLabel(key, filters[key]),
  }));

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            Total Request ({dealCount?.toLocaleString()})
          </h2>
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <span
                  key={chip.key}
                  className="group inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 text-xs font-medium text-primary bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-full shadow-sm transition-all duration-200 hover:border-primary/60 hover:from-primary/15 hover:to-primary/10 hover:shadow-md"
                >
                  <span className="truncate max-w-[160px]">{chip.label}</span>
                  <button
                    type="button"
                    onClick={() => handleFilterChange(chip.key, "")}
                    aria-label={`Remove ${chip.label} filter`}
                    className="flex items-center justify-center w-4 h-4 rounded-full text-primary/70 transition-all duration-200 hover:bg-destructive hover:text-white hover:scale-110"
                  >
                    <Icon name="X" size={11} />
                  </button>
                </span>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {selectedCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedCount} selected
              </span>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkActions(!showBulkActions)}
                >
                  <Icon name="MoreHorizontal" size={16} className="mr-1" />
                  Actions
                </Button>

                {showBulkActions && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowBulkActions(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-elevation-2 z-50">
                      <div className="py-1">
                        {bulkActions?.map((action) => (
                          <button
                            key={action?.value}
                            onClick={() =>
                              handleBulkActionSelect(action?.value)
                            }
                            className="flex items-center w-full px-3 py-2 text-sm text-popover-foreground hover:bg-muted transition-smooth"
                          >
                            <Icon
                              name={action?.icon}
                              size={16}
                              className="mr-2"
                            />
                            {action?.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden w-full"
          >
            <Icon name="Filter" size={16} className="mr-1" />
            Filters
            <Icon
              name="ChevronDown"
              size={16}
              className={`ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </div>
      {/* Filters */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 ${isExpanded ? "block" : "hidden lg:grid"}`}
      >
        <Input
          type="search"
          placeholder="Search attendance..."
          value={filters?.search || ""}
          onChange={(e) => handleFilterChange("search", e?.target?.value)}
          className="lg:col-span-2"
        />

        <Select
          placeholder="Request Type"
          options={requestOptions}
          value={filters?.requestType || ""}
          onChange={(value) => handleFilterChange("requestType", value)}
        />

        <Select
          placeholder="Filter By Days"
          options={daysOptions}
          value={filters?.dateType || ""}
          onChange={(value) => handleFilterChange("dateType", value)}
        />

        <Select
          placeholder="Created By"
          options={assignUserOptions}
          value={filters?.createdById || ""}
          onChange={(value) => handleFilterChange("createdById", value)}
          searchable
        />

        <Select
          placeholder="Reporting Manager"
          options={assignUserOptions}
          value={filters?.assignedUserId || ""}
          onChange={(value) => handleFilterChange("assignedUserId", value)}
          searchable
        />
        <Button
          onClick={toggleAnalytics}
          className="linearbg-1 text-white hover:text-white"
        >
          Calender
        </Button>
      </div>

      {/* Status quick-filter pills */}
      {statusOptions.length > 0 && (
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon name="CircleCheck" size={14} />
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Filter by Status
            </p>
          </div>

          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide snap-x -mx-1 px-1 py-1">
            {statusOptions.map((s) => {
              const isActive = filters?.status === s.value;
              const theme = STATUS_THEMES[s.value] || DEFAULT_STATUS_THEME;
              return (
                <motion.button
                  key={s.value}
                  type="button"
                  onClick={() => handleStatusSelect(s.value)}
                  aria-pressed={isActive}
                  initial={false}
                  animate={{ scale: isActive ? 1.05 : 1 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                  className={`group relative shrink-0 snap-start inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    isActive
                      ? "linearbg-1 border-transparent text-white shadow-md shadow-primary/30"
                      : `${theme.tint} shadow-sm hover:shadow-md`
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full transition-all duration-200 ${
                      isActive ? "bg-white" : `${theme.dot} group-hover:scale-125`
                    }`}
                  />
                  {s.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Month quick-filter pills — Jan through the current month */}
      <div className="mt-5 pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon name="CalendarRange" size={14} />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filter by Month
          </p>
        </div>

        {/* Horizontally scrollable, snap-aligned pill rail */}
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide snap-x -mx-1 px-1 py-1">
          {monthPills.map((m) => {
            const isActive =
              filters?.dateType === "month" &&
              Number(filters?.month) === m.index;
            const theme = MONTH_THEMES[m.index];
            return (
              <motion.button
                key={m.index}
                type="button"
                onClick={() => handleMonthSelect(m.index)}
                aria-pressed={isActive}
                initial={false}
                animate={{ scale: isActive ? 1.05 : 1 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                className={`group relative shrink-0 snap-start inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  isActive
                    ? "linearbg-1 border-transparent text-white shadow-md shadow-primary/30"
                    : `${theme.tint} shadow-sm hover:shadow-md`
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full transition-all duration-200 ${
                    isActive ? "bg-white" : `${theme.dot} group-hover:scale-125`
                  }`}
                />
                {m.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mt-4 pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {showDateInputs && (
            <div className="flex gap-2">
              <Input
                type="date"
                value={filters?.closeDateFrom || ""}
                onChange={(e) =>
                  handleFilterChange("closeDateFrom", e.target.value)
                }
              />

              {filters?.dateType === "between" && (
                <Input
                  type="date"
                  value={filters?.closeDateTo || ""}
                  onChange={(e) =>
                    handleFilterChange("closeDateTo", e.target.value)
                  }
                />
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FilterControls;
