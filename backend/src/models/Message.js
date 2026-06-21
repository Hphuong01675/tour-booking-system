// Đường dẫn: backend/src/models/Message.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const { MESSAGE_SENDER_TYPE } = require('../constants/enums');

module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    'Message',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      conversationId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'conversation_id',
      },
      senderType: {
        type: DataTypes.ENUM(Object.values(MESSAGE_SENDER_TYPE)),
        allowNull: false,
        field: 'sender_type',
      },
      senderId: {
        type: DataTypes.CHAR(36),
        field: 'sender_id',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_read',
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'sent_at',
      },
    },
    {
      sequelize,
      modelName: 'Message',
      tableName: 'messages',
      timestamps: false,
    }
  );

  Message.associate = function (models) {
    Message.belongsTo(models.Conversation, {
      foreignKey: 'conversationId',
      as: 'conversation',
      onDelete: 'CASCADE',
    });
    Message.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender',
      onDelete: 'SET NULL',
    });
  };

  return Message;
};

