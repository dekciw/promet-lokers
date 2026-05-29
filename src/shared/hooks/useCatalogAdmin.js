import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const CACHE_KEY = 'promet_catalog_v1';

function normalizeModel(firestoreKey, m) {
  const specs = m.defaultSpecs ?? {};
  return {

    ...m,

    firestoreKey: m.firestoreKey ?? firestoreKey,

    article: m.article ?? firestoreKey,

    height:        specs.height        ?? m.height        ?? 0,
    width:         specs.width         ?? m.width         ?? 0,
    depth:         specs.depth         ?? m.depth         ?? 0,
    bodyThickness: Number(specs.bodyThickness ?? m.bodyThickness) || 0.5,
    doorThickness: Number(specs.doorThickness ?? m.doorThickness) || 0.5,

    series: m.series ?? (m.seriesId ? m.seriesId.toUpperCase() : 'ML'),

    weight: m.weight ?? ((m.doorWeight ?? 0) + (m.bodyWeight ?? 0)),
    lockCount: m.lockCount ?? 1,
    doorCount:  m.doorCount  ?? 1,
    photoUrl:   m.photoUrl   ?? '',
  };
}

function toFirestoreModel(formData, original) {
  const series = formData.series ?? 'ML';
  const height        = Number(formData.height)        || 0;
  const width         = Number(formData.width)         || 0;
  const depth         = Number(formData.depth)         || 0;
  const bodyThickness = Number(formData.bodyThickness) || 0.5;
  const doorThickness = Number(formData.doorThickness) || 0.5;

  return {

    ...(original ?? {}),

    sortOrder:  Number(formData.sortOrder)  || 0,
    name:       formData.name,
    article:    formData.article,
    basePrice:  Number(formData.basePrice)  || 0,
    lockCount:  Number(formData.lockCount)  || 1,
    doorCount:  Number(formData.doorCount)  || 1,
    weight:     Number(formData.weight)     || 0,
    photoUrl:   formData.photoUrl           ?? '',

    series:   series,
    seriesId: series.toLowerCase(),

    defaultSpecs: {
      ...(original?.defaultSpecs ?? {}),
      height, width, depth, bodyThickness, doorThickness,
    },

    height, width, depth, bodyThickness, doorThickness,

    firestoreKey: original?.firestoreKey ?? formData.article,
  };
}

function rawToArray(raw) {
  if (!raw || typeof raw !== 'object') return [];
  if (Array.isArray(raw)) return raw;
  const byArticle = new Map();
  for (const [key, m] of Object.entries(raw)) {
    if (!m || typeof m !== 'object') continue;
    const article = m.article ?? key;
    const existing = byArticle.get(article);
    if (!existing) {

      byArticle.set(article, normalizeModel(key, { article, ...m }));
    } else if (key === article) {

      byArticle.set(article, normalizeModel(key, {
        article,
        ...m,
        firestoreKey: existing.firestoreKey ?? key,
      }));
    }

  }
  return Array.from(byArticle.values());
}

function arrayToRaw(arr) {
  const obj = {};
  arr.forEach((m) => {
    const key = m.firestoreKey ?? m.article;
    if (!key) return;

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

  }, []);

  useEffect(() => { loadModels(); }, [loadModels]);

  const saveModel = useCallback(async (formData) => {
    const current = await readModels(ref);
    const idx = current.findIndex((m) => m.article === formData.article);
    if (idx === -1) throw new Error(`Модель с артикулом ${formData.article} не найдена`);
    const firestoreModel = toFirestoreModel(formData, current[idx]);
    const next = [...current];
    next[idx] = firestoreModel;
    await writeModels(ref, next);
    setModels(next);

  }, []);

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

  }, []);

  const deleteModel = useCallback(async (article) => {
    const current = await readModels(ref);
    const next = current.filter((m) => m.article !== article);
    await writeModels(ref, next);
    setModels(next);

  }, []);

  const reorderModels = useCallback(async (reorderedArr) => {
    const withNewOrder = reorderedArr.map((m, i) => ({ ...m, sortOrder: i + 1 }));
    const current = await readModels(ref);
    const next = current.map((m) => {
      const updated = withNewOrder.find((u) => u.article === m.article);
      return updated ?? m;
    });
    await writeModels(ref, next);
    setModels(next);

  }, []);

  return { models, isLoading, error, loadModels, saveModel, addModel, deleteModel, reorderModels };
}
