import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAdminTours, updateAdminTourStatus } from "../../api/adminApi";
import AdminFooter from "../../components/admin/AdminFooter";
import AdminHeader from "../../components/admin/AdminHeader";
import { fetchCurrentUser, logoutUser } from "../../features/auth/authSlice";

const statusLabels = {
    draft: "Nháp",
    pending: "Chờ duyệt",
    upcoming: "Chưa mở",
    open: "Đang mở",
    closed: "Đã đóng",
    cancelled: "Đã hủy",
};

const statusBadgeClass = {
    draft: "bg-surface-container text-outline border-outline-variant",
    pending: "bg-orange-100 text-orange-800 border-orange-200",
    upcoming: "bg-blue-100 text-blue-800 border-blue-200",
    open: "bg-green-100 text-green-800 border-green-200",
    closed: "bg-surface-container-high text-on-surface-variant border-outline-variant",
    cancelled: "bg-error-container text-on-error-container border-error-container",
};

const nextStatusAction = {
    draft: { label: "Gửi duyệt", status: "pending", tone: "text-secondary border-secondary hover:bg-secondary" },
    pending: { label: "Duyệt mở", status: "upcoming", tone: "text-primary border-primary hover:bg-primary" },
    upcoming: { label: "Mở đăng ký", status: "open", tone: "text-tertiary border-tertiary hover:bg-tertiary" },
    open: { label: "Đóng đăng ký", status: "closed", tone: "text-error border-error hover:bg-error" },
    closed: { label: "Mở lại", status: "open", tone: "text-primary border-primary hover:bg-primary" },
    cancelled: { label: "Khôi phục", status: "draft", tone: "text-primary border-primary hover:bg-primary" },
};

const formatDate = (value) => {
    if (!value) return "-";
    return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
};

const formatDateRange = (schedule) => {
    if (!schedule) return "Chưa có lịch sắp tới";

    const dateRange = `${formatDate(schedule.departureDate)} - ${formatDate(schedule.returnDate)}`;

    if (schedule.scheduleTimingStatus === "past") {
        return `Đã qua: ${dateRange}`;
    }

    return dateRange;
};

