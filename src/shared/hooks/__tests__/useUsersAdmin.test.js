// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';

// Моки ДО импорта useUsersAdmin (Vitest hoists vi.mock)
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn((cfg, name) => ({ __isSecondary: !!name, __name: name })),
  deleteApp: vi.fn(),
  getApps: vi.fn(() => []),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn((app) => ({ __auth: true, __app: app })),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db, name) => ({ __collection: name })),
  doc: vi.fn((db, coll, id) => ({ __doc: `${coll}/${id}` })),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => '__serverTimestamp__'),
  getFirestore: vi.fn(() => ({})),
}));
vi.mock('../../lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'admin-uid' } },
  firebaseConfig: { apiKey: 'test', projectId: 'p' },
}));

import * as fbApp from 'firebase/app';
import * as fbAuth from 'firebase/auth';
import * as fbStore from 'firebase/firestore';
import { useUsersAdmin } from '../useUsersAdmin';

function mockUsersSnap(arr) {
  return { docs: arr.map((u) => ({ id: u.uid, data: () => ({ ...u, uid: undefined }) })) };
}

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => cleanup());

describe('useUsersAdmin', () => {
  it('USERS-01: loadUsers returns array of user docs on mount', async () => {
    fbStore.getDocs.mockResolvedValueOnce(
      mockUsersSnap([
        { uid: 'uid1', email: 'a@b.c', status: 'active' },
        { uid: 'uid2', email: 'x@y.z', status: 'active' },
      ])
    );
    const { result } = renderHook(() => useUsersAdmin());

    // isLoading starts true
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.users).toEqual([
      { uid: 'uid1', email: 'a@b.c', status: 'active' },
      { uid: 'uid2', email: 'x@y.z', status: 'active' },
    ]);
    expect(result.current.error).toBeNull();
  });

  it('USERS-01 error: loadUsers sets error on getDocs failure', async () => {
    fbStore.getDocs.mockRejectedValueOnce(new Error('Network'));
    const { result } = renderHook(() => useUsersAdmin());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Network');
    expect(result.current.isLoading).toBe(false);
  });

  it('USERS-02 secondary app create flow: createUser calls correct sequence', async () => {
    // Setup: loadUsers resolves empty on mount
    fbStore.getDocs.mockResolvedValue(mockUsersSnap([]));

    const newUid = 'new-user-uid';
    fbAuth.createUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: newUid },
    });
    fbAuth.signOut.mockResolvedValue(undefined);
    fbStore.setDoc.mockResolvedValue(undefined);
    fbApp.deleteApp.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUsersAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createUser('new@user.com', 'pass123');
    });

    // initializeApp called with firebaseConfig as first arg and a string name as second
    expect(fbApp.initializeApp).toHaveBeenCalledWith(
      { apiKey: 'test', projectId: 'p' },
      expect.stringContaining('secondary-')
    );

    // createUserWithEmailAndPassword called with secondaryAuth
    expect(fbAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.objectContaining({ __auth: true }),
      'new@user.com',
      'pass123'
    );

    // setDoc called to create users/{uid} document
    expect(fbStore.setDoc).toHaveBeenCalledWith(
      { __doc: `users/${newUid}` },
      expect.objectContaining({
        email: 'new@user.com',
        status: 'active',
        createdAt: '__serverTimestamp__',
        createdBy: 'admin-uid',
      })
    );

    // signOut called on secondaryAuth
    expect(fbAuth.signOut).toHaveBeenCalledWith(
      expect.objectContaining({ __auth: true })
    );

    // deleteApp called in finally
    expect(fbApp.deleteApp).toHaveBeenCalledWith(
      expect.objectContaining({ __isSecondary: true })
    );
  });

  it('USERS-04 finally cleanup: deleteApp called even if createUserWithEmailAndPassword throws', async () => {
    fbStore.getDocs.mockResolvedValue(mockUsersSnap([]));
    fbAuth.createUserWithEmailAndPassword.mockRejectedValueOnce(
      new Error('auth/email-already-in-use')
    );
    fbApp.deleteApp.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUsersAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      try {
        await result.current.createUser('dup@user.com', 'pass123');
      } catch {
        // expected to throw
      }
    });

    // deleteApp MUST have been called (finally block)
    expect(fbApp.deleteApp).toHaveBeenCalled();

    // setDoc NOT called — did not reach Firestore write
    expect(fbStore.setDoc).not.toHaveBeenCalled();
  });

  it('USERS-03 disableUser: calls updateDoc with status:disabled and updates local state', async () => {
    fbStore.getDocs.mockResolvedValue(
      mockUsersSnap([
        { uid: 'uid1', email: 'a@b.c', status: 'active' },
        { uid: 'uid2', email: 'x@y.z', status: 'active' },
      ])
    );
    fbStore.updateDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUsersAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.disableUser('uid1');
    });

    // updateDoc called on users/uid1 with status:disabled
    expect(fbStore.updateDoc).toHaveBeenCalledWith(
      { __doc: 'users/uid1' },
      { status: 'disabled' }
    );

    // Optimistic local update
    const user1 = result.current.users.find((u) => u.uid === 'uid1');
    expect(user1.status).toBe('disabled');

    // Other users unchanged
    const user2 = result.current.users.find((u) => u.uid === 'uid2');
    expect(user2.status).toBe('active');
  });

  it('USERS-02 list refresh after create: users list updated with new entry after createUser', async () => {
    fbStore.getDocs.mockResolvedValue(mockUsersSnap([]));
    const newUid = 'brand-new-uid';
    fbAuth.createUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: newUid },
    });
    fbAuth.signOut.mockResolvedValue(undefined);
    fbStore.setDoc.mockResolvedValue(undefined);
    fbApp.deleteApp.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUsersAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.users).toHaveLength(0);

    await act(async () => {
      await result.current.createUser('fresh@user.com', 'pass456');
    });

    // New user appears in local state
    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0]).toMatchObject({
      uid: newUid,
      email: 'fresh@user.com',
      status: 'active',
    });
  });
});
