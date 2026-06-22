import express from "express";
import customerController from "../controllers/customer.controller";
import { verifyAccessToken, authorizeRoles } from "../middlewares/accessToken.middleware";

const router = express.Router();

router.use("/api/customer", verifyAccessToken, authorizeRoles("customer"));

router.get("/api/customer/bookings", customerController.getBookings);
router.get("/api/customer/vouchers/available", customerController.getAvailableVouchers);
router.post("/api/customer/bookings", customerController.createBooking);
router.put("/api/customer/profile", customerController.updateProfile);
router.put("/api/customer/password", customerController.updatePassword);
router.put("/api/customer/bookings/:bookingId/pay", customerController.payBooking);
router.put("/api/customer/bookings/:bookingId/cancel", customerController.cancelBooking);
router.put("/api/customer/bookings/:bookingId/withdraw-cancel", customerController.withdrawCancelBooking);
router.put("/api/customer/bookings/:bookingId/participants", customerController.updateBookingTraveler);
router.post("/api/customer/bookings/:bookingId/reviews", customerController.createBookingReview);

// Wishlist / Storage routes
router.get("/api/customer/wishlist", customerController.getWishlist);
router.post("/api/customer/wishlist", customerController.addToWishlist);
router.delete("/api/customer/wishlist/:tourId", customerController.removeFromWishlist);

export default router;
