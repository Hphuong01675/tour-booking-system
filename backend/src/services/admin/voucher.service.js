"use strict";

const db = require("../../models");
const voucherRepository = require("../../repositories/admin/voucher.repository");
const {
    createHttpError,
    validateVoucherPayload,
    validateVoucherStatusPayload,
} = require("../../validations/admin.validation");

const { Op } = db.Sequelize;
const toNumber = (value) => Number(value || 0);

class AdminVoucherService {
    async getVouchers(query) {
        const {
            search = "",
            status = "all",
            type = "all",
            page = 1,
            limit = 10,
        } = query;
        const where = {};
        const normalizedSearch = search.trim();

        if (normalizedSearch) {
            where[Op.or] = [
                { code: { [Op.like]: `%${normalizedSearch}%` } },
                { name: { [Op.like]: `%${normalizedSearch}%` } },
            ];
        }

        if (status === "active") where.isActive = true;
        if (status === "paused") where.isActive = false;
        if (type !== "all") where.discountType = type;

        const pageNumber = Math.max(Number(page) || 1, 1);
        const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50);
        const offset = (pageNumber - 1) * pageSize;
        const soon = new Date();
        soon.setDate(soon.getDate() + 7);

        const [
            result,
            totalUsage,
            activeCount,
            expiringSoonCount,
            totalVoucherCount,
        ] = await voucherRepository.list({ where, pageSize, offset, soon });

        return {
            vouchers: result.rows,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total: result.count,
                totalPages: Math.ceil(result.count / pageSize),
            },
            summary: {
                totalUsage: toNumber(totalUsage),
                activeCount,
                expiringSoonCount,
                totalVoucherCount,
            },
        };
    }

    async createVoucher(payload, createdBy) {
        const voucherData = validateVoucherPayload(payload);
        const transaction = await db.sequelize.transaction();

        try {
            const existing = await voucherRepository.findByCode(voucherData.code, transaction);

            if (existing) {
                throw createHttpError(409, "Mã voucher đã tồn tại.");
            }

            const voucher = await voucherRepository.create(
                {
                    name: voucherData.name,
                    code: voucherData.code,
                    description: voucherData.description,
                    discountType: voucherData.discountType,
                    discountValue: voucherData.discountValue,
                    maxDiscountAmount: voucherData.maxDiscountAmount,
                    minOrderValue: voucherData.minOrderValue,
                    validFrom: voucherData.validFrom,
                    validUntil: voucherData.validUntil,
                    totalQuantity: voucherData.totalQuantity,
                    usageLimitPerUser: voucherData.usageLimitPerUser,
                    targetType: voucherData.targetType,
                    createdBy,
                    isActive: true,
                },
                transaction,
            );

            if (voucherData.targetType === "specific") {
                const users = await voucherRepository.findActiveCustomersByEmails(voucherData.emails, transaction);

                if (users.length !== voucherData.emails.length) {
                    throw createHttpError(400, "Một số email không tồn tại hoặc không phải khách hàng đang hoạt động.");
                }

                await voucherRepository.createTargets(
                    users.map((user) => ({
                        voucherId: voucher.id,
                        userId: user.id,
                    })),
                    transaction,
                );
            }

            await transaction.commit();
            return voucher;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async updateVoucherStatus(id, payload) {
        const { isActive } = validateVoucherStatusPayload(payload);
        const voucher = await voucherRepository.findById(id);

        if (!voucher) {
            throw createHttpError(404, "Voucher not found");
        }

        voucher.isActive = isActive;
        await voucher.save();

        return voucher;
    }

    suggestCustomerEmails(email) {
        const search = String(email || "").trim();
        return voucherRepository.suggestCustomerEmails(search);
    }
}

module.exports = new AdminVoucherService();
