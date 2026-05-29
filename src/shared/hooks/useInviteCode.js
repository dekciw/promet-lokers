import { useState, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

const REF = () => doc(db, 'settings', 'registrationCode');

export async function validateInviteCode(code) {
  if (!code) return false;
  const snap = await getDoc(REF());
  if (!snap.exists()) return false;
  return snap.data().code === code;
}

export function useInviteCode() {
  const [code, setCode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadCode = useCallback(async () => {
    setIsLoading(true);
    try {
      const snap = await getDoc(REF());
      setCode(snap.exists() ? snap.data().code : null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const regenerateCode = useCallback(async () => {
    const newCode = generateCode();
    await setDoc(REF(), { code: newCode, updatedAt: serverTimestamp() });
    setCode(newCode);
    return newCode;
  }, []);

  return { code, isLoading, loadCode, regenerateCode };
}
