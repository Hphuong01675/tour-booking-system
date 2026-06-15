import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import db from "./models";
import authRoutes from "./routes/auth.routes";
import operatorRoutes from "./routes/operator/operator.routes";
import loginRoutes from "./routes/login.routes";
import { seedDatabase } from "./seed/seed";
import { initializeDatabaseAndStartServer } from "./bootstrap";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mount authentication routes
app.use("/", authRoutes);
app.use("/", operatorRoutes);
app.use("/", loginRoutes);

// ==================== API ROUTING ====================

// 1. Get Guide Stats
app.get("/api/guides/stats", async (req, res) => {
    try {
        const { TourAssignment, TourSchedule } = db;
        // Total assigned schedules
        const totalTours = await TourAssignment.count({
            where: { guideId: "guide-1" },
        });

        // Count schedules that are upcoming/open
        const upcomingTours = await TourAssignment.count({
            where: { guideId: "guide-1" },
            include: [
                {
                    model: TourSchedule,
                    as: "schedule",
                    where: { status: "open" },
                },
            ],
        });

        res.json({
            totalTours,
            upcomingTours,
        });
    } catch (err) {
        console.error("Internal Server Error:", err);
        res.status(500).json({
            error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
        });
    }
});

// 2. Get Assigned Tours list
app.get("/api/guides/assigned-tours", async (req, res) => {
    try {
        const { TourAssignment, TourSchedule, Tour } = db;
        const { status = "all", page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        // Filter by assignment
        const whereAssignment = { guideId: "guide-1" };
        const whereSchedule = {};

        if (status !== "all") {
            whereSchedule.status = status;
        }

        const { count, rows } = await TourAssignment.findAndCountAll({
            where: whereAssignment,
            include: [
                {
                    model: TourSchedule,
                    as: "schedule",
                    where: whereSchedule,
                    include: [
                        {
                            model: Tour,
                            as: "tour",
                        },
                    ],
                },
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        const tours = rows.map((row) => {
            const sch = row.schedule || {};
            const t = sch.tour || {};
            return {
                id: sch.id,
                assignmentId: row.id,
                tourId: t.id,
                title: t.title,
                destination: t.destination,
                thumbnailUrl: t.thumbnailUrl,
                departureDate: sch.departureDate,
                returnDate: sch.returnDate,
                status: sch.status,
                maxCapacity: sch.maxCapacity,
                registered: sch.registered,
                scheduleCode: sch.scheduleCode,
            };
        });

        res.json({
            tours,
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
        });
    } catch (err) {
        console.error("Internal Server Error:", err);
        res.status(500).json({
            error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
        });
    }
});

// 3. Get Tour Assignment Detail (including bookings, customers, itinerary days)
app.get("/api/guides/assigned-tours/:id", async (req, res) => {
    try {
        const {
            TourAssignment,
            TourSchedule,
            Tour,
            Booking,
            User,
            Participant,
            TourItineraryDay,
        } = db;
        const targetId = req.params.id;

        // Try finding by schedule_id or assignment_id
        let assignment = await TourAssignment.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    { id: targetId },
                    { scheduleId: targetId },
                ],
                guideId: "guide-1",
            },
            include: [
                {
                    model: User,
                    as: "guide",
                    attributes: ["id", "fullName", "role", "phone"],
                },
                {
                    model: TourSchedule,
                    as: "schedule",
                    include: [
                        {
                            model: Tour,
                            as: "tour",
                            include: [
                                {
                                    model: TourItineraryDay,
                                    as: "itineraryDays",
                                },
                            ],
                        },
                        {
                            model: Booking,
                            as: "bookings",
                            include: [
                                {
                                    model: User,
                                    as: "customer",
                                    attributes: ["id", "fullName", "phone"],
                                },
                                {
                                    model: Participant,
                                    as: "participants",
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        if (!assignment) {
            return res.status(404).json({ error: "Tour assignment not found" });
        }

        res.json(assignment);
    } catch (err) {
        console.error("Internal Server Error:", err);
        res.status(500).json({
            error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
        });
    }
});

// 4. Export excel dummy route
app.get("/api/guides/assigned-tours/export", (req, res) => {
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");
    res.send(Buffer.from([]));
});

// 5. Update Status
app.patch(
    "/api/guides/assigned-tours/:assignmentId/status",
    async (req, res) => {
        try {
            const { TourAssignment, TourSchedule } = db;
            const { status } = req.body;

            const assignment = await TourAssignment.findByPk(
                req.params.assignmentId,
            );
            if (!assignment)
                return res.status(404).json({ error: "Assignment not found" });

            const schedule = await TourSchedule.findByPk(assignment.scheduleId);
            if (!schedule)
                return res.status(404).json({ error: "Schedule not found" });

            schedule.status = status;
            await schedule.save();

            res.json({ message: "Status updated successfully", status });
        } catch (err) {
            console.error("Internal Server Error:", err);
            res.status(500).json({
                error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
            });
        }
    },
);

// 6. Get Guide Profile
app.get("/api/guides/profile", async (req, res) => {
    try {
        const { User } = db;
        const guide = await User.findByPk("guide-1");
        if (!guide) {
            return res.status(404).json({ error: "Guide not found" });
        }
        res.json(guide);
    } catch (err) {
        console.error("Internal Server Error:", err);
        res.status(500).json({
            error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
        });
    }
});

// 7. Update Guide Profile
app.patch("/api/guides/profile", async (req, res) => {
    try {
        const { User } = db;
        const { fullName, phone, dateOfBirth, address, avatarUrl } = req.body;
        const guide = await User.findByPk("guide-1");
        if (!guide) {
            return res.status(404).json({ error: "Guide not found" });
        }

        if (fullName !== undefined) guide.fullName = fullName;
        if (phone !== undefined) guide.phone = phone;
        if (dateOfBirth !== undefined) guide.dateOfBirth = dateOfBirth;
        if (address !== undefined) guide.address = address;
        if (avatarUrl !== undefined) guide.avatarUrl = avatarUrl;

        await guide.save();
        res.json(guide);
    } catch (err) {
        console.error("Internal Server Error:", err);
        res.status(500).json({
            error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
        });
    }
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
        error: err.message || "Đã xảy ra lỗi hệ thống nghiêm trọng.",
        code: err.code || "INTERNAL_SERVER_ERROR",
    });
});

// ==================== START SERVER & DATABASE CONNECTION ====================
initializeDatabaseAndStartServer(app, PORT);
