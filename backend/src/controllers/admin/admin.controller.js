"use strict";

const dashboardService = require("../../services/admin/dashboard.service");
const voucherService = require("../../services/admin/voucher.service");
const userService = require("../../services/admin/user.service");
const tourService = require("../../services/admin/tour.service");

const sendError = (res, error) => {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message });
};

class AdminController {
    async getDashboard(req, res) {
        try {
            const dashboard = await dashboardService.getDashboard(req.query);
            return res.json(dashboard);
        } catch (error) {
            return sendError(res, error);
        }
    }

    async getVouchers(req, res) {
        try {
            const vouchers = await voucherService.getVouchers(req.query);
            return res.json(vouchers);
        } catch (error) {
            return sendError(res, error);
        }
    }

    async createVoucher(req, res) {
        try {
            const voucher = await voucherService.createVoucher(req.body, req.user.id);
            return res.status(201).json(voucher);
        } catch (error) {
            return sendError(res, error);
        }
    }

    async updateVoucherStatus(req, res) {
        try {
            const voucher = await voucherService.updateVoucherStatus(req.params.id, req.body);
            return res.json(voucher);
        } catch (error) {
            return sendError(res, error);
        }
    }

    async suggestCustomerEmails(req, res) {
        try {
            const users = await voucherService.suggestCustomerEmails(req.query.email);
            return res.json(users);
        } catch (error) {
            return sendError(res, error);
        }
    }

    async getUsers(req, res) {
        try {
            const users = await userService.getUsers(req.query);
            return res.json(users);
        } catch (error) {
            return sendError(res, error);
        }
    }

    async createUser(req, res) {
        try {
            const user = await userService.createUser(req.body);
            return res.status(201).json(user);
        } catch (error) {
            return sendError(res, error);
        }
    }

    async updateUserStatus(req, res) {
        try {
            const user = await userService.updateUserStatus(req.params.id, req.body, req.user.id);
            return res.json(user);
        } catch (error) {
            return sendError(res, error);
        }
    }

    async getTours(req, res) {
        try {
            const tours = await tourService.getTours(req.query);
            return res.json(tours);
        } catch (error) {
            return sendError(res, error);
        }
    }

    async updateTourStatus(req, res) {
        try {
            const tour = await tourService.updateTourStatus(req.params.id, req.body);
            return res.json(tour);
        } catch (error) {
            return sendError(res, error);
        }
    }
}

module.exports = new AdminController();
