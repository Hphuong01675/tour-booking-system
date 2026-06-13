"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Bảng Tour Assignments
        await queryInterface.createTable("tour_assignments", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            schedule_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "tour_schedules", key: "id" },
            },
            guide_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "users", key: "id" },
            },
            assigned_by: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "users", key: "id" },
            },
            assigned_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });

        // Bảng Schedule Checklists
        await queryInterface.createTable("schedule_checklists", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            schedule_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                unique: true,
                references: { model: "tour_schedules", key: "id" },
            },
            guide_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "users", key: "id" },
            },
            custom_message: { type: Sequelize.TEXT },
            last_sent_at: { type: Sequelize.DATE },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("schedule_checklists", { force: true });
        await queryInterface.dropTable("tour_assignments", { force: true });
    },
};
