import { useState, useCallback } from 'react';
import { resizeImageToHeight, uploadToCloudinary } from '../lib/cloudinaryUpload';

export function useImageUpload({ saveModel }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

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
