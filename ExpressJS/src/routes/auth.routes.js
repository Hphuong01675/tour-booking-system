const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const {
    forgotPasswordSchema,
    verifyOTPSchema,
    resetPasswordSchema,
} = require("../validations/auth.validation");
const {
    forgotPasswordLimiter,
    verifyOTPLimiter,
} = require("../middlewares/rateLimiter");
const { verifyResetToken } = require("../middlewares/auth.middleware");

// 1. Quên mật khẩu: Rate limit -> Validate Schema -> Controller
router.post(
    "/forgot-password",
    forgotPasswordLimiter,
    validate(forgotPasswordSchema),
    authController.forgotPassword,
);

// 2. Xác thực OTP
router.post(
    "/verify-otp",
    verifyOTPLimiter,
    validate(verifyOTPSchema),
    authController.verifyOTP,
);

// 3. Đặt mật khẩu mới: Verify JWT -> Validate Schema -> Controller
router.post(
    "/reset-password",
    verifyResetToken,
    validate(resetPasswordSchema),
    authController.resetPassword,
);

module.exports = router;
