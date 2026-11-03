import React from "react";
import HoverHelp from "./HoverHelp";
import { scoreTone } from "../utils/performanceScore";

/** The per-metric arithmetic, shown on hover so the number is never a verdict
 *  without a reason. */
const Breakdown = ({ breakdown, provisional }) => (
  <>
    <div className="space-y-1.5">
      {breakdown?.map((b) => (
        <div key={b.key}>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={b.available ? "text-slate-200" : "text-slate-500 line-through"}
            >
              {b.label}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-white">
              {b.available ? `${b.points} / ${b.weight}` : "excluded"}
            </span>
          </div>
          <p className="text-[11px] leading-snug text-slate-400">{b.detail}</p>
        </div>
      ))}
    </div>

    {provisional && (
      <p className="mt-2 border-t border-slate-700 pt-2 text-[11px] text-amber-400">
        Provisional — some metrics could not be measured, so the remaining
        weights were scaled up to still total 100.
      </p>
    )}
  </>
);

const ScoreBadge = ({ score, provisional, breakdown, isLoading, size = "md" }) => {
  if (isLoading) {
    return <div className="h-7 w-16 animate-pulse rounded-full bg-muted" />;
  }

  const pad = size === "lg" ? "px-3.5 py-1.5 text-base" : "px-3 py-1 text-sm";

  return (
    <HoverHelp
      title="How this score is built"
      icon="Gauge"
      body={<Breakdown breakdown={breakdown} provisional={provisional} />}
    >
      <span
        className={`relative inline-flex items-center gap-1 rounded-full border font-bold tabular-nums ${pad} ${scoreTone(score)}`}
      >
        {score == null ? "—" : score}
        <span className="text-[11px] font-semibold opacity-70">pts</span>
        {provisional && score != null && (
          // A dot rather than a word: the badge is repeated down a column and
          // "provisional" eight times over is noise. The tooltip explains it.
          <span
            aria-label="Provisional score"
            className="ml-0.5 h-1.5 w-1.5 rounded-full bg-current opacity-50"
          />
        )}
      </span>
    </HoverHelp>
  );
};

export default ScoreBadge;
