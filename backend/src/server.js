import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import os from "os";
import fs from "fs";
import bcrypt from "bcryptjs";
import db from "./models";
import authRoutes from "./routes/auth.routes";
import operatorRoutes from "./routes/operator/operator.routes";
import loginRoutes from "./routes/login.routes";
import tourRoutes from "./routes/tour.routes";
import pendingBookingRoutes from "./routes/pendingBooking.routes";
import customerRoutes from "./routes/customer.routes";
import uploadRoutes from "./routes/upload.routes";
import chatRoutes from "./routes/chat.routes";
import guideRoutes from "./routes/guide.routes";
import adminRoutes from "./routes/admin/admin.routes";
import { seedDatabase } from "./seed/seed";
import http from "http";
import { Server } from "socket.io";
import socketManager from "./sockets/socketManager";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const app = express();
const PORT = process.env.PORT || 8080; // Changed default port to 8080 to match configuration

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mount routes
app.use("/", authRoutes);
app.use("/", operatorRoutes);
app.use("/", loginRoutes);
app.use("/", tourRoutes);
app.use("/", pendingBookingRoutes);
app.use("/", customerRoutes);
app.use("/", uploadRoutes);
app.use("/", chatRoutes);
app.use("/api/guides", guideRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/", adminRoutes);


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
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
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
            res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

// ==================== MOMO SCAN SIMULATOR ROUTES ====================

app.get("/api/server-ip", (req, res) => {
    // Thử đọc URL từ log của SSH localhost.run (task-347.log) hoặc tunnel.log cục bộ
    let tunnelUrl = null;
    const candidatePaths = [
        path.join(process.cwd(), "tunnel.log"),
        path.join(process.cwd(), "../tunnel.log"),
        path.join(__dirname, "../tunnel.log"),
        path.join(__dirname, "../../tunnel.log"),
        "C:\\Users\\HAI\\.gemini\\antigravity-ide\\brain\\0be8321a-8d7c-4168-a844-f55f30df9d20\\.system_generated\\tasks\\task-347.log"
    ];

    for (const logPath of candidatePaths) {
        try {
            if (fs.existsSync(logPath)) {
                const content = fs.readFileSync(logPath, "utf8");
                const matches = content.match(/https:\/\/[a-z0-9\.-]+\.lhr\.(?:life|device)/g) || content.match(/https:\/\/[a-z0-9\.-]+\.loca\.lt/g) || content.match(/https:\/\/[a-z0-9\.-]+\.ngrok-free\.app/g);
                if (matches && matches.length > 0) {
                    tunnelUrl = matches[matches.length - 1];
                    break;
                }
            }
        } catch (e) {
            console.error(`Lỗi đọc log SSH tunnel tại ${logPath}:`, e);
        }
    }

    if (tunnelUrl) {
        return res.json({ ip: tunnelUrl });
    }

    const interfaces = os.networkInterfaces();
    let ipAddress = "localhost";

    let candidates = [];
    for (const devName in interfaces) {
        const lowerName = devName.toLowerCase();
        if (lowerName.includes("vmware") || lowerName.includes("virtual") || lowerName.includes("vbox") || lowerName.includes("host-only") || lowerName.includes("loopback")) {
            continue;
        }

        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
                if (alias.address.startsWith("169.254.")) {
                    continue;
                }
                candidates.push({ name: devName, address: alias.address });
            }
        }
    }

    const wifiCandidate = candidates.find(c => {
        const name = c.name.toLowerCase();
        return name.includes("wi-fi") || name.includes("wifi") || name.includes("wlan") || name.includes("wireless");
    });

    if (wifiCandidate) {
        ipAddress = wifiCandidate.address;
    } else if (candidates.length > 0) {
        ipAddress = candidates[0].address;
    } else {
        for (const devName in interfaces) {
            const iface = interfaces[devName];
            for (let i = 0; i < iface.length; i++) {
                const alias = iface[i];
                if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
                    ipAddress = alias.address;
                    break;
                }
            }
            if (ipAddress !== "localhost") break;
        }
    }
    res.json({ ip: ipAddress });
});

