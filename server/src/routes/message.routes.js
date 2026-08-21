import express from 'express';
import { getMessages, sendMessageHttp } from '../controllers/message.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/:conversationId', getMessages);
router.post('/', sendMessageHttp);

export default router;
