import db from "../models";

const { Tour, TourSchedule } = db;

class TourService {
    async getPublishedTours() {
        return await Tour.findAll({
            where: {
                isPublished: true,
                status: "open"
            },
            include: [
                {
                    model: TourSchedule,
                    as: "schedules",
                    where: {
                        status: "open"
                    },
                    required: false
                }
            ],
            order: [["createdAt", "DESC"]]
        });
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
                }
            ]
        });
    }
}

export default new TourService();
