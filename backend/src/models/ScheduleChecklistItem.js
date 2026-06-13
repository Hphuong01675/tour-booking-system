// Đường dẫn: backend/src/models/ScheduleChecklistItem.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const ScheduleChecklistItem = sequelize.define(
    'ScheduleChecklistItem',
    {
      checklistId: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        field: 'checklist_id',
      },
      itemId: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        field: 'item_id',
      },
      isRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_required',
      },
    },
    {
      sequelize,
      modelName: 'ScheduleChecklistItem',
      tableName: 'schedule_checklist_items',
      timestamps: false,
      indexes: [
        { fields: ['checklist_id', 'item_id'], unique: true },
      ],
    }
  );

  ScheduleChecklistItem.associate = function (models) {
    ScheduleChecklistItem.belongsTo(models.ScheduleChecklist, {
      foreignKey: 'checklistId',
      as: 'checklist',
      onDelete: 'CASCADE',
    });
    ScheduleChecklistItem.belongsTo(models.PackingItem, {
      foreignKey: 'itemId',
      as: 'item',
      onDelete: 'CASCADE',
    });
  };

  return ScheduleChecklistItem;
};

