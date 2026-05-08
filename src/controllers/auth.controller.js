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

const register = async (req, res) => {
    try {
        const userData = req.body;
        await authService.registerUser(userData);

        res.status(201).json({
            message: "Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.",
        });
    } catch (error) {
        let status = 500;
        let message = "Lỗi hệ thống.";
        if (error.message === "EMAIL_ALREADY_EXISTS") {
            status = 409;
            message = "Email đã được sử dụng.";
        }
        res.status(status).json({ message });
    }
};

const verifyActivationOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        await authService.verifyActivationOTP(email, otp);

        res.status(200).json({
            message: "Tài khoản đã được kích hoạt thành công.",
        });
    } catch (error) {
        let message = "Lỗi hệ thống.";
        if (error.message === "INVALID_OTP") {
            message = "Mã OTP không chính xác hoặc đã hết hạn.";
        }
        res.status(400).json({ message });
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
    register,
    verifyActivationOTP,
    verifyOTP,
    resetPassword,
};
