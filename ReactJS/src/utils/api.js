import axiosInstance from "./axios.customize";

// Auth APIs
const authAPI = {
    forgotPassword: (email) => {
        return axiosInstance.post("/forgot-password", { email });
    },
    verifyOTP: (email, otp) => {
        return axiosInstance.post("/verify-otp", { email, otp });
    },
    resetPassword: (newPassword, resetToken) => {
        return axiosInstance.post(
            "/reset-password",
            { newPassword },
            {
                headers: {
                    Authorization: `Bearer ${resetToken}`,
                },
            },
        );
    },
};

export default authAPI;
