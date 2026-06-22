import db from '../models';
import socketManager from '../sockets/socketManager';
import jwt from 'jsonwebtoken';
import { CONVERSATION_STATUS } from '../constants/enums';
import cloudinary from '../config/cloudinary';

const includeConversationUser = [
    { model: db.User, as: 'customer', attributes: ['id', 'fullName', 'avatarUrl', 'phone'] },
    { model: db.User, as: 'supportUser', attributes: ['id', 'fullName', 'avatarUrl'] }
];

const MAX_ACTIVE_CONVERSATIONS_PER_GUIDE = 5;
const ACTIVE_CONVERSATION_TIMEOUT_MS = 10 * 60 * 1000;

const buildCustomerSessionKey = (customerId) => `customer:${customerId}`;

const uploadChatFileToCloudinary = (fileBuffer, folder, publicId, resourceType) => new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return reject(new Error('CLOUDINARY_CONFIG_MISSING'));
    }

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const stream = cloudinary.uploader.upload_stream(
        {
            folder,
            public_id: publicId,
            resource_type: resourceType,
            overwrite: true,
        },
        (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
        }
    );

    stream.end(fileBuffer);
});

const getOptionalAuthenticatedUser = (req) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) return null;

    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'default_access_secret');
    } catch {
        return null;
    }
};

const findConversationWithUsers = (id) => db.Conversation.findByPk(id, {
    include: includeConversationUser
});

const findMessages = (conversationId) => db.Message.findAll({
    where: { conversationId },
    include: [
        { model: db.User, as: 'sender', attributes: ['id', 'fullName', 'avatarUrl'] }
    ],
    order: [['sentAt', 'ASC']]
});

const emitConversationUpdated = (conversation) => {
    try {
        socketManager.getIo().emit('conversation_updated', {
            conversationId: conversation.id,
            lastMessage: conversation.lastMessage,
            updatedAt: conversation.updatedAt,
            conversation
        });
    } catch (error) {
        console.warn('[Chat] Socket update skipped:', error.message);
    }
};

export const getConversations = async (req, res) => {
    try {
        const { Conversation } = db;
        const guideId = req.user?.id;

        if (!guideId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await releaseInactiveActiveConversations();

        const conversations = await Conversation.findAll({
            where: {
                [db.Sequelize.Op.or]: [
                    { status: 'waiting' },
                    { supportUserId: guideId }
                ]
            },
            include: includeConversationUser,
            order: [['updatedAt', 'DESC']]
        });
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await findMessages(conversationId);
        
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const releaseInactiveActiveConversations = async () => {
    const cutoff = new Date(Date.now() - ACTIVE_CONVERSATION_TIMEOUT_MS);
    const staleConversations = await db.Conversation.findAll({
        where: {
            status: CONVERSATION_STATUS.ACTIVE,
            supportUserId: { [db.Sequelize.Op.ne]: null },
            updatedAt: { [db.Sequelize.Op.lt]: cutoff }
        }
    });

    if (staleConversations.length === 0) return [];

    await Promise.all(staleConversations.map(async (conversation) => {
        await conversation.update({
            status: CONVERSATION_STATUS.WAITING,
            supportUserId: null,
            updatedAt: new Date()
        });

        const updatedConversation = await findConversationWithUsers(conversation.id);
        emitConversationUpdated(updatedConversation);
        return updatedConversation;
    }));

    return staleConversations.map((conversation) => conversation.id);
};

export const uploadChatMedia = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ảnh hoặc video để gửi.',
                error: 'Vui lòng chọn ảnh hoặc video để gửi.'
            });
        }

        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');

        if (!isImage && !isVideo) {
            return res.status(400).json({
                success: false,
                message: 'Chỉ hỗ trợ gửi ảnh hoặc video.',
                error: 'Chỉ hỗ trợ gửi ảnh hoặc video.'
            });
        }

        const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return res.status(400).json({
                success: false,
                message: isVideo ? 'Video không được vượt quá 50MB.' : 'Ảnh không được vượt quá 10MB.',
                error: isVideo ? 'Video không được vượt quá 50MB.' : 'Ảnh không được vượt quá 10MB.'
            });
        }

        const mediaType = isVideo ? 'video' : 'image';
        const publicId = `chat_${mediaType}_${Date.now()}`;
        const url = await uploadChatFileToCloudinary(
            file.buffer,
            `tour-booking-system/chat/${mediaType}s`,
            publicId,
            mediaType
        );

        res.json({
            success: true,
            media: {
                type: mediaType,
                url,
                name: file.originalname,
                mimeType: file.mimetype,
                size: file.size
            },
            content: JSON.stringify({
                type: mediaType,
                url,
                name: file.originalname
            })
        });
    } catch (error) {
        console.error('Upload chat media error:', error);
        const message = error.message === 'CLOUDINARY_CONFIG_MISSING'
            ? 'Cloudinary chưa được cấu hình. Vui lòng kiểm tra biến môi trường.'
            : 'Không thể tải tệp lên cloud. Vui lòng thử lại.';

        res.status(503).json({
            success: false,
            message,
            error: message
        });
    }
};

