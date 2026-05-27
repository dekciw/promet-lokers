import { useState, useCallback } from 'react';
import {
  collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// HIST-01: write КП config snapshot to users/{uid}/history.
// Fire-and-forget от вызывающей стороны — НЕ блокирует UX скачивания PDF.
// Caller должен .catch(console.warn) чтобы Firestore-ошибка не сломала генерацию КП.
async function saveToHistory(uid, config, modelName, article, price) {
  if (!uid) return; // guard для anonymous (защитный, не должно происходить в проде)
  await addDoc(collection(db, 'users', uid, 'history'), {
    configSnapshot: config,
    modelName,
    article,
    price,
    downloadedAt: serverTimestamp(),
  });
}

// HIST-02: load history sorted newest first
async function loadHistoryFor(uid) {
  if (!uid) return [];
  const q = query(
    collection(db, 'users', uid, 'history'),
    orderBy('downloadedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// HIST-03: apply stored config back to useConfig state via setters.
// Setters shape — см. src/shared/hooks/useConfig.js (setters object).
function restoreConfig(snapshot, setters) {
  if (!snapshot || !setters) return;
  // setSeriesId — это handleSeriesChange(newSeriesId, onAdvance?) — onAdvance вызывает stepper-переход;
  // для programmatic restore передаём пустой колбэк, чтобы избежать побочного эффекта.
  setters.setSeriesId(snapshot.seriesId, () => {});
  setters.onModelChange(snapshot.modelId);
  // Габариты могут быть нестандартными (отличаться от defaults модели) — перезаписываем явно.
  if (snapshot.width)  setters.setWidth(snapshot.width);
  if (snapshot.height) setters.setHeight(snapshot.height);
  if (snapshot.depth)  setters.setDepth(snapshot.depth);
  setters.setBodyThickness(snapshot.bodyThickness);
  setters.setDoorThickness(snapshot.doorThickness);
  setters.setLockId(snapshot.lockId);
  setters.setVentilationType(snapshot.ventilationType);
  setters.setBodyColor(snapshot.bodyColor);
  setters.setDoorColor(snapshot.doorColor);
  setters.setQuantity(snapshot.quantity);
}

// HIST-04: regenerate КП from stored snapshot + price
async function redownloadKP(entry, catalog) {
  const { generateCommercialProposal } = await import('@/pdf/kp/generateCommercialProposal.js');
  await generateCommercialProposal({
    config: entry.configSnapshot,
    catalog,
    price: entry.price,
  });
}

async function deleteHistoryEntry(uid, entryId) {
  await deleteDoc(doc(db, 'users', uid, 'history', entryId));
}

export function useHistory(uid) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    if (!uid) { setHistory([]); return; }
    setIsLoading(true);
    setError(null);
    try {
      const arr = await loadHistoryFor(uid);
      setHistory(arr);
    } catch (err) {
      setError(err.message ?? 'Не удалось загрузить историю');
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  const removeEntry = useCallback(async (entryId) => {
    await deleteHistoryEntry(uid, entryId);
    setHistory((prev) => prev.filter((e) => e.id !== entryId));
  }, [uid]);

  return {
    history, isLoading, error,
    loadHistory,
    saveToHistory,
    restoreConfig,
    redownloadKP,
    removeEntry,
  };
}
