// Path: backend/src/routes/auth.routes.js
import express from 'express';
import authController from '../controllers/auth.controller';
import authValidation from '../validations/auth.validation';
import rateLimiter from '../middlewares/rateLimiter';

const router = express.Router();

// API Endpoints for authentication
router.post('/api/auth/register', authValidation.validateRegister, rateLimiter, authController.register);
router.post('/api/auth/verify-otp', authValidation.validateVerifyOTP, authController.verifyOTP);
router.post('/api/auth/resend-otp', rateLimiter, authController.resendOTP);

export default router;
