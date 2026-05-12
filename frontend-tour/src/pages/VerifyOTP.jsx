import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { verifyActivationOtpApi } from '../util/api'; // Import hàm gọi API

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (!email) {
            navigate('/register');
        }
    }, [email, navigate]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timerId);
        }
    }, [timeLeft]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value !== '' && index < 3) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleResendOTP = async () => {
        setTimeLeft(60);
        setError('');
        // Chỗ này bạn có thể gọi API gửi lại mã OTP sau nếu backend có hỗ trợ
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpCode = otp.join('');

        if (otpCode.length < 4) {
            setError('Vui lòng nhập đủ 4 số OTP');
            return;
        }

        setLoading(true); setError('');

        try {
            // Gọi hàm từ api.js
            const res = await verifyActivationOtpApi(email, otpCode);

            setSuccess(res.data.message || 'Kích hoạt thành công!');
            setTimeout(() => {
                navigate('/login', { state: { msg: '🎉 Kích hoạt tài khoản thành công! Vui lòng đăng nhập.' } });
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
        } finally {
            setLoading(false);
        }
    };

    if (!email) return null;

    return (
        <div className="min-h-screen flex flex-col bg-[#f9f9fc]">
            <Header />
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="bg-white p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full max-w-md border border-gray-100">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold mb-2 text-gray-800 text-center">Xác thực tài khoản</h2>
                    <p className="text-sm mb-8 text-gray-500 text-center leading-relaxed">
                        Chúng tôi đã gửi mã xác thực gồm 4 chữ số đến <br/>
                        <span className="font-semibold text-gray-700 underline">{email}</span>
                    </p>

                    <form onSubmit={handleVerify} className="space-y-8">
                        <div className="flex justify-center gap-3">
                            {[0, 1, 2, 3].map((index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    maxLength="1"
                                    value={otp[index]}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 focus:outline-none bg-gray-50 transition-all hover:bg-white focus:bg-white focus:-translate-y-1 shadow-sm"
                                    required
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Đang xác thực...</span>
                                </>
                            ) : (
                                <span>Xác nhận kích hoạt</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-sm text-center min-h-[20px]">
                        {error && <span className="text-red-600 font-semibold">{error}</span>}
                        {success && <span className="text-green-600 font-semibold">🎉 {success}</span>}
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-50 text-center text-sm">
                        <p className="text-gray-500">Bạn chưa nhận được mã?</p>
                        <button
                            onClick={handleResendOTP}
                            disabled={timeLeft > 0}
                            className="mt-2 font-bold text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            Gửi lại mã {timeLeft > 0 && <span>({timeLeft}s)</span>}
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default VerifyOTP;