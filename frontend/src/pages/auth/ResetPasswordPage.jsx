import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    resetPassword,
    resetForgotPasswordState,
} from "../../features/auth/forgotPasswordSlice";
import AuthLayout from "../../components/auth/AuthLayout";

/**
 * ResetPasswordPage – Bước 3
 * Người dùng nhập mật khẩu mới → đặt lại → chuyển về trang đăng nhập
 */
const ResetPasswordPage = () => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [localError, setLocalError] = useState("");
    const [isDone, setIsDone] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, resetToken } = useSelector(
        (state) => state.forgotPassword
    );

    // Validate password strength
    const getStrength = (pwd) => {
        if (pwd.length === 0) return { level: 0, label: "", color: "" };
        if (pwd.length < 6) return { level: 1, label: "Yếu", color: "#ba1a1a" };
        if (pwd.length < 8) return { level: 2, label: "Trung bình", color: "#a04100" };
        const hasUpper = /[A-Z]/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        const hasSpecial = /[!@#$%^&*]/.test(pwd);
        if (hasUpper && hasNumber && hasSpecial)
            return { level: 4, label: "Rất mạnh", color: "#1a6b2f" };
        if (hasNumber || hasUpper)
            return { level: 3, label: "Mạnh", color: "#2e7d32" };
        return { level: 2, label: "Trung bình", color: "#a04100" };
    };

    const strength = getStrength(newPassword);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError("");

        // Client-side validation
        const hasUpper = /[A-Z]/.test(newPassword);
        const hasLower = /[a-z]/.test(newPassword);
        const hasNumber = /\d/.test(newPassword);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

        if (newPassword.length < 8) {
            setLocalError("Mật khẩu phải có ít nhất 8 ký tự.");
            return;
        }
        if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
            setLocalError("Mật khẩu phải bao gồm: 1 chữ in hoa, 1 chữ thường, 1 chữ số, 1 ký tự đặc biệt.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setLocalError("Mật khẩu xác nhận không khớp.");
            return;
        }
        if (!resetToken) {
            setLocalError("Phiên làm việc không hợp lệ. Vui lòng bắt đầu lại.");
            return;
        }

        const result = await dispatch(
            resetPassword({ newPassword, resetToken })
        );

        if (resetPassword.fulfilled.match(result)) {
            setIsDone(true);
            // Sau 2.5 giây tự chuyển về login và clear Redux state
            setTimeout(() => {
                dispatch(resetForgotPasswordState());
                navigate("/login");
            }, 2500);
        }
    };

    // ── Success State ──
    if (isDone) {
        return (
            <AuthLayout>
                <div
                    className="rounded-xl shadow-lg p-8 flex flex-col items-center text-center gap-6"
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #c3c6d6",
                    }}
                >
                    {/* Success icon */}
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#d4edda" }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{
                                color: "#1a6b2f",
                                fontVariationSettings: "'FILL' 1",
                                fontSize: "40px",
                            }}
                        >
                            check_circle
                        </span>
                    </div>
                    <div>
                        <h1
                            className="text-2xl font-bold mb-2"
                            style={{ color: "#191c1e" }}
                        >
                            Đặt lại mật khẩu thành công!
                        </h1>
                        <p className="text-sm leading-relaxed" style={{ color: "#434654" }}>
                            Mật khẩu của bạn đã được cập nhật. Đang chuyển hướng về trang
                            đăng nhập...
                        </p>
                    </div>
                    {/* Loading dots */}
                    <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: "#003d9b",
                                    animation: `bounce 1s ${i * 0.15}s infinite`,
                                }}
                            />
                        ))}
                    </div>
                    <style>{`
                        @keyframes bounce {
                            0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
                            40% { transform: scale(1); opacity: 1; }
                        }
                    `}</style>
                </div>
            </AuthLayout>
        );
    }

    // ── Main Form ──
    return (
        <AuthLayout>
            {/* Card chính */}
            <div
                className="rounded-xl shadow-lg p-6 md:p-8 flex flex-col gap-6"
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #c3c6d6",
                }}
            >
                {/* Icon + Tiêu đề */}
                <div className="flex flex-col items-center text-center gap-2">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#dae2ff" }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{
                                color: "#003d9b",
                                fontVariationSettings: "'FILL' 1",
                                fontSize: "32px",
                            }}
                        >
                            lock_person
                        </span>
                    </div>
                    <h1
                        className="text-2xl font-bold"
                        style={{ color: "#191c1e" }}
                    >
                        Đặt lại mật khẩu
                    </h1>
                    <p className="text-sm leading-relaxed" style={{ color: "#434654" }}>
                        Tạo mật khẩu mới cho tài khoản của bạn.
                        Mật khẩu phải có ít nhất 8 ký tự.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    {/* New Password */}
                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="new-password"
                            className="text-sm font-semibold px-1"
                            style={{ color: "#191c1e" }}
                        >
                            Mật khẩu mới
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span
                                    className="material-symbols-outlined"
                                    style={{ color: "#737685", fontSize: "22px" }}
                                >
                                    lock
                                </span>
                            </div>
                            <input
                                id="new-password"
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nhập mật khẩu mới"
                                required
                                className="w-full pl-12 pr-12 py-3 rounded-lg text-base outline-none transition-all"
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
                            {/* Toggle show/hide */}
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowNew((v) => !v)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                                style={{ color: "#737685" }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.color = "#003d9b")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.color = "#737685")
                                }
                                aria-label={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "22px" }}
                                >
                                    {showNew ? "visibility_off" : "visibility"}
                                </span>
                            </button>
                        </div>

                        {/* Password strength indicator */}
                        {newPassword.length > 0 && (
                            <div className="flex items-center gap-2 mt-1 px-1">
                                <div className="flex gap-1 flex-1">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className="h-1 flex-1 rounded-full transition-all duration-300"
                                            style={{
                                                backgroundColor:
                                                    level <= strength.level
                                                        ? strength.color
                                                        : "#e1e2e4",
                                            }}
                                        />
                                    ))}
                                </div>
                                <span
                                    className="text-xs font-semibold whitespace-nowrap"
                                    style={{ color: strength.color }}
                                >
                                    {strength.label}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="confirm-password"
                            className="text-sm font-semibold px-1"
                            style={{ color: "#191c1e" }}
                        >
                            Xác nhận mật khẩu
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span
                                    className="material-symbols-outlined"
                                    style={{ color: "#737685", fontSize: "22px" }}
                                >
                                    lock_clock
                                </span>
                            </div>
                            <input
                                id="confirm-password"
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Nhập lại mật khẩu mới"
                                required
                                className="w-full pl-12 pr-12 py-3 rounded-lg text-base outline-none transition-all"
                                style={{
                                    border: `1px solid ${
                                        confirmPassword &&
                                        newPassword !== confirmPassword
                                            ? "#ba1a1a"
                                            : confirmPassword &&
                                              newPassword === confirmPassword
                                            ? "#2e7d32"
                                            : "#c3c6d6"
                                    }`,
                                    backgroundColor: "#ffffff",
                                    color: "#191c1e",
                                }}
                                onFocus={(e) => {
                                    if (!confirmPassword) {
                                        e.target.style.borderColor = "#003d9b";
                                        e.target.style.boxShadow =
                                            "0 0 0 3px rgba(0,61,155,0.1)";
                                    }
                                }}
                                onBlur={(e) => {
                                    if (!confirmPassword) {
                                        e.target.style.borderColor = "#c3c6d6";
                                        e.target.style.boxShadow = "none";
                                    }
                                }}
                            />
                            {/* Match indicator icon */}
                            {confirmPassword && (
                                <div className="absolute inset-y-0 right-10 flex items-center pr-1">
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            fontSize: "20px",
                                            color:
                                                newPassword === confirmPassword
                                                    ? "#2e7d32"
                                                    : "#ba1a1a",
                                            fontVariationSettings: "'FILL' 1",
                                        }}
                                    >
                                        {newPassword === confirmPassword
                                            ? "check_circle"
                                            : "cancel"}
                                    </span>
                                </div>
                            )}
                            {/* Toggle */}
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowConfirm((v) => !v)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                                style={{ color: "#737685" }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.color = "#003d9b")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.color = "#737685")
                                }
                                aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "22px" }}
                                >
                                    {showConfirm ? "visibility_off" : "visibility"}
                                </span>
                            </button>
                        </div>
                        {/* Match message */}
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p
                                className="text-xs px-1 mt-0.5"
                                style={{ color: "#ba1a1a" }}
                            >
                                Mật khẩu xác nhận không khớp.
                            </p>
                        )}
                    </div>

                    {/* Error from Redux or local */}
                    {(error || localError) && (
                        <div
                            className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                            style={{
                                backgroundColor: "#ffdad6",
                                color: "#93000a",
                            }}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "18px" }}
                            >
                                error
                            </span>
                            {localError || error}
                        </div>
                    )}

                    {/* Password requirements hint */}
                    <div
                        className="flex flex-col gap-1 px-3 py-2 rounded-lg text-xs"
                        style={{
                            backgroundColor: "#f3f4f6",
                            color: "#434654",
                        }}
                    >
                        <p className="font-semibold mb-1" style={{ color: "#191c1e" }}>
                            Yêu cầu mật khẩu:
                        </p>
                        {[
                            { text: "Ít nhất 8 ký tự", check: newPassword.length >= 8 },
                            { text: "Chứa chữ hoa (A-Z)", check: /[A-Z]/.test(newPassword) },
                            { text: "Chứa chữ thường (a-z)", check: /[a-z]/.test(newPassword) },
                            { text: "Chứa chữ số (0-9)", check: /\d/.test(newPassword) },
                            { text: "Ký tự đặc biệt (!@#$%^&*)", check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) },
                        ].map(({ text, check }) => (
                            <div key={text} className="flex items-center gap-1.5">
                                <span
                                    className="material-symbols-outlined"
                                    style={{
                                        fontSize: "14px",
                                        color: check ? "#2e7d32" : "#737685",
                                        fontVariationSettings: "'FILL' 1",
                                    }}
                                >
                                    {check ? "check_circle" : "radio_button_unchecked"}
                                </span>
                                <span style={{ color: check ? "#2e7d32" : "#737685" }}>
                                    {text}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Submit Button */}
                    <button
                        id="btn-reset-password"
                        type="submit"
                        disabled={loading}
                        className="w-full font-semibold text-sm py-3 rounded-lg transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 mt-1"
                        style={{
                            backgroundColor: loading ? "#ffb693" : "#fe6b00",
                            color: "#ffffff",
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                        onMouseEnter={(e) => {
                            if (!loading)
                                e.currentTarget.style.backgroundColor = "#a04100";
                        }}
                        onMouseLeave={(e) => {
                            if (!loading)
                                e.currentTarget.style.backgroundColor = "#fe6b00";
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
                                Đang cập nhật...
                            </>
                        ) : (
                            <>
                                <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "20px" }}
                                >
                                    lock_reset
                                </span>
                                Đặt lại mật khẩu
                            </>
                        )}
                    </button>
                </form>

                {/* Back link */}
                <div
                    className="pt-4 text-center"
                    style={{ borderTop: "1px solid #c3c6d6" }}
                >
                    <Link
                        to="/verify-otp"
                        className="inline-flex items-center gap-1 text-sm hover:underline transition-all"
                        style={{
                            color: "#003d9b",
                            textDecorationColor: "#a04100",
                        }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "18px" }}
                        >
                            arrow_back
                        </span>
                        Quay lại xác thực OTP
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
};

export default ResetPasswordPage;
