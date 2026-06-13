// Đường dẫn: backend/src/models/TourImage.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const TourImage = sequelize.define(
    'TourImage',
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
      imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'image_url',
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order',
      },
    },
    {
      sequelize,
      modelName: 'TourImage',
      tableName: 'tour_images',
      timestamps: false,
    }
  );

  TourImage.associate = function (models) {
    TourImage.belongsTo(models.Tour, {
      foreignKey: 'tourId',
      as: 'tour',
      onDelete: 'CASCADE',
    });
  };

  return TourImage;
};

