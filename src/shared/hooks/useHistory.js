import { useState, useCallback } from 'react';
import {
  collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

async function saveToHistory(uid, config, modelName, article, price, { type = 'kp', nzFormData = null } = {}) {
  if (!uid) return;
  const entry = {
    type,
    configSnapshot: config,
    modelName,
    article,
    price,
    downloadedAt: serverTimestamp(),
  };
  if (type === 'nz' && nzFormData) entry.nzFormData = nzFormData;
  await addDoc(collection(db, 'users', uid, 'history'), entry);
}

async function loadHistoryFor(uid) {
  if (!uid) return [];
  const q = query(
    collection(db, 'users', uid, 'history'),
    orderBy('downloadedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function restoreConfig(snapshot, setters) {
  if (!snapshot || !setters) return;
  setters.setSeriesId(snapshot.seriesId, () => {});
  setters.onModelChange(snapshot.modelId);
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

async function redownloadKP(entry, catalog) {
  const { generateCommercialProposal } = await import('@/pdf/kp/generateCommercialProposal.js');
  await generateCommercialProposal({
    config: entry.configSnapshot,
    catalog,
    price: entry.price,
  });
}

async function redownloadNZ(entry, catalog) {
  const { generateNonStandardOrder } = await import('@/pdf/nz/generateNonStandardOrder.js');
  const form = entry.nzFormData ?? {};
  const priceObj = entry.price ? { clientPrice: Number(entry.price), manual: false } : null;
  await generateNonStandardOrder({
    config: entry.configSnapshot,
    catalog,
    managerName: form.managerName ?? '',
    clientName: form.clientName ?? '',
    price: priceObj,
    nzNumber: form.nzNumber ?? '',
    calcNumber: form.calcNumber ?? '',
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
    redownloadNZ,
    removeEntry,
  };
}
