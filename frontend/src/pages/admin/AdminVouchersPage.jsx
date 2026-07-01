import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    createAdminVoucher,
    getAdminVouchers,
    suggestCustomerEmails,
    updateAdminVoucherStatus,
} from "../../api/adminApi";
import AdminFooter from "../../components/admin/AdminFooter";
import AdminHeader from "../../components/admin/AdminHeader";
import { fetchCurrentUser, logoutUser } from "../../features/auth/authSlice";

const initialForm = {
    name: "",
    code: "",
    description: "",
    discountType: "percent",
    discountValue: "",
    maxDiscountAmount: "",
    minOrderValue: "",
    validFrom: "",
    validUntil: "",
    totalQuantity: "",
    usageLimitPerUser: "1",
    targetType: "all",
    specificEmails: "",
};

const formatDate = (value) => {
    if (!value) return "-";
    return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
};

const formatDiscount = (voucher) => {
    if (voucher.discountType === "percent") return `${Number(voucher.discountValue || 0)}%`;
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(voucher.discountValue || 0));
};

const getEmailTokens = (value) =>
    value
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);

const getNextDateValue = (value) => {
    if (!value) return undefined;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return undefined;
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
};

const buildVoucherPayload = (form) => ({
    name: form.name,
    code: form.code,
    description: form.description,
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    maxDiscountAmount: Number(form.maxDiscountAmount),
    minOrderValue: Number(form.minOrderValue),
    validFrom: form.validFrom || null,
    validUntil: form.validUntil || null,
    totalQuantity: Number(form.totalQuantity),
    usageLimitPerUser: Number(form.usageLimitPerUser),
    targetType: form.targetType,
    emails: form.targetType === "specific" ? getEmailTokens(form.specificEmails) : [],
});

