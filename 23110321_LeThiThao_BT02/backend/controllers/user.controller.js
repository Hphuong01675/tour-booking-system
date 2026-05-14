// backend/controllers/user.controller.js
const userService = require("../services/user.service");

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const data = await userService.updateProfile(userId, req.body);

        res.json({
            message: "Updated successfully",
            data,
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await userService.getProfile(userId);

        res.json({
            message: "Profile loaded successfully",
            data,
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = {
    updateProfile,
    getProfile,
};
