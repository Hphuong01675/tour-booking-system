import React from 'react';

const AuthFooter = () => {
  return (
    <footer className="mt-auto w-full flex flex-col md:flex-row justify-between items-center px-s-margin-mobile md:px-s-margin-desktop py-s-lg bg-surface-container-low border-t border-outline-variant">
      <div className="text-label-md font-label-md font-bold text-on-surface mb-s-md md:mb-0">GlobalExplore</div>
      <div className="text-body-sm font-body-sm text-on-surface-variant text-center md:text-left order-3 md:order-2">
        © 2024 GlobalExplore. Tất cả quyền được bảo lưu.
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
  );
};

export default AuthFooter;

