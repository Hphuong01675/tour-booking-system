import db from '../models';
import socketManager from '../sockets/socketManager';

const includeConversationUser = [
    { model: db.User, as: 'customer', attributes: ['id', 'fullName', 'avatarUrl', 'phone'] },
    { model: db.User, as: 'supportUser', attributes: ['id', 'fullName', 'avatarUrl'] }
];

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
        const { Message, User } = db;
        
        const messages = await Message.findAll({
            where: { conversationId },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'fullName', 'avatarUrl'] }
            ],
            order: [['sentAt', 'ASC']]
        });
        
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const initGuestChat = async (req, res) => {
    try {
        const { sessionKey } = req.body;
        if (!sessionKey) {
            return res.status(400).json({ error: 'sessionKey is required' });
        }
        
        const { Conversation, Message, User } = db;
        
        let conversation = await Conversation.findOne({
            where: { sessionKey }
        });
        
        if (!conversation) {
            const guestId = Math.floor(1000 + Math.random() * 9000);
            conversation = await Conversation.create({
                sessionKey,
                guestName: `GUEST#${guestId}`,
                status: 'waiting'
            });
            return res.json({ conversation, messages: [] });
        }
        
        const messages = await Message.findAll({
            where: { conversationId: conversation.id },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'fullName', 'avatarUrl'] }
            ],
            order: [['sentAt', 'ASC']]
        });
        
        res.json({ conversation, messages });
    } catch (error) {
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

        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        if (conversation.supportUserId && conversation.supportUserId !== guideId) {
            return res.status(409).json({ error: 'Conversation is already assigned' });
        }

        await conversation.update({
            supportUserId: guideId,
            status: 'active',
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
