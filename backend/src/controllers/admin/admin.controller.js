"use strict";

const db = require("../../models");

const { Op } = db.Sequelize;

const PAID_BOOKING_STATUSES = ["paid"];
const REFUND_BOOKING_STATUSES = ["cancelled", "refunded"];
const TOUR_STATUS_TRANSITIONS = {
    draft: ["pending", "cancelled"],
    pending: ["upcoming", "draft", "cancelled"],
    upcoming: ["open", "cancelled"],
    open: ["closed", "cancelled"],
    closed: ["open"],
    cancelled: ["draft"],
};

const toNumber = (value) => Number(value || 0);
const toNullableNumber = (value) => {
    if (value === undefined || value === null || value === "") return null;
    return Number(value);
};
const toBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";
const isNonNegative = (value) => value === null || (Number.isFinite(value) && value >= 0);
const toDateOrNull = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getMonthRange = (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return { start, end };
};

const getYearRange = (year) => {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    return { start, end };
};

class AdminController {
    async getDashboard(req, res) {
        try {
            const {
                Booking,
                Participant,
                Tour,
                TourSchedule,
                User,
            } = db;

            const now = new Date();
            const selectedYear = Number(req.query.year) || now.getFullYear();
            const monthRange = getMonthRange(now);
            const yearRange = getYearRange(selectedYear);

            const [
                paidBookings,
                refundBookings,
                monthPaidBookings,
                yearBookings,
                schedules,
                tours,
                totalCustomers,
                totalStaff,
            ] = await Promise.all([
                Booking.findAll({
                    where: { status: { [Op.in]: PAID_BOOKING_STATUSES } },
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
                    where: { status: { [Op.in]: REFUND_BOOKING_STATUSES } },
                    attributes: ["refundAmount"],
                }),
                Booking.findAll({
                    where: {
                        status: { [Op.in]: PAID_BOOKING_STATUSES },
                        bookedAt: {
                            [Op.gte]: monthRange.start,
                            [Op.lt]: monthRange.end,
                        },
                    },
                    include: [{ model: Participant, as: "participants", attributes: ["id"] }],
                }),
                Booking.findAll({
                    where: {
                        status: { [Op.in]: PAID_BOOKING_STATUSES },
                        bookedAt: {
                            [Op.gte]: yearRange.start,
                            [Op.lt]: yearRange.end,
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
                    include: [{ model: Tour, as: "tour" }],
                }),
                Tour.findAll(),
                User.count({ where: { role: "customer" } }),
                User.count({
                    where: { role: { [Op.in]: ["admin", "operator", "guide"] } },
                }),
            ]);

            const totalRevenue = paidBookings.reduce(
                (sum, booking) => sum + toNumber(booking.finalPrice),
                0,
            );
            const totalRefund = refundBookings.reduce(
                (sum, booking) => sum + toNumber(booking.refundAmount),
                0,
            );
            const netRevenue = totalRevenue - totalRefund;

            const monthRevenue = monthPaidBookings.reduce(
                (sum, booking) => sum + toNumber(booking.finalPrice),
                0,
            );
            const soldTickets = paidBookings.reduce(
                (sum, booking) => sum + (booking.participants?.length || 0),
                0,
            );
            const monthSoldTickets = monthPaidBookings.reduce(
                (sum, booking) => sum + (booking.participants?.length || 0),
                0,
            );

            const occupancyByDifficulty = {
                normal: { registered: 0, maxCapacity: 0, rate: 0 },
                hard: { registered: 0, maxCapacity: 0, rate: 0 },
            };

            schedules.forEach((schedule) => {
                const difficulty = schedule.tour?.difficulty;
                if (!occupancyByDifficulty[difficulty]) return;

                occupancyByDifficulty[difficulty].registered += toNumber(schedule.registered);
                occupancyByDifficulty[difficulty].maxCapacity += toNumber(schedule.maxCapacity);
            });

            Object.values(occupancyByDifficulty).forEach((item) => {
                item.rate = item.maxCapacity
                    ? Number(((item.registered / item.maxCapacity) * 100).toFixed(1))
                    : 0;
            });

            const totalRegistered =
                occupancyByDifficulty.normal.registered + occupancyByDifficulty.hard.registered;
            const totalCapacity =
                occupancyByDifficulty.normal.maxCapacity + occupancyByDifficulty.hard.maxCapacity;
            const overallOccupancyRate = totalCapacity
                ? Number(((totalRegistered / totalCapacity) * 100).toFixed(1))
                : 0;

            const monthlyRevenue = Array.from({ length: 12 }, (_, index) => ({
                month: index + 1,
                revenue: 0,
            }));

            const topTourMap = new Map();
            yearBookings.forEach((booking) => {
                const tour = booking.schedule?.tour;
                if (!tour) return;

                const current = topTourMap.get(tour.id) || {
                    id: tour.id,
                    title: tour.title,
                    code: tour.tourCode,
                    destination: tour.destination,
                    price: toNumber(booking.schedule?.price || tour.basePrice),
                    thumbnailUrl: tour.thumbnailUrl,
                    soldTickets: 0,
                    revenue: 0,
                };

                const ticketCount = booking.participants?.length || 0;
                current.soldTickets += ticketCount;
                current.revenue += toNumber(booking.finalPrice);
                topTourMap.set(tour.id, current);

                const bookedAt = new Date(booking.bookedAt);
                monthlyRevenue[bookedAt.getMonth()].revenue += toNumber(booking.finalPrice);
            });

            const topTours = Array.from(topTourMap.values())
                .sort((first, second) => second.revenue - first.revenue)
                .slice(0, 5);

            return res.json({
                summary: {
                    monthRevenue,
                    netRevenue,
                    totalRefund,
                    soldTickets,
                    monthSoldTickets,
                    totalTours: tours.length,
                    totalCustomers,
                    totalStaff,
                    overallOccupancyRate,
                },
                occupancy: {
                    normal: occupancyByDifficulty.normal,
                    hard: occupancyByDifficulty.hard,
                    total: {
                        registered: totalRegistered,
                        maxCapacity: totalCapacity,
                        rate: overallOccupancyRate,
                    },
                },
                monthlyRevenue,
                topTours,
                year: selectedYear,
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    async getVouchers(req, res) {
        try {
            const { Voucher, VoucherTarget, User } = db;
            const {
                search = "",
                status = "all",
                type = "all",
                page = 1,
                limit = 10,
            } = req.query;

            const where = {};
            const normalizedSearch = search.trim();

            if (normalizedSearch) {
                where[Op.or] = [
                    { code: { [Op.like]: `%${normalizedSearch}%` } },
                    { name: { [Op.like]: `%${normalizedSearch}%` } },
                ];
            }

            if (status === "active") where.isActive = true;
            if (status === "paused") where.isActive = false;
            if (type !== "all") where.discountType = type;

            const pageNumber = Math.max(Number(page) || 1, 1);
            const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50);
            const offset = (pageNumber - 1) * pageSize;

            const now = new Date();
            const soon = new Date(now);
            soon.setDate(soon.getDate() + 7);

            const [
                result,
                totalUsage,
                activeCount,
                expiringSoonCount,
                totalVoucherCount,
            ] = await Promise.all([
                Voucher.findAndCountAll({
                    where,
                    include: [
                        {
                            model: VoucherTarget,
                            as: "targets",
                            include: [
                                {
                                    model: User,
                                    as: "user",
                                    attributes: ["id", "fullName", "email"],
                                },
                            ],
                        },
                    ],
                    order: [["createdAt", "DESC"]],
                    limit: pageSize,
                    offset,
                    distinct: true,
                }),
                Voucher.sum("usedCount"),
                Voucher.count({ where: { isActive: true } }),
                Voucher.count({
                    where: {
                        isActive: true,
                        validUntil: {
                            [Op.gte]: now,
                            [Op.lte]: soon,
                        },
                    },
                }),
                Voucher.count(),
            ]);

            return res.json({
                vouchers: result.rows,
                pagination: {
                    page: pageNumber,
                    limit: pageSize,
                    total: result.count,
                    totalPages: Math.ceil(result.count / pageSize),
                },
                summary: {
                    totalUsage: toNumber(totalUsage),
                    activeCount,
                    expiringSoonCount,
                    totalVoucherCount,
                },
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    async createVoucher(req, res) {
        const transaction = await db.sequelize.transaction();

        try {
            const { Voucher, VoucherTarget, User } = db;
            const {
                name,
                code,
                description,
                discountType,
                discountValue,
                maxDiscountAmount,
                minOrderValue,
                validFrom,
                validUntil,
                totalQuantity,
                usageLimitPerUser,
                targetType = "all",
                emails = [],
            } = req.body;

            if (!name || !code || !discountType || discountValue === undefined) {
                await transaction.rollback();
                return res.status(400).json({ error: "Ten, ma, loai va gia tri voucher la bat buoc." });
            }

            const normalizedCode = String(code).trim().toUpperCase();
            const existing = await Voucher.findOne({
                where: { code: normalizedCode },
                transaction,
            });

            if (existing) {
                await transaction.rollback();
                return res.status(409).json({ error: "Ma voucher da ton tai." });
            }

            if (!["percent", "fixed"].includes(discountType)) {
                await transaction.rollback();
                return res.status(400).json({ error: "Loai voucher khong hop le." });
            }

            if (discountType === "percent" && (Number(discountValue) <= 0 || Number(discountValue) > 100)) {
                await transaction.rollback();
                return res.status(400).json({ error: "Voucher phan tram phai nam trong khoang 1 - 100." });
            }

            const cleanedEmails = Array.from(
                new Set(
                    (Array.isArray(emails) ? emails : [])
                        .map((email) => String(email).trim().toLowerCase())
                        .filter(Boolean),
                ),
            );

            if (!["all", "specific"].includes(targetType)) {
                await transaction.rollback();
                return res.status(400).json({ error: "Doi tuong voucher khong hop le." });
            }

            const numericDiscountValue = Number(discountValue);
            const numericMaxDiscountAmount = toNullableNumber(maxDiscountAmount);
            const numericMinOrderValue = minOrderValue === undefined || minOrderValue === ""
                ? 0
                : Number(minOrderValue);
            const numericTotalQuantity = toNullableNumber(totalQuantity);
            const numericUsageLimitPerUser = usageLimitPerUser === undefined || usageLimitPerUser === ""
                ? 1
                : Number(usageLimitPerUser);
            const validFromDate = toDateOrNull(validFrom);
            const validUntilDate = toDateOrNull(validUntil);

            if (!Number.isFinite(numericDiscountValue) || numericDiscountValue <= 0) {
                await transaction.rollback();
                return res.status(400).json({ error: "Gia tri voucher phai lon hon 0." });
            }

            if (
                !isNonNegative(numericMaxDiscountAmount) ||
                !isNonNegative(numericMinOrderValue) ||
                !isNonNegative(numericTotalQuantity) ||
                !Number.isFinite(numericUsageLimitPerUser) ||
                numericUsageLimitPerUser < 1
            ) {
                await transaction.rollback();
                return res.status(400).json({ error: "So luong va gia tri dieu kien voucher khong hop le." });
            }

            if ((validFrom && !validFromDate) || (validUntil && !validUntilDate)) {
                await transaction.rollback();
                return res.status(400).json({ error: "Ngay hieu luc voucher khong hop le." });
            }

            if (validFromDate && validUntilDate && validFromDate > validUntilDate) {
                await transaction.rollback();
                return res.status(400).json({ error: "Ngay bat dau khong duoc lon hon ngay ket thuc." });
            }

            if (targetType === "specific" && cleanedEmails.length === 0) {
                await transaction.rollback();
                return res.status(400).json({ error: "Can nhap email khach hang neu chon doi tuong cu the." });
            }

            const voucher = await Voucher.create(
                {
                    name: String(name).trim(),
                    code: normalizedCode,
                    description,
                    discountType,
                    discountValue: numericDiscountValue,
                    maxDiscountAmount: numericMaxDiscountAmount,
                    minOrderValue: numericMinOrderValue,
                    validFrom: validFromDate,
                    validUntil: validUntilDate,
                    totalQuantity: numericTotalQuantity,
                    usageLimitPerUser: numericUsageLimitPerUser,
                    targetType,
                    createdBy: req.user.id,
                    isActive: true,
                },
                { transaction },
            );

            if (targetType === "specific") {
                const users = await User.findAll({
                    where: {
                        email: { [Op.in]: cleanedEmails },
                        role: "customer",
                        isActive: true,
                    },
                    transaction,
                });

                if (users.length !== cleanedEmails.length) {
                    await transaction.rollback();
                    return res.status(400).json({
                        error: "Mot so email khong ton tai hoac khong phai khach hang dang hoat dong.",
                    });
                }

                await VoucherTarget.bulkCreate(
                    users.map((user) => ({
                        voucherId: voucher.id,
                        userId: user.id,
                    })),
                    { transaction },
                );
            }

            await transaction.commit();
            return res.status(201).json(voucher);
        } catch (err) {
            await transaction.rollback();
            return res.status(500).json({ error: err.message });
        }
    }

    async updateVoucherStatus(req, res) {
        try {
            const { Voucher } = db;
            const voucher = await Voucher.findByPk(req.params.id);

            if (!voucher) {
                return res.status(404).json({ error: "Voucher not found" });
            }

            if (req.body.isActive === undefined) {
                return res.status(400).json({ error: "Trang thai voucher la bat buoc." });
            }

            voucher.isActive = toBoolean(req.body.isActive);
            await voucher.save();

            return res.json(voucher);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    async suggestCustomerEmails(req, res) {
        try {
            const { User } = db;
            const search = String(req.query.email || "").trim();

            if (!search) {
                return res.json([]);
            }

            const users = await User.findAll({
                where: {
                    role: "customer",
                    isActive: true,
                    email: { [Op.like]: `%${search}%` },
                },
                attributes: ["id", "fullName", "email"],
                order: [["email", "ASC"]],
                limit: 8,
            });

            return res.json(users);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    async getUsers(req, res) {
        try {
            const { Booking, User } = db;
            const {
                group = "staff",
                search = "",
                role = "all",
                status = "all",
                page = 1,
                limit = 10,
            } = req.query;

            const where = {};
            const normalizedSearch = search.trim();

            if (group === "customer") {
                where.role = "customer";
            } else {
                where.role = { [Op.in]: ["admin", "operator", "guide"] };
            }

            if (role !== "all") {
                where.role = role;
            }

            if (status === "active") where.isActive = true;
            if (status === "inactive") where.isActive = false;

            if (normalizedSearch) {
                where[Op.or] = [
                    { fullName: { [Op.like]: `%${normalizedSearch}%` } },
                    { email: { [Op.like]: `%${normalizedSearch}%` } },
                    { phone: { [Op.like]: `%${normalizedSearch}%` } },
                ];
            }

            const pageNumber = Math.max(Number(page) || 1, 1);
            const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50);
            const offset = (pageNumber - 1) * pageSize;

            const result = await User.findAndCountAll({
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

            let bookingCountByUser = {};
            if (group === "customer" && result.rows.length > 0) {
                const customerIds = result.rows.map((user) => user.id);
                const bookingCounts = await Booking.findAll({
                    where: { customerId: { [Op.in]: customerIds } },
                    attributes: [
                        "customerId",
                        [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "tourCount"],
                    ],
                    group: ["customerId"],
                });

                bookingCountByUser = bookingCounts.reduce((acc, item) => {
                    acc[item.customerId] = Number(item.get("tourCount") || 0);
                    return acc;
                }, {});
            }

            const users = result.rows.map((user) => {
                const plainUser = user.get({ plain: true });
                return {
                    ...plainUser,
                    tourCount: bookingCountByUser[plainUser.id] || 0,
                };
            });

            const [staffCount, customerCount, activeCount, inactiveCount] = await Promise.all([
                User.count({ where: { role: { [Op.in]: ["admin", "operator", "guide"] } } }),
                User.count({ where: { role: "customer" } }),
                User.count({ where: { isActive: true } }),
                User.count({ where: { isActive: false } }),
            ]);

            return res.json({
                users,
                pagination: {
                    page: pageNumber,
                    limit: pageSize,
                    total: result.count,
                    totalPages: Math.ceil(result.count / pageSize),
                },
                summary: {
                    staffCount,
                    customerCount,
                    activeCount,
                    inactiveCount,
                },
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    async updateUserStatus(req, res) {
        try {
            const { User } = db;
            const user = await User.findByPk(req.params.id);

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            if (req.body.isActive === undefined) {
                return res.status(400).json({ error: "Trang thai nguoi dung la bat buoc." });
            }

            const nextIsActive = toBoolean(req.body.isActive);

            if (user.id === req.user.id && nextIsActive === false) {
                return res.status(400).json({ error: "Khong the khoa tai khoan dang dang nhap." });
            }

            user.isActive = nextIsActive;
            await user.save();

            return res.json({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    async getTours(req, res) {
        try {
            const { Tour, TourSchedule, User } = db;
            const {
                search = "",
                status = "all",
                difficulty = "all",
                page = 1,
                limit = 10,
            } = req.query;

            const where = {};
            const normalizedSearch = search.trim();

            if (normalizedSearch) {
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
                Tour.findAndCountAll({
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
                    order: [["createdAt", "DESC"]],
                    limit: pageSize,
                    offset,
                    distinct: true,
                }),
                Tour.findAll({
                    attributes: [
                        "status",
                        [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "count"],
                    ],
                    group: ["status"],
                }),
            ]);

            const counts = statusCounts.reduce(
                (acc, item) => {
                    acc[item.status] = Number(item.get("count") || 0);
                    acc.all += acc[item.status];
                    return acc;
                },
                { all: 0 },
            );

            const tours = result.rows.map((tour) => {
                const plainTour = tour.get({ plain: true });
                const schedules = plainTour.schedules || [];
                const registered = schedules.reduce(
                    (sum, schedule) => sum + toNumber(schedule.registered),
                    0,
                );
                const maxCapacity = schedules.reduce(
                    (sum, schedule) => sum + toNumber(schedule.maxCapacity),
                    0,
                );
                const sortedSchedules = [...schedules].sort(
                    (first, second) =>
                        new Date(first.departureDate || 0) - new Date(second.departureDate || 0),
                );

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
            });

            return res.json({
                tours,
                pagination: {
                    page: pageNumber,
                    limit: pageSize,
                    total: result.count,
                    totalPages: Math.ceil(result.count / pageSize),
                },
                summary: counts,
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    async updateTourStatus(req, res) {
        try {
            const { Tour } = db;
            const allowedStatuses = ["draft", "pending", "upcoming", "open", "closed", "cancelled"];
            const { status } = req.body;

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ error: "Trang thai tour khong hop le." });
            }

            const tour = await Tour.findByPk(req.params.id);
            if (!tour) {
                return res.status(404).json({ error: "Tour not found" });
            }

            const allowedNextStatuses = TOUR_STATUS_TRANSITIONS[tour.status] || [];
            if (tour.status !== status && !allowedNextStatuses.includes(status)) {
                return res.status(400).json({
                    error: `Khong the chuyen tour tu ${tour.status} sang ${status}.`,
                });
            }

            tour.status = status;
            tour.isPublished = ["upcoming", "open", "closed"].includes(status);
            tour.updatedAt = new Date();
            await tour.save();

            return res.json({
                id: tour.id,
                status: tour.status,
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new AdminController();
