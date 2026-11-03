// Sales team performance board.
//
// The page answers one question — who is working their leads well — and it
// answers it with RATES, not raw counts. Ranking on volume would only measure
// how leads were handed out. Every rate therefore shows its denominator, and
// reps under the volume floor are listed separately rather than ranked, so a
// new joiner with six leads does not sit at the bottom of a leaderboard.

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

import Header from "components/ui/Header";
import Sidebar from "components/ui/Sidebar";
import Icon from "components/AppIcon";
import KPICard from "pages/dashboard/components/KPICard";

import TeamTable from "./components/TeamTable";
import Leaderboard from "./components/Leaderboard";
import TeamPerformanceChart from "./components/TeamPerformanceChart";
import TargetsDialog from "./components/TargetsDialog";
import { loadTargets, saveTargets } from "./utils/performanceScore";
import TeamPagination from "./components/TeamPagination";
import { useTeamMetrics } from "./hooks/useTeamMetrics";
import {
  DEFAULT_PERIOD,
  MIN_VOLUME_FOR_RANK,
  PERIODS,
  TONE_LEGEND,
  pct,
} from "./utils/teamConstants";

// Ten rows is about what fits above the fold next to the KPI strip; past that
// the board stops being a glance and becomes a scroll.
const PAGE_SIZE = 10;

