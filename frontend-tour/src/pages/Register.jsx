import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerStart, registerSuccess, registerFailure, clearError } from "../store";
import { registerApi } from "../util/api";

const Register = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        firstName: "", lastName: "", email: "", phoneNumber: "",
        address: "", gender: "", password: "", confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            dispatch(registerFailure("Mật khẩu xác nhận không khớp."));
            return;
        }

        dispatch(registerStart());
        try {
            const submitData = { ...formData };
            if (submitData.gender === "true") submitData.gender = true;
            else if (submitData.gender === "false") submitData.gender = false;
            else delete submitData.gender;

            delete submitData.confirmPassword;

            await registerApi(submitData);
            dispatch(registerSuccess(formData.email));
            navigate("/verify-otp", { state: { email: formData.email } });
        } catch (err) {
            dispatch(registerFailure(err.response?.data?.message || "Lỗi kết nối server."));
        }
    };

    return (
        <main className="min-h-screen flex items-stretch overflow-hidden bg-[#f9f9fc] font-['Inter']">
            {/* Left Side: Inspirational Image Panel */}
            <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <img
                        className="w-full h-full object-cover"
                        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
                        alt="Travel Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#003ec7]/30 to-[#001e2b]/60"></div>
                </div>
                <div className="relative z-10 p-10 text-white max-w-lg text-left">
                    <h1 className="text-[48px] font-[800] leading-[1.2] mb-6 font-['Plus_Jakarta_Sans']">Khám phá thế giới cùng TravelSync</h1>
                    <p className="text-[18px] font-[400] leading-[1.6] text-white/90 mb-8">
                        Quản lý hành trình chuyên nghiệp, kết nối tour du lịch và mang lại những trải nghiệm khó quên cho khách hàng của bạn.
                    </p>
                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                        <div className="w-12 h-12 rounded-full bg-[#a04100] flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">explore</span>
                        </div>
                        <div>
                            <p className="text-[12px] font-[600] uppercase tracking-wider text-white/70 font-['Inter']">Cộng đồng của chúng tôi</p>
                            <p className="text-[24px] font-[700] text-white font-['Plus_Jakarta_Sans']">+500 Tour Operators</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Right Side: Sign Up Form */}
            <section className="w-full lg:w-1/2 bg-[#f9f9fc] flex flex-col items-center justify-center p-6 md:p-10 relative overflow-y-auto">
                <div className="absolute top-8 left-8 lg:left-10">
                    <span className="text-[24px] font-bold text-[#003ec7] font-['Plus_Jakarta_Sans']">TravelSync</span>
                </div>

                <div className="w-full max-w-[480px] bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-[#c3c5d9] mt-16 mb-8">
                    <div className="mb-8">
                        <h2 className="text-[32px] font-[700] leading-[1.3] mb-2 font-['Plus_Jakarta_Sans']">Đăng ký tài khoản</h2>
                        <p className="text-[#434656] text-[16px]">Bắt đầu quản lý tour chuyên nghiệp ngay hôm nay.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        {error && <div className="p-3 bg-red-50 text-[#ba1a1a] rounded-lg text-sm font-semibold">{error}</div>}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[12px] font-[600] text-[#434656] uppercase">Họ</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737688]">person</span>
                                    <input name="firstName" required className="input-field" placeholder="Nguyễn" onChange={handleChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-[600] text-[#434656] uppercase">Tên</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737688]">person</span>
                                    <input name="lastName" required className="input-field" placeholder="Văn A" onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-[600] text-[#434656] uppercase">Email</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737688]">mail</span>
                                <input name="email" type="email" required className="input-field" placeholder="example@travelsync.com" onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-[600] text-[#434656] uppercase">Số điện thoại</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737688]">call</span>
                                <input name="phoneNumber" type="tel" className="input-field" placeholder="0901234567" onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-[600] text-[#434656] uppercase">Địa chỉ</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737688]">location_on</span>
                                <input name="address" className="input-field" placeholder="Thủ Đức, TP. HCM" onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-[600] text-[#434656] uppercase">Giới tính</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737688]">wc</span>
                                <select name="gender" className="input-field appearance-none" onChange={handleChange}>
                                    <option value="">Chọn giới tính (tùy chọn)</option>
                                    <option value="true">Nam</option>
                                    <option value="false">Nữ</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-[600] text-[#434656] uppercase">Mật khẩu</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737688]">lock</span>
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="input-field pr-10"
                                    placeholder="••••••••"
                                    onChange={handleChange}
                                />
                                <span
                                    className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#737688] cursor-pointer hover:text-[#003ec7]"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? "visibility_off" : "visibility"}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-[600] text-[#434656] uppercase">Xác nhận mật khẩu</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737688]">lock_reset</span>
                                <input name="confirmPassword" type="password" required className="input-field" placeholder="••••••••" onChange={handleChange} />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 bg-[#fe6b00] hover:bg-[#a04100] text-white font-bold rounded-xl shadow-[0_4px_0_0_rgba(160,65,0,1)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            <span>{loading ? "Đang xử lý..." : "Đăng ký ngay"}</span>
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[#434656] text-[16px]">
                            Đã có tài khoản?
                            <Link to="/login" className="text-[#003ec7] font-bold hover:underline ml-1">Đăng nhập ngay</Link>
                        </p>
                    </div>
                </div>

                <div className="text-center text-[#737688] text-[12px]">
                    <p>© 2026 TravelSync Management. Bảo mật • Điều khoản • Trợ giúp</p>
                </div>
            </section>

            <style dangerouslySetInnerHTML={{ __html: `
                .input-field {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 2.5rem;
                    background-color: #f9f9fc;
                    border-radius: 0.5rem;
                    border: 1px solid #c3c5d9;
                    outline: none;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    border-color: #003ec7;
                    background-color: #ffffff;
                    box-shadow: 0 0 0 4px rgba(0, 82, 255, 0.1);
                }
            ` }} />
        </main>
    );
};

export default Register;