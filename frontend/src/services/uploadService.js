import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Upload a media file (Photo up to 100MB or Video up to 250MB) directly to Firebase Storage.
 * Completely bypasses Vercel's 4.5MB serverless payload limit and provides permanent URLs.
 *
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Optional callback for upload progress (0 - 100)
 * @returns {Promise<string>} The public download URL of the uploaded media
 */
export async function uploadToCloudinary(file, onProgress) {
  if (!file) throw new Error('No file selected for upload.');

  // Validate size limits
  const isVideo = file.type.startsWith('video/');
  const maxBytes = isVideo ? 250 * 1024 * 1024 : 100 * 1024 * 1024; // 250MB for video, 100MB for image

  if (file.size > maxBytes) {
    throw new Error(
      `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed limit of ${
        isVideo ? '250MB for video' : '100MB for photos'
      }.`
    );
  }

  // Generate unique filename in Firebase Storage bucket
  const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const filePath = `campus_swap_media/${Date.now()}_${cleanName}`;
  const storageRef = ref(storage, filePath);

  return new Promise((resolve, reject) => {
    // 15-second safety timeout so creation never gets permanently stuck
    const timer = setTimeout(() => {
      reject(new Error('Cloud upload timed out. Please check your internet connection or try a smaller file.'));
    }, 20000);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (typeof onProgress === 'function') {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        clearTimeout(timer);
        console.error('Firebase Storage Upload Error:', error);
        reject(new Error(error.message || 'Failed to upload media to cloud storage.'));
      },
      async () => {
        clearTimeout(timer);
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (urlErr) {
          reject(urlErr);
        }
      }
    );
  });
}
