import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { fetchUser } from "services/user.service";

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
  const [assignUser, setAssignUser] = useState([]);

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
    // Removing/changing the date filter clears its dependent date inputs.
    if (key === "dateType") {
      updated.closeDateFrom = "";
      updated.closeDateTo = "";
    }
    onFiltersChange(updated);
  };

  useEffect(() => {
    fetchUser()
      .then((res) => setAssignUser(res.list || []))
      .catch((err) => console.error("User fetch failed", err));
  }, []);

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
        return `Date: ${optionLabel(daysOptions, value)}`;
      case "createdById":
        return `User: ${optionLabel(assignUserOptions, value)}`;
      default:
        return `${key}: ${value}`;
    }
  };

  const CHIP_KEYS = ["search", "status", "requestType", "dateType", "createdById"];
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
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 ${isExpanded ? "block" : "hidden lg:grid"}`}
      >
        <Input
          type="search"
          placeholder="Search attendance..."
          value={filters?.search || ""}
          onChange={(e) => handleFilterChange("search", e?.target?.value)}
          className="lg:col-span-2"
        />

        <Select
          placeholder="Status"
          options={statusOptions}
          value={filters?.status || ""}
          onChange={(value) => handleFilterChange("status", value)}
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
          placeholder="By User Name"
          options={assignUserOptions}
          value={filters?.createdById || ""}
          onChange={(value) => handleFilterChange("createdById", value)}
          searchable
        />
        <Button
          onClick={toggleAnalytics}
          className="linearbg-1 text-white hover:text-white"
        >
          Calender
        </Button>
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
