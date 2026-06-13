"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Bảng Tours
        await queryInterface.createTable("tours", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            created_by: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "users", key: "id" },
            },
            tour_code: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true,
            },
            title: { type: Sequelize.STRING(200), allowNull: false },
            slug: {
                type: Sequelize.STRING(220),
                allowNull: false,
                unique: true,
            },
            description: { type: Sequelize.TEXT },
            highlights: { type: Sequelize.TEXT },
            departure_location: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            destination: { type: Sequelize.STRING(255), allowNull: false },
            difficulty: {
                type: Sequelize.ENUM("normal", "hard"),
                allowNull: false,
                defaultValue: "normal",
            },
            status: {
                type: Sequelize.ENUM(
                    "draft",
                    "pending",
                    "upcoming",
                    "open",
                    "closed",
                    "cancelled",
                ),
                allowNull: false,
                defaultValue: "draft",
            },
            duration_days: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            duration_nights: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            base_price: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0,
            },
            thumbnail_url: { type: Sequelize.STRING(500) },
            is_published: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
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
        await queryInterface.addIndex("tours", ["status"]);
        await queryInterface.addIndex("tours", ["difficulty"]);
        await queryInterface.addIndex("tours", ["created_by"]);
        await queryInterface.addIndex("tours", ["tour_code"]);

        // Bảng Vouchers
        await queryInterface.createTable("vouchers", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            name: { type: Sequelize.STRING(255), allowNull: false },
            code: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true,
            },
            description: { type: Sequelize.TEXT },
            discount_type: {
                type: Sequelize.ENUM("percent", "fixed"),
                allowNull: false,
            },
            discount_value: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
            },
            max_discount_amount: { type: Sequelize.DECIMAL(12, 2) },
            min_order_value: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0,
            },
            valid_from: { type: Sequelize.DATE },
            valid_until: { type: Sequelize.DATE },
            total_quantity: { type: Sequelize.INTEGER },
            usage_limit_per_user: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            target_type: {
                type: Sequelize.ENUM("all", "specific"),
                allowNull: false,
                defaultValue: "all",
            },
            used_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            created_by: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "users", key: "id" },
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });

        // Bảng Conversations
        await queryInterface.createTable("conversations", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            session_key: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
            },
            guest_name: { type: Sequelize.STRING(50) },
            customer_id: {
                type: Sequelize.CHAR(36),
                references: { model: "users", key: "id" },
            },
            support_user_id: {
                type: Sequelize.CHAR(36),
                references: { model: "users", key: "id" },
            },
            status: {
                type: Sequelize.ENUM("waiting", "active", "closed"),
                allowNull: false,
                defaultValue: "waiting",
            },
            last_message: { type: Sequelize.TEXT },
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

        // Bảng Packing Items
        await queryInterface.createTable("packing_items", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            category: {
                type: Sequelize.ENUM(
                    "DOCUMENT",
                    "FINANCE",
                    "CLOTHING",
                    "PERSONAL_CARE",
                    "ELECTRONICS",
                    "HEALTH",
                    "EQUIPMENT",
                    "FOOD_DRINK",
                ),
                allowNull: false,
            },
            title: { type: Sequelize.STRING(100), allowNull: false },
            content: { type: Sequelize.TEXT },
            is_system: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            created_by: {
                type: Sequelize.CHAR(36),
                references: { model: "users", key: "id" },
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });

        // Bảng Checklist Templates
        await queryInterface.createTable("checklist_templates", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            guide_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: { model: "users", key: "id" },
            },
            name: { type: Sequelize.STRING(100), allowNull: false },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });

        // Bảng Notifications
        await queryInterface.createTable("notifications", {
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
            type: {
                type: Sequelize.ENUM(
                    "packing_reminder",
                    "booking_confirmation",
                    "payment_reminder",
                    "tour_update",
                ),
                allowNull: false,
                defaultValue: "packing_reminder",
            },
            title: { type: Sequelize.STRING(200), allowNull: false },
            body: { type: Sequelize.TEXT, allowNull: false },
            is_read: {
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
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("notifications", { force: true });
        await queryInterface.dropTable("checklist_templates", { force: true });
        await queryInterface.dropTable("packing_items", { force: true });
        await queryInterface.dropTable("conversations", { force: true });
        await queryInterface.dropTable("vouchers", { force: true });
        await queryInterface.dropTable("tours", { force: true });
    },
};
