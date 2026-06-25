import { useEffect, useMemo, useRef, useState } from "react";
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

const RANGE_OPTIONS = [
    { value: "day", label: "Ngày cụ thể" },
    { value: "month", label: "Tháng này" },
    { value: "quarter", label: "Quý này" },
    { value: "year", label: "Năm nay" },
];

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const currentMonthValue = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const currentQuarterValue = () => {
    const now = new Date();
    return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
};

const getRangeParams = (filter, prefix = "") => {
    const key = (name) => (prefix ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}` : name);

    if (filter.rangeType === "day") {
        return { [key("rangeType")]: "day", [key("date")]: filter.date };
    }

    if (filter.rangeType === "month") {
        const [year, month] = filter.monthValue.split("-");
        return { [key("rangeType")]: "month", [key("year")]: year, [key("month")]: month };
    }

    if (filter.rangeType === "quarter") {
        const [year, quarterToken] = filter.quarterValue.split("-Q");
        return {
            [key("rangeType")]: "quarter",
            [key("year")]: year,
            [key("quarter")]: quarterToken,
        };
    }

    return { [key("rangeType")]: "year", [key("year")]: filter.year };
};

const getChartColor = (value, maxValue) => {
    if (!value || !maxValue) return "rgba(66, 39, 179, 0.14)";

    const intensity = Number(value) / maxValue;
    if (intensity >= 0.8) return "rgba(66, 39, 179, 1)";
    if (intensity >= 0.6) return "rgba(66, 39, 179, 0.78)";
    if (intensity >= 0.4) return "rgba(66, 39, 179, 0.58)";
    if (intensity >= 0.2) return "rgba(66, 39, 179, 0.38)";
    return "rgba(66, 39, 179, 0.22)";
};

const getCircleDash = (rate, radius) => {
    const circumference = 2 * Math.PI * radius;
    return {
        strokeDasharray: circumference,
        strokeDashoffset: circumference - (circumference * Number(rate || 0)) / 100,
    };
};

const EmptyState = ({ message }) => (
    <div className="rounded-lg border border-dashed border-outline-variant p-8 text-center text-body-sm text-on-surface-variant">
        {message}
    </div>
);

const RangeFilterControls = ({ title, description, filter, onChange }) => (
    <div className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
        <div>
            <h2 className="text-title-md font-title-md text-on-surface">
                {title}
            </h2>
            <p className="text-body-sm text-on-surface-variant">
                {description}
            </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
                Kỳ dữ liệu
                <select
                    className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
                    value={filter.rangeType}
                    onChange={(event) =>
                        onChange((current) => ({
                            ...current,
                            rangeType: event.target.value,
                        }))
                    }
                >
                    {RANGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>

            {filter.rangeType === "day" && (
                <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
                    Ngày
                    <input
                        className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
                        type="date"
                        value={filter.date}
                        onChange={(event) =>
                            onChange((current) => ({
                                ...current,
                                date: event.target.value,
                            }))
                        }
                    />
                </label>
            )}

            {filter.rangeType === "month" && (
                <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
                    Tháng
                    <input
                        className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
                        type="month"
                        value={filter.monthValue}
                        onChange={(event) =>
                            onChange((current) => ({
                                ...current,
                                monthValue: event.target.value,
                            }))
                        }
                    />
                </label>
            )}

            {filter.rangeType === "quarter" && (
                <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
                    Quý
                    <div className="flex gap-2">
                        <input
                            className="h-11 w-24 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
                            min="2000"
                            max="2100"
                            type="number"
                            value={filter.quarterValue.split("-Q")[0]}
                            onChange={(event) =>
                                onChange((current) => {
                                    const quarter = current.quarterValue.split("-Q")[1] || "1";
                                    return {
                                        ...current,
                                        quarterValue: `${event.target.value}-Q${quarter}`,
                                    };
                                })
                            }
                        />
                        <select
                            className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
                            value={filter.quarterValue.split("-Q")[1] || "1"}
                            onChange={(event) =>
                                onChange((current) => {
                                    const year = current.quarterValue.split("-Q")[0];
                                    return {
                                        ...current,
                                        quarterValue: `${year}-Q${event.target.value}`,
                                    };
                                })
                            }
                        >
                            <option value="1">Quý 1</option>
                            <option value="2">Quý 2</option>
                            <option value="3">Quý 3</option>
                            <option value="4">Quý 4</option>
                        </select>
                    </div>
                </label>
            )}

            {filter.rangeType === "year" && (
                <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
                    Năm
                    <input
                        className="h-11 w-28 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
                        min="2000"
                        max="2100"
                        type="number"
                        value={filter.year}
                        onChange={(event) =>
                            onChange((current) => ({
                                ...current,
                                year: event.target.value,
                            }))
                        }
                    />
                </label>
            )}
        </div>
    </div>
);

const AdminDashboardPage = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [dashboard, setDashboard] = useState(null);
    const [loadingDashboard, setLoadingDashboard] = useState(true);
    const [refreshingDashboard, setRefreshingDashboard] = useState(false);
    const [dashboardError, setDashboardError] = useState("");
    const hasLoadedDashboardOnce = useRef(false);
    const [dashboardFilter, setDashboardFilter] = useState(() => {
        const now = new Date();
        return {
            rangeType: "year",
            date: todayInputValue(),
            monthValue: currentMonthValue(),
            quarterValue: currentQuarterValue(),
            year: String(now.getFullYear()),
        };
    });
    const [occupancyFilter, setOccupancyFilter] = useState(() => {
        const now = new Date();
        return {
            rangeType: "year",
            date: todayInputValue(),
            monthValue: currentMonthValue(),
            quarterValue: currentQuarterValue(),
            year: String(now.getFullYear()),
        };
    });

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                if (hasLoadedDashboardOnce.current) {
                    setRefreshingDashboard(true);
                } else {
                    setLoadingDashboard(true);
                }
                setDashboardError("");
                const data = await getAdminDashboard({
                    ...getRangeParams(dashboardFilter),
                    ...getRangeParams(occupancyFilter, "occupancy"),
                });
                setDashboard(data);
                hasLoadedDashboardOnce.current = true;
            } catch (error) {
                if (!hasLoadedDashboardOnce.current) setDashboard(null);
                setDashboardError(error.message || "Không thể tải dữ liệu dashboard.");
            } finally {
                setLoadingDashboard(false);
                setRefreshingDashboard(false);
            }
        };

        loadDashboard();
    }, [dashboardFilter, occupancyFilter]);

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    const summaryCards = useMemo(() => {
        const summary = dashboard?.summary || {};
        const periodLabel = dashboard?.filter?.label || "kỳ chọn";
        const occupancyLabel = dashboard?.occupancyFilter?.label || "kỳ chọn";

        return [
            {
                label: `Doanh thu ${periodLabel}`,
                value: formatCurrency(summary.periodRevenue ?? summary.monthRevenue),
                tone: "text-primary",
                icon: "payments",
                iconClass: "bg-primary-container/10 text-primary",
            },
            {
                label: "Số vé đã bán",
                value: Number(summary.periodSoldTickets ?? summary.monthSoldTickets ?? 0).toLocaleString("vi-VN"),
                tone: "text-secondary",
                icon: "confirmation_number",
                iconClass: "bg-secondary-fixed text-secondary",
            },
            {
                label: `Tỷ lệ lấp đầy ${occupancyLabel}`,
                value: formatPercent(summary.overallOccupancyRate),
                tone: "text-tertiary",
                icon: "group_add",
                iconClass: "bg-tertiary/10 text-tertiary",
            },
        ];
    }, [dashboard]);

    const monthlyRevenue = dashboard?.revenueChart || dashboard?.monthlyRevenue || [];
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

                <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <RangeFilterControls
                        title="Bộ lọc doanh thu"
                        description="Áp dụng cho doanh thu, số vé đã bán và biểu đồ doanh thu theo ngày đặt."
                        filter={dashboardFilter}
                        onChange={setDashboardFilter}
                    />
                    <RangeFilterControls
                        title="Bộ lọc lấp đầy"
                        description="Áp dụng cho tỷ lệ lấp đầy theo ngày khởi hành tour."
                        filter={occupancyFilter}
                        onChange={setOccupancyFilter}
                    />
                </section>

                <section className="hidden">
                    <div>
                        <h2 className="text-title-md font-title-md text-on-surface">
                            Bộ lọc dashboard
                        </h2>
                        <p className="text-body-sm text-on-surface-variant">
                            Doanh thu và vé bán lọc theo ngày đặt; tỷ lệ lấp đầy lọc theo ngày khởi hành.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
                            Kỳ dữ liệu
                            <select
                                className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
                                value={dashboardFilter.rangeType}
                                onChange={(event) =>
                                    setDashboardFilter((current) => ({
                                        ...current,
                                        rangeType: event.target.value,
                                    }))
                                }
                            >
                                {RANGE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {dashboardFilter.rangeType === "day" && (
                            <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
                                Ngày
                                <input
                                    className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
                                    type="date"
                                    value={dashboardFilter.date}
                                    onChange={(event) =>
                                        setDashboardFilter((current) => ({
                                            ...current,
                                            date: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                        )}

                        {dashboardFilter.rangeType === "month" && (
                            <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
                                Tháng
                                <input
                                    className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
                                    type="month"
                                    value={dashboardFilter.monthValue}
                                    onChange={(event) =>
                                        setDashboardFilter((current) => ({
                                            ...current,
                                            monthValue: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                        )}

                        {dashboardFilter.rangeType === "quarter" && (
                            <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
                                Quý
                                <div className="flex gap-2">
                                    <input
                                        className="h-11 w-24 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
                                        min="2000"
                                        max="2100"
                                        type="number"
                                        value={dashboardFilter.quarterValue.split("-Q")[0]}
                                        onChange={(event) =>
                                            setDashboardFilter((current) => {
                                                const quarter = current.quarterValue.split("-Q")[1] || "1";
                                                return {
                                                    ...current,
                                                    quarterValue: `${event.target.value}-Q${quarter}`,
                                                };
                                            })
                                        }
                                    />
                                    <select
                                        className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
                                        value={dashboardFilter.quarterValue.split("-Q")[1] || "1"}
                                        onChange={(event) =>
                                            setDashboardFilter((current) => {
                                                const year = current.quarterValue.split("-Q")[0];
                                                return {
                                                    ...current,
                                                    quarterValue: `${year}-Q${event.target.value}`,
                                                };
                                            })
                                        }
                                    >
                                        <option value="1">Quý 1</option>
                                        <option value="2">Quý 2</option>
                                        <option value="3">Quý 3</option>
                                        <option value="4">Quý 4</option>
                                    </select>
                                </div>
                            </label>
                        )}

                        {dashboardFilter.rangeType === "year" && (
                            <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
                                Năm
                                <input
                                    className="h-11 w-28 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
                                    min="2000"
                                    max="2100"
                                    type="number"
                                    value={dashboardFilter.year}
                                    onChange={(event) =>
                                        setDashboardFilter((current) => ({
                                            ...current,
                                            year: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                        )}
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {summaryCards.map((card) => (
                        <article
                            className="group flex min-h-[140px] items-start justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-md"
                            key={card.label}
                        >
                            <div className="flex flex-col gap-1">
                                <span className="min-h-10 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">
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
                                    Phân tích doanh thu theo dữ liệu đặt tour trong kỳ đã chọn
                                </p>
                            </div>
                            <div className="rounded-lg bg-surface-container-low px-3 py-2 text-label-md text-on-surface-variant">
                                {dashboard?.filter?.label || `Năm ${dashboard?.year || new Date().getFullYear()}`}
                            </div>
                        </div>

                        <div className="min-h-[320px]">
                            {loadingDashboard ? (
                            <EmptyState message="Đang tải dữ liệu doanh thu..." />
                        ) : monthlyRevenue.length === 0 || maxMonthlyRevenue === 0 ? (
                            <EmptyState message="Chưa có dữ liệu doanh thu trong kỳ đã chọn." />
                        ) : (
                            <div className="relative flex h-[320px] items-end justify-between gap-3 border-b border-outline-variant px-2 pt-10 sm:gap-4 sm:px-4">
                                <div className="absolute inset-x-0 top-10 h-0 border-t border-outline-variant/30" />
                                <div className="absolute inset-x-0 top-[110px] h-0 border-t border-outline-variant/30" />
                                <div className="absolute inset-x-0 top-[180px] h-0 border-t border-outline-variant/30" />
                                <div className="absolute inset-x-0 top-[250px] h-0 border-t border-outline-variant/30" />

                                {monthlyRevenue.map((item) => (
                                    <div
                                        className="group z-10 flex h-full flex-1 flex-col items-center justify-end"
                                        key={item.key || item.month || item.label}
                                    >
                                        <div className="flex h-[260px] w-full items-end">
                                            <div
                                                className="relative w-full rounded-t-sm transition-all duration-500"
                                                style={{
                                                    backgroundColor: getChartColor(
                                                        item.revenue,
                                                        maxMonthlyRevenue,
                                                    ),
                                                    height: getBarHeight(item.revenue, maxMonthlyRevenue),
                                                }}
                                            >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-inverse-surface px-2 py-1 text-[10px] text-inverse-on-surface opacity-0 transition-opacity group-hover:opacity-100">
                                                    {formatCurrency(item.revenue)}
                                                </div>
                                            </div>
                                        </div>
                                        <span
                                            className={`mt-2 text-[10px] ${
                                                item.month === currentMonth
                                                    ? "font-bold text-on-surface"
                                                    : "text-on-surface-variant"
                                            }`}
                                        >
                                            {item.label || monthLabel(item.month)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            )}
                        </div>
                    </section>

                    <section className="h-full rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-4">
                        <h3 className="mb-1 text-headline-sm font-headline-sm text-on-surface">
                            Tỷ lệ lấp đầy tour
                        </h3>
                        <p className="mb-8 text-body-sm text-on-surface-variant">
                            Khách đăng ký trên tổng sức chứa theo dạng tour
                        </p>

                        <div className="min-h-[360px]">
                        {loadingDashboard ? (
                            <EmptyState message="Đang tải tỷ lệ lấp đầy..." />
                        ) : !occupancy ? (
                            <EmptyState message="Chưa có dữ liệu lịch tour." />
                        ) : (
                            <>
                                <div className="relative mb-8 flex justify-center">
                                    <svg className="h-56 w-56 -rotate-90">
                                        {[
                                            { rate: occupancy.total?.rate, radius: 88, color: "text-tertiary" },
                                            { rate: occupancy.normal?.rate, radius: 64, color: "text-primary" },
                                            { rate: occupancy.hard?.rate, radius: 40, color: "text-secondary" },
                                        ].map((ring) => (
                                            <g key={ring.radius}>
                                                <circle
                                                    className="text-surface-container-low"
                                                    cx="112"
                                                    cy="112"
                                                    fill="transparent"
                                                    r={ring.radius}
                                                    stroke="currentColor"
                                                    strokeWidth="14"
                                                />
                                                <circle
                                                    className={ring.color}
                                                    cx="112"
                                                    cy="112"
                                                    fill="transparent"
                                                    r={ring.radius}
                                                    stroke="currentColor"
                                                    strokeLinecap="round"
                                                    strokeWidth="14"
                                                    {...getCircleDash(ring.rate, ring.radius)}
                                                />
                                            </g>
                                        ))}
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-headline-md font-bold text-on-surface">
                                            {formatPercent(occupancy.total?.rate)}
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
                        </div>
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
