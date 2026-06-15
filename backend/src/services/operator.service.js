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

    generateSlug(title) {
        let slug = title.toLowerCase();
        
        // Convert Vietnamese characters to ASCII
        slug = slug.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a");
        slug = slug.replace(/[èéẹẻẽêềếệểễ]/g, "e");
        slug = slug.replace(/[ìíịỉĩ]/g, "i");
        slug = slug.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o");
        slug = slug.replace(/[ùúụủũưừứựửữ]/g, "u");
        slug = slug.replace(/[ỳýỵỷỹ]/g, "y");
        slug = slug.replace(/đ/g, "d");
        
        // Remove special characters, keep only letters, numbers, and dashes
        slug = slug.replace(/[^a-z0-9\s-]/g, "");
        
        // Replace multiple spaces or dashes with a single dash
        slug = slug.replace(/[\s-]+/g, "-");
        
        // Trim leading/trailing dashes
        slug = slug.trim().replace(/^-+|-+$/g, "");
        
        return slug;
    }

    async createTour(operatorId, tourData) {
        const transaction = await db.sequelize.transaction();
        try {
            // 1. Generate tour_code
            const tourCode = `TOUR-${Date.now()}`;

            // 2. Generate slug
            let baseSlug = this.generateSlug(tourData.title);
            let slug = baseSlug;
            let slugExists = await db.Tour.findOne({ where: { slug } });
            let counter = 1;
            while (slugExists) {
                slug = `${baseSlug}-${counter}`;
                slugExists = await db.Tour.findOne({ where: { slug } });
                counter++;
            }

            // 3. Create Tour
            const tour = await db.Tour.create({
                createdBy: operatorId,
                tourCode,
                title: tourData.title,
                slug,
                description: tourData.description || "",
                highlights: tourData.highlights || "",
                departureLocation: tourData.departureLocation,
                destination: tourData.destination,
                difficulty: tourData.difficulty || "normal",
                status: tourData.status || "draft",
                durationDays: parseInt(tourData.durationDays) || 1,
                durationNights: parseInt(tourData.durationNights) || 0,
                basePrice: parseFloat(tourData.basePrice) || 0,
                isPublished: tourData.status === "pending",
                thumbnailUrl: tourData.thumbnailUrl || ""
            }, { transaction });

            // 4. Create Schedules
            if (tourData.schedules && tourData.schedules.length > 0) {
                const schedulesData = tourData.schedules.map((sch, i) => ({
                    tourId: tour.id,
                    scheduleCode: `SCH-${tourCode.substring(tourCode.length - 6)}-${String(i + 1).padStart(3, "0")}`,
                    departureDate: new Date(sch.departureDate),
                    returnDate: new Date(sch.returnDate),
                    price: parseFloat(sch.price) || 0,
                    maxCapacity: parseInt(sch.maxCapacity) || 0,
                    registered: 0,
                    status: "open"
                }));
                await db.TourSchedule.bulkCreate(schedulesData, { transaction });
            }

            // 5. Create Itinerary Days, Locations, Items
            if (tourData.itineraryDays && tourData.itineraryDays.length > 0) {
                for (let i = 0; i < tourData.itineraryDays.length; i++) {
                    const dayData = tourData.itineraryDays[i];
                    
                    // Format meals
                    let mealsStr = "";
                    if (dayData.meals) {
                        if (typeof dayData.meals === "object") {
                            mealsStr = Object.keys(dayData.meals)
                                .filter(k => dayData.meals[k])
                                .map(k => k === "breakfast" ? "Sáng" : k === "lunch" ? "Trưa" : "Tối")
                                .join(", ");
                        } else {
                            mealsStr = dayData.meals;
                        }
                    }

                    const day = await db.TourItineraryDay.create({
                        tourId: tour.id,
                        dayNumber: i + 1,
                        title: dayData.title || `Ngày ${i + 1}`,
                        meals: mealsStr,
                        mainActivity: dayData.mainActivity || dayData.title || "",
                        description: dayData.description || "",
                        imageUrl: dayData.imageUrl || ""
                    }, { transaction });

                    // Create Locations under this day
                    if (dayData.locations && dayData.locations.length > 0) {
                        const locationsData = dayData.locations.map((loc, idx) => ({
                            itineraryDayId: day.id,
                            name: loc.name,
                            description: loc.description || "",
                            latitude: parseFloat(loc.latitude) || 0,
                            longitude: parseFloat(loc.longitude) || 0,
                            imageUrl: loc.imageUrl || "",
                            visitOrder: parseInt(loc.visitOrder) || (idx + 1)
                        }));
                        await db.TourItineraryLocation.bulkCreate(locationsData, { transaction });
                    }

                    // Create Items under this day
                    if (dayData.items && dayData.items.length > 0) {
                        const itemsData = dayData.items.map((item, idx) => ({
                            itineraryDayId: day.id,
                            title: item.title || "",
                            description: item.description || "",
                            activityTime: item.activityTime || null,
                            sortOrder: parseInt(item.sortOrder) || idx
                        }));
                        await db.TourItineraryItem.bulkCreate(itemsData, { transaction });
                    }
                }
            }

            // 6. Create Tour Information
            if (tourData.information && tourData.information.length > 0) {
                // Fetch categories to map code to id
                const categories = await db.TourInformationCategory.findAll({ transaction });
                const categoryMap = {};
                categories.forEach(cat => {
                    categoryMap[cat.code] = cat.id;
                });

                const infoData = [];
                tourData.information.forEach((info, idx) => {
                    const categoryId = categoryMap[info.categoryCode];
                    if (categoryId && info.content && info.content.trim().length > 0) {
                        infoData.push({
                            tourId: tour.id,
                            categoryId,
                            content: info.content,
                            sortOrder: idx + 1
                        });
                    }
                });

                if (infoData.length > 0) {
                    await db.TourInformation.bulkCreate(infoData, { transaction });
                }
            }

            await transaction.commit();

            // Return full tour details
            return await operatorRepository.findTourByIdAndOperator(tour.id, operatorId);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }



    async uploadTourImages(tourId, operatorId, files) {
        const tour = await operatorRepository.findTourByPkAndOperator(tourId, operatorId);
        if (!tour) {
            throw new Error("TOUR_NOT_FOUND");
        }

        const cloudinary = require("../config/cloudinary").default;
        const uploadToCloudinary = (fileBuffer, folder, publicId) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder,
                        public_id: publicId,
                        resource_type: "image"
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url);
                    }
                );
                stream.end(fileBuffer);
            });
        };

        const folder = `Home/Images/tours/${tourId}`;

        // 1. Upload in parallel to Cloudinary
        const uploadTasks = files.map(async (file) => {
            const fieldname = file.fieldname;
            let publicId = "";

            if (fieldname === "thumbnail") {
                publicId = "thumbnail";
            } 
            else if (fieldname === "images") {
                const imgIndex = Date.now() + Math.floor(Math.random() * 1000);
                publicId = `gallery_${imgIndex}`;
            } 
            else if (fieldname.startsWith("dayImage_")) {
                const parts = fieldname.split("_");
                const dayNum = parseInt(parts[1]);
                publicId = `day_${dayNum}`;
            } 
            else if (fieldname.startsWith("locationImage_")) {
                const parts = fieldname.split("_");
                const dayNum = parseInt(parts[1]);
                const visitOrd = parseInt(parts[2]);
                publicId = `day_${dayNum}_loc_${visitOrd}`;
            }

            const url = await uploadToCloudinary(file.buffer, folder, publicId);
            return { fieldname, url };
        });

        const uploadResults = await Promise.all(uploadTasks);

        // 2. Open transaction and update database rows sequentially
        const transaction = await db.sequelize.transaction();
        try {
            const itineraryDays = await db.TourItineraryDay.findAll({
                where: { tourId },
                include: [{ model: db.TourItineraryLocation, as: "locations" }],
                transaction
            });

            for (const { fieldname, url } of uploadResults) {
                if (fieldname === "thumbnail") {
                    tour.thumbnailUrl = url;
                    await tour.save({ transaction });
                } 
                else if (fieldname === "images") {
                    await db.TourImage.create({
                        tourId,
                        imageUrl: url,
                        sortOrder: 0
                    }, { transaction });
                } 
                else if (fieldname.startsWith("dayImage_")) {
                    const parts = fieldname.split("_");
                    const dayNum = parseInt(parts[1]);
                    const day = itineraryDays.find(d => d.dayNumber === dayNum);
                    if (day) {
                        day.imageUrl = url;
                        await day.save({ transaction });
                    }
                } 
                else if (fieldname.startsWith("locationImage_")) {
                    const parts = fieldname.split("_");
                    const dayNum = parseInt(parts[1]);
                    const visitOrd = parseInt(parts[2]);
                    
                    const day = itineraryDays.find(d => d.dayNumber === dayNum);
                    if (day && day.locations) {
                        const loc = day.locations.find(l => l.visitOrder === visitOrd);
                        if (loc) {
                            loc.imageUrl = url;
                            await loc.save({ transaction });
                        }
                    }
                }
            }

            await transaction.commit();
            return await operatorRepository.findTourByIdAndOperator(tourId, operatorId);
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async getTourBySlug(slug, operatorId) {
        const tour = await operatorRepository.findTourBySlugAndOperator(slug, operatorId);
        if (!tour) {
            throw new Error("TOUR_NOT_FOUND");
        }
        return tour;
    }

    async getInfoCategories() {
        return await operatorRepository.findInfoCategories();
    }

    async deleteTourImage(tourId, operatorId, imageId) {
        const tour = await operatorRepository.findTourByPkAndOperator(tourId, operatorId);
        if (!tour) {
            throw new Error("TOUR_NOT_FOUND");
        }
        if (tour.status !== "draft") {
            throw new Error("ONLY_DRAFT_CAN_BE_UPDATED");
        }

        const image = await db.TourImage.findOne({
            where: { id: imageId, tourId: tour.id }
        });
        if (!image) {
            throw new Error("IMAGE_NOT_FOUND");
        }
        
        await image.destroy();
    }
}

export default new OperatorService();
