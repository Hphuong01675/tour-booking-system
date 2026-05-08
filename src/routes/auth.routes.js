const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const {
    forgotPasswordSchema,
    verifyOTPSchema,
    resetPasswordSchema,
    registerSchema,
    verifyActivationOTPSchema,
} = require("../validations/auth.validation");
const {
    forgotPasswordLimiter,
    verifyOTPLimiter,
    registerLimiter,
    verifyActivationOTPLimiter,
} = require("../middlewares/rateLimiter");
const { verifyResetToken } = require("../middlewares/auth.middleware");

// 1. Đăng ký: Rate limit -> Validate Schema -> Controller
router.post(
    "/register",
    registerLimiter,
    validate(registerSchema),
    authController.register,
);

// 2. Xác thực OTP kích hoạt tài khoản
router.post(
    "/verify-activation-otp",
    verifyActivationOTPLimiter,
    validate(verifyActivationOTPSchema),
    authController.verifyActivationOTP,
);

// 3. Quên mật khẩu: Rate limit -> Validate Schema -> Controller
router.post(
    "/forgot-password",
    forgotPasswordLimiter,
    validate(forgotPasswordSchema),
    authController.forgotPassword,
);

// 4. Xác thực OTP
router.post(
    "/verify-otp",
    verifyOTPLimiter,
    validate(verifyOTPSchema),
    authController.verifyOTP,
);

// 5. Đặt mật khẩu mới: Verify JWT -> Validate Schema -> Controller
router.post(
    "/reset-password",
    verifyResetToken,
    validate(resetPasswordSchema),
    authController.resetPassword,
);

module.exports = router;
