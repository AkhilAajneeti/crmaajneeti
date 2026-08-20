import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useUsers } from "hooks/useUsers";
import RoleGuard from "components/RoleGuard";

const DealsFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  dealCount,
  onBulkAction,
  selectedCount,
  toggleAnalytics,
  canDelete = true,
  canExport = true,
  canMassUpdate = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  // Shared cached users query — every filter bar and drawer reads the same
  // entry, so this no longer refetches /User on each mount.
  const { data: usersData } = useUsers();
  const assignUser = usersData?.list || [];
  const bulkActions = [
    { value: "mass-update", label: "Mass Update", icon: "GitBranch" },
    { value: "export", label: "Export Selected", icon: "Download" },
    { value: "delete", label: "Delete Selected", icon: "Trash2" },
  ].filter((action) => {
    if (action.value === "mass-update") return canMassUpdate;
    if (action.value === "export") return canExport;
    if (action.value === "delete") return canDelete;
    return true;
  });

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
    { value: "Follow up", label: "Follow Up" },
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
    { label: "Last 7 Days", value: "lastSevenDays" },
    { label: "Current Month", value: "currentMonth" },
    { label: "Last Month", value: "lastMonth" },
    // { label: "Next Month", value: "nextMonth" },
    { label: "Current Quarter", value: "currentQuarter" },
    { label: "Last Quarter", value: "lastQuarter" },
    { label: "Current Year", value: "currentYear" },
    { label: "Last Year", value: "lastYear" },
    { label: "Past", value: "past" },
    { label: "Future", value: "future" },
    { label: "Ever", value: "ever" },
    { label: "Is Empty", value: "isEmpty" },

    // special
    { label: "On", value: "on" },
    { label: "Before", value: "before" },
    { label: "After", value: "after" },
    { label: "Between", value: "between" },
    { label: "Last X Days", value: "lastXDays" },
    // { label: "After X Days", value: "afterXDays" },
  ];
  const IndustryOptions = [
    { value: "AppDev", label: "App Development" },
    { value: "Automobiles", label: "Automobiles" },
    { value: "B2B", label: "B2B" },
    { value: "BanquetHall", label: "Banquet Hall" },
    { value: "BridalMakeup", label: "Bridal Makeup" },
    { value: "CaseStudy", label: "Case Study" },
    { value: "ContactForm", label: "Contact Form" },
    { value: "ContentMarketing", label: "Content Marketing" },
    { value: "CoWorking", label: "Co-Working" },
    { value: "DJMusic", label: "DJ / Music" },
    { value: "DubaiRELG", label: "Dubai Real Estate" },
    { value: "FacebookAds", label: "Facebook Ads" },
    { value: "FoodCatering", label: "Food Catering" },
    { value: "GoogleAds", label: "Google Ads" },
    { value: "HigherEducation", label: "Higher Education" },
    { value: "Interior", label: "Interior Design" },
    { value: "Leasing", label: "Leasing" },
    { value: "LinkedinAds", label: "LinkedIn Ads" },
    { value: "LogoDesign", label: "Logo Design" },
    { value: "LuxuryEventPlanners", label: "Luxury Event Planners" },
    { value: "LuxuryTransportation", label: "Luxury Transportation" },
    { value: "ORM", label: "Online Reputation Management" },
    { value: "PhotographersVideographers", label: "Photographers & Videographers" },
    { value: "PlotsRELG", label: "Plots Real Estate" },
    { value: "Political", label: "Political" },
    { value: "PreWedding", label: "Pre-Wedding" },
    { value: "RealEstate", label: "Real Estate" },
    { value: "RealEstateCityPages", label: "Real Estate City Pages" },
    { value: "SEO", label: "SEO" },
    { value: "StudyAbroad", label: "Study Abroad" },
    { value: "TourTravel", label: "Tour & Travel" },
    { value: "WebDev", label: "Web Development" },
    { value: "WeddingFloralDecor", label: "Wedding Floral Decor" },
    { value: "WikipediaBrands", label: "Wikipedia Brands" },
    { value: "WikipediaPoloticians", label: "Wikipedia Poloticians" }
  ];
  const showDateInputs = ["on", "before", "after", "between"].includes(filters?.dateType);
  const showXDaysInput = ["lastXDays", "afterXDays"].includes(filters?.dateType);
  const handleFilterChange = (key, value) => {
    let updated = {
      ...filters,
      [key]: value,
    };

    // 🔥 reset dependent fields when dateType changes
    if (key === "dateType") {
      updated.closeDateFrom = "";
      updated.closeDateTo = "";
      updated.xDays = "";
    }

    onFiltersChange(updated);
  };

  const handleBulkActionSelect = (action) => {
    onBulkAction(action);
    setShowBulkActions(false);
  };

  const activeFiltersCount = Object.values(filters)?.filter(
    (value) => value !== "" && value !== null && value !== undefined,
  )?.length;
  const assignUserOptions = assignUser.map((acc) => ({
    value: acc.id, // 👈 important (ID use karo)
    label: acc.name,
  }));

  // Build a readable label for each active filter so we can show it as a
  // removable chip (instead of just a count). IDs/codes are resolved to names
  // via the option lists above.
  const optionLabel = (options, value) =>
    options?.find((o) => o.value === value)?.label || value;

  const getFilterChipLabel = (key, value) => {
    switch (key) {
      case "search":
        return `Search: "${value}"`;
      case "status":
        return `Status: ${optionLabel(statusOptions, value)}`;
      case "source":
        return `Source: ${optionLabel(sourceOptions, value)}`;
      case "sector":
        return `Sector: ${optionLabel(IndustryOptions, value)}`;
      case "assignUser":
        return `User: ${optionLabel(assignUserOptions, value)}`;
      case "projectName":
        return `Project: ${value}`;
      case "dateType":
        return `Date: ${optionLabel(ACTIVITY_DATE_FILTERS, value)}`;
      default:
        return `${key}: ${value}`;
    }
  };

  // closeDateFrom / closeDateTo / xDays are sub-parts of the date filter, so
  // they're represented by the single "dateType" chip (removing it clears them).
  const CHIP_KEYS = [
    "search",
    "status",
    "source",
    "sector",
    "assignUser",
    "projectName",
    "dateType",
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
            Leads ({dealCount})
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
          {selectedCount > 0 && bulkActions.length > 0 && (
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
          placeholder="Search leads..."
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
          placeholder="Source"
          options={sourceOptions}
          value={filters?.source || ""}
          onChange={(value) => handleFilterChange("source", value)}
        />
        <Select
          placeholder="Sectors"
          options={IndustryOptions}
          value={filters?.sector || ""}
          onChange={(value) => handleFilterChange("sector", value)}
          searchable
        />
        <Select
          placeholder="Assign User"
          options={assignUserOptions}
          value={filters?.assignUser || ""}
          onChange={(value) => handleFilterChange("assignUser", value)}
          searchable
        />
        {/* Date Type Select */}
        <Select
          className="min-w-0"
          placeholder="Filter by date"
          options={ACTIVITY_DATE_FILTERS}
          value={filters?.dateType || ""}
          onChange={(value) => handleFilterChange("dateType", value)}
        />

        {/* X Days Input */}
        {showXDaysInput && (
          <Input
            type="number"
            placeholder="Enter days"
            value={filters?.xDays || ""}
            onChange={(e) =>
              handleFilterChange("xDays", e.target.value)
            }
          />
        )}

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
      {/* Advanced Filters Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-border gap-3">
        {/* <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Input
            type="date"
            placeholder="Close date from"
            value={filters?.closeDateFrom || ""}
            onChange={(e) =>
              handleFilterChange("closeDateFrom", e?.target?.value)
            }
          />
          <Input
            type="date"
            placeholder="Close date to"
            value={filters?.closeDateTo || ""}
            onChange={(e) =>
              handleFilterChange("closeDateTo", e?.target?.value)
            }
          />
        </div> */}
        {/* <RoleGuard allowedRoles={["admin", "manager"]}>
          <Button onClick={toggleAnalytics} className="linearbg-1 text-white hover:text-white">
            <Icon name="Plus" size={16} className="mr-2" />
            Anaylze By Chart
          </Button>
        </RoleGuard> */}
      </div>
    </div>
  );
};

export default DealsFilters;
