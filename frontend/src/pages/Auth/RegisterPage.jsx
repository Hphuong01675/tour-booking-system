// Path: frontend/src/pages/Auth/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../../api/authApi';

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không trùng khớp.' });
      return;
    }

    if (!agreeTerms) {
      setMessage({ type: 'error', text: 'Vui lòng đồng ý với các điều khoản và chính sách.' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth || null,
        phone: formData.phone,
        email: formData.email,
        address: formData.address || null,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setMessage({ type: 'success', text: response.data.message });
      
      // Redirect to OTP page after sending
      setTimeout(() => {
        navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
      }, 1000);

    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Có lỗi xảy ra trong quá trình đăng ký.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] min-h-screen flex flex-col font-sans">
      {/* TopAppBar */}
      <header className="fixed top-0 z-50 w-full h-16 flex justify-between items-center px-4 md:px-16 bg-white border-b border-[#c3c6d6]">
        <div className="text-xl md:text-2xl font-bold text-[#003d9b] tracking-tight">Chip3Chip</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#434654] hidden md:block">Bạn đã có tài khoản?</span>
          <Link className="text-sm text-[#003d9b] font-bold hover:text-[#0052cc] transition-colors" to="/login">
            Đăng nhập
          </Link>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-4">
        <div className="max-w-6xl w-full grid md:grid-cols-2 bg-white rounded-xl overflow-hidden shadow-lg border border-[#c3c6d6]">
          {/* Left Side: Visual/Brand */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-[#003d9b]/20 z-10"></div>
            <img 
              className="absolute inset-0 w-full h-full object-cover" 
              alt="A serene and luxurious tropical beach setting" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuApcVBKPNCrenQclrVmhfTN-vaeILYpYbFBVDAYD6cz2uN3yWAKmuND1gXMQvn5K7judHi7wnsG_liOfBPE2EFCr--GIbxzcUNqlqzdY-1l1U_uSgqrLvwGHzalqHrI4rjWRhRnESIomqKxp70iJ8Xk2c8-TI76ksjjPXIEMnRvlNfhrrYECc-Ewkas1PZw3P0JpoAjxPQo7GnNQD6tV6uxBVkAIXAOOQRgU9TZ1kb46YodIMg5r1FFbU23AGjigZZ4lVRW8xXcQVZk"
            />
            <div className="relative z-20 h-full flex flex-col justify-end p-8 text-white">
              <h2 className="text-3xl lg:text-4xl font-bold mb-2">Khám phá thế giới theo cách của bạn.</h2>
              <p className="text-base lg:text-lg opacity-90">Bắt đầu hành trình của bạn với Chip3Chip ngay hôm nay. Hàng ngàn tour du lịch đang chờ đón bạn.</p>
            </div>
          </div>

          {/* Right Side: Registration Form */}
          <div className="p-6 md:p-8 flex flex-col">
            <div className="mb-6">
              <h1 class="text-2xl font-semibold text-[#191c1e] mb-1">Tạo tài khoản mới</h1>
              <p className="text-sm text-[#434654]">Vui lòng điền thông tin chi tiết của bạn bên dưới.</p>
            </div>

            {message.text && (
              <div 
                className={`p-4 mb-4 rounded-lg text-sm font-medium ${
                  message.type === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-[#ffdad6] text-[#93000a]'
                }`}
              >
                {message.text}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Họ và tên */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#191c1e]" htmlFor="fullName">Họ và tên</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#434654] text-[20px]">person</span>
                  <input 
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#c3c6d6] focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] outline-none transition-all bg-[#f8f9fb]" 
                    id="fullName" 
                    placeholder="Nguyễn Văn A" 
                    type="text" 
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Ngày sinh & Số điện thoại */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#191c1e]" htmlFor="dateOfBirth">Ngày tháng năm sinh</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#434654] text-[20px]">calendar_today</span>
                    <input 
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#c3c6d6] focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] outline-none transition-all bg-[#f8f9fb]" 
                      id="dateOfBirth" 
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#191c1e]" htmlFor="phone">Số điện thoại</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#434654] text-[20px]">call</span>
                    <input 
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#c3c6d6] focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] outline-none transition-all bg-[#f8f9fb]" 
                      id="phone" 
                      placeholder="0123 456 789" 
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#191c1e]" htmlFor="email">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#434654] text-[20px]">mail</span>
                  <input 
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#c3c6d6] focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] outline-none transition-all bg-[#f8f9fb]" 
                    id="email" 
                    placeholder="example@gmail.com" 
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Địa chỉ */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#191c1e]" htmlFor="address">Địa chỉ</label>
                <div className="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#434654] text-[20px]">location_on</span>
                  <input 
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#c3c6d6] focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] outline-none transition-all bg-[#f8f9fb]" 
                    id="address" 
                    placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/Thành phố" 
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Mật khẩu & Xác nhận */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#191c1e]" htmlFor="password">Mật khẩu</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#434654] text-[20px]">lock</span>
                    <input 
                      className="w-full pl-10 pr-12 py-3 rounded-lg border border-[#c3c6d6] focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] outline-none transition-all bg-[#f8f9fb]" 
                      id="password" 
                      placeholder="••••••••" 
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#434654] hover:text-[#003d9b] transition-colors" 
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#191c1e]" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#434654] text-[20px]">lock_reset</span>
                    <input 
                      className="w-full pl-10 pr-12 py-3 rounded-lg border border-[#c3c6d6] focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] outline-none transition-all bg-[#f8f9fb]" 
                      id="confirmPassword" 
                      placeholder="••••••••" 
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#434654] hover:text-[#003d9b] transition-colors" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Nút gửi */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-4 bg-[#fe6b00] hover:bg-[#a04100] text-white font-semibold rounded-lg shadow-md transition-all transform active:scale-[0.98] flex justify-center items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    'Xác thực OTP'
                  )}
                </button>
              </div>

              <div className="flex items-start gap-2 text-xs leading-tight text-[#434654]">
                <input 
                  className="mt-1 rounded text-[#003d9b] focus:ring-[#003d9b]" 
                  id="agreeTerms" 
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                />
                <label htmlFor="agreeTerms">
                  Bằng cách đăng ký, tôi đồng ý với <a className="text-[#003d9b] hover:underline" href="#">Điều khoản dịch vụ</a> và <a className="text-[#003d9b] hover:underline" href="#">Chính sách bảo mật</a> của Chip3Chip.
                </label>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full flex flex-col md:flex-row justify-between items-center px-4 md:px-16 py-6 bg-[#f3f4f6] border-t border-[#c3c6d6]">
        <div className="font-bold text-[#191c1e] mb-4 md:mb-0">Chip3Chip</div>
        <div className="text-xs text-[#434654] text-center md:text-left order-3 md:order-2">
          © 2024 Chip3Chip. Tất cả quyền được bảo lưu.
        </div>
        <div className="flex gap-4 mb-4 md:mb-0 order-2 md:order-3 text-xs text-[#434654]">
          <a className="hover:underline cursor-pointer" href="#">Điều khoản</a>
          <a className="hover:underline cursor-pointer" href="#">Bảo mật</a>
          <a className="hover:underline cursor-pointer" href="#">Liên hệ</a>
        </div>
      </footer>
    </div>
  );
}

export default RegisterPage;
