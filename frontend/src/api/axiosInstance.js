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
        if (token) {
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
            error.response?.data?.message ||
            "Lỗi kết nối. Vui lòng thử lại.";
        return Promise.reject(new Error(message));
    }
);

export default axiosInstance;
