import { createContext, useState } from 'react';

// Khởi tạo ngữ cảnh xác thực mặc định [cite: 1248]
export const AuthContext = createContext({
    isAuthenticated: false,
    user: { email: "", firstName: "", lastName: "" },
    appLoading: true,
});

// Thành phần bao bọc để quản lý State [cite: 1267]
export const AuthWrapper = (props) => {
    const [auth, setAuth] = useState({
        isAuthenticated: false,
        user: { email: "", firstName: "", lastName: "" }
    });

    const [appLoading, setAppLoading] = useState(true);

    return (
        <AuthContext.Provider value={{
            auth, setAuth, appLoading, setAppLoading
        }}>
            {props.children}
        </AuthContext.Provider>
    );
};