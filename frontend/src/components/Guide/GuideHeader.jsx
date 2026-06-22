import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';

const GuideHeader = ({ currentUser, onLogoutClick }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const activeClass = "text-[16px] leading-6 text-primary border-b-2 border-primary pb-1 font-semibold transition-all duration-200";
    const inactiveClass = "text-[16px] leading-6 text-slate-600 hover:text-primary transition-colors";

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50 flex justify-between items-center w-full px-margin-desktop h-[84px]">
            <div className="flex items-center gap-xl">
                <h1 className="text-[28px] leading-9 font-bold text-primary">
                    Chip3Chip
                </h1>
                <nav className="hidden md:flex items-center gap-lg">
                    <NavLink
                        className={({ isActive }) => isActive ? activeClass : inactiveClass}
                        to="/guides/tours"
                    >
                        Lịch dẫn tour
                    </NavLink>
                    <NavLink
                        className={({ isActive }) => isActive ? activeClass : inactiveClass}
                        to="/guides/consultations"
                    >
                        Tư vấn khách hàng
                    </NavLink>
                </nav>
            </div>

            <div className="flex items-center gap-md">
                {/* User Avatar & Dropdown */}
                <div className="flex items-center gap-sm relative" ref={dropdownRef}>
                    <img
                        alt="Guide profile avatar"
                        className="w-10 h-10 rounded-full object-cover border-2 border-primary-fixed cursor-pointer"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        src={currentUser?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuBREwJ-JeJZx87z66kS657dVoUH0ED91CpDA2K37pcfEqiwRUjg8XKp_qq__pTS6g_evItYcZ-x_ZeU3GtJRGBrxiXW7tR9nXeuV8zHz_v8hW8tX_AInRYL-9DB6eDolmH8gDaUkK1SyQlyHDexZunz5nftL8HIBdK5TzC_ibblNSVeCxSQxPft_Da9oQopCeKqQ5DujWtrwbazZ9lZwU3Ylr71y1wAkfikRqhpH0PDX4d7VQzs7pRsUD-TNJcYUFCzzb43PrRq90kH"}
                    />

                    <div className={`absolute right-0 top-full mt-2 w-48 bg-white border border-outline-variant/30 rounded-lg shadow-lg transition-all duration-200 z-50 overflow-hidden ${isDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                        <div className="flex flex-col py-1">
                            <Link
                                to="/guide/profile"
                                onClick={() => setIsDropdownOpen(false)}
                                className="w-full text-left px-md py-sm hover:bg-surface-container-low text-body-sm text-on-surface transition-colors"
                            >
                                Thông tin cá nhân
                            </Link>
                            {onLogoutClick && (
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        onLogoutClick();
                                    }}
                                    className="w-full text-left px-md py-sm hover:bg-surface-container-low text-body-sm text-error transition-colors"
                                >
                                    Đăng xuất
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default GuideHeader;

