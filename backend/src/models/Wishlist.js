// Đường dẫn: backend/src/models/Wishlist.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Wishlist = sequelize.define(
    'Wishlist',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'user_id',
      },
      tourId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'tour_id',
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
      modelName: 'Wishlist',
      tableName: 'wishlists',
      timestamps: false,
      indexes: [
        { fields: ['user_id', 'tour_id'], unique: true },
      ],
    }
  );

  Wishlist.associate = function (models) {
    Wishlist.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
    });
    Wishlist.belongsTo(models.Tour, {
      foreignKey: 'tourId',
      as: 'tour',
      onDelete: 'CASCADE',
    });
  };

  return Wishlist;
};

