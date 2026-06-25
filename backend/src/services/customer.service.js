import db from "../models";
import bcrypt from "bcryptjs";

const { Booking, TourSchedule, Tour, Participant, Wishlist, Review } = db;

class CustomerService {
    async getCustomerBookings(customerId) {
        return await Booking.findAll({
            where: { customerId },
            include: [
                {
                    model: TourSchedule,
                    as: "schedule",
                    include: [
                        {
                            model: Tour,
                            as: "tour"
                        }
                    ]
                },
                {
                    model: Participant,
                    as: "participants"
                },
                {
                    model: Review,
                    as: "review"
                }
            ],
            order: [["bookedAt", "DESC"]]
        });
    }

    async getAvailableVouchersForTour(customerId, scheduleId) {
        const schedule = await TourSchedule.findByPk(scheduleId, {
            include: [{ model: Tour, as: "tour" }]
        });
        if (!schedule) {
            throw new Error("SCHEDULE_NOT_FOUND");
        }

        const now = new Date();
        const { Voucher, VoucherTarget } = db;

        // Tìm tất cả Voucher hoạt động và còn thời hạn
        const allVouchers = await Voucher.findAll({
            where: {
                isActive: true,
                [db.Sequelize.Op.and]: [
                    {
                        validFrom: {
                            [db.Sequelize.Op.lte]: now
                        }
                    },
                    {
                        validUntil: {
                            [db.Sequelize.Op.gte]: now
                        }
                    }
                ]
            },
            include: [
                {
                    model: VoucherTarget,
                    as: "targets",
                    required: false
                }
            ]
        });

        const availableVouchers = [];

        for (const voucher of allVouchers) {
            // 1. Kiểm tra số lượng tổng của voucher
            if (voucher.totalQuantity !== null && voucher.usedCount >= voucher.totalQuantity) {
                continue;
            }

            // 2. Kiểm tra giá trị đơn hàng tối thiểu
            if (parseFloat(schedule.price) < parseFloat(voucher.minOrderValue)) {
                continue;
            }

            // 3. Kiểm tra đối tượng áp dụng
            if (voucher.targetType === "specific") {
                const target = voucher.targets?.find(t => t.userId === customerId);
                if (!target) {
                    continue; // Không dành cho user này
                }
                if (target.usedCount >= voucher.usageLimitPerUser) {
                    continue; // Đã dùng hết giới hạn
                }
            } else {
                // Voucher toàn hệ thống (all): Kiểm tra lịch sử đặt tour của user
                const usedCount = await Booking.count({
                    where: {
                        customerId,
                        voucherId: voucher.id,
                        status: {
                            [db.Sequelize.Op.ne]: "cancelled"
                        }
                    }
                });
                if (usedCount >= voucher.usageLimitPerUser) {
                    continue; // Đã dùng hết giới hạn
                }
            }

            availableVouchers.push(voucher);
        }

        return availableVouchers;
    }

