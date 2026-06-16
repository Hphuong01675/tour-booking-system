import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../features/auth/authSlice";

const TopNavBar = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    const pathname = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const isReview = searchParams.get("tab") === "review";

    const isDatTourActive = pathname === "/" || pathname.startsWith("/tours/");
    const isTourCuaToiActive = pathname === "/customer/tours" && !isReview;
    const isLichSuGiaoDichActive = pathname === "/customer/transactions";
    const isDanhGiaActive = isReview;
    const isThongTinCaNhanActive = pathname === "/customer/profile";

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/");
    };

    const getLinkClass = (isActive) => {
        return `px-3 py-1 text-sm font-bold transition-all duration-200 flex items-center gap-1.5 relative border-b-2 ${
            isActive
                ? "text-primary border-secondary"
                : "text-neutral-600 border-transparent hover:text-primary hover:border-secondary/40"
        }`;
    };

    return (
        <nav className="sticky top-0 z-50 w-full h-16 bg-white/80 backdrop-blur-md border-b border-outline-variant shadow-sm text-neutral-800">
            <div className="max-w-[1440px] mx-auto flex justify-between items-center h-full px-margin-mobile md:px-margin-desktop">
                {/* Logo */}
                <div className="flex items-center">
                    <Link className="text-headline-md font-headline-md font-bold text-primary tracking-tight" to="/">
                        GlobalExplore
                    </Link>
                </div>

                {/* Center Menu Links */}
                <div className="hidden md:flex items-center gap-6">
                    <Link to="/" className={getLinkClass(isDatTourActive)}>
                        Đặt tour
                    </Link>
                    <Link to="/customer/tours" className={getLinkClass(isTourCuaToiActive)}>
                        Tour của tôi
                    </Link>
                    <Link to="/customer/transactions" className={getLinkClass(isLichSuGiaoDichActive)}>
                        Lịch sử giao dịch
                    </Link>
                    <Link to="/customer/tours?tab=review" className={getLinkClass(isDanhGiaActive)}>
                        Đánh giá
                    </Link>
                    <Link to="/customer/profile" className={getLinkClass(isThongTinCaNhanActive)}>
                        Thông tin cá nhân
                    </Link>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
                                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                                    {user?.fullName?.charAt(0) || "U"}
                                </div>
                                <span className="hidden lg:inline text-xs font-semibold text-neutral-800">
                                    {user?.fullName}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-2 text-xs font-bold text-neutral-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]">logout</span>
                                <span className="hidden md:inline">Đăng xuất</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate("/login")}
                                className="text-primary font-bold text-sm px-4 py-2 hover:bg-primary/5 rounded-full transition-all duration-200 cursor-pointer"
                            >
                                Đăng nhập
                            </button>
                            <button
                                onClick={() => navigate("/register")}
                                className="bg-primary text-white font-bold text-sm px-5 py-2 rounded-full shadow-sm hover:bg-primary-container active:scale-95 transition-all duration-200 cursor-pointer"
                            >
                                Đăng ký
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default TopNavBar;
