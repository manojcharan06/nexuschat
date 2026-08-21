import { uploadImageToStorage } from '../services/upload.service.js';
import { ApiError } from '../utils/apiError.util.js';

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('Please upload an image file', 'NO_FILE_PROVIDED');
    }

    const uploadResult = await uploadImageToStorage(req.file);

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: uploadResult,
    });
  } catch (error) {
    next(error);
  }
};
