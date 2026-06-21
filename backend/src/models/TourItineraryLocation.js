// Đường dẫn: backend/src/models/TourItineraryLocation.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const TourItineraryLocation = sequelize.define(
    'TourItineraryLocation',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      itineraryDayId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'itinerary_day_id',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false,
      },
      imageUrl: {
        type: DataTypes.STRING(500),
        field: 'image_url',
      },
      visitOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: 'visit_order',
      },
    },
    {
      sequelize,
      modelName: 'TourItineraryLocation',
      tableName: 'tour_itinerary_locations',
      timestamps: false,
    }
  );

  TourItineraryLocation.associate = function (models) {
    TourItineraryLocation.belongsTo(models.TourItineraryDay, {
      foreignKey: 'itineraryDayId',
      as: 'itineraryDay',
      onDelete: 'CASCADE',
    });
  };

  return TourItineraryLocation;
};

