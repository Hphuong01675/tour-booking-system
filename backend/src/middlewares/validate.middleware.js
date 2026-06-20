// Path: backend/src/middlewares/validate.middleware.js

export const validateRequest = (schema) => {
    return (req, res, next) => {
        // Custom validation logic if schema-based (like Joi/Zod) is introduced.
        // In our case we use custom validations inside auth.validation.js.
        next();
    };
};
