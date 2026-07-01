import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../features/auth/authSlice";

const OperatorHeader = ({ currentUser }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/login");
    };

    const navItems = [
        { path: "/operator/tours", label: "Điều hành tour" },
        { path: "/operator/approvals", label: "Phê duyệt khách hàng" },
        { path: "/operator/customers/cancel", label: "Quản lý khách hàng" },
    ];

    const avatarUrl = currentUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-outline-variant/30 px-s-margin-mobile md:px-s-margin-desktop shadow-sm flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-s-xxl">
                <Link to="/operator/tours" className="text-2xl font-bold text-primary tracking-tight font-headline-lg flex items-center">
                    Chip3Chip
                </Link>
 
                {/* Desktop Navigation Tabs */}
                <nav className="hidden md:flex items-center gap-s-xl h-16">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`relative flex items-center h-full px-s-xs text-[15px] font-medium transition-colors hover:text-primary ${
                                    isActive ? "text-primary font-bold" : "text-on-surface-variant/70"
                                }`}
                            >
                                {item.label}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"></span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Right Side: Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center focus:outline-none hover:scale-105 active:scale-95 transition-transform"
                    title="Menu tài khoản"
                >
                    <img
                        src={avatarUrl}
                        alt={currentUser?.fullName || "Operator Avatar"}
                        className="w-10 h-10 rounded-full object-cover border border-primary/20 shadow-sm"
                    />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-s-sm w-48 bg-white border border-outline-variant/30 rounded-xl shadow-lg py-s-sm z-50 animate-fadeIn">
                        {/* Dropdown Header */}
                        {currentUser?.fullName && (
                            <div className="px-s-md py-s-sm border-b border-outline-variant/20 mb-s-xs">
                                <p className="font-semibold text-sm text-on-surface truncate">{currentUser.fullName}</p>
                                <p className="text-xs text-on-surface-variant/80 truncate">Điều hành</p>
                            </div>
                        )}
                        <Link
                            to="/operator/profile"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-s-sm px-s-md py-s-sm text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">person</span>
                            Thông tin cá nhân
                        </Link>
                        <button
                            onClick={() => {
                                setIsDropdownOpen(false);
                                handleLogout();
                            }}
                            className="w-full flex items-center gap-s-sm px-s-md py-s-sm text-sm text-error hover:bg-error-container/10 transition-colors text-left"
                        >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                            Đăng xuất
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.15s ease-out forwards;
                }
            `}</style>
        </header>
    );
};

export default OperatorHeader;
