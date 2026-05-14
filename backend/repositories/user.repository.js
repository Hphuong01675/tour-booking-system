// backend/repositories/user.repository.js
const db = require("../models");

const findById = (id) => {
    return db.User.findByPk(id);
};

const update = (id, data) => {
    return db.User.update(data, { where: { id } });
};

module.exports = {
    findById,
    update,
};
