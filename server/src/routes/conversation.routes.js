import express from 'express';
import { createDirectConversation, getConversations } from '../controllers/conversation.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/direct', createDirectConversation);
router.get('/', getConversations);

export default router;
