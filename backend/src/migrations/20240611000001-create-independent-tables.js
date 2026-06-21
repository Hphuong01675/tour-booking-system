"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Bảng Users
        await queryInterface.createTable("users", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            full_name: { type: Sequelize.STRING(100), allowNull: false },
            email: {
                type: Sequelize.STRING(150),
                allowNull: false,
                unique: true,
            },
            password_hash: { type: Sequelize.STRING(255), allowNull: false },
            phone: { type: Sequelize.STRING(20) },
            date_of_birth: { type: Sequelize.DATE },
            address: { type: Sequelize.TEXT },
            avatar_url: { type: Sequelize.STRING(500) },
            role: {
                type: Sequelize.ENUM("customer", "operator", "guide", "admin"),
                allowNull: false,
                defaultValue: "customer",
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
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
        await queryInterface.addIndex("users", ["email"]);
        await queryInterface.addIndex("users", ["role"]);

        // Bảng Review Tags
        await queryInterface.createTable("review_tags", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        });

        // Bảng Tour Information Categories
        await queryInterface.createTable("tour_information_categories", {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            code: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
            },
            title: { type: Sequelize.STRING(255), allowNull: false },
            icon: { type: Sequelize.STRING(100) },
            sort_order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
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
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("tour_information_categories", {
            force: true,
        });
        await queryInterface.dropTable("review_tags", { force: true });
        await queryInterface.dropTable("users", { force: true });
    },
};
