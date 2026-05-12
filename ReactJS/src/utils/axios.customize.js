import axios from "axios";

// Set config defaults when creating the instance
const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
});

// Add a request interceptor
instance.interceptors.request.use(
    function (config) {
        // CHỈ gắn access_token nếu Header Authorization chưa có dữ liệu
        if (!config.headers.Authorization) {
            const token = localStorage.getItem("access_token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    function (error) {
        return Promise.reject(error);
    },
);

// Add a response interceptor
instance.interceptors.response.use(
    (response) => (response && response.data ? response.data : response),
    (error) => {
        // dùng Promise.reject để Redux nhận diện được state.rejected
        if (error?.response?.data) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    },
);

export default instance;
