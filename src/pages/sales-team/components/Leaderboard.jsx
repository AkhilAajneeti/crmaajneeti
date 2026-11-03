import React from "react";
import Icon from "components/AppIcon";
import ScoreBadge from "./ScoreBadge";
import { getInitials } from "utils/followUpUrgency";

// Podium treatment for the top three. Literal class strings — Tailwind cannot
// see a class assembled from an index.
const PODIUM = [
  {
    row: "border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/30",
    medal: "bg-amber-100 text-amber-700 ring-amber-300",
    icon: "Trophy",
  },
  {
    row: "border-slate-200 bg-gradient-to-r from-slate-50 to-slate-50/30",
    medal: "bg-slate-200 text-slate-700 ring-slate-300",
    icon: "Medal",
  },
  {
    row: "border-orange-200 bg-gradient-to-r from-orange-50 to-orange-50/30",
    medal: "bg-orange-100 text-orange-700 ring-orange-300",
    icon: "Award",
  },
];

const TOP_N = 3;

const Leaderboard = ({ rows, onViewAll, isLoading }) => {
  // Already sorted by score upstream. Reps whose score could not be computed
  // at all are left out rather than shown at the bottom — an empty score is
  // not last place.
  const top = rows.filter((r) => r.score != null).slice(0, TOP_N);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-elevation-1 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Icon name="Trophy" size={20} />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Sales Leaderboard
            </h2>
            <p className="text-xs text-muted-foreground">
              Top performers by conversion, follow-ups and site visits.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
        >
          View all
          <Icon name="ArrowRight" size={13} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[58px] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No scores yet for this period.
        </p>
      ) : (
        <div className="space-y-2">
          {top.map((row, i) => (
            <div
              key={row.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${PODIUM[i].row}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 ${PODIUM[i].medal}`}
              >
                {i + 1}
              </span>

              <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-[11px] font-bold text-muted-foreground sm:flex">
                {getInitials(row.name)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {row.name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {row.assigned ?? 0} leads · {row.overdue ?? 0} overdue
                </p>
              </div>

              <ScoreBadge
                score={row.score}
                provisional={row.scoreProvisional}
                breakdown={row.scoreBreakdown}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Leaderboard;
