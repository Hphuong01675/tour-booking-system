import "dotenv/config";
import express from "express";
import viewEngine from "./config/viewEngine";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import connectDB from "./config/configdb";

let app = express();

// middleware chuẩn
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

viewEngine(app);

// routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

app.get("/login", (req, res) => {
    return res.render("login");
});

// DB
connectDB();

let port = process.env.PORT || 6969;

app.listen(port, () => {
    console.log("Backend Nodejs is running on port: " + port);
});