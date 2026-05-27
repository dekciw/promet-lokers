// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';

// Mock firebase/firestore — hoisted by Vitest
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...args) => ({ __collection: args.slice(1).join('/') })),
  doc: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'auto-id' }),
  getDocs: vi.fn(),
  query: vi.fn((coll, ...constraints) => ({ __query: coll, __constraints: constraints })),
  orderBy: vi.fn((field, dir) => ({ __orderBy: field, __dir: dir })),
  serverTimestamp: vi.fn(() => '__serverTimestamp__'),
  getFirestore: vi.fn(() => ({})),
}));
vi.mock('../../lib/firebase', () => ({ db: {} }));

import * as fbStore from 'firebase/firestore';
import { useHistory } from '../useHistory';

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => cleanup());

describe('useHistory', () => {
  // HIST-01: saveToHistory writes correct shape to users/{uid}/history
  it('HIST-01: saveToHistory calls addDoc with correct collection path and shape', async () => {
    const { result } = renderHook(() => useHistory('user-123'));

    const config = {
      seriesId: 'ml', modelId: '10828', width: '800', height: '2000', depth: '400',
      bodyThickness: '1.5', doorThickness: '1.2', lockId: 'key_basic',
      ventilationType: null, bodyColor: null, doorColor: null,
      quantity: 10, profitability: 30,
    };

    await act(async () => {
      await result.current.saveToHistory('user-123', config, 'ML-21-80', '10828', 45000);
    });

    // Verify addDoc was called once
    expect(fbStore.addDoc).toHaveBeenCalledTimes(1);

    // Verify collection path: users/user-123/history
    const collArg = fbStore.addDoc.mock.calls[0][0];
    expect(collArg.__collection).toBe('users/user-123/history');

    // Verify shape of written document
    const docArg = fbStore.addDoc.mock.calls[0][1];
    expect(docArg).toEqual({
      configSnapshot: config,
      modelName: 'ML-21-80',
      article: '10828',
      price: 45000,
      downloadedAt: '__serverTimestamp__',
    });
  });

  // HIST-01 defensive guard: null uid → no addDoc call
  it('HIST-01: saveToHistory does nothing if uid is null (defensive guard)', async () => {
    const { result } = renderHook(() => useHistory(null));

    await act(async () => {
      await result.current.saveToHistory(null, {}, 'X', 'A', 100);
    });

    expect(fbStore.addDoc).not.toHaveBeenCalled();
  });

  // HIST-02: loadHistory reads with correct query and returns mapped array
  it('HIST-02: loadHistory returns array mapped from Firestore docs with orderBy downloadedAt desc', async () => {
    fbStore.getDocs.mockResolvedValueOnce({
      docs: [
        { id: 'h1', data: () => ({ modelName: 'ML-21-80', price: 1000 }) },
        { id: 'h2', data: () => ({ modelName: 'ML-32-50', price: 2000 }) },
      ],
    });

    const { result } = renderHook(() => useHistory('user-123'));

    await act(async () => {
      await result.current.loadHistory();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Check returned history
    expect(result.current.history).toEqual([
      { id: 'h1', modelName: 'ML-21-80', price: 1000 },
      { id: 'h2', modelName: 'ML-32-50', price: 2000 },
    ]);
    expect(result.current.error).toBeNull();

    // Verify orderBy called with downloadedAt desc
    expect(fbStore.orderBy).toHaveBeenCalledWith('downloadedAt', 'desc');
  });

  // HIST-02 error: loadHistory sets error on getDocs failure
  it('HIST-02: loadHistory sets error when getDocs throws', async () => {
    fbStore.getDocs.mockRejectedValueOnce(new Error('Firebase unavailable'));

    const { result } = renderHook(() => useHistory('user-123'));

    await act(async () => {
      await result.current.loadHistory();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Firebase unavailable');
    expect(result.current.history).toEqual([]);
  });

  // HIST-03: restoreConfig calls all 13 setters with snapshot values
  it('HIST-03: restoreConfig calls all 13 setters with correct values from snapshot', () => {
    const { result } = renderHook(() => useHistory('user-123'));

    const snapshot = {
      seriesId: 'ml',
      modelId: '10828',
      width: '800',
      height: '2000',
      depth: '400',
      bodyThickness: '1.5',
      doorThickness: '1.2',
      lockId: 'key_basic',
      ventilationType: 'roof',
      bodyColor: { name: 'RAL 9003', color: '#F4F4F4' },
      doorColor: { name: 'RAL 7016', color: '#383E42' },
      quantity: 5,
      profitability: 25,
    };

    const setters = {
      setSeriesId: vi.fn(),
      onModelChange: vi.fn(),
      setWidth: vi.fn(),
      setHeight: vi.fn(),
      setDepth: vi.fn(),
      setBodyThickness: vi.fn(),
      setDoorThickness: vi.fn(),
      setLockId: vi.fn(),
      setVentilationType: vi.fn(),
      setBodyColor: vi.fn(),
      setDoorColor: vi.fn(),
      setQuantity: vi.fn(),
      setProfitability: vi.fn(),
    };

    act(() => {
      result.current.restoreConfig(snapshot, setters);
    });

    // setSeriesId called with (seriesId, onAdvance: Function)
    expect(setters.setSeriesId).toHaveBeenCalledTimes(1);
    expect(setters.setSeriesId).toHaveBeenCalledWith(snapshot.seriesId, expect.any(Function));

    expect(setters.onModelChange).toHaveBeenCalledWith(snapshot.modelId);
    expect(setters.setWidth).toHaveBeenCalledWith(snapshot.width);
    expect(setters.setHeight).toHaveBeenCalledWith(snapshot.height);
    expect(setters.setDepth).toHaveBeenCalledWith(snapshot.depth);
    expect(setters.setBodyThickness).toHaveBeenCalledWith(snapshot.bodyThickness);
    expect(setters.setDoorThickness).toHaveBeenCalledWith(snapshot.doorThickness);
    expect(setters.setLockId).toHaveBeenCalledWith(snapshot.lockId);
    expect(setters.setVentilationType).toHaveBeenCalledWith(snapshot.ventilationType);
    expect(setters.setBodyColor).toHaveBeenCalledWith(snapshot.bodyColor);
    expect(setters.setDoorColor).toHaveBeenCalledWith(snapshot.doorColor);
    expect(setters.setQuantity).toHaveBeenCalledWith(snapshot.quantity);
    expect(setters.setProfitability).toHaveBeenCalledWith(snapshot.profitability);
  });

  // HIST-04: redownloadKP smoke test — function exists and returns a Promise
  // Full testing is manual-only per VALIDATION.md HIST-04 (dynamic import of generateCommercialProposal)
  it.skip('HIST-04: redownloadKP returns Promise (smoke) — manual-only per VALIDATION.md HIST-04', async () => {
    const { result } = renderHook(() => useHistory('user-123'));

    const entry = {
      configSnapshot: { seriesId: 'ml', modelId: '10828' },
      price: 45000,
    };
    const catalog = {};

    const promise = result.current.redownloadKP(entry, catalog);
    expect(promise).toBeInstanceOf(Promise);
    // Allow rejection (PDF generation not available in test environment)
    await promise.catch(() => {});
  });
});