const SalesTeam = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [periodId, setPeriodId] = useState(DEFAULT_PERIOD);
  const [sort, setSort] = useState({ key: "score", dir: "desc" });
  const [page, setPage] = useState(1);
  const [targets, setTargets] = useState(() => loadTargets());
  const [isTargetsOpen, setIsTargetsOpen] = useState(false);

  const period = PERIODS.find((p) => p.id === periodId) || PERIODS[2];
  const {
    rows,
    totals,
    seesWholeTeam,
    isLoading,
    isScoring,
    isFetching,
    hasError,
    refresh,
  } = useTeamMetrics(period.dateType, targets);

  // Any reordering invalidates the current page — page 3 of a differently
  // sorted list is a different set of people.
  const handleSort = (key) => {
    setPage(1);
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "desc" ? "asc" : "desc" }
        : { key, dir: "desc" }
    );
  };

  // Everyone is ranked. An earlier version held reps under the volume floor
  // out of the ranking entirely, which on a month where nobody reaches 20
  // leads meant a leaderboard with no numbers in it at all. The floor now
  // marks a row as low-volume instead of unranking it, so the caution is kept
  // without the table going blank.
  const sortedRows = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      // Null values sort last whichever direction is active — "no data" is not
      // a score, and letting it win the top row would be a lie.
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av - bv) * dir;
    });
  }, [rows, sort]);

  const allRows = sortedRows;
  const pageCount = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const offset = (safePage - 1) * PAGE_SIZE;
  const pageRows = allRows.slice(offset, offset + PAGE_SIZE);

  // The leaderboard is always ordered by score, whatever the table beside it
  // is sorted by — a "leaderboard" ordered by something else is a
  // contradiction. Reps with no score are left out rather than ranked last.
  const byScore = useMemo(
    () =>
      rows
        .filter((r) => r.score != null)
        .sort((a, b) => b.score - a.score),
    [rows]
  );

  const teamConversion = pct(totals?.won, totals?.assigned);
  const teamConnect = pct(totals?.callsHeld, totals?.calls);

  const kpis = [
    {
      title: "Leads assigned",
      value: totals?.assigned ?? 0,
      change: `${rows.length} reps`,
      changeType: "neutral",
      icon: "Users",
      iconBg: "bg-blue-100",
      iconColor: "#3B82F6",
      comparisonLabel: period.label.toLowerCase(),
    },
    {
      title: "Team conversion",
      value: teamConversion == null ? "—" : `${teamConversion}%`,
      change: `${totals?.won ?? 0} won`,
      changeType: "neutral",
      icon: "TrendingUp",
      iconBg: "bg-green-100",
      iconColor: "#10B981",
      comparisonLabel: period.label.toLowerCase(),
    },
    {
      title: "Calls connected",
      value: teamConnect == null ? "—" : `${teamConnect}%`,
      change: `${totals?.calls ?? 0} dialled`,
      changeType: "neutral",
      icon: "PhoneCall",
      iconBg: "bg-violet-100",
      iconColor: "#8B5CF6",
      comparisonLabel: period.label.toLowerCase(),
    },
    {
      title: "Missed follow-ups",
      value: totals?.overdue ?? 0,
      change: "due in period",
      changeType: "neutral",
      icon: "AlarmClock",
      iconBg: "bg-red-100",
      iconColor: "#EF4444",
      comparisonLabel: "across the team",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuToggle={() => setIsSidebarOpen((v) => !v)}
        isSidebarOpen={isSidebarOpen}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="relative pt-16 lg:ml-64">
        <div className="m-4 sm:m-6">
          {/* Title + period. Every figure on the page now respects this
              selector — nothing is silently all-time. */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
                Sales team
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {seesWholeTeam
                  ? "How each rep is working the leads they hold."
                  : "Your own numbers. Team-wide figures need wider lead access."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTargetsOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Icon name="Target" size={13} />
                Targets
              </button>

              <button
                type="button"
                onClick={refresh}
                disabled={isFetching}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                <Icon
                  name="RefreshCw"
                  size={13}
                  className={isFetching ? "animate-spin" : ""}
                />
                Refresh
              </button>

            <div className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-card p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPeriodId(p.id);
                    setPage(1);
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    p.id === periodId
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            </div>
          </div>
        </div>

        {/* Team totals */}
        <div className="m-4 grid grid-cols-1 gap-3 sm:m-6 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <KPICard {...kpi} isLoading={isLoading} />
            </motion.div>
          ))}
        </div>

        {/* Leaderboard + funnel. Score first, because it is the answer; the
            chart beside it is the working. */}
        <div className="m-4 grid grid-cols-1 gap-3 sm:m-6 sm:gap-5 xl:grid-cols-2">
          <Leaderboard
            rows={byScore}
            isLoading={isLoading || isScoring}
            onViewAll={() => {
              setSort({ key: "score", dir: "desc" });
              setPage(1);
              document
                .getElementById("team-table")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <TeamPerformanceChart rows={byScore} isLoading={isLoading || isScoring} />
        </div>

        {/* Legend. Three colours mean nothing until the page says what they
            mean, and a board people misread is worse than no board. */}
        <div className="mx-4 mb-3 flex flex-wrap items-center gap-2 sm:mx-6">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Colour scale:
          </span>
          {TONE_LEGEND.map((t) => (
            <span
              key={t.label}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${t.chip}`}
            >
              {t.label}
            </span>
          ))}
          <span className="text-[11px] text-muted-foreground">
            · under {MIN_VOLUME_FOR_RANK} leads is flagged low volume — rates
            swing too far to compare
          </span>
        </div>

        {hasError && (
          <div className="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:mx-6">
            <Icon name="TriangleAlert" size={16} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-xs text-red-700">
              Could not read the counts for any rep. The figures below are not
              zero — they are unknown. Check the console for the failing
              request.
            </p>
          </div>
        )}

        <div id="team-table" className="mx-4 mb-10 sm:mx-6">
          {isLoading && rows.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <Icon
                name="Loader"
                size={22}
                className="mx-auto animate-spin text-muted-foreground"
              />
              <p className="mt-3 text-sm text-muted-foreground">
                Counting leads and calls per rep…
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No active sales users found.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <TeamTable
                items={pageRows.map((row, i) => ({
                  row,
                  rank: offset + i,
                }))}
                sort={sort}
                onSort={handleSort}
              />

              <TeamPagination
                page={safePage}
                pageSize={PAGE_SIZE}
                totalItems={allRows.length}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </main>

      {isTargetsOpen && (
        <TargetsDialog
          targets={targets}
          onClose={() => setIsTargetsOpen(false)}
          onSave={(next) => {
            saveTargets(next);
            setTargets(next);
            setIsTargetsOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default SalesTeam;
