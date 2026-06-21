"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Bảng Voucher Targets
        await queryInterface.createTable("voucher_targets", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            voucher_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "vouchers", key: "id" },
            },
            user_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "users", key: "id" },
            },
            used_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        });
        await queryInterface.addIndex(
            "voucher_targets",
            ["voucher_id", "user_id"],
            { unique: true },
        );

        // Bảng Messages
        await queryInterface.createTable("messages", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            conversation_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "conversations", key: "id" },
            },
            sender_type: {
                type: Sequelize.ENUM("guest", "user", "guide", "system"),
                allowNull: false,
            },
            sender_id: {
                type: Sequelize.CHAR(36),
                references: { model: "users", key: "id" },
            },
            content: { type: Sequelize.TEXT, allowNull: false },
            is_read: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            sent_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });

        // Bảng Bookings
        await queryInterface.createTable("bookings", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            customer_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "users", key: "id" },
            },
            schedule_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "tour_schedules", key: "id" },
            },
            booking_code: {
                type: Sequelize.STRING(20),
                allowNull: false,
                unique: true,
            },
            status: {
                type: Sequelize.ENUM(
                    "pending_approval",
                    "pending_payment",
                    "paid",
                    "cancelled",
                    "refunded",
                ),
                allowNull: false,
                defaultValue: "pending_payment",
            },
            total_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
            discount_amount: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0,
            },
            final_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
            voucher_id: {
                type: Sequelize.CHAR(36),
                references: { model: "vouchers", key: "id" },
            },
            cancellation_reason: { type: Sequelize.TEXT },
            refund_amount: { type: Sequelize.DECIMAL(12, 2) },
            booked_at: {
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
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("bookings", { force: true });
        await queryInterface.dropTable("messages", { force: true });
        await queryInterface.dropTable("voucher_targets", { force: true });
    },
};
