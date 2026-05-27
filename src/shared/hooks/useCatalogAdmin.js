import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const CACHE_KEY = 'promet_catalog_v1';

// Flatten Firestore nested model format → flat format for the admin form.
// Firestore stores: { seriesId: 'ml', defaultSpecs: { height, width, depth, bodyThickness, doorThickness } }
// Admin form needs: { series: 'ML', height, width, depth, bodyThickness, doorThickness }
// We preserve ALL original fields plus add the flat ones — configurator keeps working.
function normalizeModel(firestoreKey, m) {
  const specs = m.defaultSpecs ?? {};
  return {
    // Preserve all original Firestore fields (defaultSpecs, seriesId, doorWeight, etc.)
    ...m,
    // firestoreKey = original numeric key, needed to write back under same key + for photo fallback
    firestoreKey: m.firestoreKey ?? firestoreKey,
    // article: explicit field takes priority, then use the key
    article: m.article ?? firestoreKey,
    // Flat dimensions (from defaultSpecs or top-level)
    height:        specs.height        ?? m.height        ?? 0,
    width:         specs.width         ?? m.width         ?? 0,
    depth:         specs.depth         ?? m.depth         ?? 0,
    bodyThickness: Math.max(0.5, Number(specs.bodyThickness ?? m.bodyThickness ?? 0.5)),
    doorThickness: Math.max(0.5, Number(specs.doorThickness ?? m.doorThickness ?? 0.5)),
    // series: uppercase for display ('ML'/'LS'), derived from seriesId if not present
    series: m.series ?? (m.seriesId ? m.seriesId.toUpperCase() : 'ML'),
    // weight: use explicit total or sum of parts
    weight: m.weight ?? ((m.doorWeight ?? 0) + (m.bodyWeight ?? 0)),
    lockCount: m.lockCount ?? 1,
    doorCount:  m.doorCount  ?? 1,
    photoUrl:   m.photoUrl   ?? '',
  };
}

// Convert flat admin form data back to Firestore-compatible format.
// We must preserve: defaultSpecs (configurator reads it), seriesId (configurator filters by it),
// doorWeight/bodyWeight and any other original fields not managed by the admin form.
function toFirestoreModel(formData, original) {
  const series = formData.series ?? 'ML';
  const height        = Number(formData.height)        || 0;
  const width         = Number(formData.width)         || 0;
  const depth         = Number(formData.depth)         || 0;
  const bodyThickness = Math.max(0.5, Number(formData.bodyThickness) || 0.5);
  const doorThickness = Math.max(0.5, Number(formData.doorThickness) || 0.5);

  return {
    // Start from original to preserve all Firestore-only fields
    ...(original ?? {}),
    // Admin-managed top-level fields
    sortOrder:  Number(formData.sortOrder)  || 0,
    name:       formData.name,
    article:    formData.article,
    basePrice:  Number(formData.basePrice)  || 0,
    lockCount:  Number(formData.lockCount)  || 1,
    doorCount:  Number(formData.doorCount)  || 1,
    weight:     Number(formData.weight)     || 0,
    photoUrl:   formData.photoUrl           ?? '',
    // series in both formats for compatibility
    series:   series,
    seriesId: series.toLowerCase(),
    // Reconstruct defaultSpecs so configurator keeps working
    defaultSpecs: {
      ...(original?.defaultSpecs ?? {}),
      height, width, depth, bodyThickness, doorThickness,
    },
    // Flat copies for admin display on next load
    height, width, depth, bodyThickness, doorThickness,
    // Preserve firestoreKey (internal — stripped before writing to Firestore)
    firestoreKey: original?.firestoreKey ?? formData.article,
  };
}

// Firestore stores models as object {key: modelData}.
// rawToArray deduplicates (numeric key vs article key) and normalizes to admin flat format.
function rawToArray(raw) {
  if (!raw || typeof raw !== 'object') return [];
  if (Array.isArray(raw)) return raw;
  const byArticle = new Map();
  for (const [key, m] of Object.entries(raw)) {
    if (!m || typeof m !== 'object') continue;
    const article = m.article ?? key;
    const existing = byArticle.get(article);
    if (!existing) {
      // First occurrence — store with this key as firestoreKey
      byArticle.set(article, normalizeModel(key, { article, ...m }));
    } else if (key === article) {
      // Article-keyed entry is canonical — overwrite but preserve numeric firestoreKey
      byArticle.set(article, normalizeModel(key, {
        article,
        ...m,
        firestoreKey: existing.firestoreKey ?? key,
      }));
    }
    // else: keep the existing entry (numeric key already stored)
  }
  return Array.from(byArticle.values());
}

// Write models back as keyed object.
// Use firestoreKey to preserve original numeric keys (so configurator modelId stays valid).
// Strip firestoreKey itself — it's an internal admin-only field.
// Dual-write: if article differs from firestoreKey, also update the article-keyed entry so
// withSortedModels in useCatalog always reads a fresh sortOrder from the article-keyed entry.
function arrayToRaw(arr) {
  const obj = {};
  arr.forEach((m) => {
    const key = m.firestoreKey ?? m.article;
    if (!key) return;
    // eslint-disable-next-line no-unused-vars
    const { firestoreKey, ...rest } = m;
    obj[key] = rest;
    if (m.article && m.article !== key) {
      obj[m.article] = rest;
    }
  });
  return obj;
}

async function readModels(ref) {
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  return rawToArray(snap.data().models);
}

async function writeModels(ref, modelsArr) {
  await setDoc(ref, { models: arrayToRaw(modelsArr) }, { mergeFields: ['models'] });
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (err) {
    console.warn('[useCatalogAdmin] localStorage.removeItem failed:', err.message);
  }
}

export function useCatalogAdmin() {
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => { loadModels(); }, [loadModels]);

  // CATALOG-06: edit existing model
  const saveModel = useCallback(async (formData) => {
    const current = await readModels(ref);
    const idx = current.findIndex((m) => m.article === formData.article);
    if (idx === -1) throw new Error(`Модель с артикулом ${formData.article} не найдена`);
    const firestoreModel = toFirestoreModel(formData, current[idx]);
    const next = [...current];
    next[idx] = firestoreModel;
    await writeModels(ref, next);
    setModels(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CATALOG-07: add new model
  const addModel = useCallback(async (formData) => {
    const current = await readModels(ref);
    const maxSort = current.reduce((m, x) => Math.max(m, x.sortOrder ?? 0), 0);
    const firestoreModel = toFirestoreModel(
      { ...formData, sortOrder: maxSort + 1 },
      null,
    );
    const next = [...current, firestoreModel];
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

  // ORDER-02: reorder — must read full array to protect non-visible models
  const reorderModels = useCallback(async (reorderedArr) => {
    const withNewOrder = reorderedArr.map((m, i) => ({ ...m, sortOrder: i + 1 }));
    const current = await readModels(ref);
    const next = current.map((m) => {
      const updated = withNewOrder.find((u) => u.article === m.article);
      return updated ?? m;
    });
    await writeModels(ref, next);
    setModels(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { models, isLoading, error, loadModels, saveModel, addModel, deleteModel, reorderModels };
}
