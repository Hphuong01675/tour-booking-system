import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    requestForgotPassword,
    setForgotEmail,
} from "../../features/auth/forgotPasswordSlice";
import AuthLayout from "../../components/auth/AuthLayout";

/**
 * ForgotPasswordPage – Bước 1
 * Người dùng nhập email → hệ thống gửi OTP về email
 */
const ForgotPasswordPage = () => {
    const [emailInput, setEmailInput] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.forgotPassword);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Lưu email vào Redux để dùng ở bước verify OTP
        dispatch(setForgotEmail(emailInput));

        const result = await dispatch(requestForgotPassword(emailInput));

        if (requestForgotPassword.fulfilled.match(result)) {
            navigate("/verify-otp");
        }
    };

    return (
        <AuthLayout showTrustBadge>
            {/* Card chính */}
            <div
                className="glass-panel rounded-xl shadow-xl p-6 md:p-8"
            >
                {/* Icon + Tiêu đề */}
                <div className="mb-8">
                    <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                        style={{ backgroundColor: "#dae2ff" }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{
                                color: "#003d9b",
                                fontVariationSettings: "'FILL' 1",
                                fontSize: "24px",
                            }}
                        >
                            lock_reset
                        </span>
                    </div>
                    <h1
                        className="text-xl md:text-2xl font-bold mb-1"
                        style={{ color: "#191c1e" }}
                    >
                        Khôi phục mật khẩu
                    </h1>
                    <p className="text-sm leading-relaxed" style={{ color: "#434654" }}>
                        Nhập địa chỉ email liên kết với tài khoản của bạn. Chúng tôi sẽ
                        gửi mã OTP để xác thực yêu cầu.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                        <label
                            htmlFor="forgot-email"
                            className="block text-sm font-semibold px-1"
                            style={{ color: "#191c1e" }}
                        >
                            Email
                        </label>
                        <div className="relative group">
                            {/* Icon bên trái */}
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span
                                    className="material-symbols-outlined transition-colors"
                                    style={{ color: "#737685", fontSize: "22px" }}
                                >
                                    mail
                                </span>
                            </div>
                            <input
                                id="forgot-email"
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="example@globalexplore.com"
                                required
                                className="w-full pl-12 pr-4 py-3 rounded-lg text-base outline-none transition-all"
                                style={{
                                    border: "1px solid #c3c6d6",
                                    backgroundColor: "#ffffff",
                                    color: "#191c1e",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "#003d9b";
                                    e.target.style.boxShadow = "0 0 0 3px rgba(0,61,155,0.1)";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "#c3c6d6";
                                    e.target.style.boxShadow = "none";
                                }}
                            />
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div
                            className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                            style={{
                                backgroundColor: "#ffdad6",
                                color: "#93000a",
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                                error
                            </span>
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        id="btn-send-otp"
                        type="submit"
                        disabled={loading}
                        className="w-full font-semibold text-sm py-3 rounded-lg transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: loading ? "#ffb693" : "#fe6b00",
                            color: "#ffffff",
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.currentTarget.style.backgroundColor = "#a04100";
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) e.currentTarget.style.backgroundColor = "#fe6b00";
                        }}
                    >
                        {loading ? (
                            <>
                                <span
                                    className="material-symbols-outlined animate-spin"
                                    style={{ fontSize: "20px" }}
                                >
                                    progress_activity
                                </span>
                                Đang gửi...
                            </>
                        ) : (
                            <>
                                Xác thực OTP
                                <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "20px" }}
                                >
                                    arrow_forward
                                </span>
                            </>
                        )}
                    </button>
                </form>

                {/* Back to Login */}
                <div
                    className="mt-8 pt-6 text-center"
                    style={{ borderTop: "1px solid #c3c6d6" }}
                >
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1 text-sm font-semibold hover:underline transition-all"
                        style={{ color: "#003d9b", textDecorationColor: "#a04100" }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                            arrow_back
                        </span>
                        Quay lại Đăng nhập
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
