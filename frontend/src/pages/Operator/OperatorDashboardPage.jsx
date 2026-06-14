import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser, logoutUser } from "../../features/auth/authSlice";

const OperatorDashboardPage = () => {
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
            <section className="mx-auto max-w-3xl rounded-lg border border-outline-variant bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-label-md font-label-md text-primary">Operator Dashboard</p>
                        <h1 className="mt-1 text-headline-md font-headline-md text-on-surface">
                            {loading ? "Dang tai..." : user?.fullName || "Nhan vien dieu hanh"}
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

                <dl className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-surface-container-low p-4">
                        <dt className="text-label-sm text-on-surface-variant">Email</dt>
                        <dd className="mt-1 font-semibold text-on-surface">{user?.email || "-"}</dd>
                    </div>
                    <div className="rounded-lg bg-surface-container-low p-4">
                        <dt className="text-label-sm text-on-surface-variant">Role</dt>
                        <dd className="mt-1 font-semibold text-on-surface">{user?.role || "-"}</dd>
                    </div>
                </dl>

                <div className="mt-6 rounded-lg border border-outline-variant p-4 text-sm text-on-surface-variant">
                    Trang mo phong cho operator. Sau nay co the merge voi man hinh dieu hanh tour.
                </div>
            </section>
        </main>
    );
};

export default OperatorDashboardPage;
