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

    async getAvailableVouchers(req, res) {
        try {
            const { scheduleId } = req.query;
            if (!scheduleId) {
                return res.status(400).json({
                    success: false,
                    error: "scheduleId là bắt buộc."
                });
            }
            const vouchers = await customerService.getAvailableVouchersForTour(req.user.id, scheduleId);
            return res.status(200).json({
                success: true,
                vouchers
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
            const { scheduleId, participants, status, voucherId } = req.body;
            if (!scheduleId) {
                return res.status(400).json({
                    success: false,
                    error: "scheduleId là bắt buộc."
                });
            }

            const booking = await customerService.createBooking(req.user.id, { scheduleId, participants, status, voucherId });
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
            if (
                error.message === "HARD_TOUR_ONLY_ADULTS" ||
                error.message === "HARD_TOUR_REQUIRED_CCCD" ||
                error.message === "NORMAL_TOUR_ADULT_REQUIRED_CCCD" ||
                error.message.startsWith("VOUCHER_")
            ) {
                return res.status(400).json({
                    success: false,
                    error: error.message
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

            // Backend password strength validation
            const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordStrengthRegex.test(newPassword)) {
                return res.status(400).json({
                    success: false,
                    error: "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt."
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

    async cancelBooking(req, res) {
        try {
            const { bookingId } = req.params;
            const { reason } = req.body;
            const booking = await customerService.cancelBooking(req.user.id, bookingId, reason);
            return res.status(200).json({
                success: true,
                message: booking.destroyed ? "Đã xóa hẳn đơn đặt tour thành công." : "Yêu cầu hủy tour thành công, đang chờ điều hành duyệt.",
                booking
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateBookingTraveler(req, res) {
        try {
            const { bookingId } = req.params;
            const { fullName, phone, participants } = req.body;

            const booking = await customerService.updateBookingTraveler(req.user.id, bookingId, { fullName, phone, participants });
            return res.status(200).json({
                success: true,
                message: "Cập nhật thông tin thành công.",
                booking
            });
        } catch (error) {
            if (error.message === "BOOKING_NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    error: "Không tìm thấy đơn đặt tour này."
                });
            }
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async createBookingReview(req, res) {
        try {
            const { bookingId } = req.params;
            const { overallRating, generalComment } = req.body;
            if (overallRating === undefined || overallRating === null) {
                return res.status(400).json({
                    success: false,
                    error: "Điểm đánh giá là bắt buộc."
                });
            }

            const booking = await customerService.createBookingReview(req.user.id, bookingId, { overallRating, generalComment });
            return res.status(201).json({
                success: true,
                message: "Gửi đánh giá thành công.",
                booking
            });
        } catch (error) {
            if (error.message === "BOOKING_NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    error: "Không tìm thấy đơn đặt tour này."
                });
            }
            if (error.message === "ONLY_PAID_BOOKINGS_CAN_BE_REVIEWED") {
                return res.status(400).json({
                    success: false,
                    error: "Chỉ những đơn đặt tour đã thanh toán mới được phép đánh giá."
                });
            }
            if (error.message === "BOOKING_ALREADY_REVIEWED") {
                return res.status(400).json({
                    success: false,
                    error: "Đơn đặt tour này đã được đánh giá trước đó."
                });
            }
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async withdrawCancelBooking(req, res) {
        try {
            const { bookingId } = req.params;
            const booking = await customerService.withdrawCancelBooking(req.user.id, bookingId);
            return res.status(200).json({
                success: true,
                message: "Thu hồi yêu cầu hủy tour thành công.",
                booking
            });
        } catch (error) {
            if (error.message === "BOOKING_NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    error: "Đơn đặt tour không tồn tại hoặc bạn không có quyền truy cập."
                });
            }
            if (error.message === "CANNOT_WITHDRAW_CANCELLATION") {
                return res.status(400).json({
                    success: false,
                    error: "Không thể thu hồi yêu cầu hủy. Trạng thái không hợp lệ."
                });
            }
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

export default new CustomerController();
