// Đường dẫn: backend/src/models/Review.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define(
    'Review',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      bookingId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        unique: true,
        field: 'booking_id',
      },
      overallRating: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        field: 'overall_rating',
      },
      generalComment: {
        type: DataTypes.TEXT,
        field: 'general_comment',
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_featured',
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
      modelName: 'Review',
      tableName: 'reviews',
      timestamps: false,
    }
  );

  Review.associate = function (models) {
    Review.belongsTo(models.Booking, {
      foreignKey: 'bookingId',
      as: 'booking',
      onDelete: 'CASCADE',
    });
    Review.hasMany(models.ReviewDetail, {
      foreignKey: 'reviewId',
      as: 'details',
      onDelete: 'CASCADE',
    });
  };

  return Review;
};

