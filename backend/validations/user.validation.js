// backend/validations/user.validation.js
const Joi = require("joi");

const updateProfileSchema = Joi.object({
    fullName: Joi.string().min(3),
    age: Joi.number().min(0),
    gender: Joi.string(),
    phone: Joi.string(),
});

module.exports = updateProfileSchema;
