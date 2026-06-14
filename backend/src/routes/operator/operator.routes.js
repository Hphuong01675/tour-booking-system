// Path: backend/src/routes/operator/operator.routes.js
"use strict";

const express = require("express");
const operatorController = require("../../controllers/operator/operator.controller");

const router = express.Router();

router.get("/api/operator/profile", operatorController.getProfile);
router.patch("/api/operator/profile", operatorController.updateProfile);
router.post("/api/operator/change-password", operatorController.changePassword);

module.exports = router;
