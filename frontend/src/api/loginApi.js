import axiosInstance from "./axiosInstance";

const loginApi = {
    login: (credentials) => {
        return axiosInstance.post("/api/auth/login", credentials);
    },

    getMe: () => {
        return axiosInstance.get("/api/auth/me");
    },

    getCustomerProfile: () => {
        return axiosInstance.get("/api/customer/profile");
    },

    getAdminProfile: () => {
        return axiosInstance.get("/api/admin/profile");
    },
};

export default loginApi;
