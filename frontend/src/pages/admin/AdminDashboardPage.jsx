import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAdminDashboard } from "../../api/adminApi";
import AdminFooter from "../../components/admin/AdminFooter";
import AdminHeader from "../../components/admin/AdminHeader";
import { fetchCurrentUser, logoutUser } from "../../features/auth/authSlice";

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const getBarHeight = (value, maxValue) => {
    if (!maxValue) return "0%";
    return `${Math.max((Number(value || 0) / maxValue) * 100, 4)}%`;
};

const monthLabel = (month) => `Th${String(month).padStart(2, "0")}`;

const EmptyState = ({ message }) => (
    <div className="rounded-lg border border-dashed border-outline-variant p-8 text-center text-body-sm text-on-surface-variant">
        {message}
    </div>
);

const AdminDashboardPage = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [dashboard, setDashboard] = useState(null);
    const [loadingDashboard, setLoadingDashboard] = useState(true);
    const [dashboardError, setDashboardError] = useState("");

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoadingDashboard(true);
                setDashboardError("");
                const data = await getAdminDashboard();
                setDashboard(data);
            } catch (error) {
                setDashboard(null);
                setDashboardError(error.message || "Không thể tải dữ liệu dashboard.");
            } finally {
                setLoadingDashboard(false);
            }
        };

        loadDashboard();
    }, []);

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    const summaryCards = useMemo(() => {
        const summary = dashboard?.summary || {};

        return [
            {
                label: "Doanh thu tháng",
                value: formatCurrency(summary.monthRevenue),
                tone: "text-primary",
                icon: "payments",
                iconClass: "bg-primary-container/10 text-primary",
            },
            {
                label: "Số vé đã bán",
                value: Number(summary.monthSoldTickets || 0).toLocaleString("vi-VN"),
                tone: "text-secondary",
                icon: "confirmation_number",
                iconClass: "bg-secondary-fixed text-secondary",
            },
            {
                label: "Tỷ lệ lấp đầy",
                value: formatPercent(summary.overallOccupancyRate),
                tone: "text-tertiary",
                icon: "group_add",
                iconClass: "bg-tertiary/10 text-tertiary",
            },
        ];
    }, [dashboard]);

    const monthlyRevenue = dashboard?.monthlyRevenue || [];
    const maxMonthlyRevenue = Math.max(
        ...monthlyRevenue.map((item) => Number(item.revenue || 0)),
        0,
    );
    const currentMonth = new Date().getMonth() + 1;
    const occupancy = dashboard?.occupancy;
    const topTours = dashboard?.topTours || [];

    return (
        <div className="flex min-h-screen flex-col bg-background text-on-background">
            <AdminHeader currentUser={user} onLogout={handleLogout} />

            <main className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8">
                {dashboardError && (
                    <div className="rounded-lg border border-error-container bg-error-container p-4 text-sm text-on-error-container">
                        {dashboardError}
                    </div>
                )}

                <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {summaryCards.map((card) => (
                        <article
                            className="group flex items-start justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-md"
                            key={card.label}
                        >
                            <div className="flex flex-col gap-1">
                                <span className="text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">
                                    {card.label}
                                </span>
                                <h2 className={`text-headline-lg font-headline-lg ${card.tone}`}>
                                    {loadingDashboard ? "Đang tải..." : card.value}
                                </h2>
                            </div>
                            <div
                                className={`rounded-lg p-3 transition-transform group-hover:scale-110 ${card.iconClass}`}
                            >
                                <span
                                    className="material-symbols-outlined text-headline-md"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    {card.icon}
                                </span>
                            </div>
                        </article>
                    ))}
                </section>

                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-8">
                        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-headline-sm font-headline-sm text-on-surface">
                                    Biểu đồ doanh thu
                                </h3>
                                <p className="text-body-sm text-on-surface-variant">
                                    Phân tích doanh thu theo dữ liệu đặt tour trong năm
                                </p>
                            </div>
                            <div className="rounded-lg bg-surface-container-low px-3 py-2 text-label-md text-on-surface-variant">
                                Năm {dashboard?.year || new Date().getFullYear()}
                            </div>
                        </div>

                        {loadingDashboard ? (
                            <EmptyState message="Đang tải dữ liệu doanh thu..." />
                        ) : monthlyRevenue.length === 0 || maxMonthlyRevenue === 0 ? (
                            <EmptyState message="Chưa có dữ liệu doanh thu trong năm này." />
                        ) : (
                            <div className="relative flex h-[300px] items-end justify-between gap-3 border-b border-outline-variant px-2 pt-10 sm:gap-4 sm:px-4">
                                <div className="absolute inset-x-0 top-10 h-0 border-t border-outline-variant/30" />
                                <div className="absolute inset-x-0 top-[110px] h-0 border-t border-outline-variant/30" />
                                <div className="absolute inset-x-0 top-[180px] h-0 border-t border-outline-variant/30" />
                                <div className="absolute inset-x-0 top-[250px] h-0 border-t border-outline-variant/30" />

                                {monthlyRevenue.map((item) => (
                                    <div
                                        className="group z-10 flex flex-1 flex-col items-center"
                                        key={item.month}
                                    >
                                        <div
                                            className={`relative w-full rounded-t-sm transition-all duration-500 ${
                                                item.month === currentMonth
                                                    ? "bg-primary-container"
                                                    : "bg-primary-container/20"
                                            }`}
                                            style={{
                                                height: getBarHeight(item.revenue, maxMonthlyRevenue),
                                            }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-inverse-surface px-2 py-1 text-[10px] text-inverse-on-surface opacity-0 transition-opacity group-hover:opacity-100">
                                                {formatCurrency(item.revenue)}
                                            </div>
                                        </div>
                                        <span
                                            className={`mt-2 text-[10px] ${
                                                item.month === currentMonth
                                                    ? "font-bold text-on-surface"
                                                    : "text-on-surface-variant"
                                            }`}
                                        >
                                            {monthLabel(item.month)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="h-full rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-4">
                        <h3 className="mb-1 text-headline-sm font-headline-sm text-on-surface">
                            Tỷ lệ lấp đầy tour
                        </h3>
                        <p className="mb-8 text-body-sm text-on-surface-variant">
                            Khách đăng ký trên tổng sức chứa theo dạng tour
                        </p>

                        {loadingDashboard ? (
                            <EmptyState message="Đang tải tỷ lệ lấp đầy..." />
                        ) : !occupancy ? (
                            <EmptyState message="Chưa có dữ liệu lịch tour." />
                        ) : (
                            <>
                                <div className="relative mb-8 flex justify-center">
                                    <svg className="h-48 w-48 -rotate-90">
                                        <circle
                                            className="text-surface-container-low"
                                            cx="96"
                                            cy="96"
                                            fill="transparent"
                                            r="80"
                                            stroke="currentColor"
                                            strokeWidth="24"
                                        />
                                        <circle
                                            className="text-primary"
                                            cx="96"
                                            cy="96"
                                            fill="transparent"
                                            r="80"
                                            stroke="currentColor"
                                            strokeDasharray="502"
                                            strokeDashoffset={
                                                502 -
                                                (502 * Number(occupancy.normal?.rate || 0)) / 100
                                            }
                                            strokeWidth="24"
                                        />
                                        <circle
                                            className="text-secondary"
                                            cx="96"
                                            cy="96"
                                            fill="transparent"
                                            r="80"
                                            stroke="currentColor"
                                            strokeDasharray="502"
                                            strokeDashoffset={
                                                502 -
                                                (502 * Number(occupancy.hard?.rate || 0)) / 100
                                            }
                                            strokeWidth="24"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-headline-md font-bold text-on-surface">
                                            {formatPercent(occupancy.total?.rate)}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                                            Tổng quan
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {[
                                        { label: "Tour Normal", data: occupancy.normal, color: "bg-primary" },
                                        { label: "Tour Hard", data: occupancy.hard, color: "bg-secondary" },
                                        { label: "Tổng quan", data: occupancy.total, color: "bg-tertiary" },
                                    ].map((item) => (
                                        <div
                                            className="flex items-center justify-between text-body-sm"
                                            key={item.label}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`h-3 w-3 rounded-full ${item.color}`} />
                                                <span className="text-on-surface-variant">{item.label}</span>
                                            </div>
                                            <span className="font-bold">
                                                {formatPercent(item.data?.rate)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </section>
                </div>

                <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
                    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-headline-sm font-headline-sm text-on-surface">
                                Tour bán chạy nhất
                            </h3>
                            <p className="text-body-sm text-on-surface-variant">
                                Danh sách tour có doanh số cao nhất theo dữ liệu đặt tour
                            </p>
                        </div>
                    </div>

                    {loadingDashboard ? (
                        <EmptyState message="Đang tải danh sách tour..." />
                    ) : topTours.length === 0 ? (
                        <EmptyState message="Chưa có tour nào phát sinh doanh thu." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[840px] text-left">
                                <thead>
                                    <tr className="border-b border-outline-variant text-on-surface-variant">
                                        <th className="px-2 pb-4 font-label-md">TOUR</th>
                                        <th className="pb-4 font-label-md">ĐỊA ĐIỂM</th>
                                        <th className="pb-4 font-label-md">GIÁ VÉ</th>
                                        <th className="pb-4 font-label-md">SỐ LƯỢNG BÁN</th>
                                        <th className="pb-4 text-right font-label-md">DOANH THU</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {topTours.map((tour) => (
                                        <tr
                                            className="group transition-colors hover:bg-surface-container-low"
                                            key={tour.id}
                                        >
                                            <td className="px-2 py-4">
                                                <div className="flex items-center gap-3">
                                                    {tour.thumbnailUrl ? (
                                                        <img
                                                            alt={tour.title}
                                                            className="h-12 w-12 rounded-lg object-cover"
                                                            src={tour.thumbnailUrl}
                                                        />
                                                    ) : (
                                                        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant">
                                                            <span className="material-symbols-outlined">map</span>
                                                        </span>
                                                    )}
                                                    <div>
                                                        <p className="text-body-md font-bold text-on-surface">
                                                            {tour.title}
                                                        </p>
                                                        <span className="text-body-sm text-on-surface-variant">
                                                            Mã: {tour.code}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-body-md">{tour.destination || "-"}</td>
                                            <td className="py-4 text-body-md">
                                                {formatCurrency(tour.price)}
                                            </td>
                                            <td className="py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-body-md font-bold">
                                                        {Number(tour.soldTickets || 0).toLocaleString("vi-VN")} vé
                                                    </span>
                                                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-container-high">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{
                                                                width: `${Math.min(
                                                                    Number(tour.soldTickets || 0) * 5,
                                                                    100,
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-right font-bold text-primary">
                                                {formatCurrency(tour.revenue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            <AdminFooter />
        </div>
    );
};

export default AdminDashboardPage;
