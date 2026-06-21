// Đường dẫn: backend/src/models/TourInformation.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const TourInformation = sequelize.define(
    'TourInformation',
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
      categoryId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'category_id',
      },
      content: {
        type: DataTypes.TEXT('long'),
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order',
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
      modelName: 'TourInformation',
      tableName: 'tour_information',
      timestamps: false,
      indexes: [
        { fields: ['tour_id'] },
        { fields: ['category_id'] },
        { fields: ['tour_id', 'category_id'], unique: true },
      ],
    }
  );

  TourInformation.associate = function (models) {
    TourInformation.belongsTo(models.Tour, {
      foreignKey: 'tourId',
      as: 'tour',
      onDelete: 'CASCADE',
    });
    TourInformation.belongsTo(models.TourInformationCategory, {
      foreignKey: 'categoryId',
      as: 'category',
      onDelete: 'CASCADE',
    });
  };

  return TourInformation;
};

