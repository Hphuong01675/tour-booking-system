"use strict";

const db = require("../../models");

const { Op } = db.Sequelize;

class AdminDashboardRepository {
    getDashboardData({ revenueRange, occupancyRange, paidStatuses, refundStatuses }) {
        const {
            Booking,
            Participant,
            Tour,
            TourSchedule,
            User,
        } = db;

        return Promise.all([
            Booking.findAll({
                where: { status: { [Op.in]: paidStatuses } },
                include: [
                    { model: Participant, as: "participants", attributes: ["id"] },
                    {
                        model: TourSchedule,
                        as: "schedule",
                        include: [{ model: Tour, as: "tour" }],
                    },
                ],
            }),
            Booking.findAll({
                where: {
                    status: { [Op.in]: refundStatuses },
                    bookedAt: {
                        [Op.gte]: revenueRange.start,
                        [Op.lt]: revenueRange.end,
                    },
                },
                attributes: ["refundAmount"],
            }),
            Booking.findAll({
                where: {
                    status: { [Op.in]: paidStatuses },
                    bookedAt: {
                        [Op.gte]: revenueRange.start,
                        [Op.lt]: revenueRange.end,
                    },
                },
                include: [
                    { model: Participant, as: "participants", attributes: ["id"] },
                    {
                        model: TourSchedule,
                        as: "schedule",
                        include: [{ model: Tour, as: "tour" }],
                    },
                ],
            }),
            TourSchedule.findAll({
                where: {
                    departureDate: {
                        [Op.gte]: occupancyRange.start,
                        [Op.lt]: occupancyRange.end,
                    },
                },
                include: [{ model: Tour, as: "tour" }],
            }),
            Tour.findAll(),
            User.count({ where: { role: "customer" } }),
            User.count({
                where: { role: { [Op.in]: ["admin", "operator", "guide"] } },
            }),
        ]);
    }
}

module.exports = new AdminDashboardRepository();
