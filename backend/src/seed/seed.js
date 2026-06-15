// Path: backend/src/seed/seed.js
import db from "../models";

export const seedDatabase = async () => {
    try {
        const {
            User,
            Tour,
            TourSchedule,
            TourItineraryDay,
            TourAssignment,
            Booking,
            Participant,
            Conversation,
            Message
        } = db;

        // Check if Guide user exists
        const guideCount = await User.count({ where: { role: "guide" } });
        if (guideCount > 0) {
            console.log("Database already has seed data. Skipping seeding.");
            return;
        }

        console.log("Seeding database with realistic MySQL data...");

        // 1. Create Users (Guides, Operators, Customers)
        await User.create({
            id: "guide-1",
            fullName: "Lê Quang Huy",
            email: "lequanghuy@chip3chip.com",
            passwordHash: "hashedpassword",
            phone: "+84 912 999 888",
            role: "guide",
            dateOfBirth: new Date("1990-05-15"),
            address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
            isActive: true,
        });

        await User.create({
            id: "guide-2",
            fullName: "Trần Văn Khánh",
            email: "trankhanh@chip3chip.com",
            passwordHash: "hashedpassword",
            phone: "+84 909 333 444",
            role: "guide",
            dateOfBirth: new Date("1993-08-20"),
            address: "456 Trần Hưng Đạo, Quận 5, TP. Hồ Chí Minh",
            avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
            isActive: true,
        });

        await User.create({
            id: "guide-3",
            fullName: "Phạm Thị Hoa",
            email: "phamhoa@chip3chip.com",
            passwordHash: "hashedpassword",
            phone: "+84 988 555 666",
            role: "guide",
            dateOfBirth: new Date("1995-12-02"),
            address: "789 Láng Hạ, Đống Đa, Hà Nội",
            avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b977?w=150&h=150&fit=crop",
            isActive: true,
        });

        await User.create({
            id: "operator-1",
            fullName: "Nguyễn Minh Tuấn",
            email: "minhtuan.nguyen@chip3chip.com",
            passwordHash: "hashedpassword",
            phone: "+84 908 123 456",
            role: "operator",
            isActive: true,
        });

        // Customers
        await User.create({
            id: "customer-1",
            fullName: "Nguyễn Thành Trung",
            email: "trung@gmail.com",
            passwordHash: "hashedpassword",
            phone: "0901234567",
            role: "customer",
        });

        await User.create({
            id: "customer-2",
            fullName: "Lê Thị Thu Hà",
            email: "ha@gmail.com",
            passwordHash: "hashedpassword",
            phone: "0987654321",
            role: "customer",
        });

        await User.create({
            id: "customer-3",
            fullName: "Nguyễn Văn An",
            email: "an@gmail.com",
            passwordHash: "hashedpassword",
            phone: "0903112233",
            role: "customer",
        });

        await User.create({
            id: "customer-4",
            fullName: "Lê Hồng Phúc",
            email: "phuc@gmail.com",
            passwordHash: "hashedpassword",
            phone: "0944556677",
            role: "customer",
        });

        await User.create({
            id: "customer-5",
            fullName: "Vũ Nam Khánh",
            email: "khanh@gmail.com",
            passwordHash: "hashedpassword",
            phone: "0977889900",
            role: "customer",
        });

        await User.create({
            id: "customer-6",
            fullName: "Phạm Minh Khang",
            email: "khang@gmail.com",
            passwordHash: "hashedpassword",
            phone: "0901112222",
            role: "customer",
        });

        await User.create({
            id: "customer-7",
            fullName: "Đỗ Hoàng Nam",
            email: "namdh@gmail.com",
            passwordHash: "hashedpassword",
            phone: "0966777888",
            role: "customer",
        });

        // 2. Create Tours
        // Tour 1: Open, Normal
        await Tour.create({
            id: "tour-1",
            tourCode: "GE-VN-1024",
            title: "Kỳ nghỉ Thượng hạng: Đà Nẵng - Hội An - Huế",
            slug: "ky-nghi-thuong-hang-da-nang-hoi-an-hue",
            description: "Quản lý lịch trình, điều phối khách hàng và theo dõi tiến độ đoàn du lịch miền Trung.",
            highlights: "Đà Nẵng - Hội An - Cố đô Huế (5 Ngày 4 Đêm)",
            departureLocation: "Sài Gòn",
            destination: "Đà Nẵng - Hội An - Cố đô Huế",
            basePrice: 15000000.0,
            durationDays: 5,
            durationNights: 4,
            thumbnailUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=250&fit=crop",
            isPublished: true,
            status: "open",
            createdBy: "operator-1",
        });

        // Tour 2: Open, Hard (Requires Verification)
        await Tour.create({
            id: "tour-2",
            tourCode: "GE-VN-7829",
            title: "Chinh phục Fansipan - Nóc nhà Đông Dương",
            slug: "chinh-phuc-fansipan-noc-nha-dong-duong",
            description: "Tour trekking mạo hiểm chinh phục đỉnh Fansipan hùng vĩ cao 3.143m.",
            highlights: "Trekking 2 Ngày 1 Đêm, Đón bình minh trên đỉnh Fansipan",
            departureLocation: "Hà Nội",
            destination: "Lào Cai - Sapa - Fansipan",
            basePrice: 4500000.0,
            durationDays: 2,
            durationNights: 1,
            difficulty: "hard",
            thumbnailUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=250&fit=crop",
            isPublished: true,
            status: "open",
            createdBy: "operator-1",
        });

        // Tour 3: Open, Hard (Requires Verification)
        await Tour.create({
            id: "tour-3",
            tourCode: "GE-VN-3310",
            title: "Trekking Hang Sơn Đoòng - Hang động lớn nhất thế giới",
            slug: "trekking-hang-son-doong",
            description: "Hành trình thám hiểm hang động lớn nhất thế giới nằm sâu trong lòng Vườn quốc gia Phong Nha - Kẻ Bàng.",
            highlights: "Khám phá thế giới ngầm, cắm trại trong lòng hang",
            departureLocation: "Đồng Hới",
            destination: "Quảng Bình - Phong Nha",
            basePrice: 65000000.0,
            durationDays: 6,
            durationNights: 5,
            difficulty: "hard",
            thumbnailUrl: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=250&fit=crop",
            isPublished: true,
            status: "open",
            createdBy: "operator-1",
        });

        // Tour 4: Pending approval
        await Tour.create({
            id: "tour-4",
            tourCode: "GE-VN-4491",
            title: "Vượt thác Dam B'ri mạo hiểm",
            slug: "vuot-thac-dam-bri-mao-hiem",
            description: "Trải nghiệm vượt thác nước Dam B'ri hùng vĩ bằng dây tử thần.",
            highlights: "Vượt thác nước 70m, cắm trại bìa rừng Lâm Đồng",
            departureLocation: "Đà Lạt",
            destination: "Lâm Đồng - Bảo Lộc",
            basePrice: 5800000.0,
            durationDays: 3,
            durationNights: 2,
            difficulty: "hard",
            thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop",
            isPublished: false,
            status: "pending",
            createdBy: "operator-1",
        });

        // Tour 5: Closed, Normal
        await Tour.create({
            id: "tour-5",
            tourCode: "GE-VN-1102",
            title: "Khám phá Cao nguyên đá Hà Giang",
            slug: "kham-pha-cao-nguyen-da-ha-giang",
            description: "Tour trải nghiệm đèo Mã Pì Lèng, cột cờ Lũng Cú và văn hóa đồng bào H'Mông.",
            highlights: "Hà Giang - Đồng Văn - Mèo Vạc (3 Ngày 2 Đêm)",
            departureLocation: "Hà Nội",
            destination: "Hà Giang",
            basePrice: 3800000.0,
            durationDays: 3,
            durationNights: 2,
            difficulty: "normal",
            thumbnailUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=250&fit=crop",
            isPublished: true,
            status: "closed",
            createdBy: "operator-1",
        });

        // Tour 6: Draft, Normal
        await Tour.create({
            id: "tour-6",
            tourCode: "GE-VN-9999",
            title: "Tour Đà Lạt: Sân Mây Đại Ngàn",
            slug: "tour-da-lat-san-may-dai-ngan",
            description: "Bản nháp tour nghỉ dưỡng lãng mạn tại Đà Lạt săn mây sớm.",
            highlights: "Săn mây đồi chè Cầu Đất, check-in dinh Bảo Đại",
            departureLocation: "Sài Gòn",
            destination: "Lâm Đồng - Đà Lạt",
            basePrice: 3200000.0,
            durationDays: 3,
            durationNights: 2,
            difficulty: "normal",
            thumbnailUrl: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=250&fit=crop",
            isPublished: false,
            status: "draft",
            createdBy: "operator-1",
        });

        // Tour 7: Upcoming, Normal
        await Tour.create({
            id: "tour-7",
            tourCode: "GE-VN-8877",
            title: "Tour Khám phá Phú Quốc: Thiên đường nhiệt đới",
            slug: "tour-kham-pha-phu-quoc",
            description: "Hành trình nghỉ dưỡng 4 ngày 3 đêm tại đảo ngọc Phú Quốc sắp ra mắt.",
            highlights: "Bãi Sao, Sunset Sanato, VinWonders Phú Quốc",
            departureLocation: "Sài Gòn",
            destination: "Kiên Giang - Phú Quốc",
            basePrice: 6800000.0,
            durationDays: 4,
            durationNights: 3,
            difficulty: "normal",
            thumbnailUrl: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=250&fit=crop",
            isPublished: false,
            status: "upcoming",
            createdBy: "operator-1",
        });

        // Tour 8: Cancelled, Normal
        await Tour.create({
            id: "tour-8",
            tourCode: "GE-VN-4433",
            title: "Tour Khám phá Tây Nguyên Động Hoang Sơ",
            slug: "tour-kham-pha-tay-nguyen-dong-hoang-so",
            description: "Tour trải nghiệm cồng chiêng Tây Nguyên và thác nước Dray Nur.",
            highlights: "Thác Dray Nur, Buôn Đôn, Chùa Sắc Tứ Khải Đoan",
            departureLocation: "Sài Gòn",
            destination: "Đắk Lắk - Buôn Ma Thuột",
            basePrice: 5200000.0,
            durationDays: 3,
            durationNights: 2,
            difficulty: "normal",
            thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop",
            isPublished: false,
            status: "cancelled",
            createdBy: "operator-1",
        });

        // 3. Create Itinerary Days
        await TourItineraryDay.bulkCreate([
            {
                id: "it-1-1",
                tourId: "tour-1",
                dayNumber: 1,
                title: "Khởi hành & Biển Mỹ Khê",
                meals: "Trưa, Tối",
                mainActivity: "Đón sân bay & Tắm biển",
                description: "Đón đoàn tại Sân bay Đà Nẵng, dùng bữa trưa đặc sản. Nhận phòng resort và tắm biển Mỹ Khê.",
            },
            {
                id: "it-1-2",
                tourId: "tour-1",
                dayNumber: 2,
                title: "Bà Nà Hills - Cầu Vàng",
                meals: "Sáng, Trưa, Tối",
                mainActivity: "Bà Nà Hills Tour",
                description: "Tham quan KDL Bà Nà Hills, trải nghiệm cáp treo và check-in Cầu Vàng.",
            },
            {
                id: "it-2-1",
                tourId: "tour-2",
                dayNumber: 1,
                title: "Trạm Tôn lên điểm hạ trại 2800m",
                meals: "Trưa, Tối",
                mainActivity: "Trekking leo dốc núi đá rừng trúc",
                description: "Di chuyển bằng xe đến Trạm Tôn, bắt đầu hành trình leo núi, ăn trưa trên đường đi. Nghỉ đêm tại lán trại 2800m.",
            },
            {
                id: "it-2-2",
                tourId: "tour-2",
                dayNumber: 2,
                title: "Chạm đỉnh Fansipan & Xuống núi",
                meals: "Sáng, Trưa",
                mainActivity: "Leo đỉnh đón bình minh & Cáp treo xuống Sapa",
                description: "Dậy sớm leo đỉnh đón bình minh. Chụp ảnh lưu niệm đỉnh 3.143m và đi cáp treo trở về thị trấn Sapa.",
            }
        ]);

        // 4. Create Tour Schedules
        // Schedule 1: Oct 15 - Oct 20 (for Tour 1)
        await TourSchedule.create({
            id: "schedule-1",
            tourId: "tour-1",
            scheduleCode: "SCH-1024-001",
            departureDate: new Date("2026-10-15T08:00:00Z"),
            returnDate: new Date("2026-10-20T17:00:00Z"),
            price: 15000000.0,
            maxCapacity: 20,
            registered: 11,
            status: "open",
        });

        // Schedule 2: Oct 16 - Oct 18 (for Tour 2 - overlap with Schedule 1)
        await TourSchedule.create({
            id: "schedule-2",
            tourId: "tour-2",
            scheduleCode: "SCH-7829-001",
            departureDate: new Date("2026-10-16T06:00:00Z"),
            returnDate: new Date("2026-10-18T18:00:00Z"),
            price: 4500000.0,
            maxCapacity: 15,
            registered: 2,
            status: "open",
        });

        // Schedule 3: Oct 15 - Oct 22 (for Tour 3 - overlap with Schedule 1 & 2)
        await TourSchedule.create({
            id: "schedule-3",
            tourId: "tour-3",
            scheduleCode: "SCH-3310-001",
            departureDate: new Date("2026-10-15T05:00:00Z"),
            returnDate: new Date("2026-10-22T20:00:00Z"),
            price: 65000000.0,
            maxCapacity: 10,
            registered: 1,
            status: "open",
        });

        // Schedule 4: Sept 01 - Sept 05 (for Tour 5 - closed)
        await TourSchedule.create({
            id: "schedule-4",
            tourId: "tour-5",
            scheduleCode: "SCH-1102-001",
            departureDate: new Date("2026-09-01T07:00:00Z"),
            returnDate: new Date("2026-09-05T18:00:00Z"),
            price: 3800000.0,
            maxCapacity: 25,
            registered: 25,
            status: "closed",
        });

        // 5. Create Tour Assignments
        // Guide 1 is assigned to schedule-1
        await TourAssignment.create({
            id: "assign-1",
            scheduleId: "schedule-1",
            guideId: "guide-1",
            assignedBy: "operator-1",
            assignedAt: new Date(),
        });

        // Guide 3 is assigned to schedule-3
        await TourAssignment.create({
            id: "assign-2",
            scheduleId: "schedule-3",
            guideId: "guide-3",
            assignedBy: "operator-1",
            assignedAt: new Date(),
        });

        // 6. Create Bookings & Participants
        // Bookings for Schedule 1 (tour-1)
        await Booking.create({
            id: "booking-1",
            customerId: "customer-1",
            scheduleId: "schedule-1",
            bookingCode: "BOOKING-101",
            status: "paid",
            totalPrice: 45000000.0,
            finalPrice: 45000000.0,
        });

        await Participant.bulkCreate([
            {
                id: "participant-1",
                bookingId: "booking-1",
                fullName: "Nguyễn Thành Trung",
                dateOfBirth: new Date("1985-05-12"),
                participantType: "adult",
                address: "Hồ Chí Minh",
                isLead: true,
                checkinCode: "QR-NT-101",
                checkinAt: new Date("2026-10-15T08:30:00.000Z"),
            },
            {
                id: "participant-2",
                bookingId: "booking-1",
                fullName: "Trần Thị Tuyết Mai",
                dateOfBirth: new Date("1985-05-12"),
                participantType: "adult",
                address: "Hồ Chí Minh",
                isLead: false,
                checkinCode: "QR-TM-102",
                checkinAt: new Date("2026-10-15T08:30:00.000Z"),
            },
            {
                id: "participant-3",
                bookingId: "booking-1",
                fullName: "Phạm Gia Huy",
                dateOfBirth: new Date("2018-11-08"),
                participantType: "child",
                address: "Hồ Chí Minh",
                isLead: false,
                checkinCode: "QR-GH-103",
                checkinAt: null,
            },
        ]);

        await Booking.create({
            id: "booking-2",
            customerId: "customer-2",
            scheduleId: "schedule-1",
            bookingCode: "BOOKING-102",
            status: "pending_payment",
            totalPrice: 30000000.0,
            finalPrice: 30000000.0,
        });

        await Participant.bulkCreate([
            {
                id: "participant-4",
                bookingId: "booking-2",
                fullName: "Lê Thị Thu Hà",
                dateOfBirth: new Date("1990-09-24"),
                participantType: "adult",
                address: "Hà Nội",
                isLead: true,
                checkinCode: "QR-TH-104",
                checkinAt: new Date("2026-10-15T09:12:00.000Z"),
            },
            {
                id: "participant-5",
                bookingId: "booking-2",
                fullName: "Hoàng Minh Tuấn",
                dateOfBirth: new Date("1992-01-22"),
                participantType: "adult",
                address: "Hà Nội",
                isLead: false,
                checkinCode: "QR-MT-105",
                checkinAt: new Date("2026-10-15T08:45:00.000Z"),
            },
        ]);

        await Booking.create({
            id: "booking-3",
            customerId: "customer-3",
            scheduleId: "schedule-1",
            bookingCode: "BOOKING-103",
            status: "paid",
            totalPrice: 15000000.0,
            finalPrice: 15000000.0,
        });

        await Participant.create({
            id: "participant-6",
            bookingId: "booking-3",
            fullName: "Nguyễn Văn An",
            dateOfBirth: new Date("1980-09-15"),
            participantType: "adult",
            address: "Đồng Nai",
            isLead: true,
            checkinCode: "QR-VA-106",
            checkinAt: null,
        });

        await Booking.create({
            id: "booking-4",
            customerId: "customer-4",
            scheduleId: "schedule-1",
            bookingCode: "BOOKING-104",
            status: "paid",
            totalPrice: 30000000.0,
            finalPrice: 30000000.0,
        });

        await Participant.bulkCreate([
            {
                id: "participant-7",
                bookingId: "booking-4",
                fullName: "Lê Hồng Phúc",
                dateOfBirth: new Date("2015-03-30"),
                participantType: "child",
                address: "Bình Dương",
                isLead: true,
                checkinCode: "QR-HP-107",
                checkinAt: new Date("2026-10-15T08:35:00.000Z"),
            },
            {
                id: "participant-8",
                bookingId: "booking-4",
                fullName: "Đặng Thu Thảo",
                dateOfBirth: new Date("1988-07-18"),
                participantType: "adult",
                address: "Bình Dương",
                isLead: false,
                checkinCode: "QR-TT-108",
                checkinAt: null,
            },
        ]);

        await Booking.create({
            id: "booking-5",
            customerId: "customer-5",
            scheduleId: "schedule-1",
            bookingCode: "BOOKING-105",
            status: "paid",
            totalPrice: 30000000.0,
            finalPrice: 30000000.0,
        });

        await Participant.bulkCreate([
            {
                id: "participant-9",
                bookingId: "booking-5",
                fullName: "Vũ Nam Khánh",
                dateOfBirth: new Date("1995-12-05"),
                participantType: "adult",
                address: "Vũng Tàu",
                isLead: true,
                checkinCode: "QR-NK-109",
                checkinAt: new Date("2026-10-15T08:30:00.000Z"),
            },
            {
                id: "participant-10",
                bookingId: "booking-5",
                fullName: "Bùi Minh Đức",
                dateOfBirth: new Date("1982-02-10"),
                participantType: "adult",
                address: "Vũng Tàu",
                isLead: false,
                checkinCode: "QR-MD-110",
                checkinAt: null,
            },
        ]);

        await Booking.create({
            id: "booking-6",
            customerId: "customer-6",
            scheduleId: "schedule-1",
            bookingCode: "BOOKING-106",
            status: "paid",
            totalPrice: 15000000.0,
            finalPrice: 15000000.0,
        });

        await Participant.create({
            id: "participant-11",
            bookingId: "booking-6",
            fullName: "Phạm Minh Khang",
            dateOfBirth: new Date("2020-05-12"),
            participantType: "child",
            address: "Hồ Chí Minh",
            isLead: true,
            checkinCode: "QR-MK-111",
            checkinAt: new Date("2026-10-15T08:30:00.000Z"),
        });

        // Hard Approvals Seeding for Tour 2 (schedule-2)
        await Booking.create({
            id: "booking-7",
            customerId: "customer-7",
            scheduleId: "schedule-2",
            bookingCode: "BOOKING-701",
            status: "pending_approval",
            totalPrice: 9000000.0,
            finalPrice: 9000000.0,
        });

        await Participant.bulkCreate([
            {
                id: "participant-12",
                bookingId: "booking-7",
                fullName: "Đỗ Hoàng Nam",
                dateOfBirth: new Date("1987-11-20"),
                participantType: "adult",
                address: "Quận 3, TP. HCM",
                isLead: true,
                cccdFrontUrl: "https://images.unsplash.com/photo-1618044619888-009e412ff12a?w=400&h=250&fit=crop",
                cccdBackUrl: "https://images.unsplash.com/photo-1618044733555-e6f1d85e4dcb?w=400&h=250&fit=crop",
                checkinCode: "QR-HN-701",
            },
            {
                id: "participant-13",
                bookingId: "booking-7",
                fullName: "Đỗ Hoàng Long",
                dateOfBirth: new Date("2012-04-15"),
                participantType: "child",
                address: "Quận 3, TP. HCM",
                isLead: false,
                checkinCode: "QR-HL-702",
            }
        ]);

        // Hard Approvals Seeding for Tour 3 (schedule-3)
        await Booking.create({
            id: "booking-8",
            customerId: "customer-2",
            scheduleId: "schedule-3",
            bookingCode: "BOOKING-801",
            status: "pending_approval",
            totalPrice: 65000000.0,
            finalPrice: 65000000.0,
        });

        await Participant.create({
            id: "participant-14",
            bookingId: "booking-8",
            fullName: "Lê Thị Thu Hà",
            dateOfBirth: new Date("1990-09-24"),
            participantType: "adult",
            address: "Hoàn Kiếm, Hà Nội",
            isLead: true,
            cccdFrontUrl: "https://images.unsplash.com/photo-1618044619888-009e412ff12a?w=400&h=250&fit=crop",
            cccdBackUrl: "https://images.unsplash.com/photo-1618044733555-e6f1d85e4dcb?w=400&h=250&fit=crop",
            checkinCode: "QR-LH-801",
        });

        // 7. Create Conversations
        await Conversation.create({
            id: "conv-1",
            sessionKey: "session_minhanh",
            guestName: null,
            customerId: "customer-1",
            supportUserId: "guide-1",
            status: "active",
            lastMessage: "Dạ có ạ, gửi giúp mình nhé. Đặc biệt là các hoạt động cho trẻ em ấy ạ...",
        });

        await Message.bulkCreate([
            {
                id: "msg-1-1",
                conversationId: "conv-1",
                senderType: "user",
                senderId: "customer-1",
                content: "Chào admin, tôi muốn hỏi về tour Hạ Long ngày 25/12 còn chỗ không ạ? Nhóm tôi có 4 người lớn và 2 trẻ em.",
                sentAt: new Date("2026-06-11T14:20:00.000Z"),
            },
            {
                id: "msg-1-2",
                conversationId: "conv-1",
                senderType: "guide",
                senderId: "guide-1",
                content: "Chào chị Minh Anh! Chip3Chip rất vui được hỗ trợ chị. Ngày 25/12 bên em vẫn còn chỗ cho đoàn 6 người trên tàu Heritage Cruises chị nhé.",
                sentAt: new Date("2026-06-11T14:22:00.000Z"),
            },
            {
                id: "msg-1-3",
                conversationId: "conv-1",
                senderType: "guide",
                senderId: "guide-1",
                content: "Chị có cần em gửi bảng giá chi tiết kèm ưu đãi cho trẻ em không ạ?",
                sentAt: new Date("2026-06-11T14:22:30.000Z"),
            },
            {
                id: "msg-1-4",
                conversationId: "conv-1",
                senderType: "user",
                senderId: "customer-1",
                content: "Dạ có ạ, gửi giúp mình nhé. Đặc biệt là các hoạt động cho trẻ em ấy ạ, vì các bé nhà mình khá năng động.",
                sentAt: new Date("2026-06-11T14:25:00.000Z"),
            }
        ]);

        await Conversation.create({
            id: "conv-2",
            sessionKey: "session_lequockhanh",
            guestName: null,
            customerId: "customer-2",
            supportUserId: "guide-1",
            status: "active",
            lastMessage: "Cảm ơn bạn, mình cần hỏi thêm về chính sách hủy tour.",
        });

        await Message.bulkCreate([
            {
                id: "msg-2-1",
                conversationId: "conv-2",
                senderType: "user",
                senderId: "customer-2",
                content: "Gói bảo hiểm du lịch có bao gồm cứu hộ núi không bạn?",
                sentAt: new Date("2026-06-11T14:10:00.000Z"),
            },
            {
                id: "msg-2-2",
                conversationId: "conv-2",
                senderType: "guide",
                senderId: "guide-1",
                content: "Dạ chào anh Khánh, gói bảo hiểm của Chip3Chip đã bao gồm toàn bộ chi phí y tế khẩn cấp và cứu hộ tại chỗ ở Sapa ạ.",
                sentAt: new Date("2026-06-11T14:13:00.000Z"),
            },
            {
                id: "msg-2-3",
                conversationId: "conv-2",
                senderType: "user",
                senderId: "customer-2",
                content: "Cảm ơn bạn, mình cần hỏi thêm về chính sách hủy tour.",
                sentAt: new Date("2026-06-11T14:15:00.000Z"),
            }
        ]);

        console.log("Database seeded successfully!");
    } catch (err) {
        console.error("Error seeding database:", err);
    }
};
