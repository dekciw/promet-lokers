// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ _path: 'catalog/main' })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));
vi.mock('../../lib/firebase', () => ({ db: { _mock: true } }));

import * as firestore from 'firebase/firestore';
import { usePriceRulesAdmin } from '../usePriceRulesAdmin';

const SAMPLE_PRICE_RULES = {
  thickness: {
    minQty: 100,
    ml: { '0.5': 0.1, '0.6': 0.25, '0.7': 0.85 },
    ls: { '0.5': 0.1, '0.6': 0.25, '0.7': 0.85 },
  },
  depth: {
    ml: { '450': { qty10: 0.05, qty50: 0.03, qty100: 0.02 } },
    ls: {},
  },
  height: {
    ml: { '1800': -0.02, '2000': 0.05 },
    ls: {},
  },
  ventilation: {
    roof:       { qty1: 0.15, qty10: 0.1, qty50: 0.07, qty100: 0.05 },
    roofBottom: { qty1: 0.25, qty10: 0.2, qty50: 0.15, qty100: 0.1 },
  },
};

function mockSnap(data) {
  return { exists: () => data !== null, data: () => data };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.spyOn(Storage.prototype, 'removeItem');
});
afterEach(() => cleanup());

describe('usePriceRulesAdmin', () => {
  it('Test 1 (PRICE-01): loads priceRules on mount, isLoading toggles true→false', async () => {
    firestore.getDoc.mockResolvedValueOnce(
      mockSnap({ priceRules: SAMPLE_PRICE_RULES })
    );
    const { result } = renderHook(() => usePriceRulesAdmin());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.priceRules).toEqual(SAMPLE_PRICE_RULES);
    expect(result.current.error).toBeNull();
  });

  it('Test 2 (PRICE-01): returns empty object when document does not exist', async () => {
    firestore.getDoc.mockResolvedValueOnce(mockSnap(null));
    const { result } = renderHook(() => usePriceRulesAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.priceRules).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it('Test 3 (PRICE-01): sets error message on getDoc failure, priceRules stays null', async () => {
    firestore.getDoc.mockRejectedValueOnce(new Error('Network down'));
    const { result } = renderHook(() => usePriceRulesAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Network down');
    expect(result.current.priceRules).toBeNull();
  });

  it('Test 4 (PRICE-06): savePriceRules calls setDoc with merge:true', async () => {
    firestore.getDoc.mockResolvedValueOnce(
      mockSnap({ priceRules: SAMPLE_PRICE_RULES })
    );
    firestore.setDoc.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePriceRulesAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.savePriceRules(SAMPLE_PRICE_RULES);
    });

    expect(firestore.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ _path: 'catalog/main' }),
      { priceRules: SAMPLE_PRICE_RULES },
      { merge: true }
    );
  });

  it('Test 5 (PRICE-06): localStorage.removeItem called with promet_catalog_v1 after save', async () => {
    firestore.getDoc.mockResolvedValueOnce(
      mockSnap({ priceRules: SAMPLE_PRICE_RULES })
    );
    firestore.setDoc.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePriceRulesAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');
    await act(async () => {
      await result.current.savePriceRules(SAMPLE_PRICE_RULES);
    });

    await waitFor(() => expect(removeSpy).toHaveBeenCalledWith('promet_catalog_v1'));
  });

  it('Test 6 (PRICE-06): isSaving toggles false→true→false, priceRules updated after save', async () => {
    firestore.getDoc.mockResolvedValueOnce(
      mockSnap({ priceRules: SAMPLE_PRICE_RULES })
    );
    const updated = { ...SAMPLE_PRICE_RULES, ventilation: { roof: { qty1: 0.99 } } };
    firestore.setDoc.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePriceRulesAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isSaving).toBe(false);
    await act(async () => {
      await result.current.savePriceRules(updated);
    });
    expect(result.current.isSaving).toBe(false);
    expect(result.current.priceRules).toEqual(updated);
  });

  it('Test 7 (PRICE-06): setDoc rejection re-throws, isSaving returns false, localStorage NOT cleared', async () => {
    firestore.getDoc.mockResolvedValueOnce(
      mockSnap({ priceRules: SAMPLE_PRICE_RULES })
    );
    firestore.setDoc.mockRejectedValueOnce(new Error('Firestore write failed'));
    const { result } = renderHook(() => usePriceRulesAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');
    await act(async () => {
      await expect(result.current.savePriceRules(SAMPLE_PRICE_RULES)).rejects.toThrow('Firestore write failed');
    });

    expect(result.current.isSaving).toBe(false);
    expect(removeSpy).not.toHaveBeenCalledWith('promet_catalog_v1');
  });
});
