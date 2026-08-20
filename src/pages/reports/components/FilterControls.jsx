import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useUsers } from "hooks/useUsers";
import RoleGuard from "components/RoleGuard";

const FilterControls = ({
  filters,
  onFiltersChange,
  onClearFilters,
  dealCount,
  onBulkAction,
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
    // 🔥 we keep yesterday in UI but handle it smartly
    { label: "Last 7 Days", value: "lastSevenDays" },
    { label: "Current Month", value: "currentMonth" },
    { label: "Last Month", value: "lastMonth" },
    { label: "On", value: "on" },
    { label: "Before", value: "before" },
    { label: "After", value: "after" },
    { label: "Between", value: "between" },
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

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };
  const showDateInputs = [
    "between",
    "after",
    "before",
    "on"
  ].includes(filters?.dateType);

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

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-foreground">
            Leads ({dealCount?.toLocaleString()})
          </h2>
          {activeFiltersCount > 1 && (
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""}{" "}
                active
              </span>
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
          placeholder="Filter By Days"
          options={daysOptions}
          value={filters?.dateType || ""}
          onChange={(value) => handleFilterChange("dateType", value)}
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
                    handleFilterChange("closeDateTo ", e.target.value)
                  }
                />
              )}
            </div>
          )}
        </div>
        {/* <RoleGuard allowedRoles={["admin", "manager", "regular"]}>
          <Button onClick={toggleAnalytics} className="linearbg-1 text-white hover:text-white">Anaylze By Chart</Button>
        </RoleGuard> */}
      </div>
    </div>
  );
};

export default FilterControls;