    async createBooking(customerId, data) {
        const { scheduleId, participants, status, voucherId } = data;
        const schedule = await TourSchedule.findByPk(scheduleId, {
            include: [{ model: Tour, as: "tour" }]
        });
        if (!schedule) {
            throw new Error("SCHEDULE_NOT_FOUND");
        }
        const tour = schedule.tour;
        if (!tour) {
            throw new Error("TOUR_NOT_FOUND");
        }

        const guestCount = (participants && participants.length > 0) ? participants.length : 1;
        if ((schedule.registered || 0) + guestCount > schedule.maxCapacity) {
            throw new Error("SCHEDULE_FULL");
        }

        // Validate độ tuổi và CCCD
        if (participants && participants.length > 0) {
            for (const p of participants) {
                if (tour.difficulty === "hard") {
                    if (p.participantType !== "adult") {
                        throw new Error("HARD_TOUR_ONLY_ADULTS");
                    }
                    if (!p.cccdFrontUrl || !p.cccdBackUrl) {
                        throw new Error("HARD_TOUR_REQUIRED_CCCD");
                    }
                    if (!p.phone || !p.phone.trim()) {
                        throw new Error("HARD_TOUR_REQUIRED_PHONE");
                    }
                } else {
                    // Tour normal: CCCD có thể upload liền hoặc để sau cũng được, không ném lỗi
                }
            }
        } else {
            // Nếu không gửi hành khách, mặc định lấy user chính đặt tour
            const user = await db.User.findByPk(customerId);
            if (tour.difficulty === "hard") {
                if (!user.phone || !user.phone.trim()) {
                    throw new Error("HARD_TOUR_REQUIRED_PHONE");
                }
                throw new Error("HARD_TOUR_REQUIRED_CCCD");
            }
        }

        const basePrice = parseFloat(schedule.price);
        let totalPrice = 0;
        if (participants && participants.length > 0) {
            for (const p of participants) {
                const type = tour.difficulty === "hard" ? "adult" : (p.participantType || "adult");
                if (type === "adult") {
                    totalPrice += basePrice;
                } else if (type === "child") {
                    totalPrice += basePrice * 0.7;
                } else if (type === "infant") {
                    totalPrice += 0;
                }
            }
        } else {
            totalPrice = basePrice;
        }
        let discountAmount = 0;
        let finalVoucher = null;

        // Xử lý áp dụng Voucher
        if (voucherId) {
            const { Voucher, VoucherTarget } = db;
            const voucher = await Voucher.findByPk(voucherId, {
                include: [{ model: VoucherTarget, as: "targets", required: false }]
            });

            if (!voucher || !voucher.isActive) {
                throw new Error("VOUCHER_INVALID");
            }

            const now = new Date();
            if (new Date(voucher.validFrom) > now || new Date(voucher.validUntil) < now) {
                throw new Error("VOUCHER_EXPIRED");
            }

            if (voucher.totalQuantity !== null && voucher.usedCount >= voucher.totalQuantity) {
                throw new Error("VOUCHER_OUT_OF_STOCK");
            }

            if (totalPrice < parseFloat(voucher.minOrderValue)) {
                throw new Error("VOUCHER_MIN_ORDER_VALUE_NOT_MET");
            }

            // Kiểm tra giới hạn sử dụng
            if (voucher.targetType === "specific") {
                const target = voucher.targets?.find(t => t.userId === customerId);
                if (!target) {
                    throw new Error("VOUCHER_NOT_FOR_USER");
                }
                if (target.usedCount >= voucher.usageLimitPerUser) {
                    throw new Error("VOUCHER_USAGE_LIMIT_EXCEEDED");
                }
                finalVoucher = { type: "specific", target };
            } else {
                const usedCount = await Booking.count({
                    where: {
                        customerId,
                        voucherId: voucher.id,
                        status: { [db.Sequelize.Op.ne]: "cancelled" }
                    }
                });
                if (usedCount >= voucher.usageLimitPerUser) {
                    throw new Error("VOUCHER_USAGE_LIMIT_EXCEEDED");
                }
                finalVoucher = { type: "all" };
            }

            // Tính tiền giảm giá
            if (voucher.discountType === "percent") {
                discountAmount = totalPrice * (parseFloat(voucher.discountValue) / 100);
                if (voucher.maxDiscountAmount && discountAmount > parseFloat(voucher.maxDiscountAmount)) {
                    discountAmount = parseFloat(voucher.maxDiscountAmount);
                }
            } else if (voucher.discountType === "fixed") {
                discountAmount = parseFloat(voucher.discountValue);
            }

            if (discountAmount > totalPrice) {
                discountAmount = totalPrice;
            }

            // Cập nhật số lượng sử dụng của Voucher
            voucher.usedCount += 1;
            await voucher.save();

            if (finalVoucher.type === "specific") {
                finalVoucher.target.usedCount += 1;
                await finalVoucher.target.save();
            }
        }

        const finalPrice = totalPrice - discountAmount;
        const bookingCode = `BK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const booking = await Booking.create({
            customerId,
            scheduleId,
            bookingCode,
            status: tour.difficulty === "hard" ? "pending_approval" : (status || "pending_payment"),
            totalPrice,
            discountAmount,
            finalPrice,
            voucherId: voucherId || null,
            bookedAt: new Date()
        });

        schedule.registered = (schedule.registered || 0) + guestCount;
        await schedule.save();

        if (participants && participants.length > 0) {
            const participantData = participants.map((p) => ({
                bookingId: booking.id,
                fullName: p.fullName,
                dateOfBirth: p.dateOfBirth || new Date("1995-01-01"),
                participantType: p.participantType || "adult",
                address: p.address || "",
                isLead: p.isLead || false,
                cccdFrontUrl: p.cccdFrontUrl || null,
                cccdBackUrl: p.cccdBackUrl || null,
                phone: p.phone || null,
                status: "active",
                checkinCode: `QR-${Math.random().toString(36).substr(2, 7).toUpperCase()}`
            }));
            await Participant.bulkCreate(participantData);
        } else {
            const user = await db.User.findByPk(customerId);
            await Participant.create({
                bookingId: booking.id,
                fullName: user.fullName,
                dateOfBirth: user.dateOfBirth || new Date("1995-01-01"),
                participantType: "adult",
                address: user.address || "",
                isLead: true,
                phone: user.phone || null,
                status: "active",
                checkinCode: `QR-${Math.random().toString(36).substr(2, 7).toUpperCase()}`
            });
        }

        return await Booking.findOne({
            where: { id: booking.id },
            include: [
                {
                    model: TourSchedule,
                    as: "schedule",
                    include: [{ model: Tour, as: "tour" }]
                },
                {
                    model: Participant,
                    as: "participants"
                },
                {
                    model: Review,
                    as: "review"
                }
            ]
        });
    }

    // Wishlist / Storage functionality
    async getWishlist(userId) {
        return await Wishlist.findAll({
            where: { userId },
            include: [
                {
                    model: Tour,
                    as: "tour",
                    include: [
                        {
                            model: TourSchedule,
                            as: "schedules",
                            where: { status: "open" },
                            required: false
                        }
                    ]
                }
            ],
            order: [["createdAt", "DESC"]]
        });
    }

    async addToWishlist(userId, tourId) {
        // Check if already in wishlist
        const existing = await Wishlist.findOne({ where: { userId, tourId } });
        if (existing) {
            return existing;
        }
        return await Wishlist.create({
            userId,
            tourId,
            createdAt: new Date()
        });
    }

    async removeFromWishlist(userId, tourId) {
        return await Wishlist.destroy({
            where: { userId, tourId }
        });
    }

    async updateProfile(userId, { fullName, phone, address, dateOfBirth }) {
        const user = await db.User.findByPk(userId);
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }

        await user.update({
            fullName: fullName !== undefined ? fullName : user.fullName,
            phone: phone !== undefined ? phone : user.phone,
            address: address !== undefined ? address : user.address,
            dateOfBirth: dateOfBirth !== undefined ? dateOfBirth : user.dateOfBirth
        });

        return user;
    }

    async updatePassword(userId, { currentPassword, newPassword }) {
        const user = await db.User.findByPk(userId);
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            throw new Error("INCORRECT_PASSWORD");
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        await user.update({ passwordHash });
        return true;
    }

    async payBooking(userId, bookingId) {
        const booking = await Booking.findOne({
            where: { id: bookingId, customerId: userId }
        });
        if (!booking) {
            throw new Error("BOOKING_NOT_FOUND");
        }
        await booking.update({ status: "paid", updatedAt: new Date() });
        return booking;
    }

    async cancelBooking(userId, bookingId, reason) {
        const booking = await Booking.findOne({
            where: { id: bookingId, customerId: userId }
        });
        if (!booking) {
            throw new Error("BOOKING_NOT_FOUND");
        }

        if (booking.status === "paid") {
            // Đã thanh toán: chuyển thành yêu cầu hủy (chờ operator duyệt/hủy)
            await booking.update({
                status: "pending_approval",
                cancellationReason: reason || "Yêu cầu hủy tour từ khách hàng.",
                updatedAt: new Date()
            });
            return booking;
        } else {
            // Chưa thanh toán: xóa hẳn khỏi database
            const schedule = await TourSchedule.findByPk(booking.scheduleId);
            if (schedule) {
                const participantsCount = await Participant.count({ where: { bookingId } });
                const restoreCount = participantsCount > 0 ? participantsCount : 1;
                schedule.registered = Math.max(0, (schedule.registered || 0) - restoreCount);
                await schedule.save();
            }

            await booking.destroy();
            return { destroyed: true };
        }
    }

    async updateBookingTraveler(userId, bookingId, { fullName, phone, participants }) {
        const booking = await Booking.findOne({
            where: { id: bookingId, customerId: userId },
            include: [{ model: Participant, as: "participants" }]
        });
        if (!booking) {
            throw new Error("BOOKING_NOT_FOUND");
        }

        // Reset status to pending_approval if the booking is currently rejected
        if (booking.status === "rejected") {
            booking.status = "pending_approval";
            booking.cancellationReason = null;
            await booking.save();
        }

        if (participants && participants.length > 0) {
            for (const p of participants) {
                const ep = booking.participants?.find((part) => part.id === p.id);
                if (ep) {
                    await ep.update({
                        fullName: p.fullName !== undefined ? p.fullName : ep.fullName,
                        dateOfBirth: p.dateOfBirth !== undefined ? p.dateOfBirth : ep.dateOfBirth,
                        address: p.address !== undefined ? p.address : ep.address,
                        phone: p.phone !== undefined ? p.phone : ep.phone,
                        participantType: p.participantType !== undefined ? p.participantType : ep.participantType,
                        cccdFrontUrl: p.cccdFrontUrl !== undefined ? p.cccdFrontUrl : ep.cccdFrontUrl,
                        cccdBackUrl: p.cccdBackUrl !== undefined ? p.cccdBackUrl : ep.cccdBackUrl,
                        status: p.status !== undefined ? p.status : ep.status,
                    });
                }
            }
        }

        const leadParticipant = booking.participants?.find((p) => p.isLead) || booking.participants?.[0];
        if (leadParticipant && fullName) {
            await leadParticipant.update({ fullName });
        }

        const user = await db.User.findByPk(userId);
        if (user && phone) {
            await user.update({ phone });
        }

        return await Booking.findOne({
            where: { id: bookingId },
            include: [
                {
                    model: TourSchedule,
                    as: "schedule",
                    include: [{ model: Tour, as: "tour" }]
                },
                {
                    model: Participant,
                    as: "participants"
                },
                {
                    model: Review,
                    as: "review"
                }
            ]
        });
    }

    async createBookingReview(userId, bookingId, { overallRating, generalComment }) {
        const booking = await Booking.findOne({
            where: { id: bookingId, customerId: userId }
        });
        if (!booking) {
            throw new Error("BOOKING_NOT_FOUND");
        }
        if (booking.status !== "paid") {
            throw new Error("ONLY_PAID_BOOKINGS_CAN_BE_REVIEWED");
        }

        const existingReview = await Review.findOne({ where: { bookingId } });
        if (existingReview) {
            throw new Error("BOOKING_ALREADY_REVIEWED");
        }

        await Review.create({
            bookingId,
            overallRating,
            generalComment,
            isFeatured: false,
            createdAt: new Date()
        });

        return await Booking.findOne({
            where: { id: bookingId },
            include: [
                {
                    model: TourSchedule,
                    as: "schedule",
                    include: [{ model: Tour, as: "tour" }]
                },
                {
                    model: Participant,
                    as: "participants"
                },
                {
                    model: Review,
                    as: "review"
                }
            ]
        });
    }

    async withdrawCancelBooking(userId, bookingId) {
        const booking = await Booking.findOne({
            where: { id: bookingId, customerId: userId }
        });
        if (!booking) {
            throw new Error("BOOKING_NOT_FOUND");
        }

        if (booking.status !== "pending_approval" || !booking.cancellationReason) {
            throw new Error("CANNOT_WITHDRAW_CANCELLATION");
        }

        await booking.update({
            status: "paid",
            cancellationReason: null,
            updatedAt: new Date()
        });

        return booking;
    }
}

export default new CustomerService();
