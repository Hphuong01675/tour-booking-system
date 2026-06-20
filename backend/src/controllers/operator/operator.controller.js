// Path: backend/src/controllers/operator/operator.controller.js
"use strict";

const bcrypt = require("bcryptjs");
const db = require("../../models");
const { User, Tour, TourImage } = db;

class OperatorController {
    /**
     * Lấy thông tin cá nhân của operator (operator-1)
     */
    async getProfile(req, res) {
        try {
            const operator = await User.findByPk("operator-1");
            if (!operator) {
                return res.status(404).json({ error: "Operator not found" });
            }
            res.json(operator);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * Lấy danh sách tour của operator
     */
    async getOperatorTours(req, res) {
        try {
            const tours = await Tour.findAll({
                include: [
                    {
                        model: TourImage,
                        as: 'images',
                        attributes: ['imageUrl', 'isThumbnail']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            res.json({
                data: tours,
                currentPage: 1,
                totalPages: 1,
                totalItems: tours.length
            });
        } catch (err) {
            console.error("Error fetching operator tours:", err);
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * Cập nhật thông tin cá nhân của operator (operator-1)
     */
    async updateProfile(req, res) {
        try {
            const { fullName, phone, dateOfBirth, address, avatarUrl } = req.body;
            const operator = await User.findByPk("operator-1");
            if (!operator) {
                return res.status(404).json({ error: "Operator not found" });
            }

            if (fullName !== undefined) operator.fullName = fullName;
            if (phone !== undefined) operator.phone = phone;
            if (dateOfBirth !== undefined) {
                operator.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
            }
            if (address !== undefined) operator.address = address;
            if (avatarUrl !== undefined) operator.avatarUrl = avatarUrl;

            await operator.save();
            res.json(operator);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * Thay đổi mật khẩu của operator (operator-1)
     */
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc." });
            }

            const operator = await User.findByPk("operator-1");
            if (!operator) {
                return res.status(404).json({ error: "Operator not found" });
            }

            // Kiểm tra mật khẩu hiện tại
            let isMatch = await bcrypt.compare(currentPassword, operator.passwordHash);
            if (!isMatch && currentPassword === operator.passwordHash) {
                isMatch = true;
            }

            if (!isMatch) {
                return res.status(400).json({ error: "Mật khẩu hiện tại không chính xác." });
            }

            // Kiểm tra các ràng buộc mật khẩu mới (8 ký tự, chữ hoa, chữ thường, số, ký tự đặc biệt)
            const hasUpper = /[A-Z]/.test(newPassword);
            const hasLower = /[a-z]/.test(newPassword);
            const hasNumber = /\d/.test(newPassword);
            const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

            if (newPassword.length < 8) {
                return res.status(400).json({ error: "Mật khẩu phải có ít nhất 8 ký tự." });
            }
            if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
                return res.status(400).json({
                    error: "Mật khẩu phải bao gồm: 1 chữ in hoa, 1 chữ thường, 1 chữ số, 1 ký tự đặc biệt."
                });
            }

            // Mã hóa mật khẩu mới và lưu
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);
            operator.passwordHash = passwordHash;
            await operator.save();

            res.json({ success: true, message: "Đổi mật khẩu thành công!" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new OperatorController();