export const getCustomerChatHistory = async (req, res) => {
    try {
        const guideId = req.user?.id;
        const { customerId } = req.params;

        if (!guideId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!customerId) {
            return res.status(400).json({ error: 'customerId is required' });
        }

        const conversations = await db.Conversation.findAll({
            where: { customerId },
            include: includeConversationUser,
            order: [['updatedAt', 'DESC']]
        });

        res.json(conversations);
    } catch (error) {
        console.error('Get customer chat history error:', error);
        res.status(500).json({ error: 'Không thể tải lịch sử tin nhắn.' });
    }
};

export const reopenCustomerConversation = async (req, res) => {
    try {
        const guideId = req.user?.id;
        const { customerId } = req.params;
        const { conversationId } = req.body || {};

        if (!guideId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!customerId) {
            return res.status(400).json({ error: 'customerId is required' });
        }

        const customer = await db.User.findByPk(customerId);
        if (!customer) {
            return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });
        }

        let conversation = null;
        if (conversationId) {
            conversation = await db.Conversation.findOne({
                where: { id: conversationId, customerId }
            });
        } else {
            conversation = await db.Conversation.findOne({
                where: { customerId },
                order: [['updatedAt', 'DESC']]
            });
        }

        if (!conversation) {
            conversation = await db.Conversation.create({
                sessionKey: `customer:${customerId}:direct:${Date.now()}`,
                customerId,
                status: CONVERSATION_STATUS.WAITING,
                lastMessage: 'Hướng dẫn viên đã mở yêu cầu tư vấn trực tiếp.',
                updatedAt: new Date()
            });
        } else {
            await conversation.update({
                status: CONVERSATION_STATUS.WAITING,
                supportUserId: null,
                updatedAt: new Date()
            });
        }

        const updatedConversation = await findConversationWithUsers(conversation.id);
        emitConversationUpdated(updatedConversation);

        res.json({
            conversation: updatedConversation,
            message: 'Đã đưa cuộc trò chuyện vào hàng chờ tiếp nhận.'
        });
    } catch (error) {
        console.error('Reopen customer conversation error:', error);
        res.status(500).json({ error: 'Không thể mở lại cuộc trò chuyện.' });
    }
};

