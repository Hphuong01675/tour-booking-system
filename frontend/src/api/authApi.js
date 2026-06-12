import axios from 'axios';
import config from '../config/env';

const API_BASE_URL = `${config.API_BASE_URL}/api/auth`;

const authApi = {
  // Đăng ký - Gửi thông tin người dùng
  register: (userData) => {
    return axios.post(`${API_BASE_URL}/register`, userData);
  },

  // Xác thực OTP
  verifyOTP: (email, otp) => {
    return axios.post(`${API_BASE_URL}/verify-otp`, { email, otp });
  },

  // Gửi lại mã OTP
  resendOTP: (email) => {
    return axios.post(`${API_BASE_URL}/resend-otp`, { email });
  },
};

export default authApi;


