// usePipelineFilters — thin convenience wrapper around the store's filters
// slice. Lets filter UI bind directly without learning the store internals.

import { useCallback } from "react";
import {
  clearFilters as storeClearFilters,
  selectFilters,
  setFilter as storeSetFilter,
  setFilters as storeSetFilters,
  usePipelineStore,
} from "../store/pipelineStore";
import { DEFAULT_FILTERS } from "../utils/pipelineConstants";

export const usePipelineFilters = () => {
  const filters = usePipelineStore(selectFilters);

  const setFilter = useCallback((key, value) => storeSetFilter(key, value), []);
  const setFilters = useCallback((partial) => storeSetFilters(partial), []);
  const clearFilters = useCallback(() => storeClearFilters(), []);

  // True if any value differs from the defaults — useful for showing "Clear all".
  const isDirty = Object.keys(DEFAULT_FILTERS).some(
    (k) => filters[k] !== DEFAULT_FILTERS[k]
  );

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    isDirty,
  };
};
