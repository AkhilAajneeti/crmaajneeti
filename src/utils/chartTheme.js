// One palette for every chart in the CRM.
//
// Charts were each carrying their own hex values — blue, violet, emerald,
// amber — which is why they read as a different product from the ivory and
// maroon around them. Importing from here keeps a new chart on-theme by
// default, and retuning the festival look means editing one file.

/** Series colours, ordered so the first two carry the most important data. */
export const CHART_SERIES = [
  "#8C1226", // deep maroon — the lead series
  "#C9A227", // champagne gold
  "#2F7D53", // deep green
  "#9A6112", // saffron
  "#6B2D5C", // plum
  "#1F6F7A", // teal
  "#B3261E", // brick
  "#8A6A2F", // bronze
];

/** Pick a series colour by index, wrapping rather than running out. */
export const seriesColor = (i) => CHART_SERIES[i % CHART_SERIES.length];

/** Axis, grid and tooltip chrome. */
export const CHART_CHROME = {
  // Champagne at low alpha: present enough to read a value against, faint
  // enough that it never competes with the data.
  grid: "rgba(201, 162, 39, 0.22)",
  axisLine: "rgba(201, 162, 39, 0.35)",
  tick: "#6B5340",
  tickSize: 11,
  label: "#2A1A14",
  cursor: "rgba(140, 18, 38, 0.06)",
};

/** Shared Recharts tick props, so typography matches across every chart. */
export const axisTick = {
  fontSize: CHART_CHROME.tickSize,
  fill: CHART_CHROME.tick,
};

/** Tooltip container styling to match the popover tokens. */
export const tooltipStyle = {
  background: "#FFFDF8",
  border: "1px solid rgba(201, 162, 39, 0.4)",
  borderRadius: "12px",
  boxShadow: "0 10px 30px -12px rgba(92, 51, 16, 0.3)",
  color: "#2A1A14",
  fontSize: 12,
};