export const initGuestChat = async (req, res) => {
    try {
        const { sessionKey } = req.body;
        if (!sessionKey) {
            return res.status(400).json({ error: 'sessionKey is required' });
        }
        
        const { Conversation } = db;
        
        let conversation = await Conversation.findOne({
            where: {
                sessionKey,
                customerId: null
            },
            include: includeConversationUser
        });
        
        if (!conversation) {
            const guestId = Math.floor(1000 + Math.random() * 9000);
            conversation = await Conversation.create({
                sessionKey,
                guestName: `GUEST#${guestId}`,
                status: 'waiting'
            });
            const createdConversation = await findConversationWithUsers(conversation.id);
            return res.json({ conversation: createdConversation, messages: [] });
        }
        
        const messages = await findMessages(conversation.id);
        
        res.json({ conversation, messages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const resolveChatSession = async (req, res) => {
    try {
        const { sessionKey, claimGuest = false, startNew = false } = req.body;
        const authUser = getOptionalAuthenticatedUser(req);

        if (!sessionKey) {
            return res.status(400).json({ error: 'sessionKey is required' });
        }

        if (!authUser?.id || authUser.role !== 'customer') {
            return initGuestChat(req, res);
        }

        const { Conversation } = db;
        const customerSessionKey = buildCustomerSessionKey(authUser.id);

        let customerConversation = await Conversation.findOne({
            where: {
                customerId: authUser.id,
            },
            include: includeConversationUser,
            order: [['updatedAt', 'DESC']]
        });

        if (customerConversation && customerConversation.status === CONVERSATION_STATUS.CLOSED) {
            await customerConversation.update({
                status: CONVERSATION_STATUS.WAITING,
                updatedAt: new Date()
            });
            customerConversation = await findConversationWithUsers(customerConversation.id);
        }

        if (customerConversation) {
            const messages = await findMessages(customerConversation.id);
            return res.json({ conversation: customerConversation, messages });
        }

        const guestConversation = await Conversation.findOne({
            where: {
                sessionKey,
                customerId: null,
            },
            include: includeConversationUser,
            order: [['updatedAt', 'DESC']]
        });

        if (guestConversation && !claimGuest && !startNew) {
            return res.json({
                needsClaimDecision: true,
                guestConversation,
                messages: await findMessages(guestConversation.id)
            });
        }

        if (guestConversation && claimGuest) {
            await guestConversation.update({
                customerId: authUser.id,
                guestName: null,
                sessionKey: customerSessionKey,
                updatedAt: new Date()
            });

            const claimedConversation = await findConversationWithUsers(guestConversation.id);
            emitConversationUpdated(claimedConversation);
            return res.json({
                conversation: claimedConversation,
                messages: await findMessages(claimedConversation.id),
                claimed: true
            });
        }

        const created = await Conversation.create({
            sessionKey: customerSessionKey,
            customerId: authUser.id,
            status: CONVERSATION_STATUS.WAITING
        });
        const createdConversation = await findConversationWithUsers(created.id);

        return res.json({
            conversation: createdConversation,
            messages: []
        });
    } catch (error) {
        console.error('Resolve chat session error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const acceptConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const guideId = req.user?.id;
        const { Conversation } = db;

        if (!guideId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await releaseInactiveActiveConversations();

        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        if (conversation.supportUserId && conversation.supportUserId !== guideId) {
            return res.status(409).json({ error: 'Conversation is already assigned' });
        }

        if (!conversation.supportUserId || conversation.supportUserId !== guideId) {
            const activeCount = await Conversation.count({
                where: {
                    supportUserId: guideId,
                    status: CONVERSATION_STATUS.ACTIVE
                }
            });

            if (activeCount >= MAX_ACTIVE_CONVERSATIONS_PER_GUIDE) {
                return res.status(409).json({
                    error: `Bạn chỉ được tiếp nhận tối đa ${MAX_ACTIVE_CONVERSATIONS_PER_GUIDE} khách hàng cùng lúc.`
                });
            }
        }

        await conversation.update({
            supportUserId: guideId,
            status: CONVERSATION_STATUS.ACTIVE,
            updatedAt: new Date()
        });

        const updatedConversation = await Conversation.findByPk(conversationId, {
            include: includeConversationUser
        });

        emitConversationUpdated(updatedConversation);
        res.json(updatedConversation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const closeConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const guideId = req.user?.id;
        const { Conversation } = db;

        if (!guideId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        if (conversation.supportUserId !== guideId) {
            return res.status(403).json({ error: 'You can only close your own conversations' });
        }

        await conversation.update({
            status: 'closed',
            updatedAt: new Date()
        });

        const updatedConversation = await Conversation.findByPk(conversationId, {
            include: includeConversationUser
        });

        emitConversationUpdated(updatedConversation);
        res.json(updatedConversation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
