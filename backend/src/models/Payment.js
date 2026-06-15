// Đường dẫn: backend/src/models/Payment.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const { PAYMENT_METHOD, PAYMENT_STATUS } = require('../constants/enums');

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    'Payment',
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
      transactionId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'transaction_id',
      },
      paymentMethod: {
        type: DataTypes.ENUM(Object.values(PAYMENT_METHOD)),
        allowNull: false,
        defaultValue: PAYMENT_METHOD.VNPAY,
        field: 'payment_method',
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(Object.values(PAYMENT_STATUS)),
        allowNull: false,
        defaultValue: PAYMENT_STATUS.PENDING,
      },
      rawResponse: {
        type: DataTypes.JSON,
        field: 'raw_response',
      },
      paidAt: {
        type: DataTypes.DATE,
        field: 'paid_at',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
    },
    {
      sequelize,
      modelName: 'Payment',
      tableName: 'payments',
      timestamps: false,
    }
  );

  Payment.associate = function (models) {
    Payment.belongsTo(models.Booking, {
      foreignKey: 'bookingId',
      as: 'booking',
      onDelete: 'RESTRICT',
    });
  };

  return Payment;
};

