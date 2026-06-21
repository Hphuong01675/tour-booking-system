import db from '../models';
import { MESSAGE_SENDER_TYPE, CONVERSATION_STATUS } from '../constants/enums';

const { Message, Conversation, User } = db;

let io;

const conversationIncludes = [
  { model: User, as: 'customer', attributes: ['id', 'fullName', 'avatarUrl', 'phone'] },
  { model: User, as: 'supportUser', attributes: ['id', 'fullName', 'avatarUrl'] },
];

const initSocket = (serverIo) => {
  io = serverIo;

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    socket.on('join_room', (conversationId) => {
      socket.join(conversationId);
      console.log(`[Socket] Socket ${socket.id} joined room: ${conversationId}`);
    });

    socket.on('leave_room', (conversationId) => {
      socket.leave(conversationId);
      console.log(`[Socket] Socket ${socket.id} left room: ${conversationId}`);
    });

    socket.on('send_message', async (data) => {
      try {
        const { conversationId, senderType, senderId, content } = data;

        if (!conversationId || !senderType || !content?.trim()) {
          return socket.emit('error', 'Thieu du lieu bat buoc de gui tin nhan');
        }

        const cleanContent = content.trim();
        const newMessage = await Message.create({
          conversationId,
          senderType,
          senderId: senderId || null,
          content: cleanContent,
          isRead: false,
        });

        const conversationUpdate = {
          lastMessage: cleanContent,
          updatedAt: new Date(),
        };

        if (senderType === MESSAGE_SENDER_TYPE.GUIDE) {
          conversationUpdate.status = CONVERSATION_STATUS.ACTIVE;
        }

        await Conversation.update(conversationUpdate, { where: { id: conversationId } });

        let senderInfo = null;
        if (senderId) {
          senderInfo = await User.findByPk(senderId, {
            attributes: ['id', 'fullName', 'avatarUrl'],
          });
        }

        const messageData = {
          ...newMessage.toJSON(),
          sender: senderInfo,
        };

        io.to(conversationId).emit('receive_message', messageData);

        const updatedConversation = await Conversation.findByPk(conversationId, {
          include: conversationIncludes,
        });

        io.emit('conversation_updated', {
          conversationId,
          lastMessage: cleanContent,
          updatedAt: newMessage.sentAt,
          conversation: updatedConversation,
        });
      } catch (error) {
        console.error('[Socket] Error sending message:', error);
        socket.emit('error', 'Loi server khi gui tin nhan');
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export default { initSocket, getIo };
