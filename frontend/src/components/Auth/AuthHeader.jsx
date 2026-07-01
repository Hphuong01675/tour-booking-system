import React from 'react';
import { Link } from 'react-router-dom';

const AuthHeader = ({ showLoginLink = true }) => {
  return (
    <header className="fixed top-0 z-50 w-full h-16 flex justify-between items-center px-4 md:px-s-margin-desktop bg-surface border-b border-outline-variant">
      <div className="text-headline-sm font-headline-lg-mobile md:font-headline-lg text-primary tracking-tight">Chip3Chip</div>
      {showLoginLink && (
        <div className="flex items-center gap-s-md">
          <span className="text-label-md font-label-md text-on-surface-variant hidden md:block">
            Bạn đã có tài khoản?
          </span>
          <Link
            to="/auth/login"
            className="text-label-md font-label-md text-primary font-bold hover:text-primary-container transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      )}
    </header>
  );
};

export default AuthHeader;

