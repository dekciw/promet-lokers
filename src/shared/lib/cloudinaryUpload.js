// Cloudinary unsigned upload — no SDK, no Firebase Storage (Spark plan blocks Storage).
// Constants read at module-load time — Vite injects import.meta.env at build time.
// For tests: vi.stubEnv() + vi.resetModules() + dynamic import() ensures fresh module
// with stubbed env vars on each test.
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Resize an image file to a fixed target height, preserving aspect ratio.
 * Uses the Canvas API (browser built-in — no npm dependency).
 *
 * PITFALL: toBlob must be called inside img.onload, not synchronously after img.src =.
 * MEMORY: URL.revokeObjectURL must be called in both onload AND onerror paths.
 *
 * @param {File|Blob} file - Source image file
 * @param {number} [targetHeight=1520] - Target height in pixels
 * @returns {Promise<Blob>} Resized image as PNG Blob
 */
export function resizeImageToHeight(file, targetHeight = 1520) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // Revoke in onload — memory leak guard (success path)
      URL.revokeObjectURL(objectUrl);

      const scale = targetHeight / img.naturalHeight;
      const targetWidth = Math.round(img.naturalWidth * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob returned null'));
          }
        },
        'image/jpeg',
        0.92
      );
    };

    img.onerror = () => {
      // Revoke in onerror — memory leak guard (error path)
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image load failed'));
    };

    img.src = objectUrl;
  });
}

/**
 * Upload a Blob to Cloudinary via unsigned upload preset.
 * POST multipart/form-data — no SDK, no server required.
 *
 * Source: https://cloudinary.com/documentation/client_side_uploading
 *
 * @param {Blob} blob - Image blob to upload
 * @returns {Promise<string>} HTTPS secure_url of the uploaded image
 */
export async function uploadToCloudinary(blob) {
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    throw new Error(`Cloudinary upload failed: ${res.status}`);
  }

  const data = await res.json();
  return data.secure_url;
}
