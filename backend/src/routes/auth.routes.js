// Path: backend/src/routes/auth.routes.js
import express from "express";
import authController from "../controllers/auth.controller";
import registerController from "../controllers/register.controller";
import authValidation from "../validations/auth.validation";
import rateLimiter, {
    forgotPasswordLimiter,
    verifyOTPLimiter,
} from "../middlewares/rateLimiter";
import { verifyResetToken } from "../middlewares/auth.middleware";

const router = express.Router();

// API Endpoints for authentication
router.post(
    "/api/auth/register",
    authValidation.validateRegister,
    rateLimiter,
    registerController.register,
);
router.post(
    "/api/auth/verify-otp",
    authValidation.validateVerifyOTP,
    registerController.verifyOTP,
);
router.post(
    "/api/auth/resend-otp",
    authValidation.validateResendOTP,
    rateLimiter,
    registerController.resendOTP,
);

// API Endpoints for forgot password
router.post(
    "/api/auth/forgot-password",
    forgotPasswordLimiter,
    authValidation.validateForgotPassword,
    authController.forgotPassword,
);
router.post(
    "/api/auth/forgot-password/verify-otp",
    verifyOTPLimiter,
    authValidation.validateVerifyOTP,
    authController.verifyForgotPasswordOTP,
);
router.post(
    "/api/auth/reset-password",
    verifyResetToken,
    authValidation.validateResetPassword,
    authController.resetPassword,
);

export default router;
