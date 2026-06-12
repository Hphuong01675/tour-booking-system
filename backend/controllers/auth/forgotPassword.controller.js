const forgotPasswordService = require("../../services/auth/forgotPassword.service");

/**
 * POST /api/auth/forgot-password
 * Nhận email → kiểm tra tồn tại → tạo OTP → gửi mail
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        await forgotPasswordService.requestForgotPassword(email);

        res.status(200).json({
            message: "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi.",
        });
    } catch (error) {
        if (error.message === "EMAIL_NOT_FOUND") {
            return res.status(200).json({
                message: "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi.",
            });
        }

        res.status(500).json({
            message: "Lỗi hệ thống. Vui lòng thử lại sau.",
        });
    }
};

/**
 * POST /api/auth/verify-otp
 * Nhận email + otp → xác minh → trả về resetToken
 */
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const resetToken = await forgotPasswordService.verifyOTPAndGenerateToken(
            email,
            otp
        );

        res.status(200).json({
            message: "Xác minh OTP thành công. Vui lòng đặt lại mật khẩu.",
            resetToken,
        });
    } catch (error) {
        let message = "Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.";
        if (error.message === "OTP_BLOCKED") {
            message = "Quá nhiều lần thử. Vui lòng đợi và thử lại sau 15 phút.";
        }

        res.status(400).json({ message });
    }
};

/**
 * POST /api/auth/reset-password
 * Xác thực JWT reset token → cập nhật mật khẩu mới
 */
const resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const email = req.userEmail; // Lấy từ middleware verifyResetToken
        const token = req.resetToken;

        await forgotPasswordService.updateNewPassword(email, newPassword, token);

        res.status(200).json({ message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi cập nhật mật khẩu." });
    }
};

module.exports = { forgotPassword, verifyOTP, resetPassword };
