// Path: backend/src/repositories/operator.repository.js
"use strict";

import { Op } from "sequelize";
import db from "../models";

const { User, Tour, TourSchedule, TourItineraryDay, TourAssignment, Booking, Participant, TourImage, TourInformation } = db;

class OperatorRepository {
    async findOperatorById(id) {
        return await User.findByPk(id);
    }

    async findToursByOperator({ operatorId, status, difficulty, search, departureDate, limit, offset }) {
        const tourWhere = { createdBy: operatorId };
        
        if (status && status !== "all") {
            tourWhere.status = status;
        }
        
        if (difficulty && difficulty !== "all") {
            tourWhere.difficulty = difficulty;
        }
        
        if (search) {
            tourWhere[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { tourCode: { [Op.like]: `%${search}%` } }
            ];
        }

        const scheduleInclude = {
            model: TourSchedule,
            as: "schedules",
            required: false
        };

        if (departureDate) {
            scheduleInclude.where = {
                departureDate: { [Op.gte]: new Date(departureDate) }
            };
            scheduleInclude.required = true;
        }

        return await Tour.findAndCountAll({
            where: tourWhere,
            include: [scheduleInclude],
            limit,
            offset,
            distinct: true,
            order: [["createdAt", "DESC"]]
        });
    }

    async findTourByIdAndOperator(id, operatorId) {
        return await Tour.findOne({
            where: { id, createdBy: operatorId },
            include: [
                { model: TourSchedule, as: "schedules" },
                { model: TourItineraryDay, as: "itineraryDays" },
                { model: TourImage, as: "images" },
                { model: TourInformation, as: "information" }
            ]
        });
    }

    async findTourByPkAndOperator(id, operatorId) {
        return await Tour.findOne({
            where: { id, createdBy: operatorId }
        });
    }

    async findScheduleByIdAndOperator(scheduleId, operatorId) {
        return await TourSchedule.findByPk(scheduleId, {
            include: [{
                model: Tour,
                as: "tour",
                where: { createdBy: operatorId },
                required: true
            }]
        });
    }

    async findActiveGuides() {
        return await User.findAll({
            where: { role: "guide", isActive: true }
        });
    }

    async countOverlappingAssignments(guideId, departureDate, returnDate) {
        return await TourAssignment.count({
            where: { guideId },
            include: [{
                model: TourSchedule,
                as: "schedule",
                where: {
                    [Op.and]: [
                        { departureDate: { [Op.lte]: returnDate } },
                        { returnDate: { [Op.gte]: departureDate } }
                    ],
                    status: { [Op.ne]: "cancelled" }
                }
            }]
        });
    }

    async deleteAssignmentsBySchedule(scheduleId) {
        return await TourAssignment.destroy({ where: { scheduleId } });
    }

    async createAssignment(assignmentData) {
        return await TourAssignment.create(assignmentData);
    }

    async findHardApprovalToursByOperator(operatorId) {
        return await Booking.findAll({
            where: { status: "pending_approval" },
            include: [
                {
                    model: TourSchedule,
                    as: "schedule",
                    required: true,
                    include: [{
                        model: Tour,
                        as: "tour",
                        where: { difficulty: "hard", createdBy: operatorId },
                        required: true
                    }]
                },
                {
                    model: Participant,
                    as: "participants"
                }
            ]
        });
    }

    async findTourParticipantsByOperator(tourId, operatorId, { search, type }) {
        const participantWhere = {};
        
        if (search) {
            participantWhere.fullName = { [Op.like]: `%${search}%` };
        }
        
        if (type && type !== "all") {
            participantWhere.participantType = type;
        }

        return await Participant.findAll({
            where: participantWhere,
            include: [{
                model: Booking,
                as: "booking",
                required: true,
                include: [
                    {
                        model: TourSchedule,
                        as: "schedule",
                        where: { tourId },
                        required: true,
                        include: [{
                            model: Tour,
                            as: "tour",
                            where: { createdBy: operatorId },
                            required: true
                        }]
                    },
                    {
                        model: User,
                        as: "customer"
                    }
                ]
            }]
        });
    }

    async findBookingVerificationByOperator(bookingId, operatorId) {
        return await Booking.findByPk(bookingId, {
            include: [
                { model: User, as: "customer" },
                { model: Participant, as: "participants" },
                {
                    model: TourSchedule,
                    as: "schedule",
                    required: true,
                    include: [{
                        model: Tour,
                        as: "tour",
                        where: { createdBy: operatorId },
                        required: true
                    }]
                }
            ]
        });
    }

    async findBookingByPkAndOperator(bookingId, operatorId) {
        return await Booking.findByPk(bookingId, {
            include: [{
                model: TourSchedule,
                as: "schedule",
                required: true,
                include: [{
                    model: Tour,
                    as: "tour",
                    where: { createdBy: operatorId },
                    required: true
                }]
            }]
        });
    }

    async findPendingBookingsByOperator(operatorId) {
        return await Booking.findAll({
            where: { status: "pending_approval" },
            include: [
                { model: User, as: "customer" },
                {
                    model: TourSchedule,
                    as: "schedule",
                    required: true,
                    include: [{
                        model: Tour,
                        as: "tour",
                        where: { createdBy: operatorId },
                        required: true
                    }]
                },
                { model: Participant, as: "participants" }
            ],
            order: [["bookedAt", "DESC"]]
        });
    }

    async findCustomerByOperator(search, operatorId) {
        return await User.findOne({
            where: {
                role: "customer",
                [Op.or]: [
                    { email: search.trim() },
                    { phone: search.trim() }
                ]
            },
            subQuery: false,
            include: [{
                model: Booking,
                as: "bookings",
                required: true,
                include: [{
                    model: TourSchedule,
                    as: "schedule",
                    required: true,
                    include: [{
                        model: Tour,
                        as: "tour",
                        where: { createdBy: operatorId },
                        required: true
                    }]
                }]
            }]
        });
    }

    async findCustomerBookingsByOperator(customerId, operatorId) {
        return await Booking.findAll({
            where: {
                customerId,
                status: { [Op.in]: ["paid", "pending_payment", "pending_approval"] }
            },
            include: [{
                model: TourSchedule,
                as: "schedule",
                required: true,
                include: [{
                    model: Tour,
                    as: "tour",
                    where: { createdBy: operatorId },
                    required: true
                }]
            }]
        });
    }

    async countParticipantsByBooking(bookingId) {
        return await Participant.count({ where: { bookingId } });
    }
}

export default new OperatorRepository();
