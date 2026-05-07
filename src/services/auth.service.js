const authRepository = require("../repositories/auth.repository");
const { sendOTPEmail } = require("./mail.service");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const requestForgotPassword = async (email) => {
    const user = await authRepository.findUserByEmail(email);
    if (!user) throw new Error("EMAIL_NOT_FOUND");

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

    await authRepository.upsertOTP(email, otp, expiredAt);
    await sendOTPEmail(email, otp);
};

const verifyOTPAndGenerateToken = async (email, otp) => {
    const resetRecord = await authRepository.findOTPRecord(email, otp);
    if (!resetRecord) throw new Error("INVALID_OTP");
    if (new Date() > resetRecord.expiredAt) throw new Error("OTP_EXPIRED");

    const resetToken = jwt.sign(
        { email, step: "verified" },
        process.env.JWT_OTP_SECRET,
        { expiresIn: "5m" },
    );

    await authRepository.deleteOTP(resetRecord);
    return resetToken;
};

const updateNewPassword = async (email, newPassword) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    return await authRepository.updatePassword(email, hashedPassword);
};

module.exports = {
    requestForgotPassword,
    verifyOTPAndGenerateToken,
    updateNewPassword,
};
