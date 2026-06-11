// Đường dẫn: backend/src/models/ReviewTag.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ReviewTag = sequelize.define(
    'ReviewTag',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      sequelize,
      modelName: 'ReviewTag',
      tableName: 'review_tags',
      timestamps: false,
    }
  );

  ReviewTag.associate = function (models) {
    ReviewTag.hasMany(models.ReviewDetail, {
      foreignKey: 'tagId',
      as: 'details',
      onDelete: 'CASCADE',
    });
  };

  return ReviewTag;
};

