"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Bảng Tour Itinerary Locations
        await queryInterface.createTable("tour_itinerary_locations", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            itinerary_day_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "tour_itinerary_days", key: "id" },
            },
            name: { type: Sequelize.STRING(255), allowNull: false },
            description: { type: Sequelize.TEXT },
            latitude: { type: Sequelize.DECIMAL(10, 8), allowNull: false },
            longitude: { type: Sequelize.DECIMAL(11, 8), allowNull: false },
            image_url: { type: Sequelize.STRING(500) },
            visit_order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
        });

        // Bảng Tour Itinerary Items
        await queryInterface.createTable("tour_itinerary_items", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            itinerary_day_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "tour_itinerary_days", key: "id" },
            },
            title: { type: Sequelize.STRING(255) },
            description: { type: Sequelize.TEXT },
            activity_time: { type: Sequelize.TIME },
            sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("tour_itinerary_items", { force: true });
        await queryInterface.dropTable("tour_itinerary_locations", {
            force: true,
        });
    },
};
