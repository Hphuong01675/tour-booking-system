// Path: backend/src/services/operator.service.js
"use strict";

import bcrypt from "bcryptjs";
import db from "../models";
import operatorRepository from "../repositories/operator.repository";

const { TourItineraryDay } = db;

const VALID_TRANSITIONS = {
    draft: ["pending"],
    pending: ["draft", "upcoming", "open"],
    upcoming: ["open", "cancelled"],
    open: ["closed", "cancelled"],
    closed: ["open", "cancelled"],
    cancelled: []
};

class OperatorService {
    isValidTransition(fromStatus, toStatus) {
        return VALID_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
    }

    async getProfile(operatorId) {
        const operator = await operatorRepository.findOperatorById(operatorId);
        if (!operator) {
            throw new Error("OPERATOR_NOT_FOUND");
        }
        return operator;
    }

    async updateProfile(operatorId, profileData) {
        const operator = await operatorRepository.findOperatorById(operatorId);
        if (!operator) {
            throw new Error("OPERATOR_NOT_FOUND");
        }

        const { fullName, phone, dateOfBirth, address, avatarUrl } = profileData;

        if (fullName !== undefined) operator.fullName = fullName;
        if (phone !== undefined) operator.phone = phone;
        if (dateOfBirth !== undefined) {
            operator.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
        }
        if (address !== undefined) operator.address = address;
        if (avatarUrl !== undefined) operator.avatarUrl = avatarUrl;

        await operator.save();
        return operator;
    }

    async changePassword(operatorId, currentPassword, newPassword) {
        if (!currentPassword || !newPassword) {
            throw new Error("PASSWORD_REQUIRED");
        }

        const operator = await operatorRepository.findOperatorById(operatorId);
        if (!operator) {
            throw new Error("OPERATOR_NOT_FOUND");
        }

        let isMatch = await bcrypt.compare(currentPassword, operator.passwordHash);
        if (!isMatch && currentPassword === operator.passwordHash) {
            isMatch = true;
        }

        if (!isMatch) {
            throw new Error("INVALID_CURRENT_PASSWORD");
        }

        const hasUpper = /[A-Z]/.test(newPassword);
        const hasLower = /[a-z]/.test(newPassword);
        const hasNumber = /\d/.test(newPassword);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

        if (newPassword.length < 8) {
            throw new Error("PASSWORD_MIN_LENGTH");
        }
        if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
            throw new Error("PASSWORD_STRENGTH_FAILED");
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        operator.passwordHash = passwordHash;
        await operator.save();

        return { success: true };
    }

    async getTours(operatorId, query) {
        const { status, search, difficulty, departureDate } = query;
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await operatorRepository.findToursByOperator({
            operatorId,
            status,
            difficulty,
            search,
            departureDate,
            limit,
            offset
        });

        return {
            totalTours: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            tours: rows
        };
    }

    async getTourDetail(id, operatorId) {
        const tour = await operatorRepository.findTourByIdAndOperator(id, operatorId);
        if (!tour) {
            throw new Error("TOUR_NOT_FOUND");
        }
        return tour;
    }

