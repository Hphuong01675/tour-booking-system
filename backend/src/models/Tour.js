// Đường dẫn: backend/src/models/Tour.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const { TOUR_STATUS, TOUR_DIFFICULTY } = require('../constants/enums');

module.exports = (sequelize, DataTypes) => {
  const Tour = sequelize.define(
    'Tour',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      createdBy: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'created_by',
      },
      tourCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'tour_code',
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(220),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
      },
      highlights: {
        type: DataTypes.TEXT,
      },
      departureLocation: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'departure_location',
      },
      destination: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      difficulty: {
        type: DataTypes.ENUM(Object.values(TOUR_DIFFICULTY)),
        allowNull: false,
        defaultValue: TOUR_DIFFICULTY.NORMAL,
      },
      status: {
        type: DataTypes.ENUM(Object.values(TOUR_STATUS)),
        allowNull: false,
        defaultValue: TOUR_STATUS.DRAFT,
      },
      durationDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: 'duration_days',
      },
      durationNights: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'duration_nights',
      },
      basePrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'base_price',
      },
      thumbnailUrl: {
        type: DataTypes.STRING(500),
        field: 'thumbnail_url',
      },
      isPublished: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_published',
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
      modelName: 'Tour',
      tableName: 'tours',
      timestamps: false,
      indexes: [
        { fields: ['status'] },
        { fields: ['difficulty'] },
        { fields: ['created_by'] },
        { fields: ['tour_code'] },
      ],
    }
  );

  Tour.associate = function (models) {
    Tour.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
      onDelete: 'RESTRICT',
    });
    Tour.hasMany(models.TourSchedule, {
      foreignKey: 'tourId',
      as: 'schedules',
      onDelete: 'CASCADE',
    });
    Tour.hasMany(models.TourItineraryDay, {
      foreignKey: 'tourId',
      as: 'itineraryDays',
      onDelete: 'CASCADE',
    });
    Tour.hasMany(models.TourImage, {
      foreignKey: 'tourId',
      as: 'images',
      onDelete: 'CASCADE',
    });
    Tour.hasMany(models.TourInformation, {
      foreignKey: 'tourId',
      as: 'information',
      onDelete: 'CASCADE',
    });
    Tour.hasMany(models.Wishlist, {
      foreignKey: 'tourId',
      as: 'wishlists',
      onDelete: 'CASCADE',
    });
  };

  return Tour;
};

