"use strict";

const bcrypt = require("bcryptjs");
const db = require("../../models");
const userRepository = require("../../repositories/admin/user.repository");
const {
    createHttpError,
    validateStaffPayload,
    validateUserStatusPayload,
} = require("../../validations/admin.validation");

const { Op } = db.Sequelize;

class AdminUserService {
    async getUsers(query) {
        const {
            group = "staff",
            search = "",
            role = "all",
            status = "all",
            page = 1,
            limit = 10,
        } = query;
        const where = {};
        const normalizedSearch = search.trim();

        if (group === "customer") {
            where.role = "customer";
        } else {
            where.role = { [Op.in]: ["admin", "operator", "guide"] };
        }

        if (role !== "all") {
            where.role = role;
        }

        if (status === "active") where.isActive = true;
        if (status === "inactive") where.isActive = false;

        if (normalizedSearch) {
            where[Op.or] = [
                { fullName: { [Op.like]: `%${normalizedSearch}%` } },
                { email: { [Op.like]: `%${normalizedSearch}%` } },
                { phone: { [Op.like]: `%${normalizedSearch}%` } },
            ];
        }

        const pageNumber = Math.max(Number(page) || 1, 1);
        const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50);
        const offset = (pageNumber - 1) * pageSize;
        const result = await userRepository.findAndCountUsers({ where, pageSize, offset });

        let bookingCountByUser = {};
        if (group === "customer" && result.rows.length > 0) {
            const customerIds = result.rows.map((user) => user.id);
            const bookingCounts = await userRepository.getBookingCounts(customerIds);

            bookingCountByUser = bookingCounts.reduce((acc, item) => {
                acc[item.customerId] = Number(item.get("tourCount") || 0);
                return acc;
            }, {});
        }

        const users = result.rows.map((user) => {
            const plainUser = user.get({ plain: true });
            return {
                ...plainUser,
                tourCount: bookingCountByUser[plainUser.id] || 0,
            };
        });
        const [staffCount, customerCount, activeCount, inactiveCount] = await userRepository.getSummaryCounts();

        return {
            users,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total: result.count,
                totalPages: Math.ceil(result.count / pageSize),
            },
            summary: {
                staffCount,
                customerCount,
                activeCount,
                inactiveCount,
            },
        };
    }

    async createUser(payload) {
        const userData = validateStaffPayload(payload);
        const existingUser = await userRepository.findByEmail(userData.email);

        if (existingUser) {
            throw createHttpError(409, "Email đã tồn tại.");
        }

        const passwordHash = await bcrypt.hash(userData.password, 10);
        const user = await userRepository.create({
            fullName: userData.fullName,
            email: userData.email,
            passwordHash,
            phone: userData.phone,
            dateOfBirth: userData.dateOfBirth,
            address: userData.address,
            role: userData.role,
            isActive: userData.isActive,
        });

        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            address: user.address,
            role: user.role,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            createdAt: user.createdAt,
        };
    }

    async updateUserStatus(id, payload, currentUserId) {
        const { isActive } = validateUserStatusPayload(payload);
        const user = await userRepository.findById(id);

        if (!user) {
            throw createHttpError(404, "Không tìm thấy người dùng.");
        }

        if (user.id === currentUserId && isActive === false) {
            throw createHttpError(400, "Không thể khóa tài khoản đang đăng nhập.");
        }

        user.isActive = isActive;
        await user.save();

        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        };
    }
}

module.exports = new AdminUserService();
