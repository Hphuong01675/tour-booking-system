import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAdminUsers, updateAdminUserStatus } from "../../api/adminApi";
import AdminFooter from "../../components/admin/AdminFooter";
import AdminHeader from "../../components/admin/AdminHeader";
import { fetchCurrentUser, logoutUser } from "../../features/auth/authSlice";

const roleLabels = {
    admin: "Quản trị viên",
    operator: "Điều hành",
    guide: "HDV",
    customer: "Khách hàng",
};

const roleBadgeClass = {
    admin: "bg-primary-fixed text-primary border-primary-fixed-dim",
    operator: "bg-blue-50 text-blue-700 border-blue-100",
    guide: "bg-orange-50 text-orange-700 border-orange-100",
    customer: "bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary-fixed-dim",
};

const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const AdminUsersPage = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [users, setUsers] = useState([]);
    const [summary, setSummary] = useState({
        staffCount: 0,
        customerCount: 0,
        activeCount: 0,
        inactiveCount: 0,
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [filters, setFilters] = useState({
        group: "staff",
        search: "",
        role: "all",
        status: "all",
        page: 1,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getAdminUsers({
                group: filters.group,
                search: filters.search,
                role: filters.role,
                status: filters.status,
                page: filters.page,
                limit: pagination.limit,
            });
            setUsers(data.users || []);
            setSummary(data.summary || {});
            setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setUsers([]);
            setError(err.message || "Không thể tải danh sách người dùng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.group, filters.search, filters.role, filters.status, filters.page]);

    const groupLabel = filters.group === "staff" ? "nhân viên" : "khách hàng";

    const roleOptions = useMemo(() => {
        if (filters.group === "customer") {
            return [{ value: "all", label: "Tất cả khách hàng" }];
        }

        return [
            { value: "all", label: "Tất cả vai trò" },
            { value: "admin", label: "Quản trị viên" },
            { value: "operator", label: "Điều hành" },
            { value: "guide", label: "Hướng dẫn viên" },
        ];
    }, [filters.group]);

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    const updateFilter = (name, value) => {
        setFilters((current) => ({
            ...current,
            [name]: value,
            page: 1,
            ...(name === "group" ? { role: "all", search: "", status: "all" } : {}),
        }));
    };

    const handleToggleStatus = async (targetUser) => {
        try {
            setError("");
            await updateAdminUserStatus(targetUser.id, !targetUser.isActive);
            await loadUsers();
        } catch (err) {
            setError(err.message || "Không thể cập nhật trạng thái người dùng.");
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-background text-on-background">
            <AdminHeader currentUser={user} onLogout={handleLogout} />

            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 md:px-8">
                <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <h2 className="mb-2 text-headline-lg font-headline-lg text-on-surface">
                            Quản lý Người dùng
                        </h2>
                        <p className="text-body-md text-on-surface-variant">
                            Quản lý cơ sở dữ liệu nhân viên và khách hàng trong hệ thống.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-error-container bg-error-container p-4 text-sm text-on-error-container">
                        {error}
                    </div>
                )}

                <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
                        <p className="text-label-md text-on-surface-variant">Nhân viên</p>
                        <h3 className="mt-2 text-headline-md font-headline-md text-primary">
                            {Number(summary.staffCount || 0).toLocaleString("vi-VN")}
                        </h3>
                    </article>
                    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
                        <p className="text-label-md text-on-surface-variant">Khách hàng</p>
                        <h3 className="mt-2 text-headline-md font-headline-md text-secondary">
                            {Number(summary.customerCount || 0).toLocaleString("vi-VN")}
                        </h3>
                    </article>
                    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
                        <p className="text-label-md text-on-surface-variant">Đang hoạt động</p>
                        <h3 className="mt-2 text-headline-md font-headline-md text-tertiary">
                            {Number(summary.activeCount || 0).toLocaleString("vi-VN")}
                        </h3>
                    </article>
                    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
                        <p className="text-label-md text-on-surface-variant">Đã khóa</p>
                        <h3 className="mt-2 text-headline-md font-headline-md text-error">
                            {Number(summary.inactiveCount || 0).toLocaleString("vi-VN")}
                        </h3>
                    </article>
                </section>

                <div className="mb-8 flex gap-8 border-b border-outline-variant">
                    <button
                        className={`flex items-center gap-2 px-2 pb-4 text-label-md font-label-md transition-all ${
                            filters.group === "staff"
                                ? "border-b-2 border-primary text-primary"
                                : "text-on-surface-variant hover:text-primary"
                        }`}
                        onClick={() => updateFilter("group", "staff")}
                        type="button"
                    >
                        <span className="material-symbols-outlined">badge</span>
                        Nhân viên
                    </button>
                    <button
                        className={`flex items-center gap-2 px-2 pb-4 text-label-md font-label-md transition-all ${
                            filters.group === "customer"
                                ? "border-b-2 border-primary text-primary"
                                : "text-on-surface-variant hover:text-primary"
                        }`}
                        onClick={() => updateFilter("group", "customer")}
                        type="button"
                    >
                        <span className="material-symbols-outlined">person</span>
                        Khách hàng
                    </button>
                </div>

                <section className="space-y-6">
                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                        <div className="flex w-full flex-grow items-center gap-3 rounded-lg border border-outline-variant bg-white px-4 py-2.5 shadow-sm">
                            <span className="material-symbols-outlined text-outline">search</span>
                            <input
                                className="w-full border-none text-body-md outline-none focus:ring-0"
                                onChange={(event) => updateFilter("search", event.target.value)}
                                placeholder={`Tìm kiếm ${groupLabel} theo tên, email hoặc số điện thoại...`}
                                type="text"
                                value={filters.search}
                            />
                        </div>
                        <select
                            className="w-full rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-body-md shadow-sm outline-none focus:border-primary sm:w-auto"
                            onChange={(event) => updateFilter("role", event.target.value)}
                            value={filters.role}
                        >
                            {roleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select
                            className="w-full rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-body-md shadow-sm outline-none focus:border-primary sm:w-auto"
                            onChange={(event) => updateFilter("status", event.target.value)}
                            value={filters.status}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="inactive">Đã khóa</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-outline-variant bg-white shadow-sm">
                        <table className="w-full min-w-[820px] text-left">
                            <thead className="border-b border-outline-variant bg-surface-container-low">
                                <tr>
                                    <th className="px-6 py-4 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">
                                        Họ tên
                                    </th>
                                    {filters.group === "staff" && (
                                        <th className="px-6 py-4 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">
                                            Vai trò
                                        </th>
                                    )}
                                    <th className="px-6 py-4 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">
                                        Email
                                    </th>
                                    {filters.group === "customer" && (
                                        <th className="px-6 py-4 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">
                                            Số tour
                                        </th>
                                    )}
                                    <th className="px-6 py-4 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-4 text-right text-label-md font-label-md uppercase tracking-wider text-on-surface-variant">
                                        Hành động
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {loading ? (
                                    <tr>
                                        <td
                                            className="px-6 py-10 text-center text-on-surface-variant"
                                            colSpan={filters.group === "staff" ? 5 : 5}
                                        >
                                            Đang tải danh sách {groupLabel}...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td
                                            className="px-6 py-10 text-center text-on-surface-variant"
                                            colSpan={filters.group === "staff" ? 5 : 5}
                                        >
                                            Không có {groupLabel} phù hợp.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((item) => (
                                        <tr
                                            className={`transition-colors hover:bg-surface-container-lowest ${
                                                item.isActive ? "" : "opacity-70"
                                            }`}
                                            key={item.id}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {item.avatarUrl ? (
                                                        <img
                                                            alt={item.fullName}
                                                            className="h-10 w-10 rounded-full object-cover"
                                                            src={item.avatarUrl}
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container font-bold text-white">
                                                            {getInitials(item.fullName)}
                                                        </div>
                                                    )}
                                                    <span className="text-body-md font-semibold text-on-surface">
                                                        {item.fullName}
                                                    </span>
                                                </div>
                                            </td>
                                            {filters.group === "staff" && (
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`rounded-full border px-3 py-1 text-label-sm font-label-sm ${
                                                            roleBadgeClass[item.role] || roleBadgeClass.operator
                                                        }`}
                                                    >
                                                        {roleLabels[item.role] || item.role}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-body-md text-on-surface-variant">
                                                {item.email}
                                            </td>
                                            {filters.group === "customer" && (
                                                <td className="px-6 py-4 text-body-md font-medium text-on-surface">
                                                    {Number(item.tourCount || 0).toLocaleString("vi-VN")} Tour
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <div
                                                    className={`flex items-center gap-2 ${
                                                        item.isActive
                                                            ? "text-green-600"
                                                            : "text-on-surface-variant"
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-2 w-2 rounded-full ${
                                                            item.isActive ? "bg-green-500" : "bg-outline-variant"
                                                        }`}
                                                    />
                                                    <span className="text-body-sm font-medium">
                                                        {item.isActive ? "Đang hoạt động" : "Đã khóa"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    className={`rounded-lg px-4 py-2 text-label-md font-label-md transition-all ${
                                                        item.isActive
                                                            ? "text-error hover:bg-error-container"
                                                            : "text-primary hover:bg-primary-fixed-dim"
                                                    }`}
                                                    onClick={() => handleToggleStatus(item)}
                                                    type="button"
                                                >
                                                    {item.isActive ? "Khóa" : "Mở khóa"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="mb-12 mt-8 flex flex-col items-center justify-between gap-4 text-body-sm text-on-surface-variant sm:flex-row">
                    <p>
                        Tổng cộng {Number(pagination.total || 0).toLocaleString("vi-VN")} {groupLabel}
                    </p>
                    <div className="flex gap-2">
                        <button
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant transition-colors hover:bg-surface-container-high disabled:opacity-40"
                            disabled={filters.page <= 1}
                            onClick={() =>
                                setFilters((current) => ({
                                    ...current,
                                    page: Math.max(current.page - 1, 1),
                                }))
                            }
                            type="button"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <span className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-primary px-3 font-bold text-white">
                            {pagination.page}
                        </span>
                        <button
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant transition-colors hover:bg-surface-container-high disabled:opacity-40"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() =>
                                setFilters((current) => ({
                                    ...current,
                                    page: current.page + 1,
                                }))
                            }
                            type="button"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
            </main>

            <AdminFooter />
        </div>
    );
};

export default AdminUsersPage;
