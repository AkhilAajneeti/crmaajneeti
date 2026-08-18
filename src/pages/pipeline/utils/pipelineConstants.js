// Centralized tunables and enums for the Pipeline module. Anything that
// might need adjusting per deployment (windows, page size, cache TTL, field
// name overrides) lives here so the service / classifier / store stay stable.

// --- Backend ---
export const API_BASE = "https://gateway.aajneetiadvertising.com";
export const LEAD_ENTITY = "Lead";

// EspoCRM field used for "next scheduled follow-up". The spec body uses
// `cNextContact`; one gotcha line says `cNextContactAt`. This project
// standardized on `cNextContact` (verified against the backend). Override if
// your deployment uses the *At variant.
export const NEXT_CONTACT_FIELD = "cNextContact";

// --- React Query ---
export const PIPELINE_QUERY_KEY = "pipeline-leads";
export const PIPELINE_PAGE_SIZE = 200;
export const PIPELINE_CACHE_TTL = 2 * 60 * 1000; // 2 min — service Map cache
export const PIPELINE_STALE_TIME = 2 * 60 * 1000; // 2 min — RQ stale window
export const PIPELINE_GC_TIME = 10 * 60 * 1000; // 10 min — RQ gc

// --- Classifier thresholds ---
export const UPCOMING_WINDOW_DAYS = 7;
export const ACTIVE_ACTIVITY_DAYS = 14;
export const STALE_MIN_DAYS = 14;

// --- Status taxonomy ---
// Lowercased substring matches — sales reps invent status strings, be liberal.
// Closed-out leads never reach the board. Sourced from the shared list so
// the pipeline and the leads table agree on what "closed" means.
export { CLOSED_LEAD_STATUSES as EXCLUDED_STATUSES } from "utils/leadStatus";

export const BUDGET_KEYWORDS = [
  "budget",
  "payment",
  "document",
  "finance",
  "pricing",
  "low budget",
];

// --- Column definitions (priority-ordered: first match wins in the classifier) ---
export const COLUMN_IDS = {
  BUDGET_ISSUE: "budget_issue",
  OVERDUE: "overdue",
  DUE_TODAY: "due_today",
  UPCOMING: "upcoming",
  ACTIVE: "active",
  STALE: "stale",
};

export const PIPELINE_COLUMNS = [
  {
    id: COLUMN_IDS.OVERDUE,
    label: "Overdue",
    description: "Follow-up date has passed.",
    tone: "red",
  },
  {
    id: COLUMN_IDS.DUE_TODAY,
    label: "Due Today",
    description: "Schedule today.",
    tone: "amber",
  },
  {
    id: COLUMN_IDS.UPCOMING,
    label: "Upcoming",
    description: `Next ${UPCOMING_WINDOW_DAYS} days.`,
    tone: "blue",
  },
  {
    id: COLUMN_IDS.ACTIVE,
    label: "Active",
    description: `Touched in last ${ACTIVE_ACTIVITY_DAYS} days.`,
    tone: "emerald",
  },
  {
    id: COLUMN_IDS.BUDGET_ISSUE,
    label: "Budget Issue",
    description: "Stuck on price / payment / docs.",
    tone: "purple",
  },
  {
    id: COLUMN_IDS.STALE,
    label: "Stale",
    description: `No activity ${STALE_MIN_DAYS}+ days.`,
    tone: "gray",
  },
];

// --- Date filter dropdown options.
// Mirrors EspoCRM whereGroup `type` values. `carriesValue` indicates whether
// the type needs a date value (`value=YYYY-MM-DD`) sent with it.
// Even valueless types must still send `value=` (empty) on this gateway.
export const DATE_FILTER_OPTIONS = [
  { value: "currentMonth", label: "Current Month", carriesValue: false },
  { value: "lastMonth", label: "Last Month", carriesValue: false },
  { value: "lastSevenDays", label: "Last 7 Days", carriesValue: false },
  { value: "currentQuarter", label: "Current Quarter", carriesValue: false },
  { value: "lastQuarter", label: "Last Quarter", carriesValue: false },
  { value: "on", label: "Specific Day", carriesValue: true },
  { value: "between", label: "Date Range", carriesValue: true },
];

// Fallback dateType when the user hasn't picked one. Applied by the service,
// not pre-selected in the dropdown.
export const DEFAULT_DATE_TYPE = "currentMonth";

// Same option list, exported under the name PipelineFilters expects.
export const PIPELINE_DATE_FILTER_OPTIONS = DATE_FILTER_OPTIONS;

// Priority dropdown options — values come from classifyDeal's `priority`.
export const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "high", label: "High Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "low", label: "Low Priority" },
];

// --- Default filter object shape (kept here so the store + UI share it).
// All empty by default — the existing PipelineFilters counts anything
// non-empty as "active", so using "" here keeps the active-count at 0
// until the user actually picks a value. The eq() matcher in
// usePipelineData treats "" as wildcard, same as "all" used to.
export const DEFAULT_FILTERS = {
  search: "",
  owner: "",
  status: "",
  source: "",
  priority: "",
  category: "",
  dateType: "", // empty = service falls back to DEFAULT_DATE_TYPE
  closeDateFrom: "",
  closeDateTo: "",
};
