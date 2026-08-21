import { User } from '../models/User.model.js';
import { uploadImageToStorage } from '../services/upload.service.js';
import { ApiError } from '../utils/apiError.util.js';

export const updateProfile = async (req, res, next) => {
  try {
    const { statusMessage, avatarUrl } = req.body;
    const userId = req.user._id;

    const updateFields = {};
    if (statusMessage !== undefined) updateFields.statusMessage = statusMessage;
    if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('Please upload an image file', 'NO_FILE_PROVIDED');
    }

    const uploadResult = await uploadImageToStorage(req.file);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl: uploadResult.url },
      { new: true }
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        user,
        upload: uploadResult,
      },
    });
  } catch (error) {
    next(error);
  }
};
