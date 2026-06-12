require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const authRoute = require("./routes/auth.route");
const connectDB = require("./config/configdb");

const app = express();

// Cấu hình CORS - cho phép ReactJS truy cập
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);

// Cấu hình body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Khai báo Routes
app.use("/api/auth", authRoute);

// Kết nối Database
connectDB();

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`✅ Backend Nodejs đang chạy tại port: ${port}`);
});
