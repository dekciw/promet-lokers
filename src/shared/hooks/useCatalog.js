import { useState, useEffect } from 'react';
import { loadCatalog } from '../api/loadCatalog';

// ORDER-03: rebuild catalog.models with keys ordered by sortOrder (ascending).
// ES2015+ guarantees string-key iteration order = insertion order
// (confirmed by ECMAScript spec — string property keys follow creation order in
// Object.entries, for..in, Object.values, etc.).
// This means consumers using Object.values(catalog.models) automatically receive
// models in sortOrder without additional sorting at each call site.
function withSortedModels(catalog) {
  if (!catalog || !catalog.models || typeof catalog.models !== 'object') return catalog;
  const entries = Object.entries(catalog.models);
  entries.sort(([, a], [, b]) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0));
  const sortedModels = {};
  for (const [k, v] of entries) sortedModels[k] = v;
  return { ...catalog, models: sortedModels };
}

export function useCatalog() {
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setCatalogError(null);
    loadCatalog()
      .then(data => {
        setCatalog(withSortedModels(data));
        setIsLoading(false);
      })
      .catch(err => {
        setCatalogError(err.message ?? 'Неизвестная ошибка');
        setIsLoading(false);
      });
  }, [retryKey]);

  function retry() {
    setRetryKey(k => k + 1);
  }

  return { catalog, catalogError, isLoading, retry };
}
