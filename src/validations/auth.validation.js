const Joi = require("joi");

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.email": "Email không đúng định dạng",
        "any.required": "Email là bắt buộc",
    }),
});

const verifyOTPSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(4).required().messages({
        "string.length": "Mã OTP phải đúng 4 ký tự",
    }),
});

const resetPasswordSchema = Joi.object({
    newPassword: Joi.string().min(6).required().messages({
        "string.min": "Mật khẩu phải từ 6 ký tự trở lên",
    }),
});

module.exports = { forgotPasswordSchema, verifyOTPSchema, resetPasswordSchema };
