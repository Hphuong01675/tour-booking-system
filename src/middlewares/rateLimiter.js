const rateLimit = require("express-rate-limit");

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 3, // Giới hạn mỗi IP chỉ được yêu cầu 3 lần trong 15 phút
    message: {
        message: "Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 15 phút.",
    },
});

const verifyOTPLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 phút
    max: 5, // Tối đa 5 lần thử cho mỗi IP
    message: {
        message: "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 10 phút.",
    },
});
const loginLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 5,

    message: {
        success: false,
        message:
            "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.",
    },
});
module.exports = { forgotPasswordLimiter, verifyOTPLimiter,loginLimiter };
