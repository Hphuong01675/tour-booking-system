// Path: backend/src/validations/tour.validation.js
"use strict";

class TourValidation {
    validateCreateTour = (req, res, next) => {
        try {
            const {
                title,
                difficulty,
                durationDays,
                durationNights,
                departureLocation,
                destination,
                basePrice,
                status,
                itineraryDays,
                schedules,
                information
            } = req.body;

            // 1. Validate General Info
            if (!title || typeof title !== "string" || title.trim().length < 3 || title.length > 200) {
                return res.status(400).json({
                    error: "Tên tour phải từ 3 đến 200 ký tự.",
                    code: "INVALID_TOUR_TITLE"
                });
            }

            if (!difficulty || !["normal", "hard"].includes(difficulty)) {
                return res.status(400).json({
                    error: "Cấp độ tour không hợp lệ (chỉ chấp nhận 'normal' hoặc 'hard').",
                    code: "INVALID_TOUR_DIFFICULTY"
                });
            }

            const days = parseInt(durationDays);
            if (isNaN(days) || days < 1) {
                return res.status(400).json({
                    error: "Số ngày phải là số nguyên lớn hơn hoặc bằng 1.",
                    code: "INVALID_DURATION_DAYS"
                });
            }

            const nights = parseInt(durationNights);
            if (isNaN(nights) || nights < 0) {
                return res.status(400).json({
                    error: "Số đêm phải là số nguyên không âm.",
                    code: "INVALID_DURATION_NIGHTS"
                });
            }

            if (Math.abs(days - nights) > 1) {
                return res.status(400).json({
                    error: "Số ngày và số đêm không hợp lệ (chỉ được lệch nhau tối đa 1 đơn vị).",
                    code: "INVALID_DURATION_MISMATCH"
                });
            }

            if (!departureLocation || typeof departureLocation !== "string" || departureLocation.trim().length < 2) {
                return res.status(400).json({
                    error: "Điểm xuất phát phải từ 2 ký tự trở lên.",
                    code: "INVALID_DEPARTURE_LOCATION"
                });
            }

            if (!destination || typeof destination !== "string" || destination.trim().length < 2) {
                return res.status(400).json({
                    error: "Điểm đến phải từ 2 ký tự trở lên.",
                    code: "INVALID_DESTINATION"
                });
            }

            const price = parseFloat(basePrice);
            if (isNaN(price) || price < 0) {
                return res.status(400).json({
                    error: "Giá cơ bản phải là số không âm.",
                    code: "INVALID_BASE_PRICE"
                });
            }

            if (!status || !["draft", "pending"].includes(status)) {
                return res.status(400).json({
                    error: "Trạng thái tour không hợp lệ (chỉ chấp nhận 'draft' hoặc 'pending').",
                    code: "INVALID_TOUR_STATUS"
                });
            }

            // 2. Validate Itinerary Days
            if (itineraryDays !== undefined) {
                if (!Array.isArray(itineraryDays)) {
                    return res.status(400).json({
                        error: "Lịch trình chi tiết phải là một danh sách.",
                        code: "INVALID_ITINERARY"
                    });
                }

                for (let i = 0; i < itineraryDays.length; i++) {
                    const day = itineraryDays[i];
                    if (!day.title || typeof day.title !== "string" || day.title.trim().length === 0) {
                        return res.status(400).json({
                            error: `Tiêu đề ngày thứ ${i + 1} không được để trống.`,
                            code: "INVALID_ITINERARY_DAY_TITLE"
                        });
                    }

                    // Validate itinerary locations
                    if (day.locations !== undefined) {
                        if (!Array.isArray(day.locations)) {
                            return res.status(400).json({
                                error: `Danh sách địa điểm tham quan ngày ${i + 1} không hợp lệ.`,
                                code: "INVALID_ITINERARY_LOCATIONS"
                            });
                        }
                        for (let j = 0; j < day.locations.length; j++) {
                            const loc = day.locations[j];
                            if (!loc.name || typeof loc.name !== "string" || loc.name.trim().length === 0) {
                                return res.status(400).json({
                                    error: `Tên địa điểm thứ ${j + 1} trong ngày ${i + 1} không được để trống.`,
                                    code: "INVALID_LOCATION_NAME"
                                });
                            }
                            const lat = parseFloat(loc.latitude);
                            const lng = parseFloat(loc.longitude);
                            if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
                                return res.status(400).json({
                                    error: `Tọa độ địa điểm "${loc.name}" trong ngày ${i + 1} không hợp lệ.`,
                                    code: "INVALID_LOCATION_COORDINATES"
                                });
                            }
                        }
                    }

                    // Validate itinerary items
                    if (day.items !== undefined) {
                        if (!Array.isArray(day.items)) {
                            return res.status(400).json({
                                                    error: `Danh sách hoạt động ngày ${i + 1} không hợp lệ.`,
                                code: "INVALID_ITINERARY_ITEMS"
                            });
                        }
                        for (let j = 0; j < day.items.length; j++) {
                            const item = day.items[j];
                            if (item.title && typeof item.title !== "string") {
                                return res.status(400).json({
                                    error: `Tiêu đề hoạt động thứ ${j + 1} trong ngày ${i + 1} phải là chuỗi ký tự.`,
                                    code: "INVALID_ITEM_TITLE"
                                });
                            }
                            if (item.activityTime && !/^([0-9]{2}:[0-9]{2})(:[0-9]{2})?$/.test(item.activityTime)) {
                                return res.status(400).json({
                                    error: `Thời gian hoạt động "${item.title || j + 1}" trong ngày ${i + 1} không đúng định dạng (HH:MM).`,
                                    code: "INVALID_ITEM_TIME"
                                });
                            }
                        }
                    }
                }
            }

            // 3. Validate Schedules
            if (schedules !== undefined) {
                if (!Array.isArray(schedules)) {
                    return res.status(400).json({
                        error: "Lịch khởi hành phải là một danh sách.",
                        code: "INVALID_SCHEDULES"
                    });
                }

                for (let i = 0; i < schedules.length; i++) {
                    const sch = schedules[i];
                    if (!sch.departureDate || isNaN(Date.parse(sch.departureDate))) {
                        return res.status(400).json({
                            error: `Ngày khởi hành ở lịch thứ ${i + 1} không hợp lệ.`,
                            code: "INVALID_SCHEDULE_DEPARTURE_DATE"
                        });
                    }
                    if (!sch.returnDate || isNaN(Date.parse(sch.returnDate))) {
                        return res.status(400).json({
                            error: `Ngày kết thúc ở lịch thứ ${i + 1} không hợp lệ.`,
                            code: "INVALID_SCHEDULE_RETURN_DATE"
                        });
                    }
                    const dep = new Date(sch.departureDate);
                    const ret = new Date(sch.returnDate);
                    if (dep > ret) {
                        return res.status(400).json({
                            error: `Ngày kết thúc không được trước ngày khởi hành ở lịch thứ ${i + 1}.`,
                            code: "INVALID_SCHEDULE_DATES"
                        });
                    }
                    
                    const diffTime = Math.abs(ret - dep);
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays !== days - 1) {
                        return res.status(400).json({
                            error: `Ngày đi và ngày về ở lịch thứ ${i + 1} không khớp với tổng số ngày của tour (${days} ngày).`,
                            code: "INVALID_SCHEDULE_DURATION_MISMATCH"
                        });
                    }
                    const schPrice = parseFloat(sch.price);
                    if (isNaN(schPrice) || schPrice < 0) {
                        return res.status(400).json({
                            error: `Giá của lịch thứ ${i + 1} phải là số không âm.`,
                            code: "INVALID_SCHEDULE_PRICE"
                        });
                    }
                    const cap = parseInt(sch.maxCapacity);
                    if (isNaN(cap) || cap < 1) {
                        return res.status(400).json({
                            error: `Số chỗ tối đa ở lịch thứ ${i + 1} phải là số nguyên lớn hơn hoặc bằng 1.`,
                            code: "INVALID_SCHEDULE_CAPACITY"
                        });
                    }
                }
            }

            // 4. Validate Information Categories
            if (information !== undefined) {
                if (!Array.isArray(information)) {
                    return res.status(400).json({
                        error: "Thông tin bổ sung phải là một danh sách.",
                        code: "INVALID_INFORMATION"
                    });
                }
                for (let i = 0; i < information.length; i++) {
                    const info = information[i];
                    if (!info.categoryCode || typeof info.categoryCode !== "string") {
                        return res.status(400).json({
                            error: `Thông tin bổ sung thứ ${i + 1} thiếu mã danh mục.`,
                            code: "INVALID_INFO_CATEGORY"
                        });
                    }
                    if (info.content && typeof info.content !== "string") {
                        return res.status(400).json({
                            error: `Nội dung thông tin bổ sung thứ ${i + 1} phải là chuỗi ký tự.`,
                            code: "INVALID_INFO_CONTENT"
                        });
                    }
                }
            }

            next();
        } catch (err) {
            console.error("Error in validateCreateTour middleware:", err);
            return res.status(500).json({
                error: "Đã xảy ra lỗi hệ thống khi kiểm tra dữ liệu.",
                code: "VALIDATION_MIDDLEWARE_ERROR"
            });
        }
    };
}

export default new TourValidation();
