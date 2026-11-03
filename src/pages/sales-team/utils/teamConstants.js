// Tunables for the sales-team board. Everything a manager might argue about
// lives here rather than inside a component.

export const API_BASE = "https://gateway.aajneetiadvertising.com";

// What counts as a win. Deliberately narrow: a status that only means "we
// spoke" would make every rep look identical.
export const SUCCESS_STATUSES = ["Interested", "Qualified", "Converted"];

// A rate computed over four leads is noise. Reps under this are still listed,
// but in their own group rather than ranked — otherwise whoever joined most
// recently sits permanently at the bottom of the board.
export const MIN_VOLUME_FOR_RANK = 20;

// "Untouched for this long" counts as stale.
export const STALE_DAYS = 14;

export const PERIODS = [
  { id: "today", label: "Today", dateType: "today" },
  { id: "lastSevenDays", label: "Last 7 days", dateType: "lastSevenDays" },
  { id: "currentMonth", label: "This month", dateType: "currentMonth" },
  { id: "lastMonth", label: "Last month", dateType: "lastMonth" },
];

export const DEFAULT_PERIOD = "currentMonth";

// Colour bands. Each metric declares which direction is good, so one helper
// can tone every cell and the legend stays honest.
//
// Bands are generous on purpose: a three-colour scale where almost everything
// lands red teaches people to ignore the colour.
export const BANDS = {
  // Higher is better.
  conversion: {
    higherIsBetter: true,
    good: 25,
    ok: 12,
  },
  connectRate: {
    higherIsBetter: true,
    good: 55,
    ok: 30,
  },
  // Lower is better.
  overdue: {
    higherIsBetter: false,
    good: 10,
    ok: 30,
  },
  untracked: {
    higherIsBetter: false,
    good: 10,
    ok: 25,
  },
};

const TONES = {
  good: {
    text: "text-emerald-700",
    bar: "bg-emerald-500",
    track: "bg-emerald-100",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  ok: {
    text: "text-amber-700",
    bar: "bg-amber-500",
    track: "bg-amber-100",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
  },
  poor: {
    text: "text-red-700",
    bar: "bg-red-500",
    track: "bg-red-100",
    chip: "bg-red-50 text-red-700 border-red-200",
  },
  none: {
    text: "text-muted-foreground",
    bar: "bg-slate-300",
    track: "bg-slate-100",
    chip: "bg-slate-50 text-slate-600 border-slate-200",
  },
};

/** Tone classes for a percentage against a named band. */
export const toneFor = (metric, value) => {
  const band = BANDS[metric];
  if (band == null || value == null || Number.isNaN(value)) return TONES.none;

  if (band.higherIsBetter) {
    if (value >= band.good) return TONES.good;
    if (value >= band.ok) return TONES.ok;
    return TONES.poor;
  }

  if (value <= band.good) return TONES.good;
  if (value <= band.ok) return TONES.ok;
  return TONES.poor;
};

export const TONE_LEGEND = [
  { label: "On track", chip: TONES.good.chip },
  { label: "Watch", chip: TONES.ok.chip },
  { label: "Needs attention", chip: TONES.poor.chip },
];

/** Safe percentage — returns null (rendered as "—") rather than NaN or 0. */
export const pct = (numerator, denominator) => {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 100);
};
