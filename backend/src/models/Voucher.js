// Đường dẫn: backend/src/models/Voucher.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const { DISCOUNT_TYPE, VOUCHER_TARGET_TYPE } = require('../constants/enums');

module.exports = (sequelize, DataTypes) => {
  const Voucher = sequelize.define(
    'Voucher',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
      },
      discountType: {
        type: DataTypes.ENUM(Object.values(DISCOUNT_TYPE)),
        allowNull: false,
        field: 'discount_type',
      },
      discountValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'discount_value',
      },
      maxDiscountAmount: {
        type: DataTypes.DECIMAL(12, 2),
        field: 'max_discount_amount',
      },
      minOrderValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'min_order_value',
      },
      validFrom: {
        type: DataTypes.DATE,
        field: 'valid_from',
      },
      validUntil: {
        type: DataTypes.DATE,
        field: 'valid_until',
      },
      totalQuantity: {
        type: DataTypes.INTEGER,
        field: 'total_quantity',
      },
      usageLimitPerUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: 'usage_limit_per_user',
      },
      targetType: {
        type: DataTypes.ENUM(Object.values(VOUCHER_TARGET_TYPE)),
        allowNull: false,
        defaultValue: VOUCHER_TARGET_TYPE.ALL,
        field: 'target_type',
      },
      usedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'used_count',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
      createdBy: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'created_by',
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
      modelName: 'Voucher',
      tableName: 'vouchers',
      timestamps: false,
    }
  );

  Voucher.associate = function (models) {
    Voucher.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
      onDelete: 'RESTRICT',
    });
    Voucher.hasMany(models.VoucherTarget, {
      foreignKey: 'voucherId',
      as: 'targets',
      onDelete: 'CASCADE',
    });
    Voucher.hasMany(models.Booking, {
      foreignKey: 'voucherId',
      as: 'bookings',
      onDelete: 'SET NULL',
    });
  };

  return Voucher;
};

