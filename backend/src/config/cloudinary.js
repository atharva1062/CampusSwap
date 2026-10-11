const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'uuywixot',
  api_key: process.env.CLOUDINARY_API_KEY || '534748287825123',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'lu4W5N0mse8zwx9wrzOmcm0K_cU',
  secure: true,
});

module.exports = cloudinary;
