import customerService from "../services/customer.service";

class CustomerController {
    async getBookings(req, res) {
        try {
            const bookings = await customerService.getCustomerBookings(req.user.id);
            return res.status(200).json({
                success: true,
                bookings
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async createBooking(req, res) {
        try {
            const { scheduleId, participants, status } = req.body;
            if (!scheduleId) {
                return res.status(400).json({
                    success: false,
                    error: "scheduleId là bắt buộc."
                });
            }

            const booking = await customerService.createBooking(req.user.id, { scheduleId, participants, status });
            return res.status(201).json({
                success: true,
                message: "Đặt tour thành công.",
                booking
            });
        } catch (error) {
            if (error.message === "SCHEDULE_NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    error: "Lịch trình tour không tồn tại."
                });
            }
            if (error.message === "SCHEDULE_FULL") {
                return res.status(400).json({
                    success: false,
                    error: "Lịch trình khởi hành này hiện tại đã hết chỗ trống."
                });
            }
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Wishlist controllers
    async getWishlist(req, res) {
        try {
            const wishlist = await customerService.getWishlist(req.user.id);
            return res.status(200).json({
                success: true,
                wishlist
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async addToWishlist(req, res) {
        try {
            const { tourId } = req.body;
            if (!tourId) {
                return res.status(400).json({
                    success: false,
                    error: "tourId là bắt buộc."
                });
            }
            const item = await customerService.addToWishlist(req.user.id, tourId);
            return res.status(201).json({
                success: true,
                message: "Đã thêm vào danh sách yêu thích.",
                item
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async removeFromWishlist(req, res) {
        try {
            const { tourId } = req.params;
            if (!tourId) {
                return res.status(400).json({
                    success: false,
                    error: "tourId là bắt buộc."
                });
            }
            await customerService.removeFromWishlist(req.user.id, tourId);
            return res.status(200).json({
                success: true,
                message: "Đã xóa khỏi danh sách yêu thích."
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const user = await customerService.updateProfile(req.user.id, req.body);
            return res.status(200).json({
                success: true,
                message: "Cập nhật thông tin thành công.",
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    address: user.address,
                    dateOfBirth: user.dateOfBirth,
                    role: user.role
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async updatePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: "Mật khẩu cũ và mật khẩu mới là bắt buộc."
                });
            }

            await customerService.updatePassword(req.user.id, { currentPassword, newPassword });
            return res.status(200).json({
                success: true,
                message: "Đổi mật khẩu thành công."
            });
        } catch (error) {
            if (error.message === "INCORRECT_PASSWORD") {
                return res.status(400).json({
                    success: false,
                    error: "Mật khẩu hiện tại không chính xác."
                });
            }
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async payBooking(req, res) {
        try {
            const { bookingId } = req.params;
            const booking = await customerService.payBooking(req.user.id, bookingId);
            return res.status(200).json({
                success: true,
                message: "Thanh toán thành công.",
                booking
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

export default new CustomerController();
