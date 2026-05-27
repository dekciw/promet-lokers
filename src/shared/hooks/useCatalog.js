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

  const entries = Object.entries(catalog.models);

  // Pass 1: collect sortOrders from article-keyed entries + find which articles have a numeric twin
  const sortByArticle = {};
  const articlesWithNumericKey = new Set();
  for (const [key, m] of entries) {
    if (!m || typeof m !== 'object') continue;
    if (m.article && key === m.article) {
      sortByArticle[m.article] = m.sortOrder ?? 0;
    } else if (m.article && key !== m.article) {
      // numeric key pointing at a model with an article field
      articlesWithNumericKey.add(m.article);
    }
  }

  // Pass 2: deduplicate — skip article-keyed entry ONLY when a numeric-keyed twin exists.
  // New models added via admin have no numeric twin and must NOT be skipped.
  const merged = {};
  for (const [key, m] of entries) {
    if (!m || typeof m !== 'object') continue;
    if (m.article && key === m.article && articlesWithNumericKey.has(m.article)) continue;
    const sortOrder = m.article
      ? (sortByArticle[m.article] ?? m.sortOrder ?? 0)
      : (m.sortOrder ?? 0);
    merged[key] = { ...m, sortOrder };
  }

  const sorted = Object.entries(merged)
    .sort(([, a], [, b]) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0));
  const sortedModels = {};
  for (const [k, v] of sorted) sortedModels[k] = v;
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
