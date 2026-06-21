// Đường dẫn: backend/src/models/VoucherTarget.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const VoucherTarget = sequelize.define(
    'VoucherTarget',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      voucherId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'voucher_id',
      },
      userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'user_id',
      },
      usedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'used_count',
      },
    },
    {
      sequelize,
      modelName: 'VoucherTarget',
      tableName: 'voucher_targets',
      timestamps: false,
      indexes: [
        { fields: ['voucher_id', 'user_id'], unique: true },
      ],
    }
  );

  VoucherTarget.associate = function (models) {
    VoucherTarget.belongsTo(models.Voucher, {
      foreignKey: 'voucherId',
      as: 'voucher',
      onDelete: 'CASCADE',
    });
    VoucherTarget.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return VoucherTarget;
};

