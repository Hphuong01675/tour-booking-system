import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    verifyForgotPasswordOTP,
    requestForgotPassword,
    clearForgotPasswordError,
} from "../../features/auth/forgotPasswordSlice";
import AuthLayout from "../../components/auth/AuthLayout";
import OtpInput from "../../components/auth/OtpInput";
import CountdownTimer from "../../components/auth/CountdownTimer";

/**
 * VerifyOTPPage – Bước 2
 * Người dùng nhập 4 chữ số OTP nhận qua email → xác minh → nhận resetToken
 */
const VerifyOTPPage = () => {
    const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
    const [isExpired, setIsExpired] = useState(false);
    const [timerResetKey, setTimerResetKey] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error, email } = useSelector(
        (state) => state.forgotPassword
    );

    const otp = otpDigits.join("");
    const isOtpComplete = otp.length === 4;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isOtpComplete) return;

        dispatch(clearForgotPasswordError());

        const result = await dispatch(
            verifyForgotPasswordOTP({ email, otp })
        );

        if (verifyForgotPasswordOTP.fulfilled.match(result)) {
            navigate("/reset-password");
        }
    };

    const handleResend = async () => {
        if (!email || resendLoading) return;
        setResendLoading(true);
        setResendSuccess(false);

        const result = await dispatch(requestForgotPassword(email));

        if (requestForgotPassword.fulfilled.match(result)) {
            // Reset OTP và countdown
            setOtpDigits(["", "", "", ""]);
            setIsExpired(false);
            setTimerResetKey((k) => k + 1);
            setResendSuccess(true);
            setTimeout(() => setResendSuccess(false), 4000);
        }
        setResendLoading(false);
    };

    const handleExpire = useCallback(() => {
        setIsExpired(true);
    }, []);

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
                            verified_user
                        </span>
                    </div>
                    <h1
                        className="text-2xl font-bold"
                        style={{ color: "#191c1e" }}
                    >
                        Xác thực OTP
                    </h1>
                    <p className="text-base" style={{ color: "#434654" }}>
                        Mã OTP đã được gửi đến{" "}
                        <span className="font-semibold" style={{ color: "#003d9b" }}>
                            {email || "email của bạn"}
                        </span>
                    </p>
                </div>

                {/* OTP Inputs + Countdown */}
                <div className="flex flex-col gap-4">
                    <OtpInput value={otpDigits} onChange={setOtpDigits} />

                    {isExpired ? (
                        <div
                            className="flex items-center justify-center gap-1 text-sm font-semibold"
                            style={{ color: "#ba1a1a" }}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "18px" }}
                            >
                                timer_off
                            </span>
                            Mã OTP đã hết hạn. Vui lòng gửi lại.
                        </div>
                    ) : (
                        <CountdownTimer
                            key={timerResetKey}
                            durationSeconds={300}
                            onExpire={handleExpire}
                        />
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div
                        className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                        style={{ backgroundColor: "#ffdad6", color: "#93000a" }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "18px" }}
                        >
                            error
                        </span>
                        {error}
                    </div>
                )}

                {/* Resend success */}
                {resendSuccess && (
                    <div
                        className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                        style={{ backgroundColor: "#d4edda", color: "#155724" }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "18px" }}
                        >
                            check_circle
                        </span>
                        Mã OTP mới đã được gửi về email của bạn.
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    {/* Confirm Button */}
                    <button
                        id="btn-verify-otp"
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !isOtpComplete || isExpired}
                        className="w-full font-semibold text-sm py-3 rounded-lg transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                        style={{
                            backgroundColor:
                                loading || !isOtpComplete || isExpired
                                    ? "#ffb693"
                                    : "#fe6b00",
                            color: "#ffffff",
                            cursor:
                                loading || !isOtpComplete || isExpired
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                        onMouseEnter={(e) => {
                            if (!loading && isOtpComplete && !isExpired)
                                e.currentTarget.style.backgroundColor = "#a04100";
                        }}
                        onMouseLeave={(e) => {
                            if (!loading && isOtpComplete && !isExpired)
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
                                Đang xác nhận...
                            </>
                        ) : (
                            "Xác nhận"
                        )}
                    </button>

                    {/* Resend */}
                    <div
                        className="text-center text-sm"
                        style={{ color: "#434654" }}
                    >
                        Bạn chưa nhận được mã?{" "}
                        <button
                            onClick={handleResend}
                            disabled={resendLoading}
                            className="font-bold ml-1 hover:underline transition-colors"
                            style={{
                                color: resendLoading ? "#737685" : "#003d9b",
                                cursor: resendLoading ? "not-allowed" : "pointer",
                                textDecorationColor: "#a04100",
                            }}
                        >
                            {resendLoading ? "Đang gửi..." : "Gửi lại mã"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Security Banner Image */}
            <div className="mt-6 rounded-xl overflow-hidden relative h-48 shadow-md group">
                <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                        background:
                            "linear-gradient(135deg, #001848 0%, #003d9b 40%, #004b58 100%)",
                    }}
                >
                    {/* Decorative elements */}
                    <div className="absolute inset-0 opacity-10">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute rounded-full"
                                style={{
                                    width: `${40 + i * 15}px`,
                                    height: `${40 + i * 15}px`,
                                    border: "1px solid rgba(255,255,255,0.3)",
                                    top: `${10 + i * 8}%`,
                                    left: `${5 + i * 12}%`,
                                }}
                            />
                        ))}
                    </div>
                    <div className="relative text-center px-6">
                        <span
                            className="material-symbols-outlined block mb-2"
                            style={{
                                color: "#5dd6f3",
                                fontSize: "40px",
                                fontVariationSettings: "'FILL' 1",
                            }}
                        >
                            shield_locked
                        </span>
                        <p
                            className="text-sm font-semibold"
                            style={{ color: "rgba(255,255,255,0.9)" }}
                        >
                            GlobalExplore bảo vệ mọi chuyến đi của bạn
                        </p>
                        <p
                            className="text-xs mt-1"
                            style={{ color: "rgba(255,255,255,0.6)" }}
                        >
                            với hệ thống bảo mật đa lớp
                        </p>
                    </div>
                </div>
            </div>

            {/* Back to forgot password */}
            <div className="mt-4 text-center">
                <Link
                    to="/forgot-password"
                    className="inline-flex items-center gap-1 text-sm hover:underline transition-all"
                    style={{ color: "#003d9b", textDecorationColor: "#a04100" }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                        arrow_back
                    </span>
                    Quay lại
                </Link>
            </div>
        </AuthLayout>
    );
};

export default VerifyOTPPage;
