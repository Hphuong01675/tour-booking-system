import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser, logoutUser } from "../../features/auth/authSlice";

const AdminDashboardPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/login", { replace: true });
    };

    return (
        <main className="min-h-screen bg-surface px-4 py-8 md:px-16">
            <section className="mx-auto max-w-4xl rounded-lg border border-outline-variant bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-label-md font-label-md text-primary">Admin Dashboard</p>
                        <h1 className="mt-1 text-headline-md font-headline-md text-on-surface">
                            {loading ? "Dang tai..." : user?.fullName || "Quan tri vien"}
                        </h1>
                    </div>
                    <button
                        className="rounded-lg bg-secondary-container px-4 py-2 text-sm font-semibold text-white hover:bg-secondary"
                        onClick={handleLogout}
                        type="button"
                    >
                        Dang xuat
                    </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-surface-container-low p-4">
                        <p className="text-label-sm text-on-surface-variant">Tong quan</p>
                        <p className="mt-2 text-title-lg font-semibold text-on-surface">Dashboard</p>
                    </div>
                    <div className="rounded-lg bg-surface-container-low p-4">
                        <p className="text-label-sm text-on-surface-variant">Quan ly</p>
                        <p className="mt-2 text-title-lg font-semibold text-on-surface">Tour</p>
                    </div>
                    <div className="rounded-lg bg-surface-container-low p-4">
                        <p className="text-label-sm text-on-surface-variant">He thong</p>
                        <p className="mt-2 text-title-lg font-semibold text-on-surface">Nguoi dung</p>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default AdminDashboardPage;
