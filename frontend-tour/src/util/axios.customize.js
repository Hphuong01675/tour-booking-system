import axios from "axios";

const instance = axios.create({
    // Sử dụng biến môi trường (phải tạo file .env.development chứa VITE_BACKEND_URL=http://localhost:6969/api/auth)
    baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:6969/api/auth",
});

// Tự động đính kèm Token vào Header cho các request cần bảo mật
instance.interceptors.request.use(function (config) {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});

export default instance;