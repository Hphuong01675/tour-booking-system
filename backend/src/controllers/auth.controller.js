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
}

export default new AuthController();
