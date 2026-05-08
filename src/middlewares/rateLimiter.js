const rateLimit = require("express-rate-limit");

// Giới hạn việc YÊU CẦU gửi mã (đăng ký/quên mật khẩu)
// Chặn việc spam gửi hàng loạt email gây tốn tài nguyên
const requestOTPLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 phút (khớp với thời gian OTP sống)
    max: 3, // Chỉ cho phép yêu cầu gửi mã tối đa 3 lần trong 5 phút
    message: {
        message: "Bạn đã yêu cầu gửi mã quá nhanh. Vui lòng đợi 5 phút để yêu cầu mã mới.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Giới hạn việc NHẬP mã (Verify)
// Chặn việc dò mã (Brute-force)
const verifyOTPLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 phút
    max: 10, // Cho phép nhập sai tối đa 10 lần trong 5 phút
    message: {
        message: "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau khi mã mới được gửi.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Giới hạn Đăng ký tài khoản mới
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 5, // Mỗi IP chỉ được đăng ký tối đa 5 tài khoản mỗi giờ để tránh clone
    message: {
        message: "Phát hiện hoạt động đăng ký bất thường. Vui lòng thử lại sau 1 giờ.",
    },
});

module.exports = {
    forgotPasswordLimiter: requestOTPLimiter, // Dùng chung cho việc yêu cầu lại pass
    verifyOTPLimiter,
    registerLimiter,
    verifyActivationOTPLimiter: verifyOTPLimiter // Dùng chung cho việc verify OTP
};