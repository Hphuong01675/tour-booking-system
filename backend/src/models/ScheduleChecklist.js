// Đường dẫn: backend/src/models/ScheduleChecklist.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ScheduleChecklist = sequelize.define(
    'ScheduleChecklist',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      scheduleId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        unique: true,
        field: 'schedule_id',
      },
      guideId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'guide_id',
      },
      customMessage: {
        type: DataTypes.TEXT,
        field: 'custom_message',
      },
      lastSentAt: {
        type: DataTypes.DATE,
        field: 'last_sent_at',
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
      modelName: 'ScheduleChecklist',
      tableName: 'schedule_checklists',
      timestamps: false,
    }
  );

  ScheduleChecklist.associate = function (models) {
    ScheduleChecklist.belongsTo(models.TourSchedule, {
      foreignKey: 'scheduleId',
      as: 'schedule',
      onDelete: 'CASCADE',
    });
    ScheduleChecklist.belongsTo(models.User, {
      foreignKey: 'guideId',
      as: 'guide',
      onDelete: 'SET NULL',
    });
    ScheduleChecklist.hasMany(models.ScheduleChecklistItem, {
      foreignKey: 'checklistId',
      as: 'items',
      onDelete: 'CASCADE',
    });
  };

  return ScheduleChecklist;
};

