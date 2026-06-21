import rateLimit from "express-rate-limit";

const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: "Ban da dang nhap qua nhieu lan. Vui long thu lai sau 15 phut.",
        code: "LOGIN_RATE_LIMITED",
    },
});

export default loginRateLimiter;