app.get("/mock-momo-pay/:bookingId", async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await db.Booking.findByPk(bookingId, {
            include: [
                {
                    model: db.TourSchedule,
                    as: "schedule",
                    include: [{ model: db.Tour, as: "tour" }]
                },
                {
                    model: db.Participant,
                    as: "participants"
                }
            ]
        });
        if (!booking) {
            return res.status(404).send("<h2 style='text-align:center;margin-top:50px;'>Không tìm thấy đơn đặt tour!</h2>");
        }

        const tourTitle = booking.schedule?.tour?.title || "Tour du lịch";
        const finalPrice = parseFloat(booking.finalPrice).toLocaleString("vi-VN") + " đ";
        const participantsCount = booking.participants?.length || 0;

        res.send(`
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Thanh toán MoMo Sandbox</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        background-color: #f5f5f7;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                    }
                    .card {
                        background: #ffffff;
                        border-radius: 20px;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
                        width: 100%;
                        max-width: 420px;
                        padding: 30px 24px;
                        box-sizing: border-box;
                        text-align: center;
                    }
                    .momo-logo {
                        width: 70px;
                        height: 70px;
                        margin: 0 auto 16px;
                        background-color: #ae2070;
                        border-radius: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 26px;
                    }
                    h2 {
                        color: #1d1d1f;
                        margin: 0 0 8px;
                        font-size: 22px;
                        font-weight: 700;
                    }
                    .merchant-name {
                        color: #86868b;
                        font-size: 14px;
                        margin-bottom: 24px;
                    }
                    .divider {
                        height: 1px;
                        background-color: #e5e5ea;
                        margin: 20px 0;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 14px;
                        color: #1d1d1f;
                        margin: 10px 0;
                    }
                    .info-row .label {
                        color: #86868b;
                    }
                    .info-row .value {
                        font-weight: 600;
                        text-align: right;
                        max-width: 60%;
                    }
                    .price-box {
                        background-color: #fff0f6;
                        border-radius: 14px;
                        padding: 18px;
                        margin-top: 24px;
                        border: 1px solid #ffdeeb;
                    }
                    .price-label {
                        color: #ae2070;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .price-value {
                        color: #ae2070;
                        font-size: 30px;
                        font-weight: 800;
                        margin-top: 6px;
                    }
                    .btn-ok {
                        background-color: #ae2070;
                        color: white;
                        border: none;
                        border-radius: 14px;
                        width: 100%;
                        padding: 18px;
                        font-size: 16px;
                        font-weight: 750;
                        cursor: pointer;
                        margin-top: 28px;
                        transition: background-color 0.2s, transform 0.1s;
                    }
                    .btn-ok:active {
                        background-color: #8f1559;
                        transform: scale(0.98);
                    }
                    .success-container {
                        display: none;
                    }
                    .success-icon {
                        width: 64px;
                        height: 64px;
                        background-color: #4cd964;
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 36px;
                        margin: 0 auto 20px;
                    }
                </style>
            </head>
            <body>
                <div class="card" id="momo-card">
                    <div class="momo-logo">momo</div>
                    <h2>Cổng thanh toán MoMo</h2>
                    <div class="merchant-name">Hệ thống Đặt Tour Du Lịch</div>
                    
                    <div class="divider"></div>
                    
                    <div class="info-row">
                        <span class="label">Tour đặt mua:</span>
                        <span class="value">${tourTitle}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Số lượng khách:</span>
                        <span class="value">${participantsCount} người</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Mã giao dịch:</span>
                        <span class="value">${booking.bookingCode}</span>
                    </div>
                    
                    <div class="price-box">
                        <div class="price-label">Số tiền cần thanh toán</div>
                        <div class="price-value">${finalPrice}</div>
                    </div>
                    
                    <button class="btn-ok" id="btn-confirm">XÁC NHẬN THANH TOÁN (OK)</button>
                </div>

                <div class="card success-container" id="success-card">
                    <div class="success-icon">✓</div>
                    <h2>Thanh toán thành công!</h2>
                    <p class="merchant-name" style="line-height: 1.6;">Cảm ơn bạn đã sử dụng dịch vụ. Màn hình máy tính của bạn sẽ tự động cập nhật trong giây lát.</p>
                </div>

                <script>
                    document.getElementById('btn-confirm').addEventListener('click', async () => {
                        try {
                            const response = await fetch('/mock-momo-pay/${bookingId}/confirm', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' }
                            });
                            const result = await response.json();
                            if (result.success) {
                                document.getElementById('momo-card').style.display = 'none';
                                document.getElementById('success-card').style.display = 'block';
                            } else {
                                alert('Có lỗi xảy ra: ' + (result.error || 'Vui lòng thử lại.'));
                            }
                        } catch (err) {
                            alert('Không thể kết nối đến máy chủ.');
                        }
                    });
                </script>
            </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send("<h2>Lỗi máy chủ: " + err.message + "</h2>");
    }
});

app.post("/mock-momo-pay/:bookingId/confirm", async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await db.Booking.findByPk(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, error: "Booking not found" });
        }
        await booking.update({ status: "paid" });
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
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

db.sequelize
    .authenticate()
    .then(async () => {
        console.log("MySQL Database Connected.");
        // Sync database schema
        await db.sequelize.sync();

        // Seed default records if empty
        await seedDatabase();

        const server = http.createServer(app);
        const io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST", "PATCH"]
            }
        });
        socketManager.initSocket(io);

        server.listen(PORT, () => {
            console.log(`Backend Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Database Connection Error:", err);
    });