const AdminToursPage = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [tours, setTours] = useState([]);
    const [summary, setSummary] = useState({});
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [filters, setFilters] = useState({
        search: "",
        status: "all",
        difficulty: "all",
        page: 1,
    });
    const [searchInput, setSearchInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingTourId, setUpdatingTourId] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const hasLoadedOnce = useRef(false);

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    const loadTours = async ({ keepPreviousData = false } = {}) => {
        try {
            if (keepPreviousData || hasLoadedOnce.current) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError("");
            const data = await getAdminTours({
                search: filters.search,
                status: filters.status,
                difficulty: filters.difficulty,
                page: filters.page,
                limit: pagination.limit,
            });
            setTours(data.tours || []);
            setSummary(data.summary || {});
            setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
            hasLoadedOnce.current = true;
        } catch (err) {
            if (!keepPreviousData && !hasLoadedOnce.current) setTours([]);
            setError(err.message || "Không thể tải danh sách tour.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadTours({ keepPreviousData: hasLoadedOnce.current });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.search, filters.status, filters.difficulty, filters.page]);

    useEffect(() => {
        const debounceId = window.setTimeout(() => {
            setFilters((current) =>
                current.search === searchInput
                    ? current
                    : { ...current, search: searchInput, page: 1 },
            );
        }, 350);

        return () => window.clearTimeout(debounceId);
    }, [searchInput]);

    const statusFilters = useMemo(
        () => [
            { value: "all", label: "Tất cả", count: summary.all || 0 },
            { value: "open", label: "Đang mở", count: summary.open || 0 },
            { value: "upcoming", label: "Chưa mở", count: summary.upcoming || 0 },
            { value: "closed", label: "Đã đóng", count: summary.closed || 0 },
            { value: "pending", label: "Chờ duyệt", count: summary.pending || 0 },
            { value: "draft", label: "Nháp", count: summary.draft || 0 },
        ],
        [summary],
    );

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    const updateFilter = (name, value) => {
        setFilters((current) => ({ ...current, [name]: value, page: 1 }));
    };

    const handleStatusAction = async (tour) => {
        const action = nextStatusAction[tour.status];
        if (!action) return;

        try {
            setError("");
            setUpdatingTourId(tour.id);
            setTours((currentTours) =>
                currentTours.map((item) =>
                    item.id === tour.id ? { ...item, status: action.status } : item,
                ),
            );
            await updateAdminTourStatus(tour.id, action.status);
            setSuccessMessage("Trạng thái tour đã được cập nhật.");
            loadTours({ keepPreviousData: true });
            setUpdatingTourId("");
            setTimeout(() => setSuccessMessage(""), 2500);
        } catch (err) {
            setTours((currentTours) =>
                currentTours.map((item) =>
                    item.id === tour.id ? { ...item, status: tour.status } : item,
                ),
            );
            setUpdatingTourId("");
            setError(err.message || "Không thể cập nhật trạng thái tour.");
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-background text-on-background">
            <AdminHeader currentUser={user} onLogout={handleLogout} />

            <main className="w-full flex-1">
                <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-8 md:px-8">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <h2 className="text-headline-lg font-headline-lg text-on-background">
                                Quản lý Toàn bộ Tour
                            </h2>
                            <p className="text-body-md text-on-surface-variant">
                                Theo dõi, kiểm duyệt và quản lý trạng thái đăng ký của các hành trình.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg border border-error-container bg-error-container p-4 text-sm text-on-error-container">
                            {error}
                        </div>
                    )}

                    <section className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
                        <span className="mr-2 text-label-md font-label-md text-outline">Trạng thái:</span>
                        {statusFilters.map((item) => (
                            <button
                                className={`rounded-full px-4 py-1.5 text-label-md transition-all ${
                                    filters.status === item.value
                                        ? "bg-primary text-on-primary"
                                        : "bg-surface-container-high text-on-surface-variant hover:bg-surface-dim"
                                }`}
                                key={item.value}
                                onClick={() => updateFilter("status", item.value)}
                                type="button"
                            >
                                {item.label} ({Number(item.count).toLocaleString("vi-VN")})
                            </button>
                        ))}

                        <div className="ml-auto flex flex-wrap gap-2">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
                                    search
                                </span>
                                <input
                                    className="w-full rounded-lg border border-outline-variant bg-white py-1.5 pl-10 pr-3 text-body-sm outline-none focus:border-primary md:w-72"
                                    onChange={(event) => setSearchInput(event.target.value)}
                                    placeholder="Tìm kiếm tour..."
                                    type="text"
                                    value={searchInput}
                                />
                            </div>
                            <select
                                className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-label-md outline-none focus:border-primary"
                                onChange={(event) => updateFilter("difficulty", event.target.value)}
                                value={filters.difficulty}
                            >
                                <option value="all">Tất cả độ khó</option>
                                <option value="normal">Normal</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
                        <div className="min-h-[620px] overflow-x-auto">
                            <table className="w-full min-w-[900px] border-collapse text-left">
                                <thead className="border-b border-outline-variant bg-surface-container-low">
                                    <tr>
                                        <th className="px-6 py-4 text-label-md text-on-surface-variant">
                                            Tên Tour
                                        </th>
                                        <th className="px-6 py-4 text-label-md text-on-surface-variant">
                                            Thời gian khởi hành
                                        </th>
                                        <th className="px-6 py-4 text-label-md text-on-surface-variant">
                                            Số khách
                                        </th>
                                        <th className="px-6 py-4 text-label-md text-on-surface-variant">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-4 text-right text-label-md text-on-surface-variant">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {loading && tours.length === 0 ? (
                                        <tr>
                                            <td
                                                className="px-6 py-10 text-center text-on-surface-variant"
                                                colSpan="5"
                                            >
                                                Đang tải danh sách tour...
                                            </td>
                                        </tr>
                                    ) : tours.length === 0 ? (
                                        <tr>
                                            <td
                                                className="px-6 py-10 text-center text-on-surface-variant"
                                                colSpan="5"
                                            >
                                                Chưa có tour phù hợp.
                                            </td>
                                        </tr>
                                    ) : (
                                        tours.map((tour) => {
                                            const action = nextStatusAction[tour.status];

                                            return (
                                                <tr
                                                    className="group transition-colors hover:bg-surface-bright"
                                                    key={tour.id}
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-4">
                                                            {tour.thumbnailUrl ? (
                                                                <div
                                                                    className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg ${
                                                                        tour.status === "closed" ? "grayscale" : ""
                                                                    }`}
                                                                >
                                                                    <img
                                                                        alt={tour.title}
                                                                        className="h-full w-full object-cover"
                                                                        src={tour.thumbnailUrl}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-high">
                                                                    <span className="material-symbols-outlined text-outline">
                                                                        image
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-body-md font-bold text-on-surface">
                                                                    {tour.title}
                                                                </p>
                                                                <p className="text-label-sm text-outline">
                                                                    Mã: {tour.tourCode}
                                                                </p>
                                                                <p className="text-label-sm text-on-surface-variant">
                                                                    {tour.destination} · {tour.difficulty}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="text-body-sm">
                                                            <p className="text-on-surface">
                                                                {formatDateRange(tour.nextSchedule)}
                                                            </p>
                                                            <p className="text-[11px] uppercase tracking-wider text-outline">
                                                                {tour.scheduleCount} lịch khởi hành
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-primary">
                                                                {Number(tour.registered || 0).toLocaleString("vi-VN")}
                                                            </span>
                                                            <span className="text-body-sm text-outline">
                                                                /{" "}
                                                                {Number(tour.maxCapacity || 0).toLocaleString("vi-VN")}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span
                                                            className={`rounded-full border px-3 py-1 text-label-sm font-bold ${
                                                                statusBadgeClass[tour.status] || statusBadgeClass.draft
                                                            }`}
                                                        >
                                                            {statusLabels[tour.status] || tour.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        {action ? (
                                                            <button
                                                                className={`rounded-lg border px-4 py-1.5 text-label-md font-bold transition-all hover:text-white ${action.tone}`}
                                                                disabled={updatingTourId === tour.id}
                                                                onClick={() => handleStatusAction(tour)}
                                                                type="button"
                                                            >
                                                                {updatingTourId === tour.id ? "Đang cập nhật..." : action.label}
                                                            </button>
                                                        ) : (
                                                            <span className="text-label-sm text-outline">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-lowest px-6 py-4">
                            <p className="text-label-sm text-outline">
                                Tổng cộng {Number(pagination.total || 0).toLocaleString("vi-VN")} kết quả
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant text-outline transition-colors hover:bg-surface-container-low disabled:opacity-40"
                                    disabled={filters.page <= 1}
                                    onClick={() =>
                                        setFilters((current) => ({
                                            ...current,
                                            page: Math.max(current.page - 1, 1),
                                        }))
                                    }
                                    type="button"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                </button>
                                <span className="flex h-8 min-w-8 items-center justify-center rounded bg-primary px-3 font-label-md text-on-primary">
                                    {pagination.page}
                                </span>
                                <button
                                    className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant text-outline transition-colors hover:bg-surface-container-low disabled:opacity-40"
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() =>
                                        setFilters((current) => ({
                                            ...current,
                                            page: current.page + 1,
                                        }))
                                    }
                                    type="button"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {successMessage && (
                <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl bg-inverse-surface px-6 py-4 text-inverse-on-surface shadow-2xl">
                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                    <div>
                        <p className="font-bold text-label-md">Thao tác thành công</p>
                        <p className="text-body-sm text-surface-variant">{successMessage}</p>
                    </div>
                </div>
            )}

            <AdminFooter />
        </div>
    );
};

export default AdminToursPage;
