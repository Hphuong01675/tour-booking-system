import axiosInstance from "./axiosInstance";

const authApi = {
    // Đăng ký - Gửi thông tin người dùng
    register: (userData) => {
        return axiosInstance.post("/api/auth/register", userData);
    },

    // Xác thực OTP (Cho luồng đăng ký)
    verifyOTP: (email, otp) => {
        return axiosInstance.post("/api/auth/verify-otp", { email, otp });
    },

    // Gửi lại mã OTP
    resendOTP: (email) => {
        return axiosInstance.post("/api/auth/resend-otp", { email });
    },

    // Gửi yêu cầu quên mật khẩu – nhận OTP qua email
    forgotPassword: (email) => {
        return axiosInstance.post("/api/auth/forgot-password", { email });
    },

    // Xác minh OTP từ email (Cho luồng quên mật khẩu)
    verifyForgotPasswordOTP: (email, otp) => {
        return axiosInstance.post("/api/auth/forgot-password/verify-otp", { email, otp });
    },

    // Đặt lại mật khẩu mới
    resetPassword: (newPassword, resetToken) => {
        return axiosInstance.post(
            "/api/auth/reset-password",
            { newPassword },
            {
                headers: {
                    Authorization: `Bearer ${resetToken}`,
                },
            }
        );
    }
};

export default authApi;
