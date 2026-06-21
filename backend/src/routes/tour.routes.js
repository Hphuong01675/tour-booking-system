import express from "express";
import tourController from "../controllers/tour.controller";

const router = express.Router();

router.get("/api/tours", tourController.getTours);
router.get("/api/tours/:id", tourController.getTourDetail);

export default router;
