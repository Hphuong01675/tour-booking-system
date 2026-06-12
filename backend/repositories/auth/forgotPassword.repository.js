const { User } = require("../../models");
const redisClient = require("../../config/redis");

/**
 * Kiểm tra email có tồn tại trong DB không
 */
const findUserByEmail = async (email) => {
    return await User.findOne({ where: { email } });
};

/**
 * Lưu OTP vào Redis với TTL 300 giây (5 phút)
 * Key: otp:<email>
 */
const upsertOTP = async (email, otp) => {
    await redisClient.setEx(`otp:${email}`, 300, otp);
};

/**
 * Lấy OTP từ Redis để đối chiếu
 * Trả về null nếu đã hết TTL hoặc không tồn tại
 */
const getOTP = async (email) => {
    return await redisClient.get(`otp:${email}`);
};

/**
 * Xóa OTP khỏi Redis sau khi xác minh thành công (OTP chỉ dùng 1 lần)
 */
const deleteOTP = async (email) => {
    await redisClient.del(`otp:${email}`);
};

const incrementOtpAttempt = async (email, windowSeconds = 600) => {
    const attemptsKey = `otp_attempts:${email}`;
    const attempts = await redisClient.incr(attemptsKey);
    if (attempts === 1) {
        await redisClient.expire(attemptsKey, windowSeconds);
    }
    return attempts;
};

const getOtpAttempts = async (email) => {
    const attempts = await redisClient.get(`otp_attempts:${email}`);
    return parseInt(attempts, 10) || 0;
};

const resetOtpAttempts = async (email) => {
    await redisClient.del(`otp_attempts:${email}`);
};

const lockOtpVerification = async (email, lockSeconds = 900) => {
    await redisClient.setEx(`otp_blocked:${email}`, lockSeconds, "1");
};

const isOtpBlocked = async (email) => {
    const blocked = await redisClient.get(`otp_blocked:${email}`);
    return blocked !== null;
};

/**
 * Cập nhật mật khẩu mới (đã được hash) vào DB
 */
const updatePassword = async (email, hashedPassword) => {
    return await User.update(
        { password: hashedPassword },
        { where: { email } }
    );
};

/**
 * Lưu resetToken vào Redis (TTL 5 phút)
 */
const saveResetToken = async (token, email) => {
    await redisClient.setEx(`reset_token:${token}`, 300, email);
};

/**
 * Xóa resetToken sau khi dùng
 */
const deleteResetToken = async (token) => {
    await redisClient.del(`reset_token:${token}`);
};

module.exports = {
    findUserByEmail,
    upsertOTP,
    getOTP,
    deleteOTP,
    incrementOtpAttempt,
    getOtpAttempts,
    resetOtpAttempts,
    lockOtpVerification,
    isOtpBlocked,
    updatePassword,
    saveResetToken,
    deleteResetToken,
};
