"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Bảng Participants
        await queryInterface.createTable("participants", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            booking_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "bookings", key: "id" },
            },
            full_name: { type: Sequelize.STRING(100), allowNull: false },
            date_of_birth: { type: Sequelize.DATE, allowNull: false },
            participant_type: {
                type: Sequelize.ENUM("adult", "child", "infant"),
                allowNull: false,
            },
            address: { type: Sequelize.TEXT },
            is_lead: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            cccd_front_url: { type: Sequelize.STRING(500) },
            cccd_back_url: { type: Sequelize.STRING(500) },
            checkin_code: { type: Sequelize.STRING(50), unique: true },
            checkin_at: { type: Sequelize.DATE },
        });

        // Bảng Payments
        await queryInterface.createTable("payments", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            booking_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "bookings", key: "id" },
            },
            transaction_id: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
            },
            payment_method: {
                type: Sequelize.ENUM("vnpay"),
                allowNull: false,
                defaultValue: "vnpay",
            },
            amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
            status: {
                type: Sequelize.ENUM(
                    "pending",
                    "success",
                    "failed",
                    "refunded",
                ),
                allowNull: false,
                defaultValue: "pending",
            },
            raw_response: { type: Sequelize.JSON },
            paid_at: { type: Sequelize.DATE },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });

        // Bảng Reviews
        await queryInterface.createTable("reviews", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            booking_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                unique: true,
                references: { model: "bookings", key: "id" },
            },
            overall_rating: { type: Sequelize.SMALLINT, allowNull: false },
            general_comment: { type: Sequelize.TEXT },
            is_featured: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });

        // Bảng Review Details
        await queryInterface.createTable("review_details", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            review_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "reviews", key: "id" },
            },
            tag_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "review_tags", key: "id" },
            },
            tag_rating: { type: Sequelize.SMALLINT },
            specific_comment: { type: Sequelize.TEXT },
        });
        await queryInterface.addIndex(
            "review_details",
            ["review_id", "tag_id"],
            { unique: true },
        );
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("review_details", { force: true });
        await queryInterface.dropTable("reviews", { force: true });
        await queryInterface.dropTable("payments", { force: true });
        await queryInterface.dropTable("participants", { force: true });
    },
};
