import express from 'express';
import * as chatController from '../controllers/chat.controller';
import { verifyAccessToken, authorizeRoles } from '../middlewares/accessToken.middleware';
import multer from 'multer';

const router = express.Router();
const chatUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            return cb(null, true);
        }
        cb(new Error('UNSUPPORTED_CHAT_MEDIA'));
    }
});

const uploadChatMedia = (req, res, next) => {
    chatUpload.single('media')(req, res, (err) => {
        if (err) {
            const message = 'Chỉ hỗ trợ gửi ảnh hoặc video.';
            return res.status(400).json({ success: false, message, error: message });
        }
        next();
    });
};

router.get('/api/chat/conversations', verifyAccessToken, authorizeRoles('guide'), chatController.getConversations);
router.get('/api/chat/customers/:customerId/history', verifyAccessToken, authorizeRoles('guide'), chatController.getCustomerChatHistory);
router.post('/api/chat/customers/:customerId/reopen', verifyAccessToken, authorizeRoles('guide'), chatController.reopenCustomerConversation);
router.get('/api/chat/messages/:conversationId', verifyAccessToken, authorizeRoles('guide'), chatController.getMessages);
router.patch('/api/chat/conversations/:conversationId/accept', verifyAccessToken, authorizeRoles('guide'), chatController.acceptConversation);
router.patch('/api/chat/conversations/:conversationId/close', verifyAccessToken, authorizeRoles('guide'), chatController.closeConversation);
router.post('/api/chat/media', uploadChatMedia, chatController.uploadChatMedia);
router.post('/api/chat/session/resolve', chatController.resolveChatSession);
router.post('/api/chat/guest/init', chatController.initGuestChat);

export default router;
