// Đường dẫn: backend/src/models/ReviewDetail.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ReviewDetail = sequelize.define(
    'ReviewDetail',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      reviewId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'review_id',
      },
      tagId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'tag_id',
      },
      tagRating: {
        type: DataTypes.SMALLINT,
        field: 'tag_rating',
      },
      specificComment: {
        type: DataTypes.TEXT,
        field: 'specific_comment',
      },
    },
    {
      sequelize,
      modelName: 'ReviewDetail',
      tableName: 'review_details',
      timestamps: false,
      indexes: [
        { fields: ['review_id', 'tag_id'], unique: true },
      ],
    }
  );

  ReviewDetail.associate = function (models) {
    ReviewDetail.belongsTo(models.Review, {
      foreignKey: 'reviewId',
      as: 'review',
      onDelete: 'CASCADE',
    });
    ReviewDetail.belongsTo(models.ReviewTag, {
      foreignKey: 'tagId',
      as: 'tag',
      onDelete: 'CASCADE',
    });
  };

  return ReviewDetail;
};

