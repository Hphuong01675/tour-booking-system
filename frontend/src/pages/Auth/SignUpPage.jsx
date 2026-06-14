import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '../../components/Auth/AuthHeader';
import SignUpForm from '../../components/Auth/SignUpForm';
import AuthFooter from '../../components/Auth/AuthFooter';

const SignUpPage = () => {
  const navigate = useNavigate();

  const handleSignUpSuccess = (email) => {
    // Điều hướng đến trang xác thực OTP với email
    navigate('/auth/verify-otp', { state: { email } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader showLoginLink={true} />

      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-s-margin-mobile">
        <div className="max-w-6xl w-full grid md:grid-cols-2 bg-surface-container-lowest rounded-xl overflow-hidden shadow-lg border border-outline-variant">
          {/* Bên trái: Hình ảnh */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-primary/20 z-10"></div>
            <img
              className="absolute inset-0 w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuApcVBKPNCrenQclrVmhfTN-vaeILYpYbFBVDAYD6cz2uN3yWAKmuND1gXMQvn5K7judHi7wnsG_liOfBPE2EFCr--GIbxzcUNqlqzdY-1l1U_uSgqrLvwGHzalqHrI4rjWRhRnESIomqKxp70iJ8Xk2c8-TI76ksjjPXIEMnRvlNfhrrYECc-Ewkas1PZw3P0JpoAjxPQo7GnNQD6tV6uxBVkAIXAOOQRgU9TZ1kb46YodIMg5r1FFbU23AGjigZZ4lVRW8xXcQVZk"
              alt="Tropical Beach Setting"
            />
            <div className="relative z-20 h-full flex flex-col justify-end p-s-xl text-white">
              <h2 className="text-display-lg font-display-lg mb-s-sm">Khám phá thế giới theo cách của bạn.</h2>
              <p className="text-body-lg font-body-lg opacity-90">
                Bắt đầu hành trình của bạn với GlobalExplore ngay hôm nay. Hàng ngàn tour du lịch đang chờ đón bạn.
              </p>
            </div>
          </div>

          {/* Bên phải: Form Đăng ký */}
          <div className="p-s-lg md:p-s-xl flex flex-col">
            <div className="mb-s-lg">
              <h1 className="text-headline-md font-headline-md text-on-surface mb-s-xs">Tạo tài khoản mới</h1>
              <p className="text-body-sm font-body-sm text-on-surface-variant">Vui lòng điền thông tin chi tiết của bạn bên dưới.</p>
            </div>

            <SignUpForm onSignUpSuccess={handleSignUpSuccess} />
          </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
};

export default SignUpPage;

