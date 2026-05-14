// backend/services/user.service.js
const userRepo = require("../repositories/user.repository");

const updateProfile = async (userId, data) => {
    const user = await userRepo.findById(userId);
    if (!user) throw new Error("User not found");

    const allowed = ["fullName", "age", "gender", "phone"];

    let updateData = {};
    allowed.forEach((field) => {
        if (data[field] !== undefined) {
            updateData[field] = data[field];
        }
    });

    await userRepo.update(userId, updateData);

    return await userRepo.findById(userId);
};

const getProfile = async (userId) => {
    const user = await userRepo.findById(userId);
    if (!user) throw new Error("User not found");
    return user;
};

module.exports = {
    updateProfile,
    getProfile,
};
