import axios from './axios.customize';

/**
 * API Đăng ký tài khoản mới
 * @param {Object} userData - Bao gồm: firstName, lastName, email, phoneNumber, address, gender, password
 */
export const registerApi = (userData) => {
    const URL_API = "/register";
    return axios.post(URL_API, userData);
};

/**
 * API Xác thực mã OTP để kích hoạt tài khoản
 * @param {string} email - Email người dùng cần kích hoạt
 * @param {string} otp - Mã OTP 4 số hoặc 6 số gửi qua mail
 */
export const verifyActivationOtpApi = (email, otp) => {
    const URL_API = "/verify-activation-otp";
    const data = {
        email,
        otp
    };
    return axios.post(URL_API, data);
};

/**
 * API Gửi lại mã OTP (Nếu bạn có làm thêm chức năng Resend)
 */
export const resendOtpApi = (email) => {
    const URL_API = "/resend-otp"; // Đảm bảo backend có route này
    return axios.post(URL_API, { email });
};