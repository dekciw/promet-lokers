import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// localStorage key используется loadCatalog.js (regular user catalog cache).
// Любая admin-мутация должна сбрасывать его, чтобы конфигуратор увидел свежие данные.
const CACHE_KEY = 'promet_catalog_v1';

export function usePriceRulesAdmin() {
  const [priceRules, setPriceRules] = useState(null);
  const [locks, setLocks] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const ref = useMemo(() => doc(db, 'catalog', 'main'), []);

  const loadPriceRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setPriceRules({});
        setLocks({});
      } else {
        const data = snap.data();
        setPriceRules(data.priceRules ?? {});
        setLocks(data.locks ?? {});
      }
    } catch (err) {
      setError(err.message ?? 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPriceRules();
  }, [loadPriceRules]);

  const savePriceRules = useCallback(async (updatedRules, updatedLocks) => {
    setIsSaving(true);
    try {
      const payload = updatedLocks !== undefined
        ? { priceRules: updatedRules, locks: updatedLocks }
        : { priceRules: updatedRules };
      const mergeFields = updatedLocks !== undefined
        ? ['priceRules', 'locks']
        : undefined;
      await setDoc(ref, payload, mergeFields ? { mergeFields } : { merge: true });
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch (err) {
        console.warn('[usePriceRulesAdmin] localStorage.removeItem failed:', err.message);
      }
      setPriceRules(updatedRules);
      if (updatedLocks !== undefined) setLocks(updatedLocks);
    } finally {
      setIsSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { priceRules, locks, isLoading, error, isSaving, loadPriceRules, savePriceRules };
}
