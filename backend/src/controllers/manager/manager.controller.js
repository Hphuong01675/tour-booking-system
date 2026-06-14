// Path: backend/src/controllers/manager/manager.controller.js
"use strict";

const bcrypt = require("bcryptjs");
const db = require("../../models");
const { User } = db;

class ManagerController {
    /**
     * Lấy thông tin cá nhân của manager (operator-1)
     */
    async getProfile(req, res) {
        try {
            const manager = await User.findByPk("operator-1");
            if (!manager) {
                return res.status(404).json({ error: "Manager not found" });
            }
            res.json(manager);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * Cập nhật thông tin cá nhân của manager (operator-1)
     */
    async updateProfile(req, res) {
        try {
            const { fullName, phone, dateOfBirth, address, avatarUrl } = req.body;
            const manager = await User.findByPk("operator-1");
            if (!manager) {
                return res.status(404).json({ error: "Manager not found" });
            }

            if (fullName !== undefined) manager.fullName = fullName;
            if (phone !== undefined) manager.phone = phone;
            if (dateOfBirth !== undefined) {
                manager.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
            }
            if (address !== undefined) manager.address = address;
            if (avatarUrl !== undefined) manager.avatarUrl = avatarUrl;

            await manager.save();
            res.json(manager);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * Thay đổi mật khẩu của manager (operator-1)
     */
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc." });
            }

            const manager = await User.findByPk("operator-1");
            if (!manager) {
                return res.status(404).json({ error: "Manager not found" });
            }

            // Kiểm tra mật khẩu hiện tại
            let isMatch = await bcrypt.compare(currentPassword, manager.passwordHash);
            if (!isMatch && currentPassword === manager.passwordHash) {
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
            manager.passwordHash = passwordHash;
            await manager.save();

            res.json({ success: true, message: "Đổi mật khẩu thành công!" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new ManagerController();
