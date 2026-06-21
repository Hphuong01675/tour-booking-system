// Đường dẫn: backend/src/models/TourItineraryDay.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const TourItineraryDay = sequelize.define(
    'TourItineraryDay',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      tourId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'tour_id',
      },
      dayNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'day_number',
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      meals: {
        type: DataTypes.STRING(200),
      },
      mainActivity: {
        type: DataTypes.STRING(255),
        field: 'main_activity',
      },
      description: {
        type: DataTypes.TEXT,
      },
      imageUrl: {
        type: DataTypes.STRING(500),
        field: 'image_url',
      },
    },
    {
      sequelize,
      modelName: 'TourItineraryDay',
      tableName: 'tour_itinerary_days',
      timestamps: false,
    }
  );

  TourItineraryDay.associate = function (models) {
    TourItineraryDay.belongsTo(models.Tour, {
      foreignKey: 'tourId',
      as: 'tour',
      onDelete: 'CASCADE',
    });
    TourItineraryDay.hasMany(models.TourItineraryLocation, {
      foreignKey: 'itineraryDayId',
      as: 'locations',
      onDelete: 'CASCADE',
    });
    TourItineraryDay.hasMany(models.TourItineraryItem, {
      foreignKey: 'itineraryDayId',
      as: 'items',
      onDelete: 'CASCADE',
    });
  };

  return TourItineraryDay;
};

