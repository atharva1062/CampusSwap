const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * Upload an image to Cloudinary via backend proxy.
 * Accepts base64 data URL or a remote URL (Google images, etc.)
 * POST /api/upload/image
 * Body: { data: "data:image/jpeg;base64,..." } OR { url: "https://..." }
 */
router.post('/image', authenticate, async (req, res) => {
  try {
    const { data, url } = req.body;

    if (!data && !url) {
      return res.status(400).json({
        success: false,
        message: 'Image data (base64) or URL is required.',
      });
    }

    const source = data || url;

    // Upload to Cloudinary (handles base64 data URLs, remote URLs, local paths)
    const result = await cloudinary.uploader.upload(source, {
      folder: 'campus_swap_uploads',
      resource_type: 'image',
      // Auto-quality + format for best compression
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto', width: 1280, crop: 'limit' },
      ],
    });

    return res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Image upload failed: ' + (error.message || 'Unknown error'),
    });
  }
});

/**
 * Proxy a remote image URL through the backend (bypasses hotlink blocking).
 * GET /api/upload/proxy?url=<encoded_url>
 * This lets Google images / any URL be displayed without CORS/hotlink issues.
 */
router.get('/proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send('Missing url parameter');
    }

    // Decode the URL
    const targetUrl = decodeURIComponent(url);

    // Fetch the image server-side (no referrer restrictions)
    const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CampusSwap/1.0)',
        'Referer': '',
      },
      redirect: 'follow',
      timeout: 10000,
    });

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch image');
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    response.body.pipe(res);
  } catch (err) {
    console.error('Image proxy error:', err.message);
    res.status(500).send('Proxy error');
  }
});

/**
 * Generate a signed upload signature for direct browser-to-Cloudinary upload.
 * GET /api/upload/sign
 */
router.get('/sign', authenticate, (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'campus_swap_uploads';

    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      process.env.CLOUDINARY_API_SECRET || 'lu4W5N0msE8zwx9wrzOmcm0K_cU'
    );

    return res.status(200).json({
      success: true,
      timestamp,
      signature,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'uuywixot',
      apiKey: process.env.CLOUDINARY_API_KEY || '534748287825123',
    });
  } catch (error) {
    console.error('Cloudinary Sign Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate upload signature.',
      error: error.message,
    });
  }
});

module.exports = router;
