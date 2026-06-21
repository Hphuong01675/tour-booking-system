/**
 * AuthLayout – Layout chung cho các trang xác thực (header + footer + background)
 * Dùng chung cho ForgotPasswordPage, VerifyOTPPage, ResetPasswordPage
 */
const AuthLayout = ({ children, showTrustBadge = false }) => {
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8f9fb" }}>

            {/* ── Header ── */}
            <header
                className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16"
                style={{
                    backgroundColor: "#f8f9fb",
                    borderBottom: "1px solid #c3c6d6",
                }}
            >
                <div
                    className="text-xl font-bold tracking-tight"
                    style={{ color: "#003d9b" }}
                >
                    Chip3Chip
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className="text-sm hidden md:block"
                        style={{ color: "#434654" }}
                    >
                        Bạn cần hỗ trợ?
                    </span>
                    <button
                        className="text-sm font-semibold transition-colors hover:underline"
                        style={{ color: "#003d9b" }}
                    >
                        Help
                    </button>
                </div>
            </header>

            {/* ── Main Content ── */}
            <main className="flex-grow flex items-center justify-center pt-16 px-4">
                {/* Background decorations */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                    <div
                        className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl"
                        style={{ backgroundColor: "rgba(0,61,155,0.05)" }}
                    />
                    <div
                        className="absolute bottom-10 left-10 w-64 h-64 rounded-full blur-3xl"
                        style={{ backgroundColor: "rgba(254,107,0,0.05)" }}
                    />
                </div>

                <div className="relative z-10 w-full max-w-[440px] py-8">
                    {children}

                    {/* Trust badge SSL */}
                    {showTrustBadge && (
                        <div className="mt-6 flex items-center justify-center gap-3 opacity-60">
                            <span
                                className="material-symbols-outlined"
                                style={{ color: "#737685", fontSize: "20px" }}
                            >
                                security
                            </span>
                            <span className="text-xs" style={{ color: "#434654" }}>
                                Kết nối bảo mật 256-bit SSL
                            </span>
                        </div>
                    )}
                </div>
            </main>

            {/* ── Footer ── */}
            <footer
                className="relative z-10 flex flex-col md:flex-row justify-between items-center px-4 md:px-16 py-6 w-full gap-4"
                style={{
                    backgroundColor: "#f3f4f6",
                    borderTop: "1px solid #c3c6d6",
                }}
            >
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <span
                        className="text-sm font-bold"
                        style={{ color: "#191c1e" }}
                    >
                        Chip3Chip
                    </span>
                    <p className="text-sm" style={{ color: "#434654" }}>
                        © 2024 Chip3Chip. Tất cả quyền được bảo lưu.
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    {["Điều khoản", "Bảo mật", "Liên hệ"].map((label) => (
                        <a
                            key={label}
                            href="#"
                            className="text-xs hover:underline transition-colors"
                            style={{ color: "#434654", textDecorationColor: "#a04100" }}
                        >
                            {label}
                        </a>
                    ))}
                </div>
            </footer>
        </div>
    );
};

export default AuthLayout;
