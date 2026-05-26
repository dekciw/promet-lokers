// @vitest-environment jsdom
// NOTE: env vars must be stubbed BEFORE importing the module under test.
// Because cloudinaryUpload.js reads import.meta.env at module-load time,
// we use dynamic import() inside each test after vi.stubEnv() calls.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// jsdom doesn't implement URL.createObjectURL/revokeObjectURL — define stubs at module level
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:fake');
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}

beforeEach(() => {
  vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'test_cloud');
  vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET', 'test_preset');
  vi.resetModules(); // force re-import with stubbed env vars
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// ──────────────────────────────────────────────
// resizeImageToHeight
// ──────────────────────────────────────────────

describe('resizeImageToHeight', () => {
  function setupImageMock({ naturalWidth = 800, naturalHeight = 400, error = false } = {}) {
    const MockImage = class {
      constructor() {
        this.naturalWidth = naturalWidth;
        this.naturalHeight = naturalHeight;
      }
      set src(_v) {
        // Simulate async onload / onerror
        setTimeout(() => {
          if (error) {
            this.onerror?.();
          } else {
            this.onload?.();
          }
        }, 0);
      }
    };
    Object.defineProperty(global, 'Image', { value: MockImage, writable: true, configurable: true });
  }

  function setupCanvasMock({ toBlobNull = false } = {}) {
    const drawImage = vi.fn();
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });
    const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => {
      if (toBlobNull) {
        cb(null);
      } else {
        cb(new Blob(['x'], { type: 'image/png' }));
      }
    });
    return { drawImage, getContextSpy, toBlobSpy };
  }

  it('Test 1 (resize math): sets canvas width/height proportionally', async () => {
    // 800x400 → targetHeight=1520 → scale=3.8 → width=3040
    setupImageMock({ naturalWidth: 800, naturalHeight: 400 });
    const { toBlobSpy } = setupCanvasMock();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL');

    const { resizeImageToHeight } = await import('../cloudinaryUpload.js');
    const file = new Blob(['img'], { type: 'image/png' });

    const canvas = document.createElement('canvas');
    const canvasSetterSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb) {
      // Check that canvas dimensions were set correctly
      expect(this.width).toBe(3040);
      expect(this.height).toBe(1520);
      cb(new Blob(['x'], { type: 'image/png' }));
    });

    await resizeImageToHeight(file, 1520);
    expect(canvasSetterSpy).toHaveBeenCalled();
  });

  it('Test 2 (default arg): uses 1520 as default targetHeight', async () => {
    setupImageMock({ naturalWidth: 760, naturalHeight: 400 });
    setupCanvasMock();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL');

    const { resizeImageToHeight } = await import('../cloudinaryUpload.js');
    const file = new Blob(['img'], { type: 'image/png' });

    const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb) {
      // default targetHeight=1520 → scale = 1520/400 = 3.8 → width = 760*3.8 = 2888
      expect(this.height).toBe(1520);
      cb(new Blob(['x'], { type: 'image/png' }));
    });

    await resizeImageToHeight(file); // no second arg
    expect(toBlobSpy).toHaveBeenCalled();
  });

  it('Test 3 (memory leak guard): createObjectURL once, revokeObjectURL once', async () => {
    setupImageMock({ naturalWidth: 800, naturalHeight: 400 });
    setupCanvasMock();
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const { resizeImageToHeight } = await import('../cloudinaryUpload.js');
    const file = new Blob(['img'], { type: 'image/png' });

    await resizeImageToHeight(file, 1520);

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledTimes(1);
  });

  it('Test 4 (error path): img.onerror rejects with "Image load failed"', async () => {
    setupImageMock({ error: true });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const { resizeImageToHeight } = await import('../cloudinaryUpload.js');
    const file = new Blob(['img'], { type: 'image/png' });

    await expect(resizeImageToHeight(file, 1520)).rejects.toThrow('Image load failed');
  });

  it('Test 5 (toBlob null guard): canvas.toBlob(null) rejects with "Canvas toBlob"', async () => {
    setupImageMock({ naturalWidth: 800, naturalHeight: 400 });
    setupCanvasMock({ toBlobNull: true });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const { resizeImageToHeight } = await import('../cloudinaryUpload.js');
    const file = new Blob(['img'], { type: 'image/png' });

    await expect(resizeImageToHeight(file, 1520)).rejects.toThrow('Canvas toBlob');
  });
});

// ──────────────────────────────────────────────
// uploadToCloudinary
// ──────────────────────────────────────────────

describe('uploadToCloudinary', () => {
  it('Test 6 (happy path): returns secure_url on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ secure_url: 'https://res.cloudinary.com/foo/x.jpg' }),
    });

    const { uploadToCloudinary } = await import('../cloudinaryUpload.js');
    const blob = new Blob(['img'], { type: 'image/png' });
    const url = await uploadToCloudinary(blob);

    expect(url).toBe('https://res.cloudinary.com/foo/x.jpg');
  });

  it('Test 7 (FormData shape): correct URL + FormData with file + upload_preset', async () => {
    let capturedUrl;
    let capturedBody;

    global.fetch = vi.fn().mockImplementation((url, options) => {
      capturedUrl = url;
      capturedBody = options.body;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ secure_url: 'https://res.cloudinary.com/test_cloud/x.jpg' }),
      });
    });

    const { uploadToCloudinary } = await import('../cloudinaryUpload.js');
    const blob = new Blob(['img'], { type: 'image/png' });
    await uploadToCloudinary(blob);

    expect(capturedUrl).toBe('https://api.cloudinary.com/v1_1/test_cloud/image/upload');
    expect(capturedBody).toBeInstanceOf(FormData);
    // jsdom wraps Blob in File when appended to FormData — check instanceof Blob (File extends Blob)
    expect(capturedBody.get('file')).toBeInstanceOf(Blob);
    expect(capturedBody.get('file').size).toBe(blob.size);
    expect(capturedBody.get('upload_preset')).toBe('test_preset');
  });

  it('Test 8 (network error): fetch resolves {ok:false, status:400} → rejects', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
    });

    const { uploadToCloudinary } = await import('../cloudinaryUpload.js');
    const blob = new Blob(['img'], { type: 'image/png' });

    await expect(uploadToCloudinary(blob)).rejects.toThrow('Cloudinary upload failed: 400');
  });

  it('Test 9 (env vars): reads VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET', async () => {
    // env already stubbed in beforeEach: test_cloud / test_preset
    let capturedUrl;
    let capturedBody;

    global.fetch = vi.fn().mockImplementation((url, options) => {
      capturedUrl = url;
      capturedBody = options.body;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ secure_url: 'https://res.cloudinary.com/test_cloud/img.jpg' }),
      });
    });

    const { uploadToCloudinary } = await import('../cloudinaryUpload.js');
    const blob = new Blob(['img'], { type: 'image/png' });
    await uploadToCloudinary(blob);

    expect(capturedUrl).toContain('test_cloud');
    expect(capturedBody.get('upload_preset')).toBe('test_preset');
  });
});
