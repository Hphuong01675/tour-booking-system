// Path: backend/src/middlewares/rateLimiter.js
import redisClient from "../config/redis";
import rateLimit from "express-rate-limit";

const rateLimiter = async (req, res, next) => {
    const ip = req.ip;
    const key = `rate:${ip}`;

    try {
        const current = await redisClient.get(key);

        // Limit to maximum 10 requests per minute
        if (current && parseInt(current) >= 10) {
            return res
                .status(429)
                .json({
                    error: "Bạn đã thao tác quá nhanh. Vui lòng thử lại sau 1 phút.",
                });
        }

        if (!current) {
            await redisClient.setEx(key, 60, "1");
        } else {
            const val = parseInt(current) + 1;
            await redisClient.setEx(key, 60, val.toString());
        }
    } catch (err) {
        console.warn("Rate limiter error:", err.message);
    }

    next();
};

export default rateLimiter;

export const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 3, // Giới hạn mỗi IP chỉ được yêu cầu 3 lần trong 15 phút
    message: {
        success: false,
        message: "Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 15 phút.",
    },
});

export const verifyOTPLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 phút
    max: 5, // Tối đa 5 lần thử cho mỗi IP
    message: {
        success: false,
        message: "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 10 phút.",
    },
});
