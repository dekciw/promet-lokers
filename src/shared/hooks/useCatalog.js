import { useState, useEffect } from 'react';
import { loadCatalog } from '../api/loadCatalog';

// ORDER-03: rebuild catalog.models with keys ordered by sortOrder (ascending).
//
// Firestore migration note: useCatalogAdmin writes models keyed by article string
// (e.g. 'S23099401102') with updated sortOrders using merge:true. The original
// numeric keys (e.g. '10828') remain in Firestore without updated sortOrder.
// This function:
//   1. Collects sortOrder from canonical article-keyed entries (key === m.article)
//   2. Propagates those sortOrders into the numeric-keyed entries (used by configurator)
//   3. Filters out article-keyed duplicates so each model appears once in the dropdown
//   4. Sorts the deduplicated set by updated sortOrder
function withSortedModels(catalog) {
  if (!catalog || !catalog.models || typeof catalog.models !== 'object') return catalog;

  // Pass 1: collect sortOrder from canonical article-keyed entries
  const sortByArticle = {};
  for (const [key, m] of Object.entries(catalog.models)) {
    if (m?.article && key === m.article) {
      sortByArticle[m.article] = m.sortOrder ?? 0;
    }
  }

  // Pass 2: build deduplicated map — skip article-keyed entries when numeric-keyed exist
  const merged = {};
  let hasNumericKeys = false;
  for (const [key, m] of Object.entries(catalog.models)) {
    if (!m || typeof m !== 'object') continue;
    if (m.article && key === m.article) continue; // skip article-keyed duplicate
    hasNumericKeys = true;
    const sortOrder = m.article
      ? (sortByArticle[m.article] ?? m.sortOrder ?? 0)
      : (m.sortOrder ?? 0);
    merged[key] = { ...m, sortOrder };
  }

  // If data is already in clean article-keyed format (no numeric keys), use as-is
  if (!hasNumericKeys) {
    for (const [key, m] of Object.entries(catalog.models)) {
      if (m && typeof m === 'object') merged[key] = m;
    }
  }

  const entries = Object.entries(merged);
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
