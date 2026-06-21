import React from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpSuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full h-16 flex justify-between items-center px-4 md:px-s-margin-desktop bg-surface border-b border-outline-variant">
        <div className="text-headline-sm font-headline-lg-mobile md:font-headline-lg text-primary tracking-tight">Chip3Chip</div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-s-margin-mobile">
        <div className="max-w-md w-full bg-surface-container-lowest rounded-xl shadow-lg p-s-lg md:p-s-xl border border-outline-variant text-center flex flex-col items-center gap-s-lg">
          <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl">check_circle</span>
          </div>

          <div>
            <h1 className="text-headline-md font-headline-md text-on-surface mb-s-xs">Đăng ký thành công!</h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Chúc mừng bạn đã hoàn tất đăng ký tài khoản tại Chip3Chip. Tài khoản của bạn đã được kích hoạt thành công.
            </p>
          </div>

          <button
            onClick={() => navigate('/auth/login')}
            className="w-full bg-secondary-container hover:bg-secondary text-white py-s-md rounded-lg font-label-md transition-all shadow-md"
          >
            Đi tới trang đăng nhập
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full flex flex-col md:flex-row justify-between items-center px-s-margin-mobile md:px-s-margin-desktop py-s-lg bg-surface-container-low border-t border-outline-variant">
        <div className="text-label-md font-label-md font-bold text-on-surface mb-s-md md:mb-0">Chip3Chip</div>
        <div className="text-body-sm font-body-sm text-on-surface-variant text-center md:text-left order-3 md:order-2">
          © 2024 Chip3Chip. Tất cả quyền được bảo lưu.
        </div>
        <div className="flex gap-s-md mb-s-md md:mb-0 order-2 md:order-3">
          <a href="#" className="text-label-sm font-label-sm text-on-surface-variant hover:underline decoration-secondary cursor-pointer">
            Điều khoản
          </a>
          <a href="#" className="text-label-sm font-label-sm text-on-surface-variant hover:underline decoration-secondary cursor-pointer">
            Bảo mật
          </a>
          <a href="#" className="text-label-sm font-label-sm text-on-surface-variant hover:underline decoration-secondary cursor-pointer">
            Liên hệ
          </a>
        </div>
      </footer>
    </div>
  );
};

export default SignUpSuccessPage;

