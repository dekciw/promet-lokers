import { useState, useEffect } from 'react';
import { loadCatalog } from '../api/loadCatalog';

function withSortedModels(catalog) {
  if (!catalog || !catalog.models || typeof catalog.models !== 'object') return catalog;

  const entries = Object.entries(catalog.models);

  const sortByArticle = {};
  const articlesWithNumericKey = new Set();
  for (const [key, m] of entries) {
    if (!m || typeof m !== 'object') continue;
    if (m.article && key === m.article) {
      sortByArticle[m.article] = m.sortOrder ?? 0;
    } else if (m.article && key !== m.article) {

      articlesWithNumericKey.add(m.article);
    }
  }

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
