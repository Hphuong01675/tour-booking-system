const { validationResult } = require("express-validator");

const validateExpress = (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }

    next();
};

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({
            message: error.message,
        });
    }

    next();
};

module.exports = {validateExpress,validate};
