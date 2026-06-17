import axiosInstance from "./axiosInstance";

export const getAdminDashboard = async (year) => {
    const response = await axiosInstance.get("/api/admin/dashboard", {
        params: year ? { year } : undefined,
    });
    return response.data;
};

export const getAdminVouchers = async (params) => {
    const response = await axiosInstance.get("/api/admin/vouchers", { params });
    return response.data;
};

export const createAdminVoucher = async (payload) => {
    const response = await axiosInstance.post("/api/admin/vouchers", payload);
    return response.data;
};

export const updateAdminVoucherStatus = async (id, isActive) => {
    const response = await axiosInstance.patch(`/api/admin/vouchers/${id}/status`, {
        isActive,
    });
    return response.data;
};

export const suggestCustomerEmails = async (email) => {
    const response = await axiosInstance.get("/api/admin/customers/suggest", {
        params: { email },
    });
    return response.data;
};

export const getAdminUsers = async (params) => {
    const response = await axiosInstance.get("/api/admin/users", { params });
    return response.data;
};

export const updateAdminUserStatus = async (id, isActive) => {
    const response = await axiosInstance.patch(`/api/admin/users/${id}/status`, {
        isActive,
    });
    return response.data;
};

export const getAdminTours = async (params) => {
    const response = await axiosInstance.get("/api/admin/tours", { params });
    return response.data;
};

export const updateAdminTourStatus = async (id, status) => {
    const response = await axiosInstance.patch(`/api/admin/tours/${id}/status`, {
        status,
    });
    return response.data;
};
