const express = require("express");
const router = express.Router();

const {
    forgotPassword,
    verifyOTP,
    resetPassword,
} = require("../controllers/auth/forgotPassword.controller");

const validate = require("../middlewares/auth/validate.middleware");

const {
    forgotPasswordSchema,
    verifyOTPSchema,
    resetPasswordSchema,
} = require("../validators/auth/forgotPassword.validator");

const {
    forgotPasswordLimiter,
    verifyOTPLimiter,
} = require("../middlewares/auth/rateLimiter");

const {
    verifyResetToken,
} = require("../middlewares/auth/forgotPassword.middleware");

// POST /api/auth/forgot-password
// Rate limit → Validate → Controller
router.post(
    "/forgot-password",
    forgotPasswordLimiter,
    validate(forgotPasswordSchema),
    forgotPassword
);

// POST /api/auth/verify-otp
// Rate limit → Validate → Controller
router.post(
    "/verify-otp",
    verifyOTPLimiter,
    validate(verifyOTPSchema),
    verifyOTP
);

// POST /api/auth/reset-password
// Verify reset JWT → Validate → Controller
router.post(
    "/reset-password",
    verifyResetToken,
    validate(resetPasswordSchema),
    resetPassword
);

module.exports = router;
