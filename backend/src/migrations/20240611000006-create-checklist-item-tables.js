"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Bảng Checklist Template Items
        await queryInterface.createTable("checklist_template_items", {
            template_id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                references: { model: "checklist_templates", key: "id" },
            },
            item_id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                references: { model: "packing_items", key: "id" },
            },
            is_required: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        });
        await queryInterface.addIndex(
            "checklist_template_items",
            ["template_id", "item_id"],
            { unique: true },
        );

        // Bảng Schedule Checklist Items
        await queryInterface.createTable("schedule_checklist_items", {
            checklist_id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                references: { model: "schedule_checklists", key: "id" },
            },
            item_id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                references: { model: "packing_items", key: "id" },
            },
            is_required: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        });
        await queryInterface.addIndex(
            "schedule_checklist_items",
            ["checklist_id", "item_id"],
            { unique: true },
        );
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("schedule_checklist_items", {
            force: true,
        });
        await queryInterface.dropTable("checklist_template_items", {
            force: true,
        });
    },
};
