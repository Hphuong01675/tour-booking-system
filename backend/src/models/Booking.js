// Đường dẫn: backend/src/models/Booking.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const { BOOKING_STATUS } = require('../constants/enums');

module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    'Booking',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      customerId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'customer_id',
      },
      scheduleId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'schedule_id',
      },
      bookingCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'booking_code',
      },
      status: {
        type: DataTypes.ENUM(Object.values(BOOKING_STATUS)),
        allowNull: false,
        defaultValue: BOOKING_STATUS.PENDING_PAYMENT,
      },
      totalPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'total_price',
      },
      discountAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'discount_amount',
      },
      finalPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'final_price',
      },
      voucherId: {
        type: DataTypes.CHAR(36),
        field: 'voucher_id',
      },
      cancellationReason: {
        type: DataTypes.TEXT,
        field: 'cancellation_reason',
      },
      refundAmount: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'refund_amount',
      },
      bookedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'booked_at',
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
      modelName: 'Booking',
      tableName: 'bookings',
      timestamps: false,
    }
  );

  Booking.associate = function (models) {
    Booking.belongsTo(models.User, {
      foreignKey: 'customerId',
      as: 'customer',
      onDelete: 'RESTRICT',
    });
    Booking.belongsTo(models.TourSchedule, {
      foreignKey: 'scheduleId',
      as: 'schedule',
      onDelete: 'RESTRICT',
    });
    Booking.belongsTo(models.Voucher, {
      foreignKey: 'voucherId',
      as: 'voucher',
      onDelete: 'SET NULL',
    });
    Booking.hasMany(models.Participant, {
      foreignKey: 'bookingId',
      as: 'participants',
      onDelete: 'CASCADE',
    });
    Booking.hasMany(models.Payment, {
      foreignKey: 'bookingId',
      as: 'payments',
      onDelete: 'RESTRICT',
    });
    Booking.hasOne(models.Review, {
      foreignKey: 'bookingId',
      as: 'review',
      onDelete: 'CASCADE',
    });
  };

  return Booking;
};

