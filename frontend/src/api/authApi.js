import axiosInstance from "./axiosInstance";

/**
 * Bước 1: Gửi yêu cầu quên mật khẩu – nhận OTP qua email
 * POST /api/auth/forgot-password
 */
export const forgotPasswordApi = (email) =>
    axiosInstance.post("/api/auth/forgot-password", { email });

/**
 * Bước 2: Xác minh OTP từ email
 * POST /api/auth/verify-otp
 * @returns {{ resetToken: string }} JWT token để đặt lại mật khẩu
 */
export const verifyForgotPasswordOTPApi = (email, otp) =>
    axiosInstance.post("/api/auth/verify-otp", { email, otp });

/**
 * Bước 3: Đặt lại mật khẩu mới
 * POST /api/auth/reset-password
 * Authorization: Bearer <resetToken>
 */
export const resetPasswordApi = (newPassword, resetToken) =>
    axiosInstance.post(
        "/api/auth/reset-password",
        { newPassword },
        {
            headers: {
                Authorization: `Bearer ${resetToken}`,
            },
        }
    );
