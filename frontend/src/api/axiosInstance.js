import axios from "axios";

/**
 * Axios instance với baseURL từ biến môi trường Vite.
 * Tự động đính kèm Authorization header nếu có token trong localStorage.
 */
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor – đính kèm token vào mọi request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        const hasAuthorizationHeader =
            Boolean(config.headers.Authorization) || Boolean(config.headers.authorization);

        if (token && !hasAuthorizationHeader) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor – xử lý lỗi toàn cục
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const message =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            "Lỗi kết nối. Vui lòng thử lại.";
        
        const customError = new Error(message);
        // Đính kèm các trường gốc của Axios vào Error object để các catch block có thể đọc được
        if (error.response) {
            customError.response = error.response;
        }
        if (error.request) {
            customError.request = error.request;
        }
        customError.config = error.config;
        
        return Promise.reject(customError);
    }
);

export default axiosInstance;
