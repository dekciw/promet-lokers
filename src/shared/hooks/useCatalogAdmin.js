import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// localStorage key используется loadCatalog.js (regular user catalog cache).
// Каждая admin-мутация должна сбрасывать его, чтобы конфигуратор увидел свежие данные.
const CACHE_KEY = 'promet_catalog_v1';

// Firestore хранит models как объект {articleKey: modelData}, а не массив.
// Конвертируем в массив для удобной фильтрации/сортировки в UI.
function rawToArray(raw) {
  if (!raw || typeof raw !== 'object') return [];
  if (Array.isArray(raw)) return raw;
  return Object.entries(raw).map(([key, m]) => ({ article: key, ...m }));
}

// Конвертируем массив обратно в объект перед записью в Firestore.
function arrayToRaw(arr) {
  const obj = {};
  arr.forEach((m) => {
    if (m.article) obj[m.article] = m;
  });
  return obj;
}

// Helper: получить актуальный массив моделей из Firestore.
async function readModels(ref) {
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  return rawToArray(snap.data().models);
}

// Helper: записать массив моделей с merge:true (сохраняет другие поля документа: locks, series).
async function writeModels(ref, modelsArr) {
  await setDoc(ref, { models: arrayToRaw(modelsArr) }, { merge: true });
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (err) {
    // localStorage может быть недоступен (private mode) — не критично
    console.warn('[useCatalogAdmin] localStorage.removeItem failed:', err.message);
  }
}

export function useCatalogAdmin() {
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Стабилизируем ref через useMemo — без этого doc() создаётся при каждом рендере
  const ref = useMemo(() => doc(db, 'catalog', 'main'), []);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const arr = await readModels(ref);
      setModels(arr);
    } catch (err) {
      setError(err.message ?? 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // CATALOG-06: edit existing model (read-splice-write)
  const saveModel = useCallback(async (updated) => {
    const current = await readModels(ref);
    const idx = current.findIndex((m) => m.article === updated.article);
    if (idx === -1) {
      throw new Error(`Модель с артикулом ${updated.article} не найдена`);
    }
    const next = [...current];
    next[idx] = updated;
    await writeModels(ref, next);
    setModels(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CATALOG-07: add new model with auto sortOrder (max+1, или 1 если массив пуст)
  const addModel = useCallback(async (newModel) => {
    const current = await readModels(ref);
    const maxSort = current.reduce((m, x) => Math.max(m, x.sortOrder ?? 0), 0);
    const withSort = { ...newModel, sortOrder: maxSort + 1 };
    const next = [...current, withSort];
    await writeModels(ref, next);
    setModels(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CATALOG-08: delete by article
  const deleteModel = useCallback(async (article) => {
    const current = await readModels(ref);
    const next = current.filter((m) => m.article !== article);
    await writeModels(ref, next);
    setModels(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { models, isLoading, error, loadModels, saveModel, addModel, deleteModel };
}
