// Path: frontend/src/pages/Auth/OTPPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authApi from '../../api/authApi';

function OTPPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '']);
  const [timeInSeconds, setTimeInSeconds] = useState(300); // 5 minutes
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeInSeconds <= 0) {
      setMessage({ type: 'error', text: 'Mã OTP đã hết hạn. Vui lòng bấm gửi lại mã.' });
      return;
    }

    const timer = setInterval(() => {
      setTimeInSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeInSeconds]);

  const formatTime = () => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (index, value) => {
    if (value !== '' && !/^\d+$/.test(value)) {
      return;
    }

    if (value.length > 1) {
      value = value.slice(-1);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value.length === 1 && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 4 && /^\d+$/.test(pasteData)) {
      const newOtp = pasteData.split('');
      setOtp(newOtp);
      inputRefs[3].current.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 4) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ mã OTP 4 số.' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authApi.verifyOTP(email, fullOtp);
      setMessage({ type: 'success', text: response.data.message });

      // Redirect on success (you can navigate to dashboard or login success page)
      setTimeout(() => {
        navigate(response.data.redirect || '/login');
      }, 1500);

    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Xác thực OTP thất bại.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setOtp(['', '', '', '']);
    if (inputRefs[0].current) inputRefs[0].current.focus();

    try {
      const response = await authApi.resendOTP(email);
      setMessage({ type: 'success', text: 'Mã OTP mới đã được gửi thành công.' });
      setTimeInSeconds(300); // Reset timer
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Không thể gửi lại mã OTP.';
      setMessage({ type: 'error', text: errMsg });
    }
  };

  // Auto trigger verification when all digits are filled
  useEffect(() => {
    if (otp.join('').length === 4) {
      handleVerify();
    }
  }, [otp]);

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] font-sans min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="bg-white border-b border-[#c3c6d6] fixed top-0 w-full z-50">
        <div className="flex justify-between items-center px-4 md:px-16 h-16 w-full">
          <div className="text-xl md:text-2xl font-bold text-[#003d9b] tracking-tight">Chip3Chip</div>
          <div className="flex items-center gap-4">
            <button className="text-[#434654] font-medium hover:text-[#003d9b] transition-colors text-sm">Help</button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center pt-16 px-4">
        <div className="max-w-md w-full py-12">
          {/* Auth Container Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 flex flex-col gap-6 border border-[#c3c6d6]">
            {/* Branding/Icon Section */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-16 h-16 bg-[#dae2ff] rounded-full flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-[#003d9b] text-4xl">verified_user</span>
              </div>
              <h1 className="text-2xl font-bold text-[#191c1e]">Xác thực OTP</h1>
              <p className="text-sm text-[#434654]">Mã OTP đã được gửi đến email:</p>
              <p className="text-sm font-semibold text-[#003d9b]">{email}</p>
            </div>

            {message.text && (
              <div 
                className={`p-4 rounded-lg text-sm font-medium text-center ${
                  message.type === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-[#ffdad6] text-[#93000a]'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* OTP Input Grid */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-center gap-4" id="otp-container">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    className="otp-input w-14 h-16 text-center text-2xl font-bold rounded-lg border border-[#737685] bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#dae2ff] outline-none transition-all"
                    maxLength={1}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={digit}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                  />
                ))}
              </div>
              {/* Countdown */}
              <div className="flex items-center justify-center gap-1 text-xs">
                <span className="material-symbols-outlined text-[#434654] text-[18px]">schedule</span>
                <span className="text-[#434654]">Mã sẽ hết hạn sau</span>
                <span className={`font-bold ${timeInSeconds <= 0 ? 'text-red-600' : 'text-[#a04100]'}`}>
                  {formatTime()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              <button 
                id="verifyBtn" 
                onClick={handleVerify}
                disabled={isLoading}
                className="w-full bg-[#fe6b00] hover:bg-[#a04100] text-white py-3 rounded-lg font-semibold transition-all active:scale-[0.98] shadow-md flex justify-center items-center gap-2"
              >
                {isLoading ? 'Đang xác thực...' : 'Xác nhận'}
              </button>
              <div className="text-center text-sm">
                <span className="text-[#434654]">Bạn chưa nhận được mã?</span>
                <button 
                  onClick={handleResend}
                  className="ml-1 text-[#003d9b] font-semibold hover:underline decoration-secondary"
                >
                  Gửi lại mã
                </button>
              </div>
            </div>
          </div>

          {/* Decorative Image / Brand Context */}
          <div className="mt-8 rounded-xl overflow-hidden relative h-48 shadow-md group">
            <img 
              alt="Security Travel" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyHCb-VABOvWPETXxydPK3XAQLE2kbmXjjueaJwlZzmBcF6TmSuirkzllq_oybXMBzHbQbznbGdd40VkXe7UwWzr474dJD5VoxraqQI0JxJVvLWNma38kbMq_Y5Dl99E3YUdhief9DhvakLfGIA2TKR7NPFWOoteGfTknuAZRcmhGRufd7rDL1ebZTLgTqMcEBVXyCd73Ibpcq1PFk66tR0ktSHFAehAUbw4NzLmu6lnINbX7jqg4_HKdMRAU2Suf1bHDILI15Ceq4"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
              <p className="text-white text-sm">Chip3Chip bảo vệ mọi chuyến đi của bạn với hệ thống bảo mật đa lớp.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#f3f4f6] border-t border-[#c3c6d6] text-xs">
        <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-16 py-6 w-full gap-4">
          <div className="font-bold text-[#191c1e]">Chip3Chip</div>
          <div className="flex gap-4 text-[#434654]">
            <a className="hover:underline" href="#">Điều khoản</a>
            <a className="hover:underline" href="#">Bảo mật</a>
            <a className="hover:underline" href="#">Liên hệ</a>
          </div>
          <div className="text-[#434654]">
            © 2024 Chip3Chip. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default OTPPage;
