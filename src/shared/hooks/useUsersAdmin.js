import { useState, useEffect, useCallback } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, firebaseConfig } from '../lib/firebase';

async function createUserViaSecondaryApp(email, password, displayName, role, company, adminUid) {
  const appName = `secondary-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, appName);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = cred.user.uid;
    await setDoc(doc(db, 'users', uid), {
      email,
      displayName: displayName || '',
      role: role || 'user',
      company: company || '',
      status: 'active',
      createdAt: serverTimestamp(),
      createdBy: adminUid,
    });
    return { uid, email, displayName: displayName || '', role: role || 'user', company: company || '', status: 'active' };
  } finally {
    try { await signOut(secondaryAuth); } catch {}
    try { await deleteApp(secondaryApp); } catch {}
  }
}

export function useUsersAdmin() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

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

  const createUser = useCallback(async (email, password, displayName, role, company) => {
    setIsCreating(true);
    try {
      const adminUid = auth.currentUser?.uid ?? 'admin';
      const newUser = await createUserViaSecondaryApp(email, password, displayName, role, company, adminUid);

      setUsers((prev) => [...prev, newUser]);
    } finally {
      setIsCreating(false);
    }
  }, []);

  const disableUser = useCallback(async (uid) => {
    await updateDoc(doc(db, 'users', uid), { status: 'disabled' });
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, status: 'disabled' } : u)));
  }, []);

  const enableUser = useCallback(async (uid) => {
    await updateDoc(doc(db, 'users', uid), { status: 'active' });
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, status: 'active' } : u)));
  }, []);

  const deleteUser = useCallback(async (uid) => {
    await deleteDoc(doc(db, 'users', uid));
    setUsers((prev) => prev.filter((u) => u.uid !== uid));
  }, []);

  const updateUser = useCallback(async (uid, { displayName, company, role, email }) => {
    await updateDoc(doc(db, 'users', uid), { displayName, company, role, email });
    setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, displayName, company, role, email } : u));
  }, []);

  return { users, isLoading, error, isCreating, loadUsers, createUser, disableUser, enableUser, deleteUser, updateUser };
}
