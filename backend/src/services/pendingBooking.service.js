import { v4 as uuidv4 } from "uuid";
import redisClient from "../config/redis";
import db from "../models";

const { Booking, Participant, TourSchedule, User, Tour } = db;

class PendingBookingService {
    async savePendingBooking(tourId, scheduleId) {
        const pendingId = uuidv4();
        const data = {
            tourId,
            scheduleId,
            createdAt: new Date().toISOString()
        };
        // Store in redis/memory for 1 hour (3600 seconds)
        await redisClient.setEx(`pending_booking:${pendingId}`, 3600, JSON.stringify(data));
        return pendingId;
    }

    async claimPendingBooking(pendingId, userId) {
        // Retrieve from redis
        const rawData = await redisClient.get(`pending_booking:${pendingId}`);
        if (!rawData) {
            throw new Error("PENDING_BOOKING_NOT_FOUND");
        }

        const data = JSON.parse(rawData);
        const { scheduleId } = data;

        // Fetch schedule and user
        const schedule = await TourSchedule.findByPk(scheduleId);
        if (!schedule) {
            throw new Error("SCHEDULE_NOT_FOUND");
        }

        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }

        // Generate unique booking code
        const bookingCode = `BK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Create booking in database
        const booking = await Booking.create({
            customerId: userId,
            scheduleId: scheduleId,
            bookingCode,
            status: "pending_payment",
            totalPrice: schedule.price,
            discountAmount: 0,
            finalPrice: schedule.price,
            bookedAt: new Date()
        });

        // Create lead participant using user info
        await Participant.create({
            bookingId: booking.id,
            fullName: user.fullName,
            dateOfBirth: user.dateOfBirth || new Date("1995-01-01"),
            participantType: "adult",
            address: user.address || "Chưa cập nhật",
            isLead: true,
            checkinCode: `QR-${Math.random().toString(36).substr(2, 7).toUpperCase()}`
        });

        // Clean up redis key
        await redisClient.del(`pending_booking:${pendingId}`);

        // Return booking with tour info
        const result = await Booking.findOne({
            where: { id: booking.id },
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
                }
            ]
        });

        return result;
    }
}

export default new PendingBookingService();
