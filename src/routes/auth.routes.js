const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { validate } = require("../middlewares/validate.middleware");
const { validateExpress } = require("../middlewares/validate.middleware");
const {
    loginValidation,
    forgotPasswordSchema,
    verifyOTPSchema,
    resetPasswordSchema,
} = require("../validations/auth.validation");
const {
    forgotPasswordLimiter,
    verifyOTPLimiter,
    loginLimiter,
} = require("../middlewares/rateLimiter");
const { verifyResetToken } = require("../middlewares/auth.middleware");

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

router.post(
    "/reset-password",
    verifyResetToken,
    validate(resetPasswordSchema),
    authController.resetPassword,
);

router.post(
    "/login",
    loginLimiter,
    loginValidation,
    validateExpress,
    authController.login
);

router.post(
    "/api/login",
    loginLimiter,
    loginValidation,
    validateExpress,
    authController.loginApi
);
module.exports = router;
