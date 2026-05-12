import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass, LogIn, UserPlus } from 'lucide-react';

const Header = () => {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    {/* Brand Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="bg-blue-600 p-2 rounded-lg group-hover:rotate-12 transition-transform">
                            <Compass className="text-white" size={24} />
                        </div>
                        <span className="font-black text-2xl text-blue-600 tracking-tighter">TravelSync</span>
                    </Link>

                    {/* Desktop Menu */}
                    <nav className="flex items-center gap-8">
                        <Link to="/" className="text-gray-600 hover:text-blue-600 font-bold flex items-center gap-1.5 transition-colors">
                            <Home size={18} /> Trang chủ
                        </Link>
                        <div className="h-6 w-[1px] bg-gray-200"></div>
                        <Link to="/login" className="text-gray-600 hover:text-blue-600 font-bold flex items-center gap-1.5 transition-colors">
                            <LogIn size={18} /> Đăng nhập
                        </Link>
                        <Link to="/register" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center gap-2">
                            <UserPlus size={18} /> Tham gia ngay
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;