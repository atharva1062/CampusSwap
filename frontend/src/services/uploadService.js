import API from './api';

/**
 * Upload a media file (Photo up to 100MB or Video up to 250MB) directly to Cloudinary.
 * Bypasses Vercel's 4.5MB serverless function limit using a signed direct upload.
 *
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Optional callback for upload progress (0 - 100)
 * @returns {Promise<string>} The secure public URL of the uploaded media
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

  // 1. Fetch signed upload credentials from our backend
  const signRes = await API.get('/upload/sign');
  if (!signRes.data.success) {
    throw new Error(signRes.data.message || 'Could not authorize upload with cloud storage.');
  }

  const { timestamp, signature, folder, cloudName, apiKey } = signRes.data;

  // 2. Upload directly from browser to Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  const resourceType = isVideo ? 'video' : 'image';
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const response = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to upload media to cloud.');
  }

  return data.secure_url;
}
