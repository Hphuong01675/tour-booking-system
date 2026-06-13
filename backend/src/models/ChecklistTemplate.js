// Đường dẫn: backend/src/models/ChecklistTemplate.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ChecklistTemplate = sequelize.define(
    'ChecklistTemplate',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      guideId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'guide_id',
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
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
      modelName: 'ChecklistTemplate',
      tableName: 'checklist_templates',
      timestamps: false,
    }
  );

  ChecklistTemplate.associate = function (models) {
    ChecklistTemplate.belongsTo(models.User, {
      foreignKey: 'guideId',
      as: 'guide',
      onDelete: 'CASCADE',
    });
    ChecklistTemplate.hasMany(models.ChecklistTemplateItem, {
      foreignKey: 'templateId',
      as: 'items',
      onDelete: 'CASCADE',
    });
  };

  return ChecklistTemplate;
};

