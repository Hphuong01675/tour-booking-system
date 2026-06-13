import React, { useState } from 'react';
import authApi from '../../api/authApi';

const SignUpForm = ({ onSignUpSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Xóa lỗi khi người dùng bắt đầu nhập lại
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên là bắt buộc';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^[0-9\s\-+()]{9,20}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Bạn phải đồng ý với điều khoản dịch vụ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || null,
        address: formData.address || null,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response.data && response.data.email) {
        onSignUpSuccess(response.data.email);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Đạo ký thất bại. Vui lòng thử lại.';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-md" onSubmit={handleSubmit}>
      {/* Họ và tên */}
      <div className="space-y-base">
        <label className="text-label-md font-label-md text-on-surface">Họ và tên</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            person
          </span>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Nguyễn Văn A"
            className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-1 outline-none transition-all bg-surface ${
              errors.fullName
                ? 'border-error focus:border-error focus:ring-error'
                : 'border-outline-variant focus:border-primary focus:ring-primary'
            }`}
          />
        </div>
        {errors.fullName && <p className="text-label-sm text-error">{errors.fullName}</p>}
      </div>

      {/* Ngày tháng năm sinh & Số điện thoại */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <div className="space-y-base">
          <label className="text-label-md font-label-md text-on-surface">Ngày tháng năm sinh</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              calendar_today
            </span>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface"
            />
          </div>
        </div>
        <div className="space-y-base">
          <label className="text-label-md font-label-md text-on-surface">Số điện thoại</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              call
            </span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="0123 456 789"
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-1 outline-none transition-all bg-surface ${
                errors.phone
                  ? 'border-error focus:border-error focus:ring-error'
                  : 'border-outline-variant focus:border-primary focus:ring-primary'
              }`}
            />
          </div>
          {errors.phone && <p className="text-label-sm text-error">{errors.phone}</p>}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-base">
        <label className="text-label-md font-label-md text-on-surface">Email</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            mail
          </span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="example@gmail.com"
            className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-1 outline-none transition-all bg-surface ${
              errors.email
                ? 'border-error focus:border-error focus:ring-error'
                : 'border-outline-variant focus:border-primary focus:ring-primary'
            }`}
          />
        </div>
        {errors.email && <p className="text-label-sm text-error">{errors.email}</p>}
      </div>

      {/* Địa chỉ */}
      <div className="space-y-base">
        <label className="text-label-md font-label-md text-on-surface">Địa chỉ</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            location_on
          </span>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/Thành phố"
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface"
          />
        </div>
      </div>

      {/* Mật khẩu & Xác nhận mật khẩu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <div className="space-y-base">
          <label className="text-label-md font-label-md text-on-surface">Mật khẩu</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              lock
            </span>
            <input
              type={showPassword.password ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className={`w-full pl-10 pr-12 py-3 rounded-lg border focus:ring-1 outline-none transition-all bg-surface ${
                errors.password
                  ? 'border-error focus:border-error focus:ring-error'
                  : 'border-outline-variant focus:border-primary focus:ring-primary'
              }`}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('password')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword.password ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {errors.password && <p className="text-label-sm text-error">{errors.password}</p>}
        </div>
        <div className="space-y-base">
          <label className="text-label-md font-label-md text-on-surface">Xác nhận mật khẩu</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              lock_reset
            </span>
            <input
              type={showPassword.confirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              className={`w-full pl-10 pr-12 py-3 rounded-lg border focus:ring-1 outline-none transition-all bg-surface ${
                errors.confirmPassword
                  ? 'border-error focus:border-error focus:ring-error'
                  : 'border-outline-variant focus:border-primary focus:ring-primary'
              }`}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirmPassword')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword.confirmPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {errors.confirmPassword && <p className="text-label-sm text-error">{errors.confirmPassword}</p>}
        </div>
      </div>

      {/* Nút gửi */}
      <div className="pt-sm">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-secondary-container hover:bg-secondary disabled:bg-gray-400 text-white font-label-md text-label-md rounded-lg shadow-md transition-all transform active:scale-[0.98]"
        >
          {loading ? 'Đang xử lý...' : 'Xác thực OTP'}
        </button>
      </div>

      {/* Điều khoản dịch vụ */}
      <div className="flex items-start gap-sm">
        <input
          type="checkbox"
          id="terms"
          name="agreeToTerms"
          checked={formData.agreeToTerms}
          onChange={handleInputChange}
          className="mt-1 rounded text-primary focus:ring-primary"
        />
        <label className="text-label-sm font-label-sm text-on-surface-variant leading-tight" htmlFor="terms">
          Bằng cách đăng ký, tôi đồng ý với <a href="#" className="text-primary hover:underline">Điều khoản dịch vụ</a> và{' '}
          <a href="#" className="text-primary hover:underline">Chính sách bảo mật</a> của GlobalExplore.
        </label>
      </div>
      {errors.agreeToTerms && <p className="text-label-sm text-error">{errors.agreeToTerms}</p>}

      {/* Lỗi submit */}
      {errors.submit && <p className="text-label-sm text-error text-center bg-error-container/20 p-2 rounded">{errors.submit}</p>}
    </form>
  );
};

export default SignUpForm;

