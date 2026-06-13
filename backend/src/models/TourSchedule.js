// Đường dẫn: backend/src/models/TourSchedule.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const { SCHEDULE_STATUS } = require('../constants/enums');

module.exports = (sequelize, DataTypes) => {
  const TourSchedule = sequelize.define(
    'TourSchedule',
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
      scheduleCode: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'schedule_code',
      },
      departureDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'departure_date',
      },
      returnDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'return_date',
      },
      price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      maxCapacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'max_capacity',
      },
      registered: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM(Object.values(SCHEDULE_STATUS)),
        allowNull: false,
        defaultValue: SCHEDULE_STATUS.OPEN,
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
      modelName: 'TourSchedule',
      tableName: 'tour_schedules',
      timestamps: false,
      indexes: [
        { fields: ['tour_id'] },
        { fields: ['departure_date'] },
        { fields: ['schedule_code'] },
      ],
    }
  );

  TourSchedule.associate = function (models) {
    TourSchedule.belongsTo(models.Tour, {
      foreignKey: 'tourId',
      as: 'tour',
      onDelete: 'CASCADE',
    });
    TourSchedule.hasMany(models.TourAssignment, {
      foreignKey: 'scheduleId',
      as: 'assignments',
      onDelete: 'CASCADE',
    });
    TourSchedule.hasMany(models.Booking, {
      foreignKey: 'scheduleId',
      as: 'bookings',
      onDelete: 'RESTRICT',
    });
    TourSchedule.hasOne(models.ScheduleChecklist, {
      foreignKey: 'scheduleId',
      as: 'checklist',
      onDelete: 'CASCADE',
    });
  };

  return TourSchedule;
};

