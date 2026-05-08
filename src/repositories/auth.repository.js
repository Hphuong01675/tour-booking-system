const { User } = require("../models");

// Temporary in-memory store for OTP (replace with Redis in production)
const otpStore = new Map();

const findUserByEmail = async (email) => {
    return await User.findOne({ where: { email } });
};

// Lưu OTP vào memory với thời gian sống (TTL) là 300 giây (5 phút)
const upsertOTP = async (email, otp) => {
    const expiredAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(email, { otp, expiredAt });
};

// Lấy OTP từ memory để đối chiếu
const getOTP = async (email) => {
    const data = otpStore.get(email);
    if (!data || Date.now() > data.expiredAt) {
        otpStore.delete(email);
        return null;
    }
    return data.otp;
};

// Xóa OTP ngay sau khi xác thực thành công
const deleteOTP = async (email) => {
    otpStore.delete(email);
};

const updatePassword = async (email, hashedPassword) => {
    return await User.update(
        { password: hashedPassword },
        { where: { email } },
    );
};

const createUser = async (userData) => {
    return await User.create(userData);
};

const activateUser = async (email) => {
    return await User.update(
        { isActive: true },
        { where: { email } },
    );
};

module.exports = {
    findUserByEmail,
    upsertOTP,
    getOTP,
    deleteOTP,
    updatePassword,
    createUser,
    activateUser,
};
