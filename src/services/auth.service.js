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

const loginService = async (email, password) => {

    const user = await authRepository.findUserByEmail(email);

    if (!user) {

        throw new Error("Email không tồn tại");
    }

    // const isMatch = await bcrypt.compare(
    //     password,
    //     user.password
    // );
    const isMatch = password === user.password;

    if (!isMatch) {

        throw new Error("Sai mật khẩu");
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            roleId: user.roleId,
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: "1h",
        }
    );

    return {
        token,
        roleId: user.roleId,
        email: user.email,
    };
};

module.exports = {
    loginService,
    requestForgotPassword,
    verifyOTPAndGenerateToken,
    updateNewPassword,
};
