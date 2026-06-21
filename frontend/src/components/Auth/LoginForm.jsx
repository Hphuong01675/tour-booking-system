import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, loginUser } from "../../features/auth/authSlice";
import axiosInstance from "../../api/axiosInstance";

const LoginForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [formErrors, setFormErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: "" }));
        }
        if (error) {
            dispatch(clearAuthError());
        }
    };

    const validateForm = () => {
        const nextErrors = {};
        const email = formData.email.trim();

        if (!email) {
            nextErrors.email = "Email la bat buoc.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            nextErrors.email = "Email khong hop le.";
        }

        if (!formData.password) {
            nextErrors.password = "Mat khau la bat buoc.";
        }

        setFormErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        const result = await dispatch(
            loginUser({
                email: formData.email.trim(),
                password: formData.password,
            })
        );

        if (loginUser.fulfilled.match(result)) {
            const pendingBookingId = localStorage.getItem("pendingBookingId");
            if (pendingBookingId && result.payload.user?.role === "customer") {
                try {
                    await axiosInstance.post("/api/bookings/claim-pending", {
                        pendingId: pendingBookingId
                    });
                    localStorage.removeItem("pendingBookingId");
                    alert("Đặt tour thành công! Hệ thống đã lưu lại lịch trình tour bạn chọn trước đó.");
                    navigate("/customer/tours", { replace: true });
                } catch (err) {
                    console.error("Lỗi khi đồng bộ đơn đặt tour:", err);
                    localStorage.removeItem("pendingBookingId");
                    navigate("/", { replace: true });
                }
            } else {
                // If the user role is customer, redirect them to the Homepage ("/")
                if (result.payload.user?.role === "customer") {
                    navigate("/", { replace: true });
                } else {
                    navigate(result.payload.redirectUrl || "/customer/profile", { replace: true });
                }
            }
        }
    };

    return (
        <div className="bg-white p-8 md:p-10 border-outline-variant h-full w-full">
            <h1 className="font-headline-md text-headline-md text-on-background mb-2">
                Chào mừng trở lại
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-8">
                Đăng nhập để khám phá thế giới cùng Chip3Chip
            </p>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                    <label className="font-label-md text-label-md text-on-surface block" htmlFor="login-email">
                        Email
                    </label>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary">
                            mail
                        </span>
                        <input
                            id="login-email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md ${
                                formErrors.email ? "border-error" : "border-outline-variant"
                            }`}
                            placeholder="name@example.com"
                            type="email"
                            autoComplete="email"
                        />
                    </div>
                    {formErrors.email && (
                        <p className="text-label-sm text-error">{formErrors.email}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <label className="font-label-md text-label-md text-on-surface" htmlFor="login-password">
                            Mật khẩu
                        </label>
                        <Link className="font-label-sm text-primary hover:underline" to="/forgot-password">
                            Quên mật khẩu?
                        </Link>
                    </div>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary">
                            lock
                        </span>
                        <input
                            id="login-password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-10 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md ${
                                formErrors.password ? "border-error" : "border-outline-variant"
                            }`}
                            placeholder="••••••••"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                        />
                        <button
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                            onClick={() => setShowPassword((prev) => !prev)}
                            type="button"
                            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                            <span className="material-symbols-outlined">
                                {showPassword ? "visibility_off" : "visibility"}
                            </span>
                        </button>
                    </div>
                    {formErrors.password && (
                        <p className="text-label-sm text-error">{formErrors.password}</p>
                    )}
                </div>

                {error && (
                    <div className="flex items-start gap-2 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
                        <span className="material-symbols-outlined text-[18px] mt-0.5">
                            error
                        </span>
                        <span>{error}</span>
                    </div>
                )}

                <button
                    className="w-full bg-secondary-container text-white font-headline-sm py-3.5 rounded-lg shadow-sm hover:shadow-md hover:bg-secondary transition-all active:scale-[0.98] disabled:bg-secondary-fixed-dim disabled:cursor-not-allowed"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
            </form>

            <div className="mt-6 grid grid-cols-2 gap-4" />
        </div>
    );
};

export default LoginForm;
