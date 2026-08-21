import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.util.js';
import { ApiError } from '../utils/apiError.util.js';

// Configure Cloudinary if environment variables are provided
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary CDN integration enabled');
}

export const uploadImageToStorage = async (file) => {
  if (!file || !file.buffer) {
    throw ApiError.badRequest('No image file provided', 'NO_FILE');
  }

  // If Cloudinary is configured, stream buffer to Cloudinary
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'nexuschat/avatars',
          transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }],
        },
        (error, result) => {
          if (error) {
            logger.error(`Cloudinary upload failed: ${error.message}`);
            return reject(ApiError.internal('Failed to upload image to CDN storage'));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  // Fallback: Convert to Base64 Data URI for local development without Cloudinary
  const base64 = file.buffer.toString('base64');
  const dataUri = `data:${file.mimetype};base64,${base64}`;

  return {
    url: dataUri,
    publicId: `local_${Date.now()}`,
    bytes: file.size,
    format: file.mimetype.split('/')[1] || 'png',
  };
};
