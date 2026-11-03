// Assembles the board: who is on it, and how each of them is doing.
//
// ONE query for the whole page. Every rep, every metric, the summary strip,
// the leaderboard and the chart are all tallied from the period's records in
// `fetchTeamAggregate`. The previous version issued a COUNT request per metric
// per rep, which on a 116-user instance meant over a thousand round trips and
// minutes of spinner.

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getScopeLevel } from "utils/permissions";
import { fetchTeamAggregate } from "../services/teamAggregate.service";
import { MIN_VOLUME_FOR_RANK, pct } from "../utils/teamConstants";
import { calculateScore, loadTargets } from "../utils/performanceScore";

const STALE = 60 * 60 * 1000; // one hour
const GC = 60 * 60 * 1000;

const CACHE_KEY = "sales_team_aggregate";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("login_object") || "{}");
  } catch {
    return {};
  }
};

// The aggregate is small — one row per rep — so unlike the raw records it is
// worth keeping on disk. That is what makes a page refresh instant instead of
// re-reading the period.
//
// Scoped by user id: the lists are ACL-filtered server-side, so one login's
// aggregate is not valid for another on a shared machine.
const diskKey = (dateType) =>
  `${CACHE_KEY}_${getStoredUser()?.id || "anon"}_${dateType}`;

const readDisk = (dateType) => {
  try {
    const stored = JSON.parse(localStorage.getItem(diskKey(dateType)));
    if (!stored || Date.now() - stored.fetchedAt > STALE) return null;
    return stored;
  } catch {
    return null;
  }
};

const writeDisk = (dateType, value) => {
  try {
    localStorage.setItem(diskKey(dateType), JSON.stringify(value));
  } catch {
    // Quota or private mode — React Query still caches for the session.
  }
};

export const useTeamMetrics = (dateType, targets) => {
  const queryClient = useQueryClient();
  const me = getStoredUser();
  const activeTargets = targets || loadTargets();

  const scope = getScopeLevel("Lead", "read");
  const seesWholeTeam = scope == null || scope === "all" || scope === "team";

  const query = useQuery({
    queryKey: ["team-aggregate", dateType],
    queryFn: async () => {
      const cached = readDisk(dateType);
      if (cached) return cached;

      const fresh = await fetchTeamAggregate({ dateType });
      writeDisk(dateType, fresh);
      return fresh;
    },
    staleTime: STALE,
    gcTime: GC,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const rows = useMemo(() => {
    const reps = query.data?.reps || [];

    // Someone who can only read their own leads sees one honest row rather
    // than a team board where every other figure is zero.
    const visible = seesWholeTeam ? reps : reps.filter((r) => r.id === me?.id);

    return visible.map((m) => {
      const score = calculateScore(m, activeTargets);

      return {
        ...m,
        isMe: m.id === me?.id,
        isLoadingCore: false,
        isLoadingScore: false,
        isLoadingDetail: false,

        conversion: pct(m.won, m.assigned),
        connectRate: pct(m.callsHeld, m.calls),
        // Leads someone has actually touched — everything off the New status.
        contacted: Math.max(0, m.assigned - m.newLeads),
        overdue: m.followUpsMissed,

        score: score.total,
        scoreProvisional: score.provisional,
        scoreBreakdown: score.breakdown,

        ranked: m.assigned >= MIN_VOLUME_FOR_RANK,
      };
    });
  }, [query.data, seesWholeTeam, activeTargets, me?.id]);

  const refresh = () => {
    try {
      localStorage.removeItem(diskKey(dateType));
    } catch {}
    queryClient.invalidateQueries({ queryKey: ["team-aggregate"], exact: false });
  };

  return {
    rows,
    totals: query.data?.totals,
    refresh,
    seesWholeTeam,
    isLoading: query.isLoading,
    isScoring: query.isLoading,
    isFetching: query.isFetching,
    hasError: query.isError,
  };
};

/**
 * Kept so the page's per-row API does not change: every figure now arrives
 * with the single aggregate, so there is nothing left to fetch per page.
 */
export const useRepDetails = () => ({});
