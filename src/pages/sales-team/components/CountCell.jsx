import React from "react";

/**
 * A plain count, with a caption saying what it counts.
 *
 * Overdue and "no follow-up" used to be shown as percentages of the period's
 * assigned leads, which produced things like "1057 of 14 → 7550%". The two
 * numbers describe different time windows: 14 is leads created this month,
 * 1,057 is the rep's whole book, built up over years. Dividing one by the
 * other is meaningless, and a percentage above 100 tells the reader nothing
 * except that the page is broken. A count needs no denominator to be true.
 */
const CountCell = ({
  value,
  caption,
  isLoading = false,
  // Most counts are neutral; for overdue and untracked, any number above zero
  // is work someone is behind on.
  alarmAboveZero = false,
}) => {
  if (isLoading) {
    return (
      <div className="min-w-[5rem]">
        <div className="h-6 w-12 animate-pulse rounded bg-muted" />
        {caption && <div className="mt-1 h-3 w-16 animate-pulse rounded bg-muted" />}
      </div>
    );
  }

  const missing = value == null;
  const shown = missing ? 0 : value;

  const tone = missing
    ? "text-red-700"
    : alarmAboveZero && shown > 0
      ? "text-red-700"
      : shown === 0 && alarmAboveZero
        ? "text-emerald-700"
        : "text-foreground";

  return (
    <div className="min-w-[5rem]">
      <span
        className={`text-xl font-bold tabular-nums ${tone}`}
        title={missing ? "No data returned for this metric" : undefined}
      >
        {shown.toLocaleString()}
      </span>
      {caption && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{caption}</p>
      )}
    </div>
  );
};

export default CountCell;
