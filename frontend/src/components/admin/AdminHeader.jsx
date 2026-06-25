import { Link, useLocation, useNavigate } from "react-router-dom";

const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
    { path: "/admin/tours", label: "Quản lý tour", icon: "map" },
    { path: "/admin/users", label: "Quản lý người dùng", icon: "group" },
    { path: "/admin/vouchers", label: "Quản lý voucher", icon: "confirmation_number" },
];

const AdminHeader = ({ currentUser, onLogout }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const avatarUrl =
        currentUser?.avatarUrl ||
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop";

    const handleLogout = () => {
        onLogout?.();
        navigate("/login", { replace: true });
    };

    return (
        <header className="sticky top-0 z-50 flex w-full flex-col border-b border-outline-variant bg-surface shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant/50 px-4 py-3 md:px-8">
                <Link to="/admin/dashboard" className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary shadow-sm">
                        <span className="material-symbols-outlined">explore</span>
                    </span>
                    <span>
                        <span className="block text-headline-sm font-headline-sm leading-tight text-primary">
                            Chip3Chip
                        </span>
                        <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant">
                            Admin Console
                        </span>
                    </span>
                </Link>

                <div className="flex items-center gap-3 border-l border-outline-variant pl-4">
                    <div className="hidden text-right md:block">
                        <p className="text-label-md font-bold text-on-surface">
                            {currentUser?.fullName || "Admin Avatar"}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                            Administrator
                        </p>
                    </div>
                    <img
                        alt={currentUser?.fullName || "Admin Avatar"}
                        className="h-9 w-9 rounded-full border-2 border-primary-container object-cover"
                        src={avatarUrl}
                    />
                    <button
                        className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-error"
                        onClick={handleLogout}
                        title="Đăng xuất"
                        type="button"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                </div>
            </div>

            <nav className="flex items-center gap-1 overflow-x-auto px-4 md:px-8">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            className={`flex items-center gap-2 border-b-2 px-4 py-3 transition-all ${
                                isActive
                                    ? "border-primary text-primary"
                                    : "border-transparent text-on-surface-variant hover:text-primary"
                            }`}
                            key={item.path}
                            to={item.path}
                        >
                            <span className="material-symbols-outlined text-xl">{item.icon}</span>
                            <span className="whitespace-nowrap text-label-md font-label-md">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </header>
    );
};

export default AdminHeader;
