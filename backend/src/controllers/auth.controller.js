// Path: backend/src/controllers/auth.controller.js
import authService from '../services/auth.service';

class AuthController {
  // ================= Forgot Password Methods =================

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      await authService.requestForgotPassword(email);

      return res.status(200).json({
        success: true,
        message: "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi.",
      });
    } catch (error) {
      if (error.message === "EMAIL_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          error: "Email không tồn tại trong hệ thống.",
        });
      }

      return res.status(500).json({
        success: false,
        error: "Lỗi hệ thống. Vui lòng thử lại sau.",
      });
    }
  }

  async verifyForgotPasswordOTP(req, res) {
    try {
      const { email, otp } = req.body;
      const resetToken = await authService.verifyOTPAndGenerateToken(email, otp);

      return res.status(200).json({
        success: true,
        message: "Xác minh OTP thành công. Vui lòng đặt lại mật khẩu.",
        resetToken,
      });
    } catch (error) {
      let message = "Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.";
      if (error.message === "OTP_BLOCKED") {
        message = "Quá nhiều lần thử. Vui lòng đợi và thử lại sau 15 phút.";
      }

      return res.status(400).json({ success: false, message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { newPassword } = req.body;
      const email = req.userEmail;
      const token = req.resetToken;

      await authService.updateNewPassword(email, newPassword, token);

      return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công!" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Lỗi khi cập nhật mật khẩu." });
    }
  }
}

export default new AuthController();
