"use strict";

const db = require("../../models");

const { Op } = db.Sequelize;

class AdminUserRepository {
    findAndCountUsers({ where, pageSize, offset }) {
        return db.User.findAndCountAll({
            where,
            attributes: [
                "id",
                "fullName",
                "email",
                "phone",
                "role",
                "avatarUrl",
                "isActive",
                "createdAt",
            ],
            order: [["createdAt", "DESC"]],
            limit: pageSize,
            offset,
            distinct: true,
        });
    }

    getBookingCounts(customerIds) {
        if (!customerIds.length) return Promise.resolve([]);

        return db.Booking.findAll({
            where: { customerId: { [Op.in]: customerIds } },
            attributes: [
                "customerId",
                [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "tourCount"],
            ],
            group: ["customerId"],
        });
    }

    getSummaryCounts() {
        return Promise.all([
            db.User.count({ where: { role: { [Op.in]: ["admin", "operator", "guide"] } } }),
            db.User.count({ where: { role: "customer" } }),
            db.User.count({ where: { isActive: true } }),
            db.User.count({ where: { isActive: false } }),
        ]);
    }

    findByEmail(email) {
        return db.User.findOne({ where: { email } });
    }

    create(userData) {
        return db.User.create(userData);
    }

    findById(id) {
        return db.User.findByPk(id);
    }
}

module.exports = new AdminUserRepository();
