"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Bảng Tour Information
        await queryInterface.createTable("tour_information", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            tour_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "tours", key: "id" },
            },
            category_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "tour_information_categories", key: "id" },
            },
            content: { type: Sequelize.TEXT("long") },
            sort_order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });
        await queryInterface.addIndex("tour_information", ["tour_id"]);
        await queryInterface.addIndex("tour_information", ["category_id"]);
        await queryInterface.addIndex(
            "tour_information",
            ["tour_id", "category_id"],
            { unique: true },
        );

        // Bảng Tour Schedules
        await queryInterface.createTable("tour_schedules", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            tour_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "tours", key: "id" },
            },
            schedule_code: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
            },
            departure_date: { type: Sequelize.DATE, allowNull: false },
            return_date: { type: Sequelize.DATE, allowNull: false },
            price: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0,
            },
            max_capacity: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            registered: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            status: {
                type: Sequelize.ENUM("open", "closed", "cancelled"),
                allowNull: false,
                defaultValue: "open",
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });
        await queryInterface.addIndex("tour_schedules", ["tour_id"]);
        await queryInterface.addIndex("tour_schedules", ["departure_date"]);
        await queryInterface.addIndex("tour_schedules", ["schedule_code"]);

        // Bảng Tour Itinerary Days
        await queryInterface.createTable("tour_itinerary_days", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            tour_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "tours", key: "id" },
            },
            day_number: { type: Sequelize.INTEGER, allowNull: false },
            title: { type: Sequelize.STRING(200), allowNull: false },
            meals: { type: Sequelize.STRING(200) },
            main_activity: { type: Sequelize.STRING(255) },
            description: { type: Sequelize.TEXT },
            image_url: { type: Sequelize.STRING(500) },
        });

        // Bảng Tour Images
        await queryInterface.createTable("tour_images", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            tour_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "tours", key: "id" },
            },
            image_url: { type: Sequelize.STRING(500), allowNull: false },
            sort_order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        });

        // Bảng Wishlists
        await queryInterface.createTable("wishlists", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "users", key: "id" },
            },
            tour_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "tours", key: "id" },
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });
        await queryInterface.addIndex("wishlists", ["user_id", "tour_id"], {
            unique: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("wishlists", { force: true });
        await queryInterface.dropTable("tour_images", { force: true });
        await queryInterface.dropTable("tour_itinerary_days", { force: true });
        await queryInterface.dropTable("tour_schedules", { force: true });
        await queryInterface.dropTable("tour_information", { force: true });
    },
};
