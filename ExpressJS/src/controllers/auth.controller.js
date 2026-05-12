const authService = require("../services/auth.service");

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        await authService.requestForgotPassword(email);

        res.status(200).json({
            message: "Mã OTP đã được gửi về email của bạn.",
        });
    } catch (error) {
        const status = error.message === "EMAIL_NOT_FOUND" ? 404 : 500;
        res.status(status).json({
            message:
                error.message === "EMAIL_NOT_FOUND"
                    ? "Email không tồn tại."
                    : "Lỗi hệ thống.",
        });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const resetToken = await authService.verifyOTPAndGenerateToken(
            email,
            otp,
        );

        res.status(200).json({
            message: "Xác minh thành công. Vui lòng đặt lại mật khẩu.",
            resetToken,
        });
    } catch (error) {
        let message = "Lỗi hệ thống.";
        if (error.message === "INVALID_OTP")
            message = "Mã OTP không chính xác.";
        if (error.message === "OTP_EXPIRED") message = "Mã OTP đã hết hạn.";

        res.status(400).json({ message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const email = req.userEmail; // Từ middleware verifyResetToken

        await authService.updateNewPassword(email, newPassword);

        res.status(200).json({ message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi cập nhật mật khẩu." });
    }
};

module.exports = {
    forgotPassword,
    verifyOTP,
    resetPassword,
};
