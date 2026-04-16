import { useState, useEffect } from 'react';
import { loadCatalog } from '../api/loadCatalog';

export function useCatalog() {
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    loadCatalog()
      .then(setCatalog)
      .catch(() => setCatalogError(true));
  }, [retryKey]);

  function retry() {
    setCatalogError(false);
    setRetryKey(k => k + 1);
  }

  return { catalog, catalogError, retry };
}
