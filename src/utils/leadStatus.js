// Single source of truth for "this lead is closed out".
//
// A lead in one of these statuses is finished — nobody is expected to contact
// it again — so a next-contact date in the past is stale data, not a follow-up
// anyone is behind on. Used to keep such leads off the pipeline board and to
// stop the leads table flagging them as overdue.
//
// Matching is a lowercased substring test, so casing drift in stored values
// ("Not interested" vs "Not Interested") can't slip past it.
export const CLOSED_LEAD_STATUSES = [
  // Dead ends — the lead went nowhere.
  "dead",
  "invalid",
  "not interested",
  "duplicate",
  "z old leads",

  // Finished — the lead already reached its outcome.
  "converted",
  "purchased",
  "recycled",
  "won",
  "lost",
  "closed",
];

export const isClosedLeadStatus = (status) => {
  const value = String(status ?? "").toLowerCase().trim();
  if (!value) return false;
  return CLOSED_LEAD_STATUSES.some((closed) => value.includes(closed));
};

export const LEAD_STATUS_OPTIONS = [
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

// Per-colour chip styling. Written out as literal class strings because
// Tailwind's JIT can't see `bg-${colour}-50` and would purge it.
export const CHIP_PALETTE = {
  blue: {
    idle: "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400",
    active: "border-blue-500 bg-blue-100 text-blue-800 ring-1 ring-blue-500",
    pill: "bg-blue-100 text-blue-800",
    burst: "bg-blue-300",
  },
  sky: {
    idle: "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-400",
    active: "border-sky-500 bg-sky-100 text-sky-800 ring-1 ring-sky-500",
    pill: "bg-sky-100 text-sky-800",
    burst: "bg-sky-300",
  },
  emerald: {
    idle: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400",
    active: "border-emerald-500 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-500",
    pill: "bg-emerald-100 text-emerald-800",
    burst: "bg-emerald-300",
  },
  green: {
    idle: "border-green-200 bg-green-50 text-green-700 hover:border-green-400",
    active: "border-green-500 bg-green-100 text-green-800 ring-1 ring-green-500",
    pill: "bg-green-100 text-green-800",
    burst: "bg-green-300",
  },
  greenDark: {
    idle: "border-green-400 bg-green-50 text-green-800 hover:border-green-600",
    active: "border-green-600 bg-green-100 text-green-900 ring-1 ring-green-600",
    pill: "bg-green-100 text-green-900",
    burst: "bg-green-300",
  },
  greenDeep: {
    idle: "border-emerald-600 bg-emerald-50 text-emerald-900 hover:border-emerald-700",
    active: "border-emerald-700 bg-emerald-100 text-emerald-900 ring-1 ring-emerald-700",
    pill: "bg-emerald-100 text-emerald-900",
    burst: "bg-emerald-300",
  },
  indigo: {
    idle: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-400",
    active: "border-indigo-500 bg-indigo-100 text-indigo-800 ring-1 ring-indigo-500",
    pill: "bg-indigo-100 text-indigo-800",
    burst: "bg-indigo-300",
  },
  violet: {
    idle: "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-400",
    active: "border-violet-500 bg-violet-100 text-violet-800 ring-1 ring-violet-500",
    pill: "bg-violet-100 text-violet-800",
    burst: "bg-violet-300",
  },
  cyan: {
    idle: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:border-cyan-400",
    active: "border-cyan-500 bg-cyan-100 text-cyan-800 ring-1 ring-cyan-500",
    pill: "bg-cyan-100 text-cyan-800",
    burst: "bg-cyan-300",
  },
  teal: {
    idle: "border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-400",
    active: "border-teal-500 bg-teal-100 text-teal-800 ring-1 ring-teal-500",
    pill: "bg-teal-100 text-teal-800",
    burst: "bg-teal-300",
  },
  fuchsia: {
    idle: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 hover:border-fuchsia-400",
    active: "border-fuchsia-500 bg-fuchsia-100 text-fuchsia-800 ring-1 ring-fuchsia-500",
    pill: "bg-fuchsia-100 text-fuchsia-800",
    burst: "bg-fuchsia-300",
  },
  amber: {
    idle: "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400",
    active: "border-amber-500 bg-amber-100 text-amber-800 ring-1 ring-amber-500",
    pill: "bg-amber-100 text-amber-800",
    burst: "bg-amber-300",
  },
  yellow: {
    idle: "border-yellow-200 bg-yellow-50 text-yellow-700 hover:border-yellow-400",
    active: "border-yellow-500 bg-yellow-100 text-yellow-800 ring-1 ring-yellow-500",
    pill: "bg-yellow-100 text-yellow-800",
    burst: "bg-yellow-300",
  },
  orange: {
    idle: "border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-400",
    active: "border-orange-500 bg-orange-100 text-orange-800 ring-1 ring-orange-500",
    pill: "bg-orange-100 text-orange-800",
    burst: "bg-orange-300",
  },
  rose: {
    idle: "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-400",
    active: "border-rose-500 bg-rose-100 text-rose-800 ring-1 ring-rose-500",
    pill: "bg-rose-100 text-rose-800",
    burst: "bg-rose-300",
  },
  purple: {
    idle: "border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-400",
    active: "border-purple-500 bg-purple-100 text-purple-800 ring-1 ring-purple-500",
    pill: "bg-purple-100 text-purple-800",
    burst: "bg-purple-300",
  },
  red: {
    idle: "border-red-200 bg-red-50 text-red-700 hover:border-red-400",
    active: "border-red-500 bg-red-100 text-red-800 ring-1 ring-red-500",
    pill: "bg-red-100 text-red-800",
    burst: "bg-red-300",
  },
  gray: {
    idle: "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-400",
    active: "border-gray-500 bg-gray-100 text-gray-800 ring-1 ring-gray-500",
    pill: "bg-gray-100 text-gray-800",
    burst: "bg-gray-300",
  },
  slate: {
    idle: "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400",
    active: "border-slate-500 bg-slate-100 text-slate-800 ring-1 ring-slate-500",
    pill: "bg-slate-100 text-slate-800",
    burst: "bg-slate-300",
  },
  stone: {
    idle: "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400",
    active: "border-stone-500 bg-stone-100 text-stone-800 ring-1 ring-stone-500",
    pill: "bg-stone-100 text-stone-800",
    burst: "bg-stone-300",
  },
};

// Each status gets a colour that matches what it means: forward motion in
// greens/blues, waiting in ambers, negative in reds, archived in greys.
export const STATUS_COLORS = {
  "New": "blue",
  "Interested": "greenDeep",
  "Qualified": "emerald",
  "Converted": "green",
  "Follow Up": "greenDark",
  "In Process": "violet",
  "Proposal Shared": "cyan",
  "Future Prospect": "teal",
  "Webinar": "fuchsia",
  "Call Later": "amber",
  "Call Not Connecting": "yellow",
  "Call Not Picked": "rose",
  "Not interested": "orange",
  "Low Budget | Low Intent": "purple",
  "Dead": "red",
  "Invalid": "gray",
  "Duplicate": "slate",
  "Z Old Leads": "stone",
};

// Case-insensitive lookup — stored values drift in casing ("Follow up" vs
// "Follow Up"), and a status should never lose its colour over that.
const STATUS_COLORS_BY_KEY = Object.fromEntries(
  Object.entries(STATUS_COLORS).map(([status, colour]) => [
    status.toLowerCase(),
    colour,
  ])
);

export const getStatusTheme = (status) =>
  CHIP_PALETTE[STATUS_COLORS_BY_KEY[String(status || "").toLowerCase()]] || {
    idle: "border-border bg-background text-foreground hover:border-primary/40",
    active: "border-primary bg-primary/10 text-primary ring-1 ring-primary",
    pill: "bg-gray-100 text-gray-800",
    burst: "bg-gray-300",
  };
