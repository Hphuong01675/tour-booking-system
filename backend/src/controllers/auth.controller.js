// Path: backend/src/controllers/auth.controller.js
import authService from '../services/auth.service';

class AuthController {
  /**
   * Handle user registration step 1
   * - Validate input
   * - Create inactive user
   * - Generate and send OTP
   * - Return redirect URL to OTP page
   */
  async register(req, res) {
    try {
      const result = await authService.registerStep1(req.body);

      return res.status(200).json({
        success: true,
        message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email để lấy mã.',
        email: result.email,
        redirect: `/auth/verify-otp?email=${encodeURIComponent(result.email)}`,
        redirectFrontend: `/auth/verify-otp`,
        expiryTime: 300, // 5 minutes in seconds
      });
    } catch (err) {
      // Handle specific error codes
      if (err.message.includes('Email đã được đăng ký')) {
        return res.status(409).json({
          success: false,
          error: err.message,
          code: 'EMAIL_ALREADY_REGISTERED',
        });
      }

      return res.status(400).json({
        success: false,
        error: err.message,
        code: 'REGISTRATION_FAILED',
      });
    }
  }

  /**
   * Handle OTP verification
   * - Verify OTP from Redis
   * - Activate user account
   * - Return success message with redirect to home/dashboard
   */
  async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;

      const result = await authService.verifyOTP(email, otp);

      return res.status(200).json({
        success: true,
        message: result.message,
        redirect: '/login',
        redirectFrontend: '/login',
      });
    } catch (err) {
      // Handle specific error cases
      if (err.message.includes('không chính xác')) {
        return res.status(400).json({
          success: false,
          error: err.message,
          code: 'INVALID_OTP',
          attemptRemaining: 3,
        });
      }

      if (err.message.includes('hết hạn')) {
        return res.status(400).json({
          success: false,
          error: err.message,
          code: 'OTP_EXPIRED',
        });
      }

      return res.status(400).json({
        success: false,
        error: err.message,
        code: 'OTP_VERIFICATION_FAILED',
      });
    }
  }

  /**
   * Handle OTP resend
   * - Verify user exists and not activated
   * - Generate new OTP
   * - Send via email
   * - Return success message
   */
  async resendOTP(req, res) {
    try {
      const { email } = req.body;

      const result = await authService.resendOTP(email);

      return res.status(200).json({
        success: true,
        message: 'Mã OTP mới đã được gửi đến email của bạn. Vui lòng kiểm tra email.',
        email: result.email,
        expiryTime: 300, // 5 minutes in seconds
      });
    } catch (err) {
      // Handle specific error conditions
      if (err.message.includes('đã được kích hoạt')) {
        return res.status(409).json({
          success: false,
          error: err.message,
          code: 'ACCOUNT_ALREADY_ACTIVATED',
        });
      }

      if (err.message.includes('không tồn tại')) {
        return res.status(404).json({
          success: false,
          error: err.message,
          code: 'USER_NOT_FOUND',
        });
      }

      return res.status(400).json({
        success: false,
        error: err.message,
        code: 'RESEND_OTP_FAILED',
      });
    }
  }

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
      const email = req.userEmail; // Lấy từ middleware verifyResetToken
      const token = req.resetToken;

      await authService.updateNewPassword(email, newPassword, token);

      return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công!" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Lỗi khi cập nhật mật khẩu." });
    }
  }
}

export default new AuthController();
