"use strict";

const db = require("../../models");

const { Op } = db.Sequelize;

class AdminVoucherRepository {
    list({ where, pageSize, offset, soon }) {
        const { Voucher, VoucherTarget, User } = db;
        const now = new Date();

        return Promise.all([
            Voucher.findAndCountAll({
                where,
                include: [
                    {
                        model: VoucherTarget,
                        as: "targets",
                        include: [
                            {
                                model: User,
                                as: "user",
                                attributes: ["id", "fullName", "email"],
                            },
                        ],
                    },
                ],
                order: [["createdAt", "DESC"]],
                limit: pageSize,
                offset,
                distinct: true,
            }),
            Voucher.sum("usedCount"),
            Voucher.count({ where: { isActive: true } }),
            Voucher.count({
                where: {
                    isActive: true,
                    validUntil: {
                        [Op.gte]: now,
                        [Op.lte]: soon,
                    },
                },
            }),
            Voucher.count(),
        ]);
    }

    findByCode(code, transaction) {
        return db.Voucher.findOne({ where: { code }, transaction });
    }

    create(voucherData, transaction) {
        return db.Voucher.create(voucherData, { transaction });
    }

    findActiveCustomersByEmails(emails, transaction) {
        return db.User.findAll({
            where: {
                email: { [Op.in]: emails },
                role: "customer",
                isActive: true,
            },
            transaction,
        });
    }

    createTargets(targets, transaction) {
        return db.VoucherTarget.bulkCreate(targets, { transaction });
    }

    findById(id) {
        return db.Voucher.findByPk(id);
    }

    suggestCustomerEmails(search) {
        const where = {
            role: "customer",
            isActive: true,
        };

        if (search) {
            where.email = { [Op.like]: `%${search}%` };
        }

        return db.User.findAll({
            where,
            attributes: ["id", "fullName", "email"],
            order: [["email", "ASC"]],
            limit: 8,
        });
    }
}

module.exports = new AdminVoucherRepository();
