"use strict";

const dashboardRepository = require("../../repositories/admin/dashboard.repository");

const PAID_BOOKING_STATUSES = ["paid"];
const REVENUE_BOOKING_STATUSES = ["paid", "cancelled", "refunded"];

const toNumber = (value) => Number(value || 0);

const getRefundAmount = (booking) => toNumber(booking.refundAmount);

const getGrossRevenue = (booking) => (
    toNumber(booking.finalPrice) + getRefundAmount(booking)
);

const getNetRevenue = (booking) => (
    getGrossRevenue(booking) - getRefundAmount(booking)
);

const toDateOrNull = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getYearRange = (year) => {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    return { start, end };
};

const getDayRange = (dateValue) => {
    const date = toDateOrNull(dateValue) || new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return { start, end };
};

const getQuarterRange = (year, quarter) => {
    const selectedYear = Number(year) || new Date().getFullYear();
    const selectedQuarter = Math.min(Math.max(Number(quarter) || 1, 1), 4);
    const startMonth = (selectedQuarter - 1) * 3;
    const start = new Date(selectedYear, startMonth, 1);
    const end = new Date(selectedYear, startMonth + 3, 1);
    return { start, end, quarter: selectedQuarter, year: selectedYear };
};

const createRange = (query, prefix = "") => {
    const key = (name) => (prefix ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}` : name);
    const now = new Date();
    const rangeType = query[key("rangeType")] || "year";

    if (rangeType === "day") {
        const { start, end } = getDayRange(query[key("date")]);
        return {
            type: "day",
            start,
            end,
            label: start.toLocaleDateString("vi-VN"),
        };
    }

    if (rangeType === "month") {
        const selectedYear = Number(query[key("year")]) || now.getFullYear();
        const selectedMonth = Math.min(Math.max(Number(query[key("month")]) || now.getMonth() + 1, 1), 12);
        const start = new Date(selectedYear, selectedMonth - 1, 1);
        const end = new Date(selectedYear, selectedMonth, 1);
        return {
            type: "month",
            start,
            end,
            year: selectedYear,
            month: selectedMonth,
            label: `Tháng ${selectedMonth}/${selectedYear}`,
        };
    }

    if (rangeType === "quarter") {
        const range = getQuarterRange(query[key("year")], query[key("quarter")]);
        return {
            type: "quarter",
            ...range,
            label: `Quý ${range.quarter}/${range.year}`,
        };
    }

    const selectedYear = Number(query[key("year")]) || now.getFullYear();
    const { start, end } = getYearRange(selectedYear);
    return {
        type: "year",
        start,
        end,
        year: selectedYear,
        label: `Năm ${selectedYear}`,
    };
};

const createRevenueChart = (range, bookings) => {
    let buckets = [];

    if (range.type === "day") {
        buckets = Array.from({ length: 24 }, (_, hour) => ({
            key: `hour-${hour}`,
            label: `${String(hour).padStart(2, "0")}:00`,
            revenue: 0,
            grossRevenue: 0,
            refundAmount: 0,
        }));
    } else if (range.type === "month") {
        const daysInMonth = new Date(range.year, range.month, 0).getDate();
        buckets = Array.from({ length: daysInMonth }, (_, index) => ({
            key: `day-${index + 1}`,
            label: String(index + 1),
            revenue: 0,
            grossRevenue: 0,
            refundAmount: 0,
        }));
    } else if (range.type === "quarter") {
        const startMonth = (range.quarter - 1) * 3;
        buckets = Array.from({ length: 3 }, (_, index) => ({
            key: `month-${startMonth + index + 1}`,
            month: startMonth + index + 1,
            label: `Th${String(startMonth + index + 1).padStart(2, "0")}`,
            revenue: 0,
            grossRevenue: 0,
            refundAmount: 0,
        }));
    } else {
        buckets = Array.from({ length: 12 }, (_, index) => ({
            key: `month-${index + 1}`,
            month: index + 1,
            label: `Th${String(index + 1).padStart(2, "0")}`,
            revenue: 0,
            grossRevenue: 0,
            refundAmount: 0,
        }));
    }

    bookings.forEach((booking) => {
        const bookedAt = new Date(booking.bookedAt);
        let index = bookedAt.getMonth();

        if (range.type === "day") index = bookedAt.getHours();
        if (range.type === "month") index = bookedAt.getDate() - 1;
        if (range.type === "quarter") index = bookedAt.getMonth() - (range.quarter - 1) * 3;

        if (buckets[index]) {
            const grossRevenue = getGrossRevenue(booking);
            const refundAmount = getRefundAmount(booking);

            buckets[index].grossRevenue += grossRevenue;
            buckets[index].refundAmount += refundAmount;
            buckets[index].revenue += getNetRevenue(booking);
        }
    });

    return buckets;
};

class AdminDashboardService {
    async getDashboard(query) {
        const revenueRange = createRange(query);
        const occupancyRange = createRange(query, "occupancy");
        const [
            paidBookings,
            refundBookings,
            periodBookings,
            schedules,
            tours,
            totalCustomers,
            totalStaff,
        ] = await dashboardRepository.getDashboardData({
            revenueRange,
            occupancyRange,
            paidStatuses: PAID_BOOKING_STATUSES,
            revenueStatuses: REVENUE_BOOKING_STATUSES,
        });

        const periodRefund = refundBookings.reduce(
            (sum, booking) => sum + toNumber(booking.refundAmount),
            0,
        );
        const periodGrossRevenue = periodBookings.reduce(
            (sum, booking) => sum + getGrossRevenue(booking),
            0,
        );
        const netRevenue = periodGrossRevenue - periodRefund;
        const soldTickets = paidBookings.reduce(
            (sum, booking) => sum + (booking.participants?.length || 0),
            0,
        );
        const periodSoldTickets = periodBookings.reduce(
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

        const topTourMap = new Map();
        periodBookings.forEach((booking) => {
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
                grossRevenue: 0,
                refundAmount: 0,
            };

            const ticketCount = booking.participants?.length || 0;
            const grossRevenue = getGrossRevenue(booking);
            const refundAmount = getRefundAmount(booking);

            current.soldTickets += ticketCount;
            current.grossRevenue += grossRevenue;
            current.refundAmount += refundAmount;
            current.revenue += getNetRevenue(booking);
            topTourMap.set(tour.id, current);
        });

        const topTours = Array.from(topTourMap.values())
            .sort((first, second) => second.revenue - first.revenue)
            .slice(0, 5);
        const revenueChart = createRevenueChart(revenueRange, periodBookings);

        return {
            summary: {
                periodRevenue: netRevenue,
                monthRevenue: netRevenue,
                grossRevenue: periodGrossRevenue,
                periodGrossRevenue,
                netRevenue,
                totalRefund: periodRefund,
                soldTickets,
                periodSoldTickets,
                monthSoldTickets: periodSoldTickets,
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
            filter: revenueRange,
            occupancyFilter: occupancyRange,
            revenueChart,
            monthlyRevenue: revenueChart,
            topTours,
            year: revenueRange.year,
        };
    }
}

module.exports = new AdminDashboardService();
