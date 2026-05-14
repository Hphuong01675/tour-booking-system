// backend/routes/user.routes.js
const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const verifyToken = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");

const schema = require("../validations/user.validation");

router.get(
    "/profile",
    verifyToken,
    userController.getProfile
);

router.put(
    "/profile",
    verifyToken,
    validate(schema),
    userController.updateProfile
);

module.exports = router;
