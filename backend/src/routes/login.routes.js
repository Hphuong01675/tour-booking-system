import express from "express";
import loginController from "../controllers/login.controller";
import loginRateLimiter from "../middlewares/loginRateLimiter";
import {
    authorizeRoles,
    verifyAccessToken,
} from "../middlewares/accessToken.middleware";
import loginValidation from "../validations/login.validation";

const router = express.Router();

router.post(
    "/api/auth/login",
    loginRateLimiter,
    loginValidation.validateLogin,
    loginController.login,
);

router.get("/api/auth/me", verifyAccessToken, loginController.me);

router.get(
    "/api/customer/profile",
    verifyAccessToken,
    authorizeRoles("customer"),
    loginController.userProfile.bind(loginController),
);

router.get(
    "/api/admin/profile",
    verifyAccessToken,
    authorizeRoles("admin"),
    loginController.adminProfile.bind(loginController),
);

export default router;
