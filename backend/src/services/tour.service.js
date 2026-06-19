import db from "../models";

const { Tour, TourSchedule } = db;

class TourService {
    async getPublishedTours({ page = 1, limit = 6, search = "", priceRange = "all", date = "" } = {}) {
        const offset = (page - 1) * limit;
        const { Op } = db.Sequelize;

        const whereCondition = {
            isPublished: true,
            status: "open"
        };

        if (search) {
            whereCondition[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { destination: { [Op.like]: `%${search}%` } }
            ];
        }

        if (priceRange !== "all") {
            if (priceRange === "under2") {
                whereCondition.basePrice = { [Op.lt]: 2000000 };
            } else if (priceRange === "2to5") {
                whereCondition.basePrice = { [Op.between]: [2000000, 5000000] };
            } else if (priceRange === "5to10") {
                whereCondition.basePrice = { [Op.between]: [5000000, 10000000] };
            } else if (priceRange === "over10") {
                whereCondition.basePrice = { [Op.gt]: 10000000 };
            }
        }

        const scheduleInclude = {
            model: TourSchedule,
            as: "schedules",
            where: {
                status: "open"
            },
            required: false
        };

        if (date) {
            scheduleInclude.where.departureDate = {
                [Op.gte]: new Date(date)
            };
            scheduleInclude.required = true;
        }

        const { count, rows } = await Tour.findAndCountAll({
            where: whereCondition,
            include: [scheduleInclude],
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true,
            order: [["createdAt", "DESC"]]
        });

        return { tours: rows, total: count };
    }

    async getTourById(id) {
        return await Tour.findOne({
            where: { id, isPublished: true },
            include: [
                {
                    model: TourSchedule,
                    as: "schedules",
                    where: { status: "open" },
                    required: false
                },
                {
                    model: db.TourItineraryDay,
                    as: "itineraryDays",
                    required: false
                },
                {
                    model: db.TourImage,
                    as: "images",
                    required: false
                },
                {
                    model: db.TourInformation,
                    as: "information",
                    required: false
                }
            ]
        });
    }
}

export default new TourService();
