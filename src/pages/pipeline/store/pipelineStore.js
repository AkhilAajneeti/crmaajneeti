// Tiny vanilla store backed by React 18's useSyncExternalStore. Same surface
// area Zustand would give us (subscribe / getState / setState + a selector
// hook) without adding a dependency.
//
// State slices:
//   - filters           UI filter values (server-side `dateType*` + client-side rest)
//   - optimisticPatches { [leadId]: partialLead } applied over the server list
//   - removedIds        Set<string> — hide these IDs immediately on delete

import { useSyncExternalStore } from "react";
import { DEFAULT_FILTERS } from "../utils/pipelineConstants";

// ---------------------------------------------------------------------------
// Minimal store primitive
// ---------------------------------------------------------------------------

const createStore = (initial) => {
  let state = initial;
  const listeners = new Set();
  return {
    getState: () => state,
    setState: (updater) => {
      const next = typeof updater === "function" ? updater(state) : updater;
      // Shallow merge — callers can also return a whole new object.
      state = { ...state, ...next };
      listeners.forEach((l) => l());
    },
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
};

const store = createStore({
  filters: { ...DEFAULT_FILTERS },
  optimisticPatches: {},
  removedIds: new Set(),
});

// ---------------------------------------------------------------------------
// React hook — selectors must return referentially-stable snapshots for
// equal logical state. We achieve that by always returning the same slice
// object reference unless we explicitly replace it in an action.
// ---------------------------------------------------------------------------

export const usePipelineStore = (selector) => {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
};

// Selector helpers — components import these instead of writing inline selectors.
export const selectFilters = (s) => s.filters;
export const selectOptimisticPatches = (s) => s.optimisticPatches;
export const selectRemovedIds = (s) => s.removedIds;

// ---------------------------------------------------------------------------
// Actions — non-React. Safe to call from anywhere (services, event handlers).
// ---------------------------------------------------------------------------

// --- filters ---

export const setFilter = (key, value) => {
  store.setState((s) => ({
    filters: { ...s.filters, [key]: value },
  }));
};

export const setFilters = (partial) => {
  store.setState((s) => ({
    filters: { ...s.filters, ...partial },
  }));
};

export const clearFilters = () => {
  store.setState({ filters: { ...DEFAULT_FILTERS } });
};

// --- optimistic patches ---

export const setOptimisticPatch = (id, patch) => {
  if (!id) return;
  store.setState((s) => ({
    optimisticPatches: { ...s.optimisticPatches, [id]: patch },
  }));
};

export const clearOptimisticPatch = (id) => {
  if (!id) return;
  store.setState((s) => {
    if (!(id in s.optimisticPatches)) return s;
    const next = { ...s.optimisticPatches };
    delete next[id];
    return { optimisticPatches: next };
  });
};

export const clearAllOptimisticPatches = () => {
  store.setState({ optimisticPatches: {} });
};

// --- removed-id set ---

export const addRemovedId = (id) => {
  if (!id) return;
  store.setState((s) => {
    if (s.removedIds.has(id)) return s;
    const next = new Set(s.removedIds);
    next.add(id);
    return { removedIds: next };
  });
};

export const clearRemovedId = (id) => {
  if (!id) return;
  store.setState((s) => {
    if (!s.removedIds.has(id)) return s;
    const next = new Set(s.removedIds);
    next.delete(id);
    return { removedIds: next };
  });
};

export const clearAllRemovedIds = () => {
  store.setState({ removedIds: new Set() });
};

// Raw store access (rarely needed — for tests / debugging).
export const __pipelineStore = store;
