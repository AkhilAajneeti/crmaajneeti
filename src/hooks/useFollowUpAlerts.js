// The two "needs you now" buckets — leads due today and leads already overdue.
//
// This reads the SAME React Query entry the pipeline board reads: identical
// key, identical fetcher, identical params. That is deliberate. The underlying
// request fans out one call per page of leads, so a second independent query
// would double that traffic and — worse — the two copies would refresh at
// different moments and put two different overdue counts on screen at once.
// Mounting this hook next to the board costs nothing; React Query hands back
// the cached list.
//
// For the same reason there is no refetch-on-mount here. staleTime governs it,
// so returning to the dashboard five seconds after leaving it re-reads cache
// instead of re-firing the whole fan-out.

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchPipelineLeads } from "pages/pipeline/services/pipelineService";
import {
  DEFAULT_FILTERS,
  NEXT_CONTACT_FIELD,
  PIPELINE_GC_TIME,
  PIPELINE_PAGE_SIZE,
  PIPELINE_QUERY_KEY,
  PIPELINE_STALE_TIME,
} from "pages/pipeline/utils/pipelineConstants";
import {
  isBeforeToday,
  isToday,
  parseEspoToLocal,
} from "pages/pipeline/utils/dateHelpers";
import { isClosedLeadStatus } from "utils/leadStatus";

// Must match usePipelineData's key exactly or the cache is not shared. The
// board puts its date filter in the key; with the store at its defaults that
// is this object.
const SHARED_DATE_FILTER = {
  dateType: DEFAULT_FILTERS.dateType,
  closeDateFrom: DEFAULT_FILTERS.closeDateFrom,
  closeDateTo: DEFAULT_FILTERS.closeDateTo,
};

const getNextContact = (lead) =>
  lead?.[NEXT_CONTACT_FIELD] ?? lead?.cNextContactAt ?? null;

/**
 * Bucket by the follow-up date alone, deliberately NOT by the board's
 * `category`. The board's classifier sends anything with a budget-ish status
 * to its own column before it ever tests the date, so an overdue "Low Budget"
 * lead would silently never appear here. Overdue is overdue.
 */
const bucketLeads = (list) => {
  const dueToday = [];
  const overdue = [];

  for (const lead of Array.isArray(list) ? list : []) {
    if (isClosedLeadStatus(lead?.status)) continue;

    const raw = getNextContact(lead);
    const due = parseEspoToLocal(raw);
    if (!due) continue;

    const row = { ...lead, dueAt: due };

    if (isToday(raw)) dueToday.push(row);
    else if (isBeforeToday(raw)) overdue.push(row);
  }

  // Soonest first within today — that is the order you work the day in.
  dueToday.sort((a, b) => a.dueAt - b.dueAt);
  // Freshest first within overdue: the panel shows only the top handful, and
  // a lead that slipped this morning is still warm enough to recover, while
  // one from five weeks ago is a cleanup job rather than today's work. The
  // full count still appears in the header, and the darkest stripes remain
  // visible on the board.
  overdue.sort((a, b) => b.dueAt - a.dueAt);

  return { dueToday, overdue };
};

export const useFollowUpAlerts = () => {
  const query = useQuery({
    queryKey: [PIPELINE_QUERY_KEY, PIPELINE_PAGE_SIZE, SHARED_DATE_FILTER],
    queryFn: () =>
      fetchPipelineLeads({
        limit: PIPELINE_PAGE_SIZE,
        dateFilter: SHARED_DATE_FILTER,
      }),
    placeholderData: keepPreviousData,
    staleTime: PIPELINE_STALE_TIME,
    gcTime: PIPELINE_GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const { dueToday, overdue } = useMemo(
    () => bucketLeads(query.data?.list),
    [query.data]
  );

  return {
    dueToday,
    overdue,
    total: dueToday.length + overdue.length,
    // The real moment the data landed, so the header can't claim a refresh
    // that never happened.
    dataUpdatedAt: query.dataUpdatedAt,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  };
};
