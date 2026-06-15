import pendingBookingService from "../services/pendingBooking.service";

class PendingBookingController {
    async savePending(req, res) {
        try {
            const { tourId, scheduleId } = req.body;
            if (!tourId || !scheduleId) {
                return res.status(400).json({
                    success: false,
                    error: "tourId và scheduleId là bắt buộc."
                });
            }

            const pendingId = await pendingBookingService.savePendingBooking(tourId, scheduleId);
            return res.status(200).json({
                success: true,
                pendingId
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async claimPending(req, res) {
        try {
            const { pendingId } = req.body;
            const userId = req.user.id; // From verifyAccessToken middleware

            if (!pendingId) {
                return res.status(400).json({
                    success: false,
                    error: "pendingId là bắt buộc."
                });
            }

            const booking = await pendingBookingService.claimPendingBooking(pendingId, userId);
            return res.status(201).json({
                success: true,
                message: "Đồng bộ đơn đặt tour thành công.",
                booking
            });
        } catch (error) {
            if (error.message === "PENDING_BOOKING_NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    error: "Không tìm thấy thông tin đặt tour tạm thời hoặc đã hết hạn."
                });
            }
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

export default new PendingBookingController();
