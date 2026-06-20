import tourService from "../services/tour.service";

class TourController {
    async getTours(req, res) {
        try {
            const tours = await tourService.getPublishedTours();
            return res.status(200).json({
                success: true,
                tours
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
            return res.status(200).json({
                success: true,
                tour
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
