const express = require("express");

const router = express.Router();

const {
    verifyToken,
    authorizeRoles,
} = require("../middlewares/auth.middleware");

router.get(
    "/profile",
    verifyToken,
    authorizeRoles("user"),
    (req, res) => {

        return res.status(200).json({
            success: true,
            message: "USER PROFILE",
            user: req.user,
        });
    }
);

module.exports = router;