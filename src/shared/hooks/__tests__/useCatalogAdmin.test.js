// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';

// Mock firebase/firestore — hoisted by Vitest
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ __ref: 'catalog/main' })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  getFirestore: vi.fn(() => ({})),
}));
vi.mock('../../lib/firebase', () => ({ db: {} }));

import * as firestore from 'firebase/firestore';
import { useCatalogAdmin } from '../useCatalogAdmin';

function mockSnap(data) {
  return { exists: () => data !== null, data: () => data };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // localStorage spy
  vi.spyOn(Storage.prototype, 'removeItem');
});
afterEach(() => cleanup());

describe('useCatalogAdmin', () => {
  it('loads models on mount (CATALOG-01)', async () => {
    firestore.getDoc.mockResolvedValueOnce(
      mockSnap({ models: [{ article: 'A1', name: 'Old' }] })
    );
    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.models).toEqual([{ article: 'A1', name: 'Old' }]);
    expect(result.current.error).toBeNull();
  });

  it('returns empty array when document missing', async () => {
    firestore.getDoc.mockResolvedValueOnce(mockSnap(null));
    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.models).toEqual([]);
  });

  it('sets error message on getDoc failure', async () => {
    firestore.getDoc.mockRejectedValueOnce(new Error('Network down'));
    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Network down');
  });

  it('saveModel replaces existing model by article (CATALOG-06)', async () => {
    firestore.getDoc.mockResolvedValue(
      mockSnap({ models: [{ article: 'A1', name: 'Old' }, { article: 'A2', name: 'Keep' }] })
    );
    firestore.setDoc.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.saveModel({ article: 'A1', name: 'New', sortOrder: 1 });
    });

    // Firestore хранит models как объект {key: modelData}
    expect(firestore.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      { models: {
        'A1': { article: 'A1', name: 'New', sortOrder: 1 },
        'A2': { article: 'A2', name: 'Keep' },
      } },
      { merge: true }
    );
    expect(result.current.models[0].name).toBe('New');
    expect(localStorage.removeItem).toHaveBeenCalledWith('promet_catalog_v1');
  });

  it('addModel appends with next sortOrder (CATALOG-07)', async () => {
    firestore.getDoc.mockResolvedValue(
      mockSnap({ models: [{ article: 'A1', sortOrder: 1 }] })
    );
    firestore.setDoc.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addModel({ article: 'A2', name: 'New' });
    });

    const callArgs = firestore.setDoc.mock.calls[0][1].models;
    expect(Object.keys(callArgs)).toHaveLength(2);
    expect(callArgs['A2']).toMatchObject({ article: 'A2', sortOrder: 2 });
    expect(localStorage.removeItem).toHaveBeenCalledWith('promet_catalog_v1');
  });

  it('addModel uses sortOrder=1 on empty models', async () => {
    firestore.getDoc.mockResolvedValue(mockSnap({ models: [] }));
    firestore.setDoc.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addModel({ article: 'A1', name: 'First' });
    });
    const callArgs = firestore.setDoc.mock.calls[0][1].models;
    expect(callArgs['A1'].sortOrder).toBe(1);
  });

  it('deleteModel removes by article (CATALOG-08)', async () => {
    firestore.getDoc.mockResolvedValue(
      mockSnap({ models: [{ article: 'A1' }, { article: 'A2' }] })
    );
    firestore.setDoc.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteModel('A1');
    });

    const callArgs = firestore.setDoc.mock.calls[0][1].models;
    expect(callArgs).toEqual({ 'A2': { article: 'A2' } });
    expect(result.current.models).toEqual([{ article: 'A2' }]);
    expect(localStorage.removeItem).toHaveBeenCalledWith('promet_catalog_v1');
  });

  it('saveModel updates local state after successful write', async () => {
    firestore.getDoc.mockResolvedValue(
      mockSnap({ models: [{ article: 'A1', name: 'Old', sortOrder: 1 }] })
    );
    firestore.setDoc.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.saveModel({ article: 'A1', name: 'Updated', sortOrder: 1 });
    });

    expect(result.current.models).toEqual([{ article: 'A1', name: 'Updated', sortOrder: 1 }]);
  });

  it('addModel local state contains new model after write', async () => {
    firestore.getDoc.mockResolvedValue(mockSnap({ models: [] }));
    firestore.setDoc.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addModel({ article: 'A1', name: 'Brand New' });
    });

    expect(result.current.models).toHaveLength(1);
    expect(result.current.models[0]).toMatchObject({ article: 'A1', name: 'Brand New', sortOrder: 1 });
  });

  it('deleteModel clears localStorage cache (CATALOG-08)', async () => {
    firestore.getDoc.mockResolvedValue(
      mockSnap({ models: [{ article: 'A1' }] })
    );
    firestore.setDoc.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteModel('A1');
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('promet_catalog_v1');
  });
});