const AdminVouchersPage = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [vouchers, setVouchers] = useState([]);
    const [summary, setSummary] = useState({
        totalUsage: 0,
        activeCount: 0,
        expiringSoonCount: 0,
        totalVoucherCount: 0,
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [filters, setFilters] = useState({ search: "", status: "all", type: "all", page: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [isCustomerComboboxOpen, setIsCustomerComboboxOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    const loadVouchers = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getAdminVouchers({
                search: filters.search,
                status: filters.status,
                type: filters.type,
                page: filters.page,
                limit: pagination.limit,
            });
            setVouchers(data.vouchers || []);
            setSummary(data.summary || {
                totalUsage: 0,
                activeCount: 0,
                expiringSoonCount: 0,
                totalVoucherCount: 0,
            });
            setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        } catch (err) {
            setError(err.message || "Không thể tải danh sách voucher.");
            setVouchers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVouchers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.search, filters.status, filters.type, filters.page]);

    useEffect(() => {
        const loadSuggestions = async () => {
            if (form.targetType !== "specific" || !isCustomerComboboxOpen) {
                setSuggestions([]);
                return;
            }

            try {
                const data = await suggestCustomerEmails(customerSearch);
                setSuggestions(data || []);
            } catch {
                setSuggestions([]);
            }
        };

        const timer = setTimeout(loadSuggestions, 250);
        return () => clearTimeout(timer);
    }, [customerSearch, form.targetType, isCustomerComboboxOpen]);

    const stats = useMemo(() => {
        const activeVoucherCount = Number(summary.activeCount || 0);
        const totalVoucherCount = Number(summary.totalVoucherCount || 0);
        const activeRate = totalVoucherCount
            ? Math.min((activeVoucherCount / totalVoucherCount) * 100, 100)
            : 0;

        return {
            totalUsage: Number(summary.totalUsage || 0).toLocaleString("vi-VN"),
            active: activeVoucherCount,
            totalVouchers: totalVoucherCount,
            expiringSoon: Number(summary.expiringSoonCount || 0),
            activeRate,
        };
    }, [summary]);

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    const updateFilter = (name, value) => {
        setFilters((current) => ({ ...current, [name]: value, page: 1 }));
    };

    const updateForm = (name, value) => {
        setForm((current) => {
            const nextForm = { ...current, [name]: value };
            if (name === "validFrom" && current.validUntil && current.validUntil <= value) {
                nextForm.validUntil = "";
            }
            if (name === "targetType" && value === "all") {
                nextForm.specificEmails = "";
                setCustomerSearch("");
                setSuggestions([]);
                setIsCustomerComboboxOpen(false);
            }
            return nextForm;
        });
    };

    const selectedEmails = useMemo(() => getEmailTokens(form.specificEmails), [form.specificEmails]);
    const selectableSuggestions = useMemo(
        () => suggestions.filter((item) => !selectedEmails.includes(item.email)),
        [selectedEmails, suggestions],
    );

    const addSuggestedEmail = (email) => {
        const nextEmails = Array.from(new Set([...selectedEmails, email]));
        updateForm("specificEmails", nextEmails.join(", "));
        setCustomerSearch("");
        setSuggestions([]);
        setIsCustomerComboboxOpen(false);
    };

    const removeSelectedEmail = (email) => {
        updateForm("specificEmails", selectedEmails.filter((item) => item !== email).join(", "));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            if (form.validFrom && form.validUntil && form.validUntil <= form.validFrom) {
                setError("Ngày kết thúc phải sau ngày bắt đầu.");
                setSaving(false);
                return;
            }
            if (form.maxDiscountAmount === "" || form.minOrderValue === "") {
                setError("Vui lòng nhập giảm tối đa và giá trị đơn tối thiểu.");
                setSaving(false);
                return;
            }
            if (
                !form.name.trim() ||
                !form.code.trim() ||
                !form.description.trim() ||
                !form.discountType ||
                form.discountValue === "" ||
                !form.validFrom ||
                !form.validUntil ||
                form.totalQuantity === "" ||
                form.usageLimitPerUser === "" ||
                !form.targetType ||
                (form.targetType === "specific" && getEmailTokens(form.specificEmails).length === 0)
            ) {
                setError("Vui lòng nhập đầy đủ tất cả thông tin voucher.");
                setSaving(false);
                return;
            }
            await createAdminVoucher(buildVoucherPayload(form));
            setForm(initialForm);
            setIsFormOpen(false);
            await loadVouchers();
        } catch (err) {
            setError(err.message || "Không thể tạo voucher.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (voucher) => {
        try {
            setError("");
            await updateAdminVoucherStatus(voucher.id, !voucher.isActive);
            await loadVouchers();
        } catch (err) {
            setError(err.message || "Không thể cập nhật trạng thái voucher.");
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-background text-on-background">
            <AdminHeader currentUser={user} onLogout={handleLogout} />

            <main className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8">
                <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <h2 className="text-headline-lg font-headline-lg text-on-surface">
                            Danh sách Voucher
                        </h2>
                    </div>
                    <button
                        className="flex items-center justify-center gap-2 rounded-xl bg-secondary-container px-6 py-3 font-label-md text-on-secondary-fixed shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
                        onClick={() => setIsFormOpen((value) => !value)}
                        type="button"
                    >
                        <span className="material-symbols-outlined">
                            {isFormOpen ? "close" : "add"}
                        </span>
                        {isFormOpen ? "Đóng biểu mẫu" : "Thêm Voucher mới"}
                    </button>
                </section>

                {error && (
                    <div className="rounded-lg border border-error-container bg-error-container p-4 text-sm text-on-error-container">
                        {error}
                    </div>
                )}

                <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <article className="relative overflow-hidden rounded-xl bg-primary-container p-6 text-on-primary shadow-md md:col-span-2">
                        <div className="relative z-10">
                            <p className="text-label-md uppercase tracking-widest opacity-80">
                                Tổng lượt sử dụng
                            </p>
                            <h3 className="mt-2 text-display-lg font-display-lg">{stats.totalUsage}</h3>
                        </div>
                        <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[120px] opacity-10">
                            confirmation_number
                        </span>
                    </article>
                    <article className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
                        <div>
                            <p className="text-label-md text-outline">Voucher đang chạy</p>
                            <h3 className="mt-1 text-headline-md font-headline-md text-on-surface">
                                {Number(stats.active).toLocaleString("vi-VN")}
                                <span className="text-body-md font-normal text-on-surface-variant">
                                    /{Number(stats.totalVouchers).toLocaleString("vi-VN")}
                                </span>
                            </h3>
                        </div>
                        <div className="mt-4 h-2 w-full rounded-full bg-surface-variant">
                            <div
                                className="h-full rounded-full bg-tertiary"
                                style={{ width: `${stats.activeRate}%` }}
                            />
                        </div>
                    </article>
                    <article className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
                        <div>
                            <p className="text-label-md text-outline">Gần hết hạn</p>
                            <h3 className="mt-1 text-headline-md font-headline-md text-error">
                                {stats.expiringSoon}
                            </h3>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-body-sm text-error">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            Cần gia hạn sớm
                        </div>
                    </article>
                </section>

                {isFormOpen && (
                    <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-headline-sm font-headline-sm text-on-surface">
                                Tạo Voucher mới
                            </h3>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label className="font-label-md text-label-md text-on-surface">
                                    Tên Voucher <span className="text-error">*</span>
                                </label>
                                <input
                                    className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    onChange={(event) => updateForm("name", event.target.value)}
                                    required
                                    type="text"
                                    value={form.name}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="font-label-md text-label-md text-on-surface">
                                        Mã Voucher <span className="text-error">*</span>
                                    </label>
                                    <input
                                        className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 font-mono text-body-md uppercase outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        onChange={(event) => updateForm("code", event.target.value)}
                                        required
                                        type="text"
                                        value={form.code}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label-md text-label-md text-on-surface">
                                        Loại Voucher <span className="text-error">*</span>
                                    </label>
                                    <select
                                        className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        onChange={(event) => updateForm("discountType", event.target.value)}
                                        required
                                        value={form.discountType}
                                    >
                                        <option value="percent">Phần trăm (%)</option>
                                        <option value="fixed">Số tiền cố định (VND)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="font-label-md text-label-md text-on-surface">
                                        Giá trị ưu đãi <span className="text-error">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 pr-16 text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            min="0"
                                            onChange={(event) => updateForm("discountValue", event.target.value)}
                                            required
                                            type="number"
                                            value={form.discountValue}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-md text-on-surface-variant">
                                            {form.discountType === "percent" ? "%" : "VND"}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label-md text-label-md text-on-surface">
                                        Giảm tối đa <span className="text-error">*</span>
                                    </label>
                                    <input
                                        className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        min="0"
                                        onChange={(event) => updateForm("maxDiscountAmount", event.target.value)}
                                        required
                                        type="number"
                                        value={form.maxDiscountAmount}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="font-label-md text-label-md text-on-surface">
                                        Ngày bắt đầu <span className="text-error">*</span>
                                    </label>
                                    <input
                                        className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        onChange={(event) => updateForm("validFrom", event.target.value)}
                                        required
                                        type="date"
                                        value={form.validFrom}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label-md text-label-md text-on-surface">
                                        Ngày kết thúc <span className="text-error">*</span>
                                    </label>
                                    <input
                                        className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        onChange={(event) => updateForm("validUntil", event.target.value)}
                                        min={getNextDateValue(form.validFrom)}
                                        required
                                        type="date"
                                        value={form.validUntil}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <label className="font-label-md text-label-md text-on-surface">
                                        Số lượng phát hành <span className="text-error">*</span>
                                    </label>
                                    <input
                                        className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        min="0"
                                        onChange={(event) => updateForm("totalQuantity", event.target.value)}
                                        required
                                        type="number"
                                        value={form.totalQuantity}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label-md text-label-md text-on-surface">
                                        Lượt dùng mỗi tài khoản <span className="text-error">*</span>
                                    </label>
                                    <input
                                        className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        min="1"
                                        onChange={(event) => updateForm("usageLimitPerUser", event.target.value)}
                                        required
                                        type="number"
                                        value={form.usageLimitPerUser}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-label-md text-label-md text-on-surface">
                                        Giá trị đơn tối thiểu <span className="text-error">*</span>
                                    </label>
                                    <input
                                        className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        min="0"
                                        onChange={(event) => updateForm("minOrderValue", event.target.value)}
                                        required
                                        type="number"
                                        value={form.minOrderValue}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="font-label-md text-label-md text-on-surface">
                                    Mô tả <span className="text-error">*</span>
                                </label>
                                <textarea
                                    className="min-h-[96px] w-full rounded-lg border border-outline-variant bg-surface p-4 text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    onChange={(event) => updateForm("description", event.target.value)}
                                    required
                                    value={form.description}
                                />
                            </div>

                            <div className="space-y-4">
                                <p className="font-label-md text-label-md text-on-surface">
                                    Đối tượng áp dụng <span className="text-error">*</span>
                                </p>
                                <div className="flex flex-col gap-4 md:flex-row">
                                    <label className="flex cursor-pointer items-center gap-2">
                                        <input
                                            checked={form.targetType === "all"}
                                            className="h-5 w-5 border-outline-variant text-primary focus:ring-primary"
                                            name="targetType"
                                            onChange={() => updateForm("targetType", "all")}
                                            required
                                            type="radio"
                                        />
                                        <span className="text-body-md text-on-surface">Toàn hệ thống</span>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2">
                                        <input
                                            checked={form.targetType === "specific"}
                                            className="h-5 w-5 border-outline-variant text-primary focus:ring-primary"
                                            name="targetType"
                                            onChange={() => updateForm("targetType", "specific")}
                                            required
                                            type="radio"
                                        />
                                        <span className="text-body-md text-on-surface">Đối tượng cụ thể</span>
                                    </label>
                                </div>

                                {form.targetType === "specific" && (
                                    <div className="relative space-y-2">
                                        <label className="font-label-md text-label-md text-on-surface">
                                            Chọn khách hàng <span className="text-error">*</span>
                                        </label>
                                        {selectedEmails.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedEmails.map((email) => (
                                                    <span
                                                        className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-label-md text-primary"
                                                        key={email}
                                                    >
                                                        {email}
                                                        <button
                                                            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary/10"
                                                            onClick={() => removeSelectedEmail(email)}
                                                            type="button"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">
                                                                close
                                                            </span>
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <input
                                            autoComplete="off"
                                            className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            onChange={(event) => {
                                                setCustomerSearch(event.target.value);
                                                setIsCustomerComboboxOpen(true);
                                            }}
                                            onFocus={() => setIsCustomerComboboxOpen(true)}
                                            placeholder="Tìm theo email khách hàng..."
                                            role="combobox"
                                            type="text"
                                            value={customerSearch}
                                        />
                                        <input
                                            name="specificEmails"
                                            readOnly
                                            required={form.targetType === "specific"}
                                            type="hidden"
                                            value={form.specificEmails}
                                        />
                                        {isCustomerComboboxOpen && selectableSuggestions.length > 0 && (
                                            <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-outline-variant bg-white shadow-lg">
                                                {selectableSuggestions.map((item) => (
                                                    <button
                                                        className="flex w-full flex-col px-4 py-3 text-left text-sm hover:bg-surface-container-low"
                                                        key={item.id}
                                                        onClick={() => addSuggestedEmail(item.email)}
                                                        type="button"
                                                    >
                                                        <span className="font-semibold text-on-surface">
                                                            {item.email}
                                                        </span>
                                                        <span className="text-on-surface-variant">
                                                            {item.fullName}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {isCustomerComboboxOpen && customerSearch && selectableSuggestions.length === 0 && (
                                            <div className="absolute z-20 mt-1 w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-body-sm text-on-surface-variant shadow-lg">
                                                Không tìm thấy khách hàng phù hợp.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col justify-end gap-3 border-t border-outline-variant/30 pt-4 md:flex-row">
                                <button
                                    className="h-12 rounded-lg border border-primary px-8 font-label-md text-primary transition-colors hover:bg-primary-fixed"
                                    onClick={() => {
                                        setForm(initialForm);
                                        setIsFormOpen(false);
                                    }}
                                    type="button"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-container px-8 font-label-md text-on-primary shadow-md transition-all hover:brightness-110 disabled:opacity-60"
                                    disabled={saving}
                                    type="submit"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {saving ? "sync" : "save"}
                                    </span>
                                    {saving ? "Đang lưu..." : "Lưu Voucher"}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                <section className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant p-4">
                        <div className="flex flex-1 flex-wrap items-center gap-3">
                            <div className="relative min-w-[240px] flex-1 md:max-w-sm">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-outline">
                                    search
                                </span>
                                <input
                                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 text-body-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                                    onChange={(event) => updateFilter("search", event.target.value)}
                                    placeholder="Tìm kiếm voucher..."
                                    type="text"
                                    value={filters.search}
                                />
                            </div>
                            <select
                                className="rounded-lg border-none bg-surface-container-low px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary"
                                onChange={(event) => updateFilter("status", event.target.value)}
                                value={filters.status}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="active">Đang chạy</option>
                                <option value="paused">Tạm dừng</option>
                            </select>
                            <select
                                className="rounded-lg border-none bg-surface-container-low px-4 py-2 text-body-md outline-none focus:ring-2 focus:ring-primary"
                                onChange={(event) => updateFilter("type", event.target.value)}
                                value={filters.type}
                            >
                                <option value="all">Loại voucher</option>
                                <option value="percent">Giảm %</option>
                                <option value="fixed">Giảm tiền cố định</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-surface-container text-label-md font-label-md text-on-surface-variant">
                                    <th className="px-6 py-4 uppercase tracking-wider">Mã Voucher</th>
                                    <th className="px-6 py-4 uppercase tracking-wider">Loại</th>
                                    <th className="px-6 py-4 uppercase tracking-wider">Giá trị</th>
                                    <th className="px-6 py-4 uppercase tracking-wider">Hiệu lực</th>
                                    <th className="px-6 py-4 text-center uppercase tracking-wider">
                                        Số lượng
                                    </th>
                                    <th className="px-6 py-4 text-center uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-4 text-right uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {loading ? (
                                    <tr>
                                        <td
                                            className="px-6 py-10 text-center text-on-surface-variant"
                                            colSpan="7"
                                        >
                                            Đang tải danh sách voucher...
                                        </td>
                                    </tr>
                                ) : vouchers.length === 0 ? (
                                    <tr>
                                        <td
                                            className="px-6 py-10 text-center text-on-surface-variant"
                                            colSpan="7"
                                        >
                                            Chưa có voucher nào trong hệ thống.
                                        </td>
                                    </tr>
                                ) : (
                                    vouchers.map((voucher) => {
                                        const totalQuantity = Number(voucher.totalQuantity || 0);
                                        const usedCount = Number(voucher.usedCount || 0);
                                        const usageRate = totalQuantity
                                            ? Math.min((usedCount / totalQuantity) * 100, 100)
                                            : 0;

                                        return (
                                            <tr
                                                className={`group transition-colors hover:bg-surface-container-low ${
                                                    voucher.isActive ? "" : "bg-surface-dim/20 opacity-70"
                                                }`}
                                                key={voucher.id}
                                            >
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`rounded px-2 py-1 font-mono font-bold ${
                                                            voucher.isActive
                                                                ? "bg-primary-fixed text-primary"
                                                                : "bg-surface-variant text-outline"
                                                        }`}
                                                    >
                                                        {voucher.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-body-md">
                                                    {voucher.discountType === "percent"
                                                        ? "Giảm %"
                                                        : "Giảm tiền cố định"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`text-headline-sm font-bold ${
                                                            voucher.isActive ? "text-secondary" : "text-outline"
                                                        }`}
                                                    >
                                                        {formatDiscount(voucher)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-body-sm text-on-surface">
                                                        <p>
                                                            Từ:{" "}
                                                            <span className="font-medium">
                                                                {formatDate(voucher.validFrom)}
                                                            </span>
                                                        </p>
                                                        <p>
                                                            Đến:{" "}
                                                            <span className="font-medium">
                                                                {formatDate(voucher.validUntil)}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className="text-body-md font-bold">
                                                            {usedCount}
                                                            {totalQuantity ? `/${totalQuantity}` : ""}
                                                        </span>
                                                        {totalQuantity > 0 && (
                                                            <div className="mt-1 h-1 w-16 rounded-full bg-surface-variant">
                                                                <div
                                                                    className="h-full rounded-full bg-primary"
                                                                    style={{ width: `${usageRate}%` }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-sm ${
                                                            voucher.isActive
                                                                ? "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                                                                : "bg-surface-container-high text-on-surface-variant"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`h-2 w-2 rounded-full ${
                                                                voucher.isActive ? "bg-tertiary" : "bg-outline"
                                                            }`}
                                                        />
                                                        {voucher.isActive ? "Đang chạy" : "Tạm dừng"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        className={`rounded-lg p-2 transition-colors ${
                                                            voucher.isActive
                                                                ? "text-error hover:bg-error-container"
                                                                : "text-primary hover:bg-primary-container/10"
                                                        }`}
                                                        onClick={() => handleToggleStatus(voucher)}
                                                        title={voucher.isActive ? "Dừng" : "Kích hoạt lại"}
                                                        type="button"
                                                    >
                                                        <span className="material-symbols-outlined">
                                                            {voucher.isActive ? "stop_circle" : "play_circle"}
                                                        </span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container p-4">
                        <p className="text-body-sm text-on-surface-variant">
                            Tổng cộng {Number(pagination.total || 0).toLocaleString("vi-VN")} voucher
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                className="rounded p-2 text-outline transition-colors hover:bg-surface-container-high disabled:opacity-40"
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
                            <span className="flex h-8 min-w-8 items-center justify-center rounded bg-primary px-3 font-label-md text-on-primary">
                                {pagination.page}
                            </span>
                            <button
                                className="rounded p-2 transition-colors hover:bg-surface-container-high disabled:opacity-40"
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
                </section>
            </main>

            <AdminFooter />
        </div>
    );
};

export default AdminVouchersPage;
