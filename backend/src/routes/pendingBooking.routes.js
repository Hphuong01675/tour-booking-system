import express from "express";
import pendingBookingController from "../controllers/pendingBooking.controller";
import { verifyAccessToken } from "../middlewares/accessToken.middleware";

const router = express.Router();

router.post("/api/bookings/pending-guest", pendingBookingController.savePending);
router.post("/api/bookings/claim-pending", verifyAccessToken, pendingBookingController.claimPending);

export default router;
