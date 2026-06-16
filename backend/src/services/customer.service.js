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

    async createBooking(customerId, data) {
        const { scheduleId, participants, status } = data;
        const schedule = await TourSchedule.findByPk(scheduleId);
        if (!schedule) {
            throw new Error("SCHEDULE_NOT_FOUND");
        }

        const guestCount = (participants && participants.length > 0) ? participants.length : 1;
        if ((schedule.registered || 0) + guestCount > schedule.maxCapacity) {
            throw new Error("SCHEDULE_FULL");
        }

        const bookingCode = `BK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const booking = await Booking.create({
            customerId,
            scheduleId,
            bookingCode,
            status: status || "pending_payment",
            totalPrice: schedule.price,
            discountAmount: 0,
            finalPrice: schedule.price,
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
        await booking.update({ status: "paid" });
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
            throw new Error("CANNOT_CANCEL_PAID_BOOKING");
        }
        await booking.update({
            status: "cancelled",
            cancellationReason: reason || "Khách hàng chủ động hủy."
        });

        const schedule = await TourSchedule.findByPk(booking.scheduleId);
        if (schedule) {
            const participantsCount = await Participant.count({ where: { bookingId } });
            const restoreCount = participantsCount > 0 ? participantsCount : 1;
            schedule.registered = Math.max(0, (schedule.registered || 0) - restoreCount);
            await schedule.save();
        }

        return booking;
    }

    async updateBookingTraveler(userId, bookingId, { fullName, phone }) {
        const booking = await Booking.findOne({
            where: { id: bookingId, customerId: userId },
            include: [{ model: Participant, as: "participants" }]
        });
        if (!booking) {
            throw new Error("BOOKING_NOT_FOUND");
        }

        const leadParticipant = booking.participants?.find((p) => p.isLead) || booking.participants?.[0];
        if (leadParticipant) {
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
}

export default new CustomerService();
