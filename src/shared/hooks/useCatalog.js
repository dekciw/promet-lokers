import { useState, useEffect } from 'react';
import { loadCatalog } from '../api/loadCatalog';

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
        setCatalog(data);
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
