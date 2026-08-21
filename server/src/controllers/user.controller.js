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

export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user._id;

    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        data: [],
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [{ username: searchRegex }, { email: searchRegex }],
    })
      .select('username email avatarUrl isOnline lastSeen statusMessage')
      .limit(20);

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

