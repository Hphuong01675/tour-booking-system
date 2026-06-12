const forgotPasswordRepository = require("../../repositories/auth/forgotPassword.repository");
const { sendForgotPasswordOTPEmail } = require("./mail.service");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

/**
 * Bước 1: Kiểm tra email → tạo OTP → lưu Redis → gửi mail
 */
const MAX_OTP_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5;
const OTP_ATTEMPT_WINDOW =
    parseInt(process.env.OTP_ATTEMPT_WINDOW, 10) || 10 * 60; // 10 phút
const OTP_BLOCK_DURATION =
    parseInt(process.env.OTP_BLOCK_DURATION, 10) || 15 * 60; // 15 phút

const requestForgotPassword = async (email) => {
    const user = await forgotPasswordRepository.findUserByEmail(email);
    if (!user) throw new Error("EMAIL_NOT_FOUND");

    // OTP 4 chữ số ngẫu nhiên
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Lưu OTP vào Redis với TTL 300 giây
    await forgotPasswordRepository.upsertOTP(email, otp);
    await forgotPasswordRepository.resetOtpAttempts(email);

    // Gửi email chứa OTP
    await sendForgotPasswordOTPEmail(email, otp);
};

/**
 * Bước 2: Xác minh OTP → tạo JWT resetToken (5 phút)
 */
const verifyOTPAndGenerateToken = async (email, otp) => {
    if (await forgotPasswordRepository.isOtpBlocked(email)) {
        throw new Error("OTP_BLOCKED");
    }

    const savedOtp = await forgotPasswordRepository.getOTP(email);
    if (!savedOtp) {
        await forgotPasswordRepository.resetOtpAttempts(email);
        throw new Error("OTP_EXPIRED");
    }

    if (savedOtp !== otp) {
        const attempts = await forgotPasswordRepository.incrementOtpAttempt(
            email,
            OTP_ATTEMPT_WINDOW,
        );

        if (attempts >= MAX_OTP_ATTEMPTS) {
            await forgotPasswordRepository.lockOtpVerification(
                email,
                OTP_BLOCK_DURATION,
            );
            await forgotPasswordRepository.deleteOTP(email);
            throw new Error("OTP_BLOCKED");
        }

        throw new Error("INVALID_OTP");
    }

    await forgotPasswordRepository.resetOtpAttempts(email);

    const resetToken = jwt.sign(
        { email, step: "verified" },
        process.env.JWT_OTP_SECRET,
        { expiresIn: "5m" },
    );

    // Xóa OTP sau khi xác minh thành công (dùng 1 lần)
    await forgotPasswordRepository.deleteOTP(email);

    // Lưu resetToken vào Redis
    await forgotPasswordRepository.saveResetToken(resetToken, email);

    return resetToken;
};

/**
 * Bước 3: Hash password mới → cập nhật vào DB
 */
const updateNewPassword = async (email, newPassword, token) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await forgotPasswordRepository.updatePassword(email, hashedPassword);

    // Xóa token khỏi Redis để không thể dùng lại
    await forgotPasswordRepository.deleteResetToken(token);
    return true;
};

module.exports = {
    requestForgotPassword,
    verifyOTPAndGenerateToken,
    updateNewPassword,
};
