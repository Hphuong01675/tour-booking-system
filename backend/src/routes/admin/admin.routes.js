"use strict";

const express = require("express");
const adminController = require("../../controllers/admin/admin.controller");
const {
    authorizeRoles,
    verifyAccessToken,
} = require("../../middlewares/accessToken.middleware");

const router = express.Router();

router.get(
    "/api/admin/dashboard",
    verifyAccessToken,
    authorizeRoles("admin"),
    adminController.getDashboard.bind(adminController),
);

router.get(
    "/api/admin/vouchers",
    verifyAccessToken,
    authorizeRoles("admin"),
    adminController.getVouchers.bind(adminController),
);

router.post(
    "/api/admin/vouchers",
    verifyAccessToken,
    authorizeRoles("admin"),
    adminController.createVoucher.bind(adminController),
);

router.patch(
    "/api/admin/vouchers/:id/status",
    verifyAccessToken,
    authorizeRoles("admin"),
    adminController.updateVoucherStatus.bind(adminController),
);

router.get(
    "/api/admin/customers/suggest",
    verifyAccessToken,
    authorizeRoles("admin"),
    adminController.suggestCustomerEmails.bind(adminController),
);

router.get(
    "/api/admin/users",
    verifyAccessToken,
    authorizeRoles("admin"),
    adminController.getUsers.bind(adminController),
);

router.post(
    "/api/admin/users",
    verifyAccessToken,
    authorizeRoles("admin"),
    adminController.createUser.bind(adminController),
);

router.patch(
    "/api/admin/users/:id/status",
    verifyAccessToken,
    authorizeRoles("admin"),
    adminController.updateUserStatus.bind(adminController),
);

router.get(
    "/api/admin/tours",
    verifyAccessToken,
    authorizeRoles("admin"),
    adminController.getTours.bind(adminController),
);

router.patch(
    "/api/admin/tours/:id/status",
    verifyAccessToken,
    authorizeRoles("admin"),
    adminController.updateTourStatus.bind(adminController),
);

module.exports = router;
