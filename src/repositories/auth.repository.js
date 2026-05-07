const { User, PasswordReset } = require("../models");

const findUserByEmail = async (email) => {
    return await User.findOne({ where: { email } });
};

const upsertOTP = async (email, otp, expiredAt) => {
    return await PasswordReset.upsert({ email, otp, expiredAt });
};

const findOTPRecord = async (email, otp) => {
    return await PasswordReset.findOne({ where: { email, otp } });
};

const updatePassword = async (email, hashedPassword) => {
    return await User.update(
        { password: hashedPassword },
        { where: { email } },
    );
};

const deleteOTP = async (record) => {
    return await record.destroy();
};

module.exports = {
    findUserByEmail,
    upsertOTP,
    findOTPRecord,
    updatePassword,
    deleteOTP,
};
