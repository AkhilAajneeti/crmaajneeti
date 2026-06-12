// usePipelineData — the orchestrator hook.
//
// Wires React Query + the pipeline store together:
//   - Server cache: React Query keyed by [PIPELINE_QUERY_KEY, limit, dateFilter]
//   - Service cache: pipelineService internal Map (cleared on mutate + refetch)
//   - Local UI overlay: optimistic patches + removed-id set from the store
//
// Returns an enriched + classified + filtered list ready for the kanban,
// plus mutations exposed as plain functions for the UI to call.

import { useMemo, useCallback } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  PIPELINE_QUERY_KEY,
  PIPELINE_STALE_TIME,
  PIPELINE_GC_TIME,
  PIPELINE_PAGE_SIZE,
} from "../utils/pipelineConstants";
import {
  applyOptimisticState,
  buildPipelineDeals,
  groupDealsByCategory,
} from "../utils/pipelineHelpers";
import {
  deletePipelineDeal,
  fetchPipelineLeads,
  invalidatePipelineCache,
  persistDealReschedule,
} from "../services/pipelineService";
import {
  selectFilters,
  selectOptimisticPatches,
  selectRemovedIds,
  setOptimisticPatch,
  clearOptimisticPatch,
  addRemovedId,
  clearRemovedId,
  usePipelineStore,
} from "../store/pipelineStore";

// ---------------------------------------------------------------------------
// Client-side filter application — runs over the enriched deals AFTER
// classification. Only `dateType / closeDateFrom / closeDateTo` are server-side;
// everything else is local-only.
// ---------------------------------------------------------------------------

const matchesText = (deal, search) => {
  if (!search) return true;
  const q = String(search).trim().toLowerCase();
  if (!q) return true;
  return [
    deal?.name,
    deal?.firstName,
    deal?.lastName,
    deal?.accountName,
    deal?.assignedUserName,
    deal?.emailAddress,
    deal?.phoneNumber,
  ].some((v) => String(v ?? "").toLowerCase().includes(q));
};

const eq = (filterValue, leadValue) =>
  !filterValue || filterValue === "all" || filterValue === leadValue;

const applyClientFilters = (deals, filters) =>
  deals.filter(
    (d) =>
      matchesText(d, filters.search) &&
      eq(filters.owner, d.assignedUserId) &&
      eq(filters.status, d.status) &&
      eq(filters.source, d.source) &&
      eq(filters.priority, d.priority) &&
      eq(filters.category, d.category)
  );

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

export const usePipelineData = ({ limit = PIPELINE_PAGE_SIZE } = {}) => {
  const queryClient = useQueryClient();

  // Subscribe to the three store slices independently — each rerenders only
  // when its slice reference changes.
  const filters = usePipelineStore(selectFilters);
  const optimisticPatches = usePipelineStore(selectOptimisticPatches);
  const removedIds = usePipelineStore(selectRemovedIds);

  // Only the date filter participates in the queryKey — everything else is
  // client-side and shouldn't trigger refetches.
  const dateFilter = useMemo(
    () => ({
      dateType: filters.dateType,
      closeDateFrom: filters.closeDateFrom,
      closeDateTo: filters.closeDateTo,
    }),
    [filters.dateType, filters.closeDateFrom, filters.closeDateTo]
  );

  const query = useQuery({
    queryKey: [PIPELINE_QUERY_KEY, limit, dateFilter],
    queryFn: () => fetchPipelineLeads({ limit, dateFilter }),
    placeholderData: keepPreviousData,
    staleTime: PIPELINE_STALE_TIME,
    gcTime: PIPELINE_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  // Pipeline list memo — overlay store state then classify + filter.
  const deals = useMemo(() => {
    const raw = query.data?.list || [];
    const withOverlay = applyOptimisticState(raw, optimisticPatches, removedIds);
    const enriched = buildPipelineDeals(withOverlay);
    return applyClientFilters(enriched, filters);
  }, [query.data, optimisticPatches, removedIds, filters]);

  // Group by column — cheap derived view for the kanban.
  const dealsByColumn = useMemo(() => groupDealsByCategory(deals), [deals]);

  // refetch must blow away the service cache, not just RQ's.
  const refetch = useCallback(async () => {
    invalidatePipelineCache();
    await queryClient.invalidateQueries({
      queryKey: [PIPELINE_QUERY_KEY],
      exact: false,
    });
    return query.refetch();
  }, [queryClient, query]);

  // -------------------------------------------------------------------------
  // Mutations — optimistic patch first, network second, reconcile last.
  // -------------------------------------------------------------------------

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, nextContact }) =>
      persistDealReschedule(id, nextContact),
    onMutate: ({ id, nextContact }) => {
      setOptimisticPatch(id, { cNextContact: nextContact });
      return { id };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.id) clearOptimisticPatch(ctx.id);
      toast.error(err?.message || "Failed to reschedule");
    },
    onSuccess: (_data, { id }) => {
      // Clear the patch — the network response is now the truth.
      clearOptimisticPatch(id);
      toast.success("Follow-up rescheduled");
      // RQ refetch picks up the fresh value.
      queryClient.invalidateQueries({
        queryKey: [PIPELINE_QUERY_KEY],
        exact: false,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }) => deletePipelineDeal(id),
    onMutate: ({ id }) => {
      addRemovedId(id);
      return { id };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.id) clearRemovedId(ctx.id);
      toast.error(err?.message || "Failed to delete lead");
    },
    onSuccess: (_data, { id }) => {
      toast.success("Lead deleted");
      // Leave the id in removedIds; the next list refetch will simply not
      // include it. Clearing now would briefly reintroduce it.
      queryClient.invalidateQueries({
        queryKey: [PIPELINE_QUERY_KEY],
        exact: false,
      });
      // After the refetch lands, the lead is gone from raw too — we can
      // safely drop the removed-id entry to keep the Set from growing.
      // (Small race window is fine; if RQ hasn't refetched yet, the overlay
      // still hides it.)
      setTimeout(() => clearRemovedId(id), PIPELINE_STALE_TIME);
    },
  });

  return {
    // data
    deals,
    dealsByColumn,
    total: query.data?.total,
    hasMore: false, // fan-out paginates everything

    // query state
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,

    // actions
    refetch,
    reschedule: (id, nextContact) =>
      rescheduleMutation.mutateAsync({ id, nextContact }),
    deleteDeal: (id) => deleteMutation.mutateAsync({ id }),

    // mutation state (for buttons / spinners)
    isRescheduling: rescheduleMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
