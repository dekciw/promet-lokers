// useImageUpload — orchestrates Canvas resize → Cloudinary upload → Firestore saveModel
// Named export (not default) per project hook pattern.
// React 19 useCallback: [saveModel] dependency is correct — uploadPhoto captures saveModel
// from the closure. If the parent recreates saveModel on every render, wrap it in useCallback
// at the call site to avoid unnecessary uploadPhoto re-creation.
import { useState, useCallback } from 'react';
import { resizeImageToHeight, uploadToCloudinary } from '../lib/cloudinaryUpload';

/**
 * Hook for photo upload: resize → Cloudinary → saveModel.
 *
 * @param {{ saveModel: (model: object) => Promise<void> }} options
 * @returns {{ uploadPhoto: Function, isUploading: boolean, uploadError: string|null }}
 */
export function useImageUpload({ saveModel }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  /**
   * Upload a photo file for a given model.
   * Clears previous error, sets isUploading=true, then:
   *   1. Resize to 1520px height via Canvas API
   *   2. Upload to Cloudinary (returns secure_url)
   *   3. Call saveModel({...currentModel, photoUrl}) to persist URL to Firestore
   *
   * Returns the secure_url on success (useful for immediate preview in the caller).
   * Re-throws any error so callers can react if needed.
   *
   * @param {File|Blob} file - Image file selected by user
   * @param {object} currentModel - Current model object (all fields preserved)
   * @returns {Promise<string>} Cloudinary secure_url
   */
  const uploadPhoto = useCallback(async (file, currentModel) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const resizedBlob = await resizeImageToHeight(file, 1520);
      const photoUrl = await uploadToCloudinary(resizedBlob);
      await saveModel({ ...currentModel, photoUrl });
      return photoUrl;
    } catch (err) {
      setUploadError(err.message ?? 'Неизвестная ошибка загрузки');
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [saveModel]);

  return { uploadPhoto, isUploading, uploadError };
}
