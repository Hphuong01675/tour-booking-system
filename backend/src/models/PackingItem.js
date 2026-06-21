// Đường dẫn: backend/src/models/PackingItem.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const { PACKING_ITEM_CATEGORY } = require('../constants/enums');

module.exports = (sequelize, DataTypes) => {
  const PackingItem = sequelize.define(
    'PackingItem',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      category: {
        type: DataTypes.ENUM(Object.values(PACKING_ITEM_CATEGORY)),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
      },
      isSystem: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_system',
      },
      createdBy: {
        type: DataTypes.CHAR(36),
        field: 'created_by',
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
      modelName: 'PackingItem',
      tableName: 'packing_items',
      timestamps: false,
    }
  );

  PackingItem.associate = function (models) {
    PackingItem.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
      onDelete: 'SET NULL',
    });
    PackingItem.hasMany(models.ChecklistTemplateItem, {
      foreignKey: 'itemId',
      as: 'templateItems',
      onDelete: 'CASCADE',
    });
    PackingItem.hasMany(models.ScheduleChecklistItem, {
      foreignKey: 'itemId',
      as: 'scheduleItems',
      onDelete: 'CASCADE',
    });
  };

  return PackingItem;
};

