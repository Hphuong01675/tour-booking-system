// Path: backend/src/routes/manager/manager.routes.js
"use strict";

const express = require("express");
const managerController = require("../../controllers/manager/manager.controller");

const router = express.Router();

router.get("/api/managers/profile", managerController.getProfile);
router.patch("/api/managers/profile", managerController.updateProfile);
router.post("/api/managers/change-password", managerController.changePassword);

module.exports = router;
