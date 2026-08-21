import multer from 'multer';
import { ApiError } from '../utils/apiError.util.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        'Invalid file type. Only JPEG, PNG, and WEBP image files are allowed',
        'INVALID_FILE_TYPE'
      ),
      false
    );
  }
};

export const uploadSingleImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max size
  },
  fileFilter,
}).single('image');
