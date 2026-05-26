// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the cloudinaryUpload lib module entirely
vi.mock('../../lib/cloudinaryUpload', () => ({
  resizeImageToHeight: vi.fn(),
  uploadToCloudinary: vi.fn(),
}));

import * as cloudinaryLib from '../../lib/cloudinaryUpload';
import { useImageUpload } from '../useImageUpload';

// Sample model with all 14 fields (as used in production)
const SAMPLE_MODEL = {
  sortOrder: 1,
  name: 'ML-0-45 U',
  article: 'ML-0-45 U',
  series: 'ML',
  basePrice: 12000,
  height: 1850,
  width: 600,
  depth: 500,
  bodyThickness: 0.5,
  doorThickness: 0.5,
  lockCount: 1,
  doorCount: 1,
  weight: 30,
  cpBezNDS: 10000,
};

const FAKE_SECURE_URL = 'https://res.cloudinary.com/test_cloud/image/upload/v1/model.jpg';
const FAKE_BLOB = new Blob(['resized'], { type: 'image/png' });
const FAKE_FILE = new File(['original'], 'photo.jpg', { type: 'image/jpeg' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useImageUpload', () => {
  it('Test 1 (default state): isUploading=false, uploadError=null, uploadPhoto is function', () => {
    const saveModel = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useImageUpload({ saveModel }));

    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadError).toBeNull();
    expect(typeof result.current.uploadPhoto).toBe('function');
  });

  it('Test 2 (happy path): calls resize → upload → saveModel in order', async () => {
    cloudinaryLib.resizeImageToHeight.mockResolvedValue(FAKE_BLOB);
    cloudinaryLib.uploadToCloudinary.mockResolvedValue(FAKE_SECURE_URL);
    const saveModel = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useImageUpload({ saveModel }));

    await act(async () => {
      await result.current.uploadPhoto(FAKE_FILE, SAMPLE_MODEL);
    });

    // Verify call order
    expect(cloudinaryLib.resizeImageToHeight).toHaveBeenCalledWith(FAKE_FILE, 1520);
    expect(cloudinaryLib.uploadToCloudinary).toHaveBeenCalledWith(FAKE_BLOB);
    expect(saveModel).toHaveBeenCalledWith({ ...SAMPLE_MODEL, photoUrl: FAKE_SECURE_URL });

    // Verify invocation order using mock.invocationCallOrder
    const resizeOrder = cloudinaryLib.resizeImageToHeight.mock.invocationCallOrder[0];
    const uploadOrder = cloudinaryLib.uploadToCloudinary.mock.invocationCallOrder[0];
    const saveOrder = saveModel.mock.invocationCallOrder[0];
    expect(resizeOrder).toBeLessThan(uploadOrder);
    expect(uploadOrder).toBeLessThan(saveOrder);
  });

  it('Test 3 (isUploading toggles): true during upload, false after', async () => {
    let resolveFn;
    cloudinaryLib.resizeImageToHeight.mockReturnValue(new Promise((r) => { resolveFn = r; }));
    cloudinaryLib.uploadToCloudinary.mockResolvedValue(FAKE_SECURE_URL);
    const saveModel = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useImageUpload({ saveModel }));

    let uploadPromise;
    act(() => {
      uploadPromise = result.current.uploadPhoto(FAKE_FILE, SAMPLE_MODEL);
    });

    // While resize is pending, isUploading should be true
    expect(result.current.isUploading).toBe(true);

    await act(async () => {
      resolveFn(FAKE_BLOB);
      await uploadPromise;
    });

    expect(result.current.isUploading).toBe(false);
  });

  it('Test 4 (returns photoUrl): uploadPhoto resolves with secure_url', async () => {
    cloudinaryLib.resizeImageToHeight.mockResolvedValue(FAKE_BLOB);
    cloudinaryLib.uploadToCloudinary.mockResolvedValue(FAKE_SECURE_URL);
    const saveModel = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useImageUpload({ saveModel }));

    let returnedUrl;
    await act(async () => {
      returnedUrl = await result.current.uploadPhoto(FAKE_FILE, SAMPLE_MODEL).catch(() => null);
    });

    expect(returnedUrl).toBe(FAKE_SECURE_URL);
  });

  it('Test 5 (resize error → uploadError): sets error, isUploading=false, saveModel NOT called', async () => {
    cloudinaryLib.resizeImageToHeight.mockRejectedValue(new Error('Image load failed'));
    const saveModel = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useImageUpload({ saveModel }));

    await act(async () => {
      await result.current.uploadPhoto(FAKE_FILE, SAMPLE_MODEL).catch(() => {});
    });

    expect(result.current.uploadError).toBe('Image load failed');
    expect(result.current.isUploading).toBe(false);
    expect(saveModel).not.toHaveBeenCalled();
  });

  it('Test 6 (cloudinary error → uploadError): sets error containing "400", saveModel NOT called', async () => {
    cloudinaryLib.resizeImageToHeight.mockResolvedValue(FAKE_BLOB);
    cloudinaryLib.uploadToCloudinary.mockRejectedValue(new Error('Cloudinary upload failed: 400'));
    const saveModel = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useImageUpload({ saveModel }));

    await act(async () => {
      await result.current.uploadPhoto(FAKE_FILE, SAMPLE_MODEL).catch(() => {});
    });

    expect(result.current.uploadError).toContain('400');
    expect(result.current.isUploading).toBe(false);
    expect(saveModel).not.toHaveBeenCalled();
  });

  it('Test 7 (saveModel error propagates): sets uploadError, isUploading=false', async () => {
    cloudinaryLib.resizeImageToHeight.mockResolvedValue(FAKE_BLOB);
    cloudinaryLib.uploadToCloudinary.mockResolvedValue(FAKE_SECURE_URL);
    const saveModel = vi.fn().mockRejectedValue(new Error('Firestore write failed'));

    const { result } = renderHook(() => useImageUpload({ saveModel }));

    await act(async () => {
      await result.current.uploadPhoto(FAKE_FILE, SAMPLE_MODEL).catch(() => {});
    });

    expect(result.current.uploadError).toBe('Firestore write failed');
    expect(result.current.isUploading).toBe(false);
  });

  it('Test 8 (clears uploadError on new attempt): error resets to null on next uploadPhoto', async () => {
    // First call fails
    cloudinaryLib.resizeImageToHeight.mockRejectedValueOnce(new Error('Image load failed'));
    const saveModel = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useImageUpload({ saveModel }));

    await act(async () => {
      await result.current.uploadPhoto(FAKE_FILE, SAMPLE_MODEL).catch(() => {});
    });
    expect(result.current.uploadError).toBe('Image load failed');

    // Second call succeeds
    cloudinaryLib.resizeImageToHeight.mockResolvedValue(FAKE_BLOB);
    cloudinaryLib.uploadToCloudinary.mockResolvedValue(FAKE_SECURE_URL);

    await act(async () => {
      await result.current.uploadPhoto(FAKE_FILE, SAMPLE_MODEL).catch(() => {});
    });

    expect(result.current.uploadError).toBeNull();
  });

  it('Test 9 (preserves all model fields): saveModel called with all 14 fields + new photoUrl', async () => {
    cloudinaryLib.resizeImageToHeight.mockResolvedValue(FAKE_BLOB);
    cloudinaryLib.uploadToCloudinary.mockResolvedValue(FAKE_SECURE_URL);
    const saveModel = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useImageUpload({ saveModel }));

    await act(async () => {
      await result.current.uploadPhoto(FAKE_FILE, SAMPLE_MODEL).catch(() => {});
    });

    const calledWith = saveModel.mock.calls[0][0];
    // All original 14 fields must be preserved
    Object.keys(SAMPLE_MODEL).forEach((key) => {
      expect(calledWith[key]).toEqual(SAMPLE_MODEL[key]);
    });
    // New photoUrl field added
    expect(calledWith.photoUrl).toBe(FAKE_SECURE_URL);
    // Total fields = 14 original + 1 new
    expect(Object.keys(calledWith)).toHaveLength(Object.keys(SAMPLE_MODEL).length + 1);
  });
});
