const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * Generate a signed upload signature for direct browser-to-Cloudinary upload.
 * This completely bypasses Vercel's 4.5MB serverless payload limit, allowing
 * uploads up to 100MB for photos and 250MB for videos.
 * GET /api/upload/sign
 */
router.get('/sign', authenticate, (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'campus_swap_uploads';

    const signature = cloudinary.utils.api_sign_request(
      {
        folder,
        timestamp,
      },
      process.env.CLOUDINARY_API_SECRET || 'lu4W5N0mse8zwx9wrzOmcm0K_cU'
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
