import db from "../models";
import bcrypt from "bcryptjs";

const { Booking, TourSchedule, Tour, Participant, Wishlist } = db;

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
}

export default new CustomerService();
