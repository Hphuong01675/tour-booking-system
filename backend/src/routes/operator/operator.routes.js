// Path: backend/src/routes/operator/operator.routes.js
"use strict";

import express from "express";
import operatorController from "../../controllers/operator/operator.controller";
import { verifyAccessToken, authorizeRoles } from "../../middlewares/accessToken.middleware";
import upload from "../../middlewares/upload.middleware";
import tourValidation from "../../validations/tour.validation";

const router = express.Router();

// Yêu cầu xác thực và phân quyền operator cho tất cả các route bên dưới
router.use("/api/operator", verifyAccessToken, authorizeRoles("operator"));

router.get("/api/operator/profile", operatorController.getProfile);
router.patch("/api/operator/profile", operatorController.updateProfile);
router.post("/api/operator/change-password", operatorController.changePassword);

// Information categories
router.get("/api/operator/info-categories", operatorController.getInfoCategories);

// Tours routes
router.get("/api/operator/tours", operatorController.getTours);
router.get("/api/operator/tours/hard-approval", operatorController.getHardApprovalTours);
router.post("/api/operator/tours", tourValidation.validateCreateTour, operatorController.createTour);
router.post("/api/operator/tours/:id/images", upload.any(), operatorController.uploadTourImages);
router.delete("/api/operator/tours/:id/images/:imageId", operatorController.deleteTourImage);
router.get("/api/operator/tours/by-slug/:slug", operatorController.getTourBySlug);
router.get("/api/operator/tours/:id", operatorController.getTourDetail);
router.patch("/api/operator/tours/:id", operatorController.updateTour);

// Guide assignments
router.get("/api/operator/tour-schedules/:scheduleId", operatorController.getScheduleDetail);
router.get("/api/operator/guides/available", operatorController.getAvailableGuides);
router.post("/api/operator/tour-assignments", operatorController.assignGuide);

// Approvals & participants
router.get("/api/operator/tours/:id/participants", operatorController.getTourParticipants);
router.get("/api/operator/bookings/:bookingId/verify", operatorController.getBookingVerification);
router.put("/api/operator/bookings/:bookingId/approve", operatorController.approveBooking);
router.put("/api/operator/bookings/:bookingId/reject", operatorController.rejectBooking);
router.get("/api/operator/bookings/pending", operatorController.getPendingBookings);

// Customer management & cancellation
router.get("/api/operator/customers", operatorController.searchCustomer);
router.get("/api/operator/customers/:customerId/bookings", operatorController.getCustomerBookings);
router.get("/api/operator/bookings/:bookingId/refund-estimate", operatorController.getRefundEstimate);
router.post("/api/operator/bookings/:bookingId/cancel", operatorController.cancelBooking);

export default router;
