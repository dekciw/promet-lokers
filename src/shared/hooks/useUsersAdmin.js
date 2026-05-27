import { useState, useEffect, useCallback } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, firebaseConfig } from '../lib/firebase';

// USERS-02/USERS-04: создание пользователя через secondary Firebase App.
// Firebase Auth client SDK НЕ умеет создать пользователя без выхода текущего.
// Решение: отдельный FirebaseApp с уникальным именем → создание → signOut + deleteApp.
// Pitfall: имя должно быть уникальным (Date.now()), и deleteApp ОБЯЗАТЕЛЬНО в finally —
// иначе при повторном вызове получим "Firebase App named X already exists".
async function createUserViaSecondaryApp(email, password, adminUid) {
  const appName = `secondary-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, appName);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = cred.user.uid;
    await setDoc(doc(db, 'users', uid), {
      email,
      status: 'active',
      createdAt: serverTimestamp(),
      createdBy: adminUid,
    });
    return { uid, email, status: 'active' };
  } finally {
    // Cleanup ВСЕГДА — даже если create или setDoc упали
    try { await signOut(secondaryAuth); } catch { /* ignore */ }
    try { await deleteApp(secondaryApp); } catch { /* ignore */ }
  }
}

export function useUsersAdmin() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // USERS-01: load all users from Firestore
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const arr = snap.docs.map((d) => ({ ...d.data(), uid: d.id }));
      setUsers(arr);
    } catch (err) {
      setError(err.message ?? 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // USERS-02: create user via secondary app + Firestore mirror doc
  const createUser = useCallback(async (email, password) => {
    setIsCreating(true);
    try {
      const adminUid = auth.currentUser?.uid ?? 'admin';
      const newUser = await createUserViaSecondaryApp(email, password, adminUid);
      // Optimistic local update — list refresh
      setUsers((prev) => [...prev, newUser]);
    } finally {
      setIsCreating(false);
    }
  }, []);

  // USERS-03: soft-delete (deactivate)
  const disableUser = useCallback(async (uid) => {
    await updateDoc(doc(db, 'users', uid), { status: 'disabled' });
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, status: 'disabled' } : u)));
  }, []);

  return { users, isLoading, error, isCreating, loadUsers, createUser, disableUser };
}
