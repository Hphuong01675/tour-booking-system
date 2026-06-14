import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OTPInput from '../../components/Auth/OTPInput';
import authApi from '../../api/authApi';

const OTPVerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canResend, setCanResend] = useState(false);

  // Lấy email từ state hoặc query params
  useEffect(() => {
    const stateEmail = location.state?.email;
    const queryEmail = new URLSearchParams(location.search).get('email');
    const emailToUse = stateEmail || queryEmail;

    if (emailToUse) {
      setEmail(emailToUse);
    } else {
      // Nếu không có email, chuyển hướng về trang đăng ký
      navigate('/auth/signup');
    }
  }, [location, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOTPComplete = async (completedOtp) => {
    await submitOTP(completedOtp);
  };

  const submitOTP = async (otpToSubmit) => {
    if (otpToSubmit.length !== 4) {
      setError('Vui lòng nhập đầy đủ 4 chữ số');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.verifyOTP(email, otpToSubmit);

      if (response.data) {
        setSuccess('Xác thực thành công!');
        // Chuyển hướng đến trang thành công sau 2 giây
        setTimeout(() => {
          navigate('/auth/signup-success');
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Xác thực OTP thất bại. Vui lòng thử lại.';
      setError(errorMsg);
      setOtp(''); // Reset OTP input
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await authApi.resendOTP(email);

      if (response.data) {
        setSuccess('Mã OTP mới đã được gửi đến email của bạn.');
        setOtp('');
        setCountdown(300);
        setCanResend(false);

        // Xóa thông báo thành công sau 3 giây
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Gửi lại mã OTP thất bại. Vui lòng thử lại.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background font-body-md">
      {/* Header */}
      <header className="bg-surface dark:bg-surface-dim border-b border-outline-variant dark:border-outline fixed top-0 w-full z-50">
        <div className="flex justify-between items-center px-4 md:px-s-margin-desktop h-16 w-full">
          <div className="text-headline-sm font-headline-lg-mobile text-primary dark:text-inverse-primary tracking-tight">GlobalExplore</div>
          <div className="flex items-center gap-s-md">
            <button className="text-on-surface-variant font-medium hover:text-primary transition-colors text-label-md font-label-md">
              Help
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center pt-16 px-4">
        <div className="max-w-md w-full py-s-xl">
          {/* OTP Container Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-lg p-s-lg md:p-s-xl flex flex-col gap-s-lg border border-outline-variant">
            {/* Icon Section */}
            <div className="flex flex-col items-center text-center gap-s-sm">
              <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mb-s-sm">
                <span className="material-symbols-outlined text-primary text-4xl">verified_user</span>
              </div>
              <h1 className="text-headline-md font-headline-md text-on-surface">Xác thực OTP</h1>
              <p className="text-body-md text-on-surface-variant">Mã OTP đã được gửi đến email/số điện thoại của bạn</p>
              <p className="text-body-sm text-on-surface-variant">{email}</p>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-error-container/20 border border-error text-error-container text-label-sm p-s-md rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100/20 border border-green-500 text-green-700 text-label-sm p-s-md rounded-lg">
                {success}
              </div>
            )}

            {/* OTP Input Grid */}
            <div className="flex flex-col gap-s-md">
              <OTPInput value={otp} onChange={setOtp} onComplete={handleOTPComplete} />

              {/* Countdown */}
              <div className="flex items-center justify-center gap-s-xs text-body-sm">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">schedule</span>
                <span className="text-on-surface-variant">Mã sẽ hết hạn sau</span>
                <span className={`font-bold ${countdown <= 60 ? 'text-error' : 'text-secondary'}`}>
                  {formatCountdown(countdown)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-s-md">
              <button
                onClick={() => submitOTP(otp)}
                disabled={loading || otp.length !== 4}
                className="w-full bg-secondary-container hover:bg-secondary disabled:bg-gray-400 text-white py-s-md rounded-lg font-label-md transition-all active:scale-[0.98] shadow-md"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
              <div className="text-center text-body-sm">
                <span className="text-on-surface-variant">Bạn chưa nhận được mã?</span>
                <button
                  onClick={handleResendOTP}
                  disabled={!canResend || loading}
                  className={`ml-1 font-semibold hover:underline decoration-secondary ${
                    canResend ? 'text-primary cursor-pointer' : 'text-on-surface-variant cursor-not-allowed'
                  }`}
                >
                  Gửi lại mã
                </button>
              </div>
            </div>
          </div>

          {/* Decorative Image */}
          <div className="mt-s-xl rounded-xl overflow-hidden relative h-48 md:h-64 shadow-md group">
            <img
              alt="Security Travel"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyHCb-VABOvWPETXxydPK3XAQLE2kbmXjjueaJwlZzmBcF6TmSuirkzllq_oybXMBzHbQbznbGdd40VkXe7UwWzr474dJD5VoxraqQI0JxJVvLWNma38kbMq_Y5Dl99E3YUdhief9DhvakLfGIA2TKR7NPFWOoteGfTknuAZRcmhGRufd7rDL1ebZTLgTqMcEBVXyCd73Ibpcq1PFk66tR0ktSHFAehAUbw4NzLmu6lnINbX7jqg4_HKdMRAU2Suf1bHDILI15Ceq4"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-s-lg">
              <p className="text-white font-label-md">GlobalExplore bảo vệ mọi chuyến đi của bạn với hệ thống bảo mật đa lớp.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low dark:bg-surface-container-lowest border-t border-outline-variant">
        <div className="flex flex-col md:flex-row justify-between items-center px-s-margin-mobile md:px-s-margin-desktop py-s-lg w-full gap-s-md">
          <div className="text-label-md font-label-md font-bold text-on-surface">GlobalExplore</div>
          <div className="flex gap-s-lg">
            <a href="#" className="text-on-surface-variant text-label-sm font-label-sm hover:underline decoration-secondary">
              Điều khoản
            </a>
            <a href="#" className="text-on-surface-variant text-label-sm font-label-sm hover:underline decoration-secondary">
              Bảo mật
            </a>
            <a href="#" className="text-on-surface-variant text-label-sm font-label-sm hover:underline decoration-secondary">
              Liên hệ
            </a>
          </div>
          <div className="text-on-surface-variant text-body-sm font-body-sm">© 2024 GlobalExplore. Tất cả quyền được bảo lưu.</div>
        </div>
      </footer>
    </div>
  );
};

export default OTPVerificationPage;

