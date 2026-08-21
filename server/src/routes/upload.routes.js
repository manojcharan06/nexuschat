import express from 'express';
import { uploadImage } from '../controllers/upload.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { uploadSingleImage } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/image', uploadSingleImage, uploadImage);

export default router;
