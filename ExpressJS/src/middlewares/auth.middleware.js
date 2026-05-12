const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");

const verifyResetToken = async (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1]; // Bearer <token>

    if (!token)
        return res.status(403).json({ message: "Không có quyền truy cập." });
    try {
        // 1. Kiểm tra trong Redis xem có lưu token vào Redis ở bước verify-otp không
        const isExists = await redisClient.get(`reset_token:${token}`);
        if (!isExists)
            return res
                .status(401)
                .json({ message: "Phiên làm việc đã bị hủy hoặc hết hạn." });

        // 2. Verify JWT
        jwt.verify(token, process.env.JWT_OTP_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    message:
                        err.name === "TokenExpiredError"
                            ? "Mã xác thực đã hết hạn."
                            : "Phiên làm việc không hợp lệ.",
                });
            }

            // Lưu email vào request để controller sử dụng
            req.userEmail = decoded.email;
            next();
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống khi xác thực." });
    }
};

module.exports = { verifyResetToken };
