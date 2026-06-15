// Đường dẫn: backend/src/models/Participant.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const { PARTICIPANT_TYPE } = require('../constants/enums');

module.exports = (sequelize, DataTypes) => {
  const Participant = sequelize.define(
    'Participant',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      bookingId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'booking_id',
      },
      fullName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'full_name',
      },
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'date_of_birth',
      },
      participantType: {
        type: DataTypes.ENUM(Object.values(PARTICIPANT_TYPE)),
        allowNull: false,
        field: 'participant_type',
      },
      address: {
        type: DataTypes.TEXT,
      },
      isLead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_lead',
      },
      cccdFrontUrl: {
        type: DataTypes.STRING(500),
        field: 'cccd_front_url',
      },
      cccdBackUrl: {
        type: DataTypes.STRING(500),
        field: 'cccd_back_url',
      },
      checkinCode: {
        type: DataTypes.STRING(50),
        unique: true,
        field: 'checkin_code',
      },
      checkinAt: {
        type: DataTypes.DATE,
        field: 'checkin_at',
      },
    },
    {
      sequelize,
      modelName: 'Participant',
      tableName: 'participants',
      timestamps: false,
    }
  );

  Participant.associate = function (models) {
    Participant.belongsTo(models.Booking, {
      foreignKey: 'bookingId',
      as: 'booking',
      onDelete: 'CASCADE',
    });
  };

  return Participant;
};

