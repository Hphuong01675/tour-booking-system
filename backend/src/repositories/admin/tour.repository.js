"use strict";

const db = require("../../models");

class AdminTourRepository {
    findAndCountTours({ where }) {
        const { Tour, TourSchedule, User } = db;

        return Tour.findAndCountAll({
            where,
            include: [
                {
                    model: TourSchedule,
                    as: "schedules",
                },
                {
                    model: User,
                    as: "creator",
                    attributes: ["id", "fullName", "email"],
                },
            ],
            distinct: true,
        });
    }

    getStatusCounts() {
        return db.Tour.findAll({
            attributes: [
                "status",
                [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "count"],
            ],
            group: ["status"],
        });
    }

    findById(id) {
        return db.Tour.findByPk(id);
    }
}

module.exports = new AdminTourRepository();
