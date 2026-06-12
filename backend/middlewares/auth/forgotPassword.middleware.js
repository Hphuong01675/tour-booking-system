const jwt = require("jsonwebtoken");
const redisClient = require("../../config/redis");

/**
 * Middleware xác thực resetToken (JWT) trước khi cho phép đặt lại mật khẩu.
 * Token phải tồn tại trong Redis và còn hiệu lực.
 */
const verifyResetToken = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1]; // Format: "Bearer <token>"

    if (!token) {
        return res.status(403).json({ message: "Không có quyền truy cập. Token bị thiếu." });
    }

    try {
        // Kiểm tra Redis: token có tồn tại không (tránh reuse)
        const isExists = await redisClient.get(`reset_token:${token}`);
        if (!isExists) {
            return res.status(401).json({
                message: "Phiên làm việc đã bị hủy hoặc hết hạn. Vui lòng bắt đầu lại.",
            });
        }

        // Xác minh JWT
        jwt.verify(token, process.env.JWT_OTP_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    message:
                        err.name === "TokenExpiredError"
                            ? "Mã xác thực đã hết hạn. Vui lòng bắt đầu lại."
                            : "Phiên làm việc không hợp lệ.",
                });
            }

            req.userEmail = decoded.email; // Truyền email vào request
            req.resetToken = token;        // Truyền token vào để xóa sau khi dùng
            next();
        });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống khi xác thực token." });
    }
};

module.exports = { verifyResetToken };
