import tourService from "../services/tour.service";
import db from "../models";

class TourController {
    async getTours(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 6;
            const search = req.query.search || "";
            const priceRange = req.query.priceRange || "all";
            const date = req.query.date || "";

            const { tours, total } = await tourService.getPublishedTours({ page, limit, search, priceRange, date });
            return res.status(200).json({
                success: true,
                tours,
                total,
                page,
                limit
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getTourDetail(req, res) {
        try {
            const { id } = req.params;
            const tour = await tourService.getTourById(id);
            if (!tour) {
                return res.status(404).json({
                    success: false,
                    error: "Tour khong ton tai hoac chua duoc xuat ban."
                });
            }

            // Get all reviews of this tour
            const reviews = await db.Review.findAll({
                include: [
                    {
                        model: db.Booking,
                        as: "booking",
                        required: true,
                        include: [
                            {
                                model: db.TourSchedule,
                                as: "schedule",
                                where: { tourId: id },
                                required: true
                            },
                            {
                                model: db.User,
                                as: "customer",
                                attributes: ["id", "fullName", "avatarUrl"]
                            }
                        ]
                    }
                ],
                order: [["createdAt", "DESC"]]
            });

            return res.status(200).json({
                success: true,
                tour,
                reviews
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

export default new TourController();
