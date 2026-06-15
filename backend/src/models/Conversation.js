// Đường dẫn: backend/src/models/Conversation.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const { CONVERSATION_STATUS } = require('../constants/enums');

module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define(
    'Conversation',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      sessionKey: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'session_key',
      },
      guestName: {
        type: DataTypes.STRING(50),
        field: 'guest_name',
      },
      customerId: {
        type: DataTypes.CHAR(36),
        field: 'customer_id',
      },
      supportUserId: {
        type: DataTypes.CHAR(36),
        field: 'support_user_id',
      },
      status: {
        type: DataTypes.ENUM(Object.values(CONVERSATION_STATUS)),
        allowNull: false,
        defaultValue: CONVERSATION_STATUS.WAITING,
      },
      lastMessage: {
        type: DataTypes.TEXT,
        field: 'last_message',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      modelName: 'Conversation',
      tableName: 'conversations',
      timestamps: false,
    }
  );

  Conversation.associate = function (models) {
    Conversation.belongsTo(models.User, {
      foreignKey: 'customerId',
      as: 'customer',
      onDelete: 'SET NULL',
    });
    Conversation.belongsTo(models.User, {
      foreignKey: 'supportUserId',
      as: 'supportUser',
      onDelete: 'SET NULL',
    });
    Conversation.hasMany(models.Message, {
      foreignKey: 'conversationId',
      as: 'messages',
      onDelete: 'CASCADE',
    });
  };

  return Conversation;
};

