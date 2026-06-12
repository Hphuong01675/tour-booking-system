import { Routes, Route, Navigate } from "react-router-dom";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import VerifyOTPPage from "./pages/auth/VerifyOTPPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

function App() {
    return (
        <Routes>
            {/* Auth – Quên mật khẩu */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-otp" element={<VerifyOTPPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Trang gốc tạm thời để trống, sau này merge code sẽ đổi thành redirect sang /login hoặc Home */}
            <Route path="/" element={<div className="min-h-screen bg-[#f8f9fb]"></div>} />
        </Routes>
    );
}

export default App;
