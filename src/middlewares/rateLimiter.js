const rateLimit = require("express-rate-limit");

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 3, // Giới hạn mỗi IP chỉ được yêu cầu 3 lần trong 15 phút
    message: {
        message: "Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 15 phút.",
    },
});

module.exports = { forgotPasswordLimiter };
