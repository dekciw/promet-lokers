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
      { models: expect.objectContaining({
        'A1': expect.objectContaining({ article: 'A1', name: 'New', sortOrder: 1 }),
        'A2': expect.objectContaining({ article: 'A2', name: 'Keep' }),
      }) },
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

    expect(result.current.models[0]).toMatchObject({ article: 'A1', name: 'Updated', sortOrder: 1 });
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

describe('reorderModels (ORDER-02)', () => {
  it('Test 1 (basic reassignment): reassigns sortOrder sequentially per new position', async () => {
    // Initial Firestore state: A=1, B=2, C=3
    firestore.getDoc.mockResolvedValue(
      mockSnap({ models: [
        { article: 'A', sortOrder: 1 },
        { article: 'B', sortOrder: 2 },
        { article: 'C', sortOrder: 3 },
      ] })
    );
    firestore.setDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Reorder: C first, then A, then B → new sortOrder: C=1, A=2, B=3
    await act(async () => {
      await result.current.reorderModels([
        { article: 'C', sortOrder: 3 },
        { article: 'A', sortOrder: 1 },
        { article: 'B', sortOrder: 2 },
      ]);
    });

    const callModels = firestore.setDoc.mock.calls[0][1].models;
    expect(callModels['C'].sortOrder).toBe(1);
    expect(callModels['A'].sortOrder).toBe(2);
    expect(callModels['B'].sortOrder).toBe(3);
  });

  it('Test 2 (local state updated): hook.models reflects new sortOrder after reorder', async () => {
    firestore.getDoc.mockResolvedValue(
      mockSnap({ models: [
        { article: 'A', sortOrder: 1 },
        { article: 'B', sortOrder: 2 },
      ] })
    );
    firestore.setDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.reorderModels([
        { article: 'B', sortOrder: 2 },
        { article: 'A', sortOrder: 1 },
      ]);
    });

    // Local state should reflect updated sortOrders without re-fetch
    const modelA = result.current.models.find((m) => m.article === 'A');
    const modelB = result.current.models.find((m) => m.article === 'B');
    expect(modelA.sortOrder).toBe(2);
    expect(modelB.sortOrder).toBe(1);
  });

  it('Test 3 (preserves invisible models): writes ALL 5 models when given only 3', async () => {
    // Firestore has 5 models; reorderModels called with only [C, A, B] (filtered view)
    firestore.getDoc.mockResolvedValue(
      mockSnap({ models: [
        { article: 'A', sortOrder: 1 },
        { article: 'B', sortOrder: 2 },
        { article: 'C', sortOrder: 3 },
        { article: 'D', sortOrder: 4 },
        { article: 'E', sortOrder: 5 },
      ] })
    );
    firestore.setDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.reorderModels([
        { article: 'C', sortOrder: 3 },
        { article: 'A', sortOrder: 1 },
        { article: 'B', sortOrder: 2 },
      ]);
    });

    const callModels = firestore.setDoc.mock.calls[0][1].models;
    // All 5 models must be present
    expect(Object.keys(callModels)).toHaveLength(5);
    // D and E preserved
    expect(callModels['D']).toBeDefined();
    expect(callModels['E']).toBeDefined();
    // Reordered subset gets new sortOrders
    expect(callModels['C'].sortOrder).toBe(1);
    expect(callModels['A'].sortOrder).toBe(2);
    expect(callModels['B'].sortOrder).toBe(3);
  });

  it('Test 4 (localStorage cache cleared): removeItem called after reorder', async () => {
    firestore.getDoc.mockResolvedValue(
      mockSnap({ models: [{ article: 'A', sortOrder: 1 }, { article: 'B', sortOrder: 2 }] })
    );
    firestore.setDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.reorderModels([
        { article: 'B', sortOrder: 2 },
        { article: 'A', sortOrder: 1 },
      ]);
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('promet_catalog_v1');
  });

  it('Test 5 (setDoc called with merge:true): second arg is { merge: true }', async () => {
    firestore.getDoc.mockResolvedValue(
      mockSnap({ models: [{ article: 'A', sortOrder: 1 }] })
    );
    firestore.setDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.reorderModels([{ article: 'A', sortOrder: 1 }]);
    });

    expect(firestore.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { merge: true }
    );
  });

  it('Test 6 (idempotent on same order): no error thrown when same order', async () => {
    firestore.getDoc.mockResolvedValue(
      mockSnap({ models: [{ article: 'A', sortOrder: 1 }, { article: 'B', sortOrder: 2 }] })
    );
    firestore.setDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Reorder with same order — should not throw and should write
    await act(async () => {
      await result.current.reorderModels([
        { article: 'A', sortOrder: 1 },
        { article: 'B', sortOrder: 2 },
      ]);
    });

    // setDoc was called (no optimization — always writes)
    expect(firestore.setDoc).toHaveBeenCalled();
  });

  it('Test 7 (handles missing sortOrder): writes consistent 1..N for models without sortOrder', async () => {
    firestore.getDoc.mockResolvedValue(
      mockSnap({ models: [
        { article: 'A' },  // no sortOrder field
        { article: 'B' },  // no sortOrder field
      ] })
    );
    firestore.setDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCatalogAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.reorderModels([
        { article: 'B' },
        { article: 'A' },
      ]);
    });

    const callModels = firestore.setDoc.mock.calls[0][1].models;
    expect(callModels['B'].sortOrder).toBe(1);
    expect(callModels['A'].sortOrder).toBe(2);
  });
});
