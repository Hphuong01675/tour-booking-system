// Path: backend/src/controllers/operator/operator.controller.js
"use strict";

import operatorService from "../../services/operator.service";

class OperatorController {
    /**
     * Lấy thông tin cá nhân của operator đang đăng nhập
     */
    async getProfile(req, res) {
        try {
            const operator = await operatorService.getProfile(req.user.id);
            res.json(operator);
        } catch (err) {
            if (err.message === "OPERATOR_NOT_FOUND") {
                return res.status(404).json({ error: "Operator not found" });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * Cập nhật thông tin cá nhân của operator
     */
    async updateProfile(req, res) {
        try {
            const operator = await operatorService.updateProfile(req.user.id, req.body);
            res.json(operator);
        } catch (err) {
            if (err.message === "OPERATOR_NOT_FOUND") {
                return res.status(404).json({ error: "Operator not found" });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * Thay đổi mật khẩu của operator
     */
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            await operatorService.changePassword(req.user.id, currentPassword, newPassword);
            res.json({ success: true, message: "Đổi mật khẩu thành công!" });
        } catch (err) {
            if (err.message === "PASSWORD_REQUIRED") {
                return res.status(400).json({ error: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc." });
            }
            if (err.message === "OPERATOR_NOT_FOUND") {
                return res.status(404).json({ error: "Operator not found" });
            }
            if (err.message === "INVALID_CURRENT_PASSWORD") {
                return res.status(400).json({ error: "Mật khẩu hiện tại không chính xác." });
            }
            if (err.message === "PASSWORD_MIN_LENGTH") {
                return res.status(400).json({ error: "Mật khẩu phải có ít nhất 8 ký tự." });
            }
            if (err.message === "PASSWORD_STRENGTH_FAILED") {
                return res.status(400).json({
                    error: "Mật khẩu phải bao gồm: 1 chữ in hoa, 1 chữ thường, 1 chữ số, 1 ký tự đặc biệt."
                });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * GET /api/operator/tours
     * Lấy danh sách tour kèm tìm kiếm, bộ lọc tab, difficulty, và phân trang
     */
    async getTours(req, res) {
        try {
            const result = await operatorService.getTours(req.user.id, req.query);
            res.json(result);
        } catch (err) {
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * GET /api/operator/tours/:id
     * Chi tiết một tour cùng các bảng liên quan
     */
    async getTourDetail(req, res) {
        try {
            const { id } = req.params;
            const tour = await operatorService.getTourDetail(id, req.user.id);
            res.json(tour);
        } catch (err) {
            if (err.message === "TOUR_NOT_FOUND") {
                return res.status(404).json({ error: "Tour không tồn tại hoặc bạn không có quyền truy cập." });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * PATCH /api/operator/tours/:id
     * Cập nhật thông tin tour / Chuyển trạng thái tour
     */
    async updateTour(req, res) {
        try {
            const { id } = req.params;
            const tour = await operatorService.updateTour(id, req.user.id, req.body);
            res.json({ success: true, message: "Cập nhật tour thành công!", tour });
        } catch (err) {
            if (err.message === "TOUR_NOT_FOUND") {
                return res.status(404).json({ error: "Tour không tồn tại hoặc bạn không có quyền truy cập." });
            }
            if (err.message === "INVALID_STATUS_TRANSITION") {
                return res.status(400).json({ error: "Chuyển trạng thái không hợp lệ." });
            }
            if (err.message === "ONLY_DRAFT_CAN_BE_UPDATED") {
                return res.status(400).json({ error: "Chỉ cho phép cập nhật thông tin đối với các Tour có trạng thái Bản nháp (draft)." });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * GET /api/operator/tour-schedules/:scheduleId
     * Lấy chi tiết lịch trình tour
     */
    async getScheduleDetail(req, res) {
        try {
            const { scheduleId } = req.params;
            const schedule = await operatorService.getScheduleDetail(scheduleId, req.user.id);
            res.json(schedule);
        } catch (err) {
            if (err.message === "SCHEDULE_NOT_FOUND") {
                return res.status(404).json({ error: "Lịch trình tour không tồn tại hoặc bạn không có quyền truy cập." });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * GET /api/operator/guides/available
     * Danh sách hướng dẫn viên, kiểm tra bận/rảnh và sắp xếp rảnh lên trước, hỗ trợ lazy load
     */
    async getAvailableGuides(req, res) {
        try {
            const { scheduleId, page, limit } = req.query;
            const result = await operatorService.getAvailableGuides(scheduleId, req.user.id, page, limit);
            res.json(result);
        } catch (err) {
            if (err.message === "SCHEDULE_NOT_FOUND") {
                return res.status(404).json({ error: "Lịch trình tour không tồn tại hoặc bạn không có quyền truy cập." });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * POST /api/operator/tour-assignments
     * Ghi nhận phân công hướng dẫn viên cho tour schedule
     */
    async assignGuide(req, res) {
        try {
            const { scheduleId, guideId } = req.body;
            const assignment = await operatorService.assignGuide(scheduleId, guideId, req.user.id);
            res.json({ success: true, message: "Phân công hướng dẫn viên thành công!", assignment });
        } catch (err) {
            if (err.message === "SCHEDULE_NOT_FOUND") {
                return res.status(404).json({ error: "Lịch trình tour không tồn tại hoặc bạn không có quyền truy cập." });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * GET /api/operator/tours/hard-approval
     * Danh sách các tour cấp độ hard đang có booking cần phê duyệt (status = pending_approval)
     */
    async getHardApprovalTours(req, res) {
        try {
            const tours = await operatorService.getHardApprovalTours(req.user.id);
            res.json({
                totalPending: tours.length,
                tours
            });
        } catch (err) {
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * GET /api/operator/tours/:id/participants
     * Danh sách hành khách tham gia tour phục vụ tìm kiếm/lọc
     */
    async getTourParticipants(req, res) {
        try {
            const { id } = req.params;
            const result = await operatorService.getTourParticipants(id, req.user.id, req.query);
            res.json(result);
        } catch (err) {
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * GET /api/operator/bookings/:bookingId/verify
     * Hồ sơ chi tiết xác thực của một Booking
     */
    async getBookingVerification(req, res) {
        try {
            const { bookingId } = req.params;
            const result = await operatorService.getBookingVerification(bookingId, req.user.id);
            res.json(result);
        } catch (err) {
            if (err.message === "BOOKING_NOT_FOUND") {
                return res.status(404).json({ error: "Không tìm thấy hồ sơ booking này hoặc bạn không có quyền truy cập." });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * PUT /api/operator/bookings/:bookingId/approve
     * Phê duyệt hồ sơ thanh toán/CCCD của khách hàng
     */
    async approveBooking(req, res) {
        try {
            const { bookingId } = req.params;
            const booking = await operatorService.approveBooking(bookingId, req.user.id);
            res.json({ success: true, message: "Duyệt hồ sơ thành công!", booking });
        } catch (err) {
            if (err.message === "BOOKING_NOT_FOUND") {
                return res.status(404).json({ error: "Booking không tồn tại hoặc bạn không có quyền truy cập." });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * PUT /api/operator/bookings/:bookingId/reject
     * Từ chối hồ sơ thanh toán/CCCD của khách hàng
     */
    async rejectBooking(req, res) {
        try {
            const { bookingId } = req.params;
            const { reason } = req.body;
            const booking = await operatorService.rejectBooking(bookingId, reason, req.user.id);
            res.json({ success: true, message: "Hủy duyệt hồ sơ thành công!", booking });
        } catch (err) {
            if (err.message === "BOOKING_NOT_FOUND") {
                return res.status(404).json({ error: "Booking không tồn tại hoặc bạn không có quyền truy cập." });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * GET /api/operator/customers
     * Tra cứu khách hàng theo email hoặc số điện thoại
     */
    async searchCustomer(req, res) {
        try {
            const { search } = req.query;
            if (!search) {
                return res.status(400).json({ error: "Vui lòng nhập email hoặc số điện thoại để tìm kiếm." });
            }
            const customer = await operatorService.searchCustomer(search, req.user.id);
            res.json(customer);
        } catch (err) {
            if (err.message === "CUSTOMER_NOT_FOUND") {
                return res.status(404).json({ error: "Không tìm thấy khách hàng ứng với thông tin tra cứu do bạn quản lý." });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * GET /api/operator/customers/:customerId/bookings
     * Lấy danh sách chuyến đi đang hoạt động của khách hàng
     */
    async getCustomerBookings(req, res) {
        try {
            const { customerId } = req.params;
            const result = await operatorService.getCustomerBookings(customerId, req.user.id);
            res.json(result);
        } catch (err) {
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * GET /api/operator/bookings/:bookingId/refund-estimate
     * Dự toán số tiền hoàn lại dựa trên khoảng cách ngày
     */
    async getRefundEstimate(req, res) {
        try {
            const { bookingId } = req.params;
            const result = await operatorService.getRefundEstimate(bookingId, req.user.id);
            res.json(result);
        } catch (err) {
            if (err.message === "BOOKING_NOT_FOUND") {
                return res.status(404).json({ error: "Không tìm thấy thông tin booking hoặc bạn không có quyền truy cập." });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * POST /api/operator/bookings/:bookingId/cancel
     * Thực hiện hủy booking và cập nhật lại số lượng capacity của tour schedule
     */
    async cancelBooking(req, res) {
        try {
            const { bookingId } = req.params;
            const { reason } = req.body;
            const result = await operatorService.cancelBooking(bookingId, reason, req.user.id);
            res.json({ success: true, message: "Hủy chuyến đi thành công!", refundAmount: result.refundAmount });
        } catch (err) {
            if (err.message === "BOOKING_NOT_FOUND") {
                return res.status(404).json({ error: "Booking không tồn tại hoặc bạn không có quyền truy cập." });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * GET /api/operator/bookings/pending
     * Lấy danh sách booking đang chờ phê duyệt
     */
    async getPendingBookings(req, res) {
        try {
            const result = await operatorService.getPendingBookings(req.user.id);
            res.json(result);
        } catch (err) {
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * POST /api/operator/tours
     * Tạo một tour du lịch mới với đầy đủ thông tin chi tiết
     */
    async createTour(req, res) {
        try {
            const tour = await operatorService.createTour(req.user.id, req.body);
            res.status(201).json({
                success: true,
                message: "Tạo tour mới thành công!",
                tour
            });
        } catch (err) {
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * POST /api/operator/tours/:id/images
     * Upload các tệp hình ảnh của tour lên Cloudinary
     */
    async uploadTourImages(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: "Vui lòng đính kèm ít nhất một file ảnh." });
            }
            const tour = await operatorService.uploadTourImages(req.params.id, req.user.id, req.files);
            res.json({
                success: true,
                message: "Tải ảnh lên Cloudinary thành công!",
                tour
            });
        } catch (err) {
            if (err.message === "TOUR_NOT_FOUND") {
                return res.status(404).json({ error: "Tour không tồn tại hoặc bạn không có quyền truy cập." });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * DELETE /api/operator/tours/:id/images/:imageId
     * Xóa một hình ảnh khỏi thư viện ảnh của tour
     */
    async deleteTourImage(req, res) {
        try {
            const { id, imageId } = req.params;
            await operatorService.deleteTourImage(id, req.user.id, imageId);
            res.json({ success: true, message: "Xóa ảnh thành công!" });
        } catch (err) {
            if (["TOUR_NOT_FOUND", "ONLY_DRAFT_CAN_BE_UPDATED", "IMAGE_NOT_FOUND"].includes(err.message)) {
                return res.status(400).json({ error: err.message });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * GET /api/operator/tours/by-slug/:slug
     * Xem thông tin chi tiết tour bằng slug thay vì ID
     */
    async getTourBySlug(req, res) {
        try {
            const { slug } = req.params;
            const tour = await operatorService.getTourBySlug(slug, req.user.id);
            res.json(tour);
        } catch (err) {
            if (err.message === "TOUR_NOT_FOUND") {
                return res.status(404).json({ error: "Tour không tồn tại hoặc bạn không có quyền truy cập." });
            }
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    /**
     * GET /api/operator/info-categories
     * Lấy danh mục thông tin bổ sung để hiển thị trên form
     */
    async getInfoCategories(req, res) {
        try {
            const categories = await operatorService.getInfoCategories();
            res.json(categories);
        } catch (err) {
            console.error("Internal Server Error:", err);
            res.status(500).json({ error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }
}

export default new OperatorController();
