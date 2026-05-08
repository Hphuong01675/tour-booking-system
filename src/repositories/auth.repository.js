const { User } = require("../models");
const redisClient = require("../config/redis");

const findUserByEmail = async (email) => {
    return await User.findOne({ where: { email } });
};

// Lưu OTP vào Redis với thời gian sống (TTL) là 300 giây (5 phút)
const upsertOTP = async (email, otp) => {
    await redisClient.setEx(`otp:${email}`, 300, otp);
};

// Lấy OTP từ Redis để đối chiếu
const getOTP = async (email) => {
    return await redisClient.get(`otp:${email}`);
};

// Xóa OTP ngay sau khi xác thực thành công
const deleteOTP = async (email) => {
    await redisClient.del(`otp:${email}`);
};

const updatePassword = async (email, hashedPassword) => {
    return await User.update(
        { password: hashedPassword },
        { where: { email } },
    );
};

module.exports = {
    findUserByEmail,
    upsertOTP,
    getOTP,
    deleteOTP,
    updatePassword,
};
