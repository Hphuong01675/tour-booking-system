"use strict";

const db = require("../../models");
const tourRepository = require("../../repositories/admin/tour.repository");
const {
    createHttpError,
    validateTourStatusPayload,
} = require("../../validations/admin.validation");

const { Op } = db.Sequelize;

const TOUR_STATUS_TRANSITIONS = {
    draft: ["pending", "cancelled"],
    pending: ["upcoming", "draft", "cancelled"],
    upcoming: ["open", "cancelled"],
    open: ["closed", "cancelled"],
    closed: ["open"],
    cancelled: ["draft"],
};

const toNumber = (value) => Number(value || 0);

const normalizeSearchText = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");

const getScheduleTimingStatus = (schedule, now) => {
    const departureDate = new Date(schedule.departureDate);
    const returnDate = new Date(schedule.returnDate || schedule.departureDate);

    if (returnDate < now) return "past";
    if (departureDate <= now && returnDate >= now) return "current";
    return "upcoming";
};

const scheduleRank = (schedule) => (schedule.scheduleTimingStatus === "past" ? 1 : 0);
const getScheduleTime = (schedule) => new Date(schedule.departureDate || 0).getTime();

const compareSchedules = (first, second) => {
    const firstRank = scheduleRank(first);
    const secondRank = scheduleRank(second);

    if (firstRank !== secondRank) return firstRank - secondRank;

    const firstTime = getScheduleTime(first);
    const secondTime = getScheduleTime(second);

    return firstRank === 1 ? secondTime - firstTime : firstTime - secondTime;
};

const compareToursBySchedule = (first, second) => {
    const firstSchedule = first.nextSchedule;
    const secondSchedule = second.nextSchedule;

    if (!firstSchedule && !secondSchedule) return 0;
    if (!firstSchedule) return 1;
    if (!secondSchedule) return -1;

    return compareSchedules(firstSchedule, secondSchedule);
};

class AdminTourService {
    async getTours(query) {
        const {
            search = "",
            status = "all",
            difficulty = "all",
            page = 1,
            limit = 10,
        } = query;
        const where = {};
        const normalizedSearch = search.trim();
        const normalizedSearchText = normalizeSearchText(search);
        const isPastScheduleSearch = normalizedSearchText.includes("da qua");

        if (normalizedSearch && !isPastScheduleSearch) {
            where[Op.or] = [
                { title: { [Op.like]: `%${normalizedSearch}%` } },
                { tourCode: { [Op.like]: `%${normalizedSearch}%` } },
                { destination: { [Op.like]: `%${normalizedSearch}%` } },
            ];
        }

        if (status !== "all") where.status = status;
        if (difficulty !== "all") where.difficulty = difficulty;

        const pageNumber = Math.max(Number(page) || 1, 1);
        const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50);
        const offset = (pageNumber - 1) * pageSize;
        const [result, statusCounts] = await Promise.all([
            tourRepository.findAndCountTours({ where }),
            tourRepository.getStatusCounts(),
        ]);
        const counts = statusCounts.reduce(
            (acc, item) => {
                acc[item.status] = Number(item.get("count") || 0);
                acc.all += acc[item.status];
                return acc;
            },
            { all: 0 },
        );
        const now = new Date();
        const tours = result.rows.map((tour) => {
            const plainTour = tour.get({ plain: true });
            const schedules = (plainTour.schedules || []).map((schedule) => ({
                ...schedule,
                scheduleTimingStatus: getScheduleTimingStatus(schedule, now),
            }));
            const registered = schedules.reduce(
                (sum, schedule) => sum + toNumber(schedule.registered),
                0,
            );
            const maxCapacity = schedules.reduce(
                (sum, schedule) => sum + toNumber(schedule.maxCapacity),
                0,
            );
            const sortedSchedules = [...schedules].sort(compareSchedules);

            return {
                id: plainTour.id,
                title: plainTour.title,
                tourCode: plainTour.tourCode,
                destination: plainTour.destination,
                difficulty: plainTour.difficulty,
                status: plainTour.status,
                basePrice: plainTour.basePrice,
                thumbnailUrl: plainTour.thumbnailUrl,
                isPublished: plainTour.isPublished,
                createdAt: plainTour.createdAt,
                creator: plainTour.creator,
                scheduleCount: schedules.length,
                registered,
                maxCapacity,
                nextSchedule: sortedSchedules[0] || null,
            };
        }).filter((tour) => {
            if (!isPastScheduleSearch) return true;
            return tour.nextSchedule?.scheduleTimingStatus === "past";
        }).sort(compareToursBySchedule);
        const paginatedTours = tours.slice(offset, offset + pageSize);

        return {
            tours: paginatedTours,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total: tours.length,
                totalPages: Math.ceil(tours.length / pageSize),
            },
            summary: counts,
        };
    }

    async updateTourStatus(id, payload) {
        const { status } = validateTourStatusPayload(payload);
        const tour = await tourRepository.findById(id);

        if (!tour) {
            throw createHttpError(404, "Không tìm thấy tour.");
        }

        const allowedNextStatuses = TOUR_STATUS_TRANSITIONS[tour.status] || [];
        if (tour.status !== status && !allowedNextStatuses.includes(status)) {
            throw createHttpError(400, `Không thể chuyển tour từ ${tour.status} sang ${status}.`);
        }

        tour.status = status;
        tour.isPublished = ["upcoming", "open", "closed"].includes(status);
        tour.updatedAt = new Date();
        await tour.save();

        return {
            id: tour.id,
            status: tour.status,
        };
    }
}

module.exports = new AdminTourService();
