const express = require("express");

const router = express.Router();

const {
    verifyToken,
    authorizeRoles,
} = require("../middlewares/auth.middleware");

router.get(
    "/profile",
    verifyToken,
    authorizeRoles("admin"),
    (req, res) => {

        return res.status(200).json({
            success: true,
            message: "ADMIN PROFILE",
            user: req.user,
        });
    }
);

module.exports = router;