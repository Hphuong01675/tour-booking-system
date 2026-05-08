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

const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.email": "Email không đúng định dạng",
        "any.required": "Email là bắt buộc",
    }),
    password: Joi.string()
        .min(8)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
        .required()
        .messages({
            "string.min": "Mật khẩu phải từ 8 ký tự trở lên",
            "string.pattern.base": "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt",
            "any.required": "Mật khẩu là bắt buộc",
        }),
    firstName: Joi.string().min(2).max(50).pattern(new RegExp('^[a-zA-ZÀ-ỹ\\s]+$')).required().messages({
        "string.min": "Họ phải từ 2 ký tự trở lên",
        "string.max": "Họ không được quá 50 ký tự",
        "string.pattern.base": "Họ chỉ được chứa chữ cái và khoảng trắng",
        "any.required": "Họ là bắt buộc",
    }),
    lastName: Joi.string().min(2).max(50).pattern(new RegExp('^[a-zA-ZÀ-ỹ\\s]+$')).required().messages({
        "string.min": "Tên phải từ 2 ký tự trở lên",
        "string.max": "Tên không được quá 50 ký tự",
        "string.pattern.base": "Tên chỉ được chứa chữ cái và khoảng trắng",
        "any.required": "Tên là bắt buộc",
    }),
    phoneNumber: Joi.string().pattern(new RegExp('^(0[3|5|7|8|9])+([0-9]{8})$')).optional().messages({
        "string.pattern.base": "Số điện thoại không đúng định dạng (VD: 0901234567)",
    }),
    address: Joi.string().max(255).optional().messages({
        "string.max": "Địa chỉ không được quá 255 ký tự",
    }),
    gender: Joi.boolean().optional().messages({
        "boolean.base": "Giới tính phải là true (Nam) hoặc false (Nữ)",
    }),
});

const verifyActivationOTPSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(4).required().messages({
        "string.length": "Mã OTP phải đúng 4 ký tự",
    }),
});

module.exports = { forgotPasswordSchema, verifyOTPSchema, resetPasswordSchema, registerSchema, verifyActivationOTPSchema };
