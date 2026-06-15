// Đường dẫn: backend/src/models/TourAssignment.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const TourAssignment = sequelize.define(
    'TourAssignment',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      scheduleId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'schedule_id',
      },
      guideId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'guide_id',
      },
      assignedBy: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'assigned_by',
      },
      assignedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'assigned_at',
      },
    },
    {
      sequelize,
      modelName: 'TourAssignment',
      tableName: 'tour_assignments',
      timestamps: false,
    }
  );

  TourAssignment.associate = function (models) {
    TourAssignment.belongsTo(models.TourSchedule, {
      foreignKey: 'scheduleId',
      as: 'schedule',
      onDelete: 'CASCADE',
    });
    TourAssignment.belongsTo(models.User, {
      foreignKey: 'guideId',
      as: 'guide',
      onDelete: 'RESTRICT',
    });
    TourAssignment.belongsTo(models.User, {
      foreignKey: 'assignedBy',
      as: 'assignedByUser',
      onDelete: 'RESTRICT',
    });
  };

  return TourAssignment;
};

