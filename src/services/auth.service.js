const authRepository = require("../repositories/auth.repository");
const { sendOTPEmail, sendActivationOTPEmail } = require("./mail.service");
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

const registerUser = async (userData) => {
    const { email, password, ...otherData } = userData;

    // Check if user already exists
    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
        throw new Error("EMAIL_ALREADY_EXISTS");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with isActive = false
    const newUser = await authRepository.createUser({
        email,
        password: hashedPassword,
        ...otherData,
        isActive: false,
    });

    // Generate OTP for activation
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    await authRepository.upsertOTP(`activation:${email}`, otp);
    await sendActivationOTPEmail(email, otp);

    return newUser;
};

const verifyActivationOTP = async (email, otp) => {
    const savedOtp = await authRepository.getOTP(`activation:${email}`);

    if (!savedOtp || savedOtp !== otp) {
        throw new Error("INVALID_OTP");
    }

    // Activate user
    await authRepository.activateUser(email);
    await authRepository.deleteOTP(`activation:${email}`);
};

const verifyOTPAndGenerateToken = async (email, otp) => {
    const savedOtp = await authRepository.getOTP(email);

    if (!savedOtp || savedOtp !== otp) {
        throw new Error("INVALID_OTP"); // Redis trả về null nếu hết hạn hoặc không tồn tại
    }

    const resetToken = jwt.sign(
        { email, step: "verified" },
        process.env.JWT_OTP_SECRET,
        { expiresIn: "5m" },
    );

    await authRepository.deleteOTP(email);
    return resetToken;
};

const updateNewPassword = async (email, newPassword) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    return await authRepository.updatePassword(email, hashedPassword);
};

module.exports = {
    requestForgotPassword,
    registerUser,
    verifyActivationOTP,
    verifyOTPAndGenerateToken,
    updateNewPassword,
};