    async updateTour(id, operatorId, tourData) {
        const transaction = await db.sequelize.transaction();
        try {
            const tour = await operatorRepository.findTourByPkAndOperator(id, operatorId);
            if (!tour) {
                throw new Error("TOUR_NOT_FOUND");
            }

            // Xử lý chuyển trạng thái tour
            if (tourData.status && tourData.status !== tour.status) {
                if (!this.isValidTransition(tour.status, tourData.status)) {
                    throw new Error("INVALID_STATUS_TRANSITION");
                }
                
                tour.status = tourData.status;
                if (["upcoming", "open", "closed"].includes(tourData.status)) {
                    tour.isPublished = true;
                } else {
                    tour.isPublished = false;
                }
                await tour.save({ transaction });
                
                // Nếu chỉ cập nhật status thì commit và trả về
                if (Object.keys(tourData).length === 1) {
                    await transaction.commit();
                    return tour;
                }
            }

            // Cập nhật thông tin chi tiết (chỉ cho phép khi ở draft)
            if (tour.status !== "draft") {
                throw new Error("ONLY_DRAFT_CAN_BE_UPDATED");
            }

            // Cập nhật thông tin chính của Tour (trừ status và createdBy)
            const { status, createdBy, itineraryDays, ...updatableData } = tourData;
            await tour.update(updatableData, { transaction });

            // Cập nhật các ngày lịch trình nếu được gửi lên
            if (itineraryDays) {
                await TourItineraryDay.destroy({ where: { tourId: id }, transaction });
                const itineraries = itineraryDays.map((day, idx) => ({
                    tourId: id,
                    dayNumber: idx + 1,
                    title: day.title || `Ngày ${idx + 1}`,
                    mainActivity: day.mainActivity || day.title || "",
                    meals: day.meals ? (typeof day.meals === 'string' ? day.meals : Object.keys(day.meals).filter(k => day.meals[k]).join(", ")) : "",
                    description: day.description || ""
                }));
                await TourItineraryDay.bulkCreate(itineraries, { transaction });
            }

            await transaction.commit();
            
            // Lấy lại thông tin đầy đủ sau cập nhật
            return await operatorRepository.findTourByIdAndOperator(id, operatorId);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async getScheduleDetail(scheduleId, operatorId) {
        const schedule = await operatorRepository.findScheduleByIdAndOperator(scheduleId, operatorId);
        if (!schedule) {
            throw new Error("SCHEDULE_NOT_FOUND");
        }
        return schedule;
    }

    async getAvailableGuides(scheduleId, operatorId, pageQuery, limitQuery) {
        const page = parseInt(pageQuery) || 1;
        const limit = parseInt(limitQuery) || 4;
        const offset = (page - 1) * limit;

        const targetSchedule = await operatorRepository.findScheduleByIdAndOperator(scheduleId, operatorId);
        if (!targetSchedule) {
            throw new Error("SCHEDULE_NOT_FOUND");
        }

        const { departureDate, returnDate } = targetSchedule;
        const guides = await operatorRepository.findActiveGuides();

        const guidesWithOverlapStatus = [];
        for (let guide of guides) {
            const overlappingAssignments = await operatorRepository.countOverlappingAssignments(
                guide.id,
                departureDate,
                returnDate
            );

            guidesWithOverlapStatus.push({
                id: guide.id,
                fullName: guide.fullName,
                email: guide.email,
                phone: guide.phone,
                avatarUrl: guide.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256",
                isFree: overlappingAssignments === 0
            });
        }

        guidesWithOverlapStatus.sort((a, b) => b.isFree - a.isFree);
        const paginatedGuides = guidesWithOverlapStatus.slice(offset, offset + limit);

        return {
            totalGuides: guidesWithOverlapStatus.length,
            totalPages: Math.ceil(guidesWithOverlapStatus.length / limit),
            currentPage: page,
            guides: paginatedGuides
        };
    }

    async assignGuide(scheduleId, guideId, operatorId) {
        const schedule = await operatorRepository.findScheduleByIdAndOperator(scheduleId, operatorId);
        if (!schedule) {
            throw new Error("SCHEDULE_NOT_FOUND");
        }

        await operatorRepository.deleteAssignmentsBySchedule(scheduleId);

        const assignment = await operatorRepository.createAssignment({
            scheduleId,
            guideId,
            assignedBy: operatorId,
            assignedAt: new Date()
        });

        return assignment;
    }

    async getHardApprovalTours(operatorId) {
        const bookings = await operatorRepository.findHardApprovalToursByOperator(operatorId);

        const tourGroups = {};
        for (let b of bookings) {
            const tour = b.schedule.tour;
            const tourId = tour.id;
            if (!tourGroups[tourId]) {
                tourGroups[tourId] = {
                    id: tourId,
                    tourId: tour.tourCode,
                    title: tour.title,
                    thumbnail: tour.thumbnailUrl || "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=80&h=60&fit=crop",
                    departureDate: b.schedule.departureDate ? new Date(b.schedule.departureDate).toLocaleDateString("vi-VN") : "N/A",
                    pendingCustomers: 0,
                    avatars: [],
                    status: "pending"
                };
            }
            tourGroups[tourId].pendingCustomers += b.participants.length;
            b.participants.forEach(p => {
                const parts = p.fullName.trim().split(" ");
                const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
                if (tourGroups[tourId].avatars.length < 3 && !tourGroups[tourId].avatars.includes(initials)) {
                    tourGroups[tourId].avatars.push(initials);
                }
            });
        }

        return Object.values(tourGroups);
    }

    async getTourParticipants(tourId, operatorId, query) {
        const { search, type } = query;
        const participants = await operatorRepository.findTourParticipantsByOperator(tourId, operatorId, { search, type });

        return participants.map(p => ({
            id: p.id,
            fullName: p.fullName,
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString("vi-VN") : "N/A",
            participantType: p.participantType === "adult" ? "Người lớn" : p.participantType === "child" ? "Trẻ em" : "Em bé",
            bookingCode: p.booking.bookingCode,
            bookingId: p.booking.id,
            leadCustomer: p.booking.customer?.fullName || "Khách vãng lai",
            leadPhone: p.booking.customer?.phone || "N/A",
            status: p.booking.status
        }));
    }

    async getBookingVerification(bookingId, operatorId) {
        const booking = await operatorRepository.findBookingVerificationByOperator(bookingId, operatorId);
        if (!booking) {
            throw new Error("BOOKING_NOT_FOUND");
        }

        const leadParticipant = booking.participants.find(p => p.isLead) || booking.participants[0];
        const companions = booking.participants.filter(p => p.id !== leadParticipant?.id);

        const statusLabelMap = {
            paid: "Đã thanh toán 100%",
            pending_payment: "Chờ thanh toán",
            pending_approval: "Chờ duyệt hồ sơ",
            cancelled: "Đã hủy",
            refunded: "Đã hoàn tiền"
        };

        return {
            bookingCode: booking.bookingCode,
            tourName: booking.schedule.tour.title,
            customer: {
                fullName: booking.customer.fullName,
                dateOfBirth: booking.customer.dateOfBirth ? new Date(booking.customer.dateOfBirth).toLocaleDateString("vi-VN") : "N/A",
                phone: booking.customer.phone || "N/A",
                email: booking.customer.email,
                address: booking.customer.address || "N/A"
            },
            booking: {
                registeredDate: booking.bookedAt ? new Date(booking.bookedAt).toLocaleDateString("vi-VN") : "N/A",
                totalGuests: `${booking.participants.length} người`,
                paymentStatus: statusLabelMap[booking.status] || booking.status,
            },
            documents: {
                status: booking.status === "pending_approval" ? "pending" : booking.status === "paid" ? "approved" : "rejected",
                frontImage: leadParticipant?.cccdFrontUrl || "https://images.unsplash.com/photo-1618044619888-009e412ff12a?w=400&h=250&fit=crop",
                backImage: leadParticipant?.cccdBackUrl || "https://images.unsplash.com/photo-1618044733555-e6f1d85e4dcb?w=400&h=250&fit=crop",
            },
            companions: companions.map(c => ({
                name: c.fullName,
                dateOfBirth: c.dateOfBirth ? new Date(c.dateOfBirth).toLocaleDateString("vi-VN") : "N/A",
                type: c.participantType === "adult" ? "Người lớn" : c.participantType === "child" ? "Trẻ em" : "Em bé"
            })),
            customerNote: booking.cancellationReason || "Đăng ký tham gia tour trekking độ khó Hard. Hồ sơ CCCD đã được đính kèm."
        };
    }

    async approveBooking(bookingId, operatorId) {
        const booking = await operatorRepository.findBookingByPkAndOperator(bookingId, operatorId);
        if (!booking) {
            throw new Error("BOOKING_NOT_FOUND");
        }

        booking.status = "paid";
        await booking.save();
        return booking;
    }

    async rejectBooking(bookingId, reason, operatorId) {
        const booking = await operatorRepository.findBookingByPkAndOperator(bookingId, operatorId);
        if (!booking) {
            throw new Error("BOOKING_NOT_FOUND");
        }

        booking.status = "cancelled";
        booking.cancellationReason = reason || "Giấy tờ xác minh không hợp lệ.";
        await booking.save();

        const schedule = await db.TourSchedule.findByPk(booking.scheduleId);
        if (schedule) {
            const count = await operatorRepository.countParticipantsByBooking(bookingId);
            schedule.registered = Math.max(0, schedule.registered - count);
            await schedule.save();
        }

        return booking;
    }

    async getPendingBookings(operatorId) {
        const bookings = await operatorRepository.findPendingBookingsByOperator(operatorId);

        return bookings.map(b => ({
            id: b.id,
            bookingCode: b.bookingCode,
            customerName: b.customer?.fullName || "N/A",
            customerPhone: b.customer?.phone || "N/A",
            tourTitle: b.schedule?.tour?.title || "N/A",
            difficulty: b.schedule?.tour?.difficulty || "normal",
            departureDate: b.schedule?.departureDate ? new Date(b.schedule.departureDate).toLocaleDateString("vi-VN") : "N/A",
            totalGuests: b.participants.length,
            totalPrice: parseFloat(b.finalPrice),
            status: b.status
        }));
    }

    async searchCustomer(search, operatorId) {
        const customer = await operatorRepository.findCustomerByOperator(search, operatorId);
        if (!customer) {
            throw new Error("CUSTOMER_NOT_FOUND");
        }

        return {
            id: customer.id,
            fullName: customer.fullName,
            email: customer.email,
            phone: customer.phone,
            tier: "Khách hàng thông thường"
        };
    }

    async getCustomerBookings(customerId, operatorId) {
        const bookings = await operatorRepository.findCustomerBookingsByOperator(customerId, operatorId);

        return bookings.map(b => ({
            id: b.id,
            code: b.bookingCode,
            tourTitle: b.schedule.tour.title,
            thumbnail: b.schedule.tour.thumbnailUrl || "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=80&h=60&fit=crop",
            departureDate: b.schedule.departureDate ? new Date(b.schedule.departureDate).toLocaleDateString("vi-VN") : "N/A",
            totalPrice: parseFloat(b.finalPrice),
            status: b.status
        }));
    }

    async getRefundEstimate(bookingId, operatorId) {
        const booking = await operatorRepository.findBookingByPkAndOperator(bookingId, operatorId);
        if (!booking) {
            throw new Error("BOOKING_NOT_FOUND");
        }

        const depDate = new Date(booking.schedule.departureDate);
        const today = new Date();
        const timeDiff = depDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        const originalAmount = parseFloat(booking.finalPrice);
        let refundAmount = 0;
        let cancelFee = 0;
        let refundPolicy = "";

        if (daysDiff > 15) {
            refundAmount = originalAmount;
            cancelFee = 0;
            refundPolicy = "Hủy trước ngày khởi hành > 15 ngày: Hoàn tiền 100% (Phí hủy 0%)";
        } else if (daysDiff >= 7 && daysDiff <= 15) {
            refundAmount = originalAmount * 0.5;
            cancelFee = originalAmount * 0.5;
            refundPolicy = "Hủy trước ngày khởi hành từ 7 đến 15 ngày: Hoàn tiền 50% (Phí hủy 50%)";
        } else {
            refundAmount = 0;
            cancelFee = originalAmount;
            refundPolicy = "Hủy trước ngày khởi hành dưới 7 ngày: Không hoàn tiền (Phí hủy 100%)";
        }

        return {
            bookingId,
            originalAmount,
            cancelFee,
            refundAmount,
            refundPolicy
        };
    }

    async cancelBooking(bookingId, reason, operatorId) {
        const booking = await operatorRepository.findBookingByPkAndOperator(bookingId, operatorId);
        if (!booking) {
            throw new Error("BOOKING_NOT_FOUND");
        }

        const depDate = new Date(booking.schedule.departureDate);
        const today = new Date();
        const timeDiff = depDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        const originalAmount = parseFloat(booking.finalPrice);
        let refundAmount = 0;
        if (daysDiff > 15) {
            refundAmount = originalAmount;
        } else if (daysDiff >= 7 && daysDiff <= 15) {
            refundAmount = originalAmount * 0.5;
        } else {
            refundAmount = 0;
        }

        booking.status = "cancelled";
        booking.cancellationReason = reason || "Hủy bởi operator điều hành.";
        booking.refundAmount = refundAmount;
        await booking.save();

        const schedule = await db.TourSchedule.findByPk(booking.scheduleId);
        if (schedule) {
            const count = await operatorRepository.countParticipantsByBooking(bookingId);
            schedule.registered = Math.max(0, schedule.registered - count);
            await schedule.save();
        }

        return { refundAmount };
    }
}

export default new OperatorService();
