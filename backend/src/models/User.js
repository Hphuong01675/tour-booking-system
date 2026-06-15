// Đường dẫn: backend/src/models/User.js
"use strict";
const { v4: uuidv4 } = require("uuid");
const { USER_ROLES } = require("../constants/enums");

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define(
        "User",
        {
            id: {
                type: DataTypes.CHAR(36),
                primaryKey: true,
                defaultValue: () => uuidv4(),
            },
            fullName: {
                type: DataTypes.STRING(100),
                allowNull: false,
                field: "full_name",
            },
            email: {
                type: DataTypes.STRING(150),
                allowNull: false,
                unique: true,
            },
            passwordHash: {
                type: DataTypes.STRING(255),
                allowNull: false,
                field: "password_hash",
            },
            phone: {
                type: DataTypes.STRING(20),
            },
            dateOfBirth: {
                type: DataTypes.DATE,
                field: "date_of_birth",
            },
            address: {
                type: DataTypes.TEXT,
            },
            avatarUrl: {
                type: DataTypes.STRING(500),
                field: "avatar_url",
            },
            role: {
                type: DataTypes.ENUM(Object.values(USER_ROLES)),
                allowNull: false,
                defaultValue: USER_ROLES.CUSTOMER,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                field: "is_active",
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                field: "created_at",
            },
        },
        {
            sequelize,
            modelName: "User",
            tableName: "users",
            timestamps: false,
            indexes: [{ fields: ["email"] }, { fields: ["role"] }],
        },
    );

    User.associate = function (models) {
        User.hasMany(models.Tour, {
            foreignKey: "createdBy",
            as: "createdTours",
        });
        User.hasMany(models.TourAssignment, {
            foreignKey: "guideId",
            as: "assignedTours",
        });
        User.hasMany(models.TourAssignment, {
            foreignKey: "assignedBy",
            as: "assignmentsMade",
        });
        User.hasMany(models.Voucher, {
            foreignKey: "createdBy",
            as: "createdVouchers",
        });
        User.hasMany(models.VoucherTarget, {
            foreignKey: "userId",
            as: "voucherTargets",
        });
        User.hasMany(models.Booking, {
            foreignKey: "customerId",
            as: "bookings",
        });
        User.hasMany(models.Wishlist, {
            foreignKey: "userId",
            as: "wishlists",
        });
        User.hasMany(models.Conversation, {
            foreignKey: "customerId",
            as: "conversations",
        });
        User.hasMany(models.Conversation, {
            foreignKey: "supportUserId",
            as: "supportedConversations",
        });
        User.hasMany(models.Message, {
            foreignKey: "senderId",
            as: "sentMessages",
        });
        User.hasMany(models.PackingItem, {
            foreignKey: "createdBy",
            as: "createdPackingItems",
        });
        User.hasMany(models.ChecklistTemplate, {
            foreignKey: "guideId",
            as: "checklistTemplates",
        });
        User.hasMany(models.ScheduleChecklist, {
            foreignKey: "guideId",
            as: "configuredChecklists",
        });
        User.hasMany(models.Notification, {
            foreignKey: "userId",
            as: "notifications",
        });
    };

    return User;
};
