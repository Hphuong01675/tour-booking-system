"use strict";

const createHttpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const toNullableNumber = (value) => {
    if (value === undefined || value === null || value === "") return null;
    return Number(value);
};

const toBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";

const toDateOrNull = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const isNonNegative = (value) => value === null || (Number.isFinite(value) && value >= 0);

const validateVoucherPayload = (payload) => {
    const {
        name,
        code,
        description,
        discountType,
        discountValue,
        maxDiscountAmount,
        minOrderValue,
        validFrom,
        validUntil,
        totalQuantity,
        usageLimitPerUser,
        targetType = "all",
        emails = [],
    } = payload;

    if (!name || !code || !discountType || discountValue === undefined) {
        throw createHttpError(400, "Tên, mã, loại va giá trị voucher là bắt buộc.");
    }

    if (!["percent", "fixed"].includes(discountType)) {
        throw createHttpError(400, "Loại voucher không hợp lệ.");
    }

    if (discountType === "percent" && (Number(discountValue) <= 0 || Number(discountValue) > 100)) {
        throw createHttpError(400, "Voucher phần trăm phải nằm trong khoảng 1 - 100.");
    }

    if (!["all", "specific"].includes(targetType)) {
        throw createHttpError(400, "Đối tượng voucher không hợp lệ.");
    }

    const cleanedEmails = Array.from(
        new Set(
            (Array.isArray(emails) ? emails : [])
                .map((email) => String(email).trim().toLowerCase())
                .filter(Boolean),
        ),
    );

    if (targetType === "specific" && cleanedEmails.length === 0) {
        throw createHttpError(400, "Cần nhập email khách hàng nếu chọn đối tượng cụ thể.");
    }

    const numericDiscountValue = Number(discountValue);
    const numericMaxDiscountAmount = toNullableNumber(maxDiscountAmount);
    const numericMinOrderValue = minOrderValue === undefined || minOrderValue === ""
        ? 0
        : Number(minOrderValue);
    const numericTotalQuantity = toNullableNumber(totalQuantity);
    const numericUsageLimitPerUser = usageLimitPerUser === undefined || usageLimitPerUser === ""
        ? 1
        : Number(usageLimitPerUser);
    const validFromDate = toDateOrNull(validFrom);
    const validUntilDate = toDateOrNull(validUntil);

    if (!Number.isFinite(numericDiscountValue) || numericDiscountValue <= 0) {
        throw createHttpError(400, "Giá trị voucher phải lớn hơn 0.");
    }

    if (
        !isNonNegative(numericMaxDiscountAmount) ||
        !isNonNegative(numericMinOrderValue) ||
        !isNonNegative(numericTotalQuantity) ||
        !Number.isFinite(numericUsageLimitPerUser) ||
        numericUsageLimitPerUser < 1
    ) {
        throw createHttpError(400, "Số lượng và giá trị điều kiện voucher không hợp lệ.");
    }

    if ((validFrom && !validFromDate) || (validUntil && !validUntilDate)) {
        throw createHttpError(400, "Ngày hiệu lực voucher không hợp lệ.");
    }

    if (validFromDate && validUntilDate && validFromDate > validUntilDate) {
        throw createHttpError(400, "Ngày bắt đầu không được lớn hơn ngày kết thúc.");
    }

    return {
        name: String(name).trim(),
        code: String(code).trim().toUpperCase(),
        description,
        discountType,
        discountValue: numericDiscountValue,
        maxDiscountAmount: numericMaxDiscountAmount,
        minOrderValue: numericMinOrderValue,
        validFrom: validFromDate,
        validUntil: validUntilDate,
        totalQuantity: numericTotalQuantity,
        usageLimitPerUser: numericUsageLimitPerUser,
        targetType,
        emails: cleanedEmails,
    };
};

const validateVoucherStatusPayload = (payload) => {
    if (payload.isActive === undefined) {
        throw createHttpError(400, "Trạng thái voucher là bắt buộc.");
    }

    return { isActive: toBoolean(payload.isActive) };
};

const validateStaffPayload = (payload) => {
    const {
        fullName,
        email,
        password,
        phone,
        dateOfBirth,
        address,
        role = "operator",
        isActive = true,
    } = payload;
    const normalizedFullName = String(fullName || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const allowedStaffRoles = ["admin", "operator", "guide"];

    if (!normalizedFullName || !normalizedEmail || !password) {
        throw createHttpError(400, "Họ tên, email và mật khẩu là bắt buộc.");
    }

    if (!allowedStaffRoles.includes(role)) {
        throw createHttpError(400, "Vai trò nhân viên không hợp lệ.");
    }

    if (String(password).length < 6) {
        throw createHttpError(400, "Mật khẩu phải có ít nhất 6 ký tự.");
    }

    const birthDate = toDateOrNull(dateOfBirth);
    if (dateOfBirth && !birthDate) {
        throw createHttpError(400, "Ngày sinh không hợp lệ.");
    }

    return {
        fullName: normalizedFullName,
        email: normalizedEmail,
        password: String(password),
        phone: phone ? String(phone).trim() : null,
        dateOfBirth: birthDate,
        address: address ? String(address).trim() : null,
        role,
        isActive: toBoolean(isActive),
    };
};

const validateUserStatusPayload = (payload) => {
    if (payload.isActive === undefined) {
        throw createHttpError(400, "Trạng thái người dùng là bắt buộc.");
    }

    return { isActive: toBoolean(payload.isActive) };
};

const validateTourStatusPayload = (payload) => {
    const allowedStatuses = ["draft", "pending", "upcoming", "open", "closed", "cancelled"];

    if (!allowedStatuses.includes(payload.status)) {
        throw createHttpError(400, "Trạng thái tour không hợp lệ.");
    }

    return { status: payload.status };
};

module.exports = {
    createHttpError,
    toBoolean,
    toDateOrNull,
    toNullableNumber,
    validateStaffPayload,
    validateTourStatusPayload,
    validateUserStatusPayload,
    validateVoucherPayload,
    validateVoucherStatusPayload,
};
