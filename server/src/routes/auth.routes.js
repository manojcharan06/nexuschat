import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { registerValidation, loginValidation } from '../middlewares/authDTO.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', protect, authController.logout);

export default router;
