import express from 'express';
import * as chatController from '../controllers/chat.controller';
import { verifyAccessToken, authorizeRoles } from '../middlewares/accessToken.middleware';

const router = express.Router();

router.get('/api/chat/conversations', verifyAccessToken, authorizeRoles('guide'), chatController.getConversations);
router.get('/api/chat/messages/:conversationId', verifyAccessToken, authorizeRoles('guide'), chatController.getMessages);
router.patch('/api/chat/conversations/:conversationId/accept', verifyAccessToken, authorizeRoles('guide'), chatController.acceptConversation);
router.patch('/api/chat/conversations/:conversationId/close', verifyAccessToken, authorizeRoles('guide'), chatController.closeConversation);
router.post('/api/chat/guest/init', chatController.initGuestChat);

export default router;
