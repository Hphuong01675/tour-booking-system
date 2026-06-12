const Joi = require("joi");

/**
 * Schema validate cho bước 1: Quên mật khẩu
 * Input: { email }
 */
const forgotPasswordSchema = Joi.object({
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
            "string.base": "Email phải là chuỗi ký tự.",
            "string.email": "Email không đúng định dạng.",
            "string.empty": "Email không được để trống.",
            "any.required": "Email là bắt buộc.",
        }),
});

/**
 * Schema validate cho bước 2: Xác minh OTP
 * Input: { email, otp }
 */
const verifyOTPSchema = Joi.object({
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
            "string.email": "Email không đúng định dạng.",
            "any.required": "Email là bắt buộc.",
        }),
    otp: Joi.string()
        .length(4)
        .pattern(/^[0-9]+$/)
        .required()
        .messages({
            "string.base": "OTP phải là chuỗi ký tự.",
            "string.length": "OTP phải có đúng 4 chữ số.",
            "string.pattern.base": "OTP chỉ được chứa chữ số.",
            "string.empty": "OTP không được để trống.",
            "any.required": "OTP là bắt buộc.",
        }),
});

/**
 * Schema validate cho bước 3: Đặt mật khẩu mới
 * Input: { newPassword }
 */
const resetPasswordSchema = Joi.object({
    newPassword: Joi.string()
        .min(8)
        .required()
        .messages({
            "string.base": "Mật khẩu phải là chuỗi ký tự.",
            "string.min": "Mật khẩu phải có ít nhất 8 ký tự.",
            "string.empty": "Mật khẩu không được để trống.",
            "any.required": "Mật khẩu mới là bắt buộc.",
        }),
});

module.exports = {
    forgotPasswordSchema,
    verifyOTPSchema,
    resetPasswordSchema,
};
