/**
 * Middleware validate dữ liệu request body bằng Joi schema.
 * Nếu không hợp lệ → trả về 400 với thông báo lỗi đầu tiên.
 */
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: true });

    if (error) {
        return res.status(400).json({
            message: error.details[0].message,
        });
    }

    next();
};

module.exports = validate;
