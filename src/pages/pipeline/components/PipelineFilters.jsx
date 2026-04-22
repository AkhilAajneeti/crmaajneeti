import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useMetaData } from "hooks/useMetaData";
import { useUsers } from "hooks/useUsers";

const PipelineFilters = ({ filters, onFiltersChange, onResetFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: meta } = useMetaData();
  const { data: users } = useUsers();
  const source = meta?.list || [];
  const status = meta?.status?.options || [];
  const userList = users?.list || [];
  // Source
  const sourceOptions = [
    { value: "Call", label: "Call" },
    { value: "Email", label: "Email" },
    { value: "Existing Customer", label: "Existing Customer" },
    { value: "Partner", label: "Partner" },
    { value: "Public Relations", label: "Public Relations" },
    { value: "Web Site", label: "Web Site" },
    { value: "Campaign", label: "Campaign" },
    { value: "Other", label: "Other" },
    { value: "Facebook", label: "Facebook" }, // ✅ added
    { value: "IVR", label: "IVR" }            // ✅ added
  ];
  // Status
  const statusOptions = [
    { value: "Call Later", label: "Call Later" },
    { value: "Call Not Connecting", label: "Call Not Connecting" },
    { value: "Call Not Picked", label: "Call Not Picked" },
    { value: "Converted", label: "Converted" },
    { value: "Dead", label: "Dead" },
    { value: "Duplicate", label: "Duplicate" },
    { value: "Follow Up", label: "Follow Up" },
    { value: "Future Prospect", label: "Future Prospect" },
    { value: "In Process", label: "In Process" },
    { value: "Interested", label: "Interested" },
    { value: "Invalid", label: "Invalid" },
    { value: "Low Budget | Low Intent", label: "Low Budget | Low Intent" },
    { value: "New", label: "New" },
    { value: "Not interested", label: "Not interested" },
    { value: "Proposal Shared", label: "Proposal Shared" },
    { value: "Qualified", label: "Qualified" },
    { value: "Webinar", label: "Webinar" },        // ✅ added
    { value: "Z Old Leads", label: "Z Old Leads" } // ✅ added
  ];
  const ACTIVITY_DATE_FILTERS = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last7Days" },

    { label: "Before", value: "before" },
    { label: "After", value: "after" },

    { label: "Between", value: "between" },
    { label: "This Month", value: "currentMonth" },
    { label: "Last Month", value: "lastMonth" },
  ];
  // Users
  const userOptions = userList.map((user) => ({
    value: user.id,
    label: user.name,
  }));
  // assign user filter



  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters?.status && filters.status !== "") count++;
    if (filters?.source && filters.source !== "") count++;
    if (filters?.assignedUser && filters.assignedUser !== "") count++;
    if (filters?.dateType) count++;
    if (filters?.search) count++;

    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();
  const showDateInputs = [
    "between",
    "after",
    "before",
    "on"
  ].includes(filters?.dateType);

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon name="Filter" size={20} className="text-muted-foreground" />
          <h3 className="font-medium text-card-foreground">Pipeline Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              iconName="X"
              iconPosition="left"
              iconSize={14}
            >
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden"
            aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
          </Button>
        </div>
      </div>
      {/* Filters Content */}
      <div className={`space-y-4 ${isExpanded ? "block" : "hidden lg:block"}`}>
        {/* Search and Quick Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status */}
          <Select
            placeholder="Status"
            options={statusOptions}
            value={filters?.status || "all"}
            onChange={(value) => handleFilterChange("status", value)}
          />

          {/* Assigned User */}
          <Select
            placeholder="Assigned User"
            options={userOptions}
            value={filters?.assignedUser || "all"}
            onChange={(value) => handleFilterChange("assignedUser", value)}
          />

          {/* Source */}
          <Select
            placeholder="Source"
            options={sourceOptions}
            value={filters?.source || "all"}
            onChange={(value) => handleFilterChange("source", value)}
          />

          {/* Age */}
          <Select
            className="min-w-0"
            placeholder="Filter by date"
            options={ACTIVITY_DATE_FILTERS}
            value={filters?.dateType || ""}
            onChange={(value) => handleFilterChange("dateType", value)}
          />
          {/* Date Range Inputs */}
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

        {/* Custom Date Range */}
        {filters?.dateRange === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <Input
              type="date"
              label="Start Date"
              value={filters?.startDate || ""}
              onChange={(e) =>
                handleFilterChange("startDate", e?.target?.value)
              }
            />

            <Input
              type="date"
              label="End Date"
              value={filters?.endDate || ""}
              onChange={(e) => handleFilterChange("endDate", e?.target?.value)}
            />
          </div>
        )}

        {/* Filter Summary */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {filters?.search && (
              <span className="inline-flex items-center px-3 py-1 text-sm bg-accent text-accent-foreground rounded-full">
                Search: "{filters?.search}"
                <button
                  onClick={() => handleFilterChange("search", "")}
                  className="ml-2 hover:text-accent-foreground/80"
                  aria-label="Remove search filter"
                >
                  <Icon name="X" size={12} />
                </button>
              </span>
            )}

            {filters?.owner && filters?.owner !== "all" && (
              <span className="inline-flex items-center px-3 py-1 text-sm bg-accent text-accent-foreground rounded-full">
                Owner:{" "}
                {userOptions?.find((o) => o?.value === filters?.owner)?.label}
                <button
                  onClick={() => handleFilterChange("owner", "all")}
                  className="ml-2 hover:text-accent-foreground/80"
                  aria-label="Remove owner filter"
                >
                  <Icon name="X" size={12} />
                </button>
              </span>
            )}

            {filters?.priority && filters?.priority !== "all" && (
              <span className="inline-flex items-center px-3 py-1 text-sm bg-accent text-accent-foreground rounded-full">
                Priority: {filters?.priority}
                <button
                  onClick={() => handleFilterChange("priority", "all")}
                  className="ml-2 hover:text-accent-foreground/80"
                  aria-label="Remove priority filter"
                >
                  <Icon name="X" size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineFilters;
