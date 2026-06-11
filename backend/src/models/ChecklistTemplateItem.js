// Đường dẫn: backend/src/models/ChecklistTemplateItem.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const ChecklistTemplateItem = sequelize.define(
    'ChecklistTemplateItem',
    {
      templateId: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        field: 'template_id',
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
      modelName: 'ChecklistTemplateItem',
      tableName: 'checklist_template_items',
      timestamps: false,
      indexes: [
        { fields: ['template_id', 'item_id'], unique: true },
      ],
    }
  );

  ChecklistTemplateItem.associate = function (models) {
    ChecklistTemplateItem.belongsTo(models.ChecklistTemplate, {
      foreignKey: 'templateId',
      as: 'template',
      onDelete: 'CASCADE',
    });
    ChecklistTemplateItem.belongsTo(models.PackingItem, {
      foreignKey: 'itemId',
      as: 'item',
      onDelete: 'CASCADE',
    });
  };

  return ChecklistTemplateItem;
};

