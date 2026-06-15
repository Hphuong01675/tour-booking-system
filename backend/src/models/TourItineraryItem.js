// Đường dẫn: backend/src/models/TourItineraryItem.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const TourItineraryItem = sequelize.define(
    'TourItineraryItem',
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
      title: {
        type: DataTypes.STRING(255),
      },
      description: {
        type: DataTypes.TEXT,
      },
      activityTime: {
        type: DataTypes.TIME,
        field: 'activity_time',
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'sort_order',
      },
    },
    {
      sequelize,
      modelName: 'TourItineraryItem',
      tableName: 'tour_itinerary_items',
      timestamps: false,
    }
  );

  TourItineraryItem.associate = function (models) {
    TourItineraryItem.belongsTo(models.TourItineraryDay, {
      foreignKey: 'itineraryDayId',
      as: 'itineraryDay',
      onDelete: 'CASCADE',
    });
  };

  return TourItineraryItem;
};

