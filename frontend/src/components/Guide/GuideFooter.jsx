import React from "react";

const GuideFooter = () => {
    return (
        <footer className="bg-surface border-t border-outline-variant/20 py-s-lg px-s-margin-mobile md:px-s-margin-desktop text-on-surface-variant/70">
            <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-s-md text-sm">
                <div>
                    <span className="font-bold text-primary mr-1">Chip3Chip</span>
                    <span>© {new Date().getFullYear()} Chip3Chip. Hệ thống Dẫn Tour Chuyên Nghiệp.</span>
                </div>
                <div className="flex gap-s-lg">
                    <a href="#help" className="hover:text-primary transition-colors">Trợ giúp</a>
                    <a href="#privacy" className="hover:text-primary transition-colors">Điều khoản & Bảo mật</a>
                </div>
            </div>
        </footer>
    );
};

export default GuideFooter;
