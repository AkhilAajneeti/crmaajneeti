import React from "react";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import Input from "components/ui/Input";
import Select from "components/ui/Select";
import { useUsers } from "hooks/useUsers";

// Same option set the leads page offers, so the two filter bars behave
// identically rather than each having its own vocabulary.
export const DATE_FILTERS = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "lastSevenDays" },
  { label: "Current Month", value: "currentMonth" },
  { label: "Last Month", value: "lastMonth" },
  { label: "Current Quarter", value: "currentQuarter" },
  { label: "Current Year", value: "currentYear" },
  { label: "On", value: "on" },
  { label: "Before", value: "before" },
  { label: "After", value: "after" },
  { label: "Between", value: "between" },
];

export const EMPTY_FILTERS = {
  search: "",
  city: "",
  assignUser: "",
  dateType: "",
  dateFrom: "",
  dateTo: "",
};

const ContactsFilters = ({
  filters,
  onChange,
  onClear,
  total,
  selectedCount = 0,
  onBulkDelete,
  canDelete,
}) => {
  const { data: usersData } = useUsers();
  const userOptions = (usersData?.list || []).map((u) => ({
    value: u.id,
    label: u.name,
  }));

  const set = (key, value) => {
    const next = { ...filters, [key]: value };
    // A leftover endpoint from a previous range would silently narrow the
    // next selection.
    if (key === "dateType") {
      next.dateFrom = "";
      next.dateTo = "";
    }
    onChange(next);
  };

  const showDates = ["on", "before", "after", "between"].includes(filters.dateType);

  // Sub-parts of the date filter are represented by the dateType chip, so
  // they are not counted or shown separately.
  const chips = [
    filters.search && { key: "search", label: `Search: "${filters.search}"` },
    filters.city && { key: "city", label: `City: ${filters.city}` },
    filters.assignUser && {
      key: "assignUser",
      label: `Owner: ${userOptions.find((o) => o.value === filters.assignUser)?.label || "—"}`,
    },
    filters.dateType && {
      key: "dateType",
      label: `Added: ${DATE_FILTERS.find((d) => d.value === filters.dateType)?.label}`,
    },
  ].filter(Boolean);

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-elevation-1">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Contacts{" "}
          <span className="text-muted-foreground">({total ?? 0})</span>
        </h2>

        {chips.map((chip) => (
          <span
            key={chip.key}
            className="group inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 py-1 pl-3 pr-1.5 text-xs font-medium text-primary shadow-sm"
          >
            <span className="max-w-[160px] truncate">{chip.label}</span>
            <button
              type="button"
              onClick={() => set(chip.key, "")}
              aria-label={`Remove ${chip.label} filter`}
              className="flex h-4 w-4 items-center justify-center rounded-full text-primary/70 transition-all hover:bg-destructive hover:text-white"
            >
              <Icon name="X" size={11} />
            </button>
          </span>
        ))}

        {chips.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-xs">
            Clear all
          </Button>
        )}

        {selectedCount > 0 && canDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={onBulkDelete}
            className="ml-auto text-xs"
          >
            <Icon name="Trash2" size={14} className="mr-1" />
            Delete {selectedCount}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Input
          type="search"
          placeholder="Search contacts…"
          value={filters.search}
          onChange={(e) => set("search", e?.target?.value)}
        />
        <Input
          type="text"
          placeholder="City"
          value={filters.city}
          onChange={(e) => set("city", e?.target?.value)}
        />
        <Select
          placeholder="Owner"
          options={userOptions}
          value={filters.assignUser}
          onChange={(v) => set("assignUser", v)}
          searchable
          clearable
        />
        <Select
          placeholder="Date added"
          options={DATE_FILTERS}
          value={filters.dateType}
          onChange={(v) => set("dateType", v)}
          clearable
        />

        {showDates && (
          <div className="flex gap-2 md:col-span-2">
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => set("dateFrom", e?.target?.value)}
            />
            {filters.dateType === "between" && (
              <Input
                type="date"
                min={filters.dateFrom || undefined}
                value={filters.dateTo}
                onChange={(e) => set("dateTo", e?.target?.value)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsFilters;
