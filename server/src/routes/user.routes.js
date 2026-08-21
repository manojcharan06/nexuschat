import express from 'express';
import { getMe } from '../controllers/auth.controller.js';
import { updateProfile, uploadAvatar, searchUsers } from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { uploadSingleImage } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/me', getMe);
router.get('/search', searchUsers);
router.patch('/profile', updateProfile);
router.post('/avatar', uploadSingleImage, uploadAvatar);

export default router;
