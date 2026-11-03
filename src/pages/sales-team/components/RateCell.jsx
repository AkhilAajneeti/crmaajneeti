import React from "react";
import { toneFor } from "../utils/teamConstants";

/**
 * A percentage with its own evidence: the number large and in its band colour,
 * a bar for pre-attentive comparison down the column, and the raw counts
 * underneath so nobody reads "100%" off two leads as a win.
 *
 * `metric` names the band in teamConstants, which also decides whether high or
 * low is the good end — overdue at 5% is green, conversion at 5% is not.
 */
const RateCell = ({
  metric,
  value,
  numerator,
  denominator,
  suffix = "%",
  isLoading = false,
}) => {
  const tone = toneFor(metric, value);
  const hasValue = value != null && !Number.isNaN(value);

  // A cell still in flight must not look like a result. Three states, three
  // appearances: "…" waiting, "—" no answer, a number otherwise.
  if (isLoading) {
    return (
      <div className="min-w-[5.5rem]">
        <div className="h-5 w-10 animate-pulse rounded bg-muted" />
        <div className="mt-1.5 h-1.5 w-full animate-pulse rounded-full bg-muted" />
        <div className="mt-1 h-3 w-14 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  // No answer shows as a red zero rather than a dash: on a performance board
  // "we could not measure this" and "this rep did none of it" both need
  // chasing, and a dash was being read as "fine".
  const shown = hasValue ? value : 0;
  const toneText = hasValue ? tone.text : "text-red-700";

  return (
    <div className="min-w-[5.5rem]">
      <div className="flex items-baseline gap-1">
        <span
          className={`text-lg font-bold tabular-nums leading-none ${toneText}`}
          title={hasValue ? undefined : "No data returned for this metric"}
        >
          {shown}
        </span>
        <span className={`text-xs font-semibold ${toneText}`}>{suffix}</span>
      </div>

      {/* Capped at 100 so an outlier cannot overflow the track. */}
      <div className={`mt-1.5 h-1.5 w-full overflow-hidden rounded-full ${tone.track}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
          style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }}
        />
      </div>

      {denominator != null && (
        <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
          {numerator ?? 0} of {denominator ?? 0}
        </p>
      )}
    </div>
  );
};

export default RateCell;
