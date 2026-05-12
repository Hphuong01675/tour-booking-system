import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { loginUser } from "../features/auth/authSlice";

const backgroundUrl =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070";

export default function Login() {
  const dispatch = useDispatch();
  const { status, error, user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ email: "", password: "", remember: false });
  const [validation, setValidation] = useState({ email: "", password: "" });

  useEffect(() => {
    if (user) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [user]);

  const validateForm = () => {
    const newValidation = { email: "", password: "" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newValidation.email = "Email không được để trống";
    } else if (!emailRegex.test(formData.email.trim())) {
      newValidation.email = "Email không đúng định dạng";
    }

    if (!formData.password.trim()) {
      newValidation.password = "Mật khẩu không được để trống";
    } else if (formData.password.trim().length < 6) {
      newValidation.password = "Mật khẩu phải >= 6 ký tự";
    }

    setValidation(newValidation);
    return !newValidation.email && !newValidation.password;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    dispatch(loginUser(formData));
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-950 text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute top-0 left-0 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-float"></div>
      <div className="pointer-events-none absolute bottom-[-3rem] right-[-3rem] h-64 w-64 rounded-full bg-white/10 blur-3xl animate-float animation-delay-2000"></div>
      <div className="relative mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl rounded-[2rem] border border-white/20 bg-white/10 p-8 shadow-2xl shadow-black/40 backdrop-blur-3xl">
          <div className="space-y-6 text-center text-white">
            <div className="flex items-center justify-center text-5xl">✈️</div>
            <h1 className="text-4xl font-semibold">Travel Tour</h1>
            <p className="text-slate-200">Khám phá thế giới cùng chúng tôi</p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-slate-200">
                Đăng nhập để quản lý tour, đặt chuyến và trải nghiệm du lịch cùng hệ thống của chúng tôi.
              </p>
              {user && (
                <div className="rounded-3xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-emerald-100">
                  <p className="font-semibold">Đăng nhập thành công!</p>
                  <p className="mt-2 text-sm">Email: {user.email}</p>
                  <p className="mt-1 text-sm">Vai trò: {user.roleId || "user"}</p>
                </div>
              )}
              {error && !user && (
                <div className="rounded-3xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-100">
                  {error}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-xl shadow-slate-950/30">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Nhập email..."
                    className="w-full rounded-3xl border border-white/20 bg-white/10 px-5 py-3 text-white outline-none transition focus:border-white focus:bg-white/15"
                  />
                  {validation.email && <p className="text-sm text-rose-300">{validation.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Mật khẩu</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu..."
                    className="w-full rounded-3xl border border-white/20 bg-white/10 px-5 py-3 text-white outline-none transition focus:border-white focus:bg-white/15"
                  />
                  {validation.password && <p className="text-sm text-rose-300">{validation.password}</p>}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-300">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={formData.remember}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-white/30 bg-slate-900 text-emerald-400"
                    />
                    Ghi nhớ đăng nhập
                  </label>
                  <Link to="/" className="text-white/80 hover:text-white">
                    Quên mật khẩu?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500 px-5 py-3 text-base font-semibold text-slate-950 transition hover:shadow-[0_10px_20px_rgba(255,94,98,0.35)]"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Đang xử lý..." : "Đăng nhập"}
                </button>

                <p className="text-center text-sm text-slate-300">
                  Chưa có tài khoản?{' '}
                  <Link to="/register" className="font-semibold text-white hover:underline">
                    Đăng ký ngay
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
