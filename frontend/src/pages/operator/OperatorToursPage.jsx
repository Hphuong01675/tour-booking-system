import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OperatorHeader from "../../components/operator/OperatorHeader";
import OperatorFooter from "../../components/operator/OperatorFooter";
import { getOperatorProfile, getOperatorTours, updateOperatorTour } from "../../api/operatorApi";

const TABS = [
    { key: "all", label: "Tất cả" },
    { key: "open", label: "Đang đăng ký" },
    { key: "pending", label: "Chờ duyệt" },
    { key: "upcoming", label: "Chưa mở" },
    { key: "closed", label: "Đã đóng" },
    { key: "draft", label: "Bản nháp" },
];

const STATUS_CONFIG = {
    open: { label: "Đang đăng ký", classes: "bg-blue-100 text-blue-700" },
    pending: { label: "Chờ duyệt", classes: "bg-amber-100 text-amber-700" },
    upcoming: { label: "Chưa mở", classes: "bg-gray-100 text-gray-600" },
    closed: { label: "Đã đóng", classes: "bg-rose-100 text-rose-600" },
    draft: { label: "Bản nháp", classes: "bg-gray-100 text-gray-500" },
    cancelled: { label: "Đã hủy", classes: "bg-red-100 text-red-600" },
};

const formatPrice = (p) =>
    p != null ? parseFloat(p).toLocaleString("vi-VN") + "đ" : "TBC";

const OperatorToursPage = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("all");
    const [category, setCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [departureDate, setDepartureDate] = useState("");
    
    // Áp dụng khi bấm nút lọc
    const [searchVal, setSearchVal] = useState("");
    const [dateVal, setDateVal] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [tours, setTours] = useState([]);
    const [totalTours, setTotalTours] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileData = await getOperatorProfile();
                setUser(profileData);
            } catch (err) {
                console.error("Failed to load profile in tours page", err);
            }
        };
        fetchProfile();
    }, []);

    const fetchTours = async () => {
        setLoading(true);
        try {
            const data = await getOperatorTours({
                status: activeTab,
                difficulty: category,
                search: searchVal,
                departureDate: dateVal,
                page: currentPage,
                limit: 5
            });
            setTours(data.tours || []);
            setTotalTours(data.totalTours || 0);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error("Failed to fetch tours", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTours();
    }, [activeTab, category, searchVal, dateVal, currentPage]);

    const handleApplyFilters = () => {
        setSearchVal(searchQuery);
        setDateVal(departureDate);
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setSearchQuery("");
        setDepartureDate("");
        setCategory("all");
        setSearchVal("");
        setDateVal("");
        setCurrentPage(1);
    };

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        setCurrentPage(1);
    };

    const handleCloseRegistration = async (tourId) => {
        if (!window.confirm("Bạn có chắc chắn muốn đóng đăng ký cho tour này không?")) {
            return;
        }
        setLoading(true);
        try {
            await updateOperatorTour(tourId, { status: "closed" });
            alert("Đã đóng đăng ký tour thành công!");
            fetchTours();
        } catch (err) {
            console.error("Failed to close registration", err);
            alert(err.response?.data?.error || err.message || "Lỗi khi đóng đăng ký.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background text-on-background min-h-screen flex flex-col">
            <OperatorHeader currentUser={user} />

            <main className="flex-grow pt-24 pb-s-xl px-s-margin-mobile md:px-s-margin-desktop max-w-[1440px] mx-auto w-full">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-s-xl">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface">Quản lý Tour Đang Vận Hành</h1>
                        <p className="text-sm text-on-surface-variant mt-1">
                            Theo dõi và cập nhật trạng thái các chuyến đi trong hệ thống.
                        </p>
                    </div>
                    <div className="flex gap-3 flex-shrink-0">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            Xuất báo cáo
                        </button>
                        <button
                            onClick={() => navigate("/operator/tours/new")}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-container text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Tạo Tour Mới
                        </button>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden mb-s-lg">
                    {/* Tabs */}
                    <div className="border-b border-outline-variant/30 flex gap-0 overflow-x-auto">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                                    activeTab === tab.key
                                        ? "border-primary text-primary font-semibold"
                                        : "border-transparent text-on-surface-variant hover:text-on-surface"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Filter Row - Balanced Aligned items-end */}
                    <div className="p-5 border-b border-outline-variant/20 flex flex-wrap gap-3 items-end">
                        {/* Search */}
                        <div className="flex flex-col flex-1 min-w-[200px]">
                            <label className="text-xs text-on-surface-variant mb-1">Từ khóa</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm tiêu đề hoặc mã tour..."
                                    className="pl-9 pr-4 py-2 w-full rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </div>
                        {/* Category filter */}
                        <div className="flex flex-col">
                            <label className="text-xs text-on-surface-variant mb-1">Phân loại</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-outline-variant text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[160px] h-[38px]"
                            >
                                <option value="all">Tất cả danh mục</option>
                                <option value="normal">Thông thường</option>
                                <option value="hard">Cấp độ Hard</option>
                            </select>
                        </div>
                        {/* Date filter */}
                        <div className="flex flex-col">
                            <label className="text-xs text-on-surface-variant mb-1">Ngày khởi hành (từ ngày)</label>
                            <input
                                type="date"
                                value={departureDate}
                                onChange={(e) => setDepartureDate(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-outline-variant text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[160px] h-[38px]"
                            />
                        </div>
                        <button
                            onClick={handleApplyFilters}
                            className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition h-[38px]"
                        >
                            Áp dụng lọc
                        </button>
                        <button
                            onClick={handleResetFilters}
                            className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition h-[38px]"
                        >
                            Đặt lại
                        </button>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold uppercase text-on-surface-variant tracking-wide">
                        <span>Thông tin Tour</span>
                        <span>Lịch trình tour</span>
                        <span>Trạng thái</span>
                        <span>Giá khởi điểm</span>
                        <span className="text-right">Thao tác</span>
                    </div>

                    {/* Tour Rows */}
                    <div className="divide-y divide-outline-variant/20">
                        {loading ? (
                            <div className="text-center py-12 text-sm text-on-surface-variant">
                                Đang tải danh sách tour...
                            </div>
                        ) : tours.length === 0 ? (
                            <div className="text-center py-12 text-sm text-on-surface-variant">
                                Không tìm thấy tour nào phù hợp.
                            </div>
                        ) : (
                            tours.map((tour) => (
                                <div
                                    key={tour.id}
                                    className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-surface-container-low/50 transition-colors"
                                >
                                    {/* Tour Info */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-16 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                                            {tour.thumbnailUrl ? (
                                                <img src={tour.thumbnailUrl} alt={tour.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-outline-variant text-[20px]">image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p
                                                onClick={() => navigate(`/operator/tours/${tour.id}`)}
                                                className="font-semibold text-sm text-primary hover:underline cursor-pointer truncate"
                                            >
                                                {tour.title}
                                            </p>
                                            <p className="text-xs text-on-surface-variant mt-0.5">
                                                Mã: {tour.tourCode} | {tour.difficulty === "hard" ? "Cấp độ Hard" : "Thông thường"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div className="text-sm">
                                        {tour.schedules && tour.schedules.length > 0 ? (
                                            <>
                                                <p className="flex items-center gap-1 text-on-surface-variant">
                                                    <span className="material-symbols-outlined text-[14px]">login</span>
                                                    Đi: {new Date(tour.schedules[0].departureDate).toLocaleDateString("vi-VN")}
                                                </p>
                                                <p className="flex items-center gap-1 text-rose-500 mt-0.5">
                                                    <span className="material-symbols-outlined text-[14px]">logout</span>
                                                    Về: {new Date(tour.schedules[0].returnDate).toLocaleDateString("vi-VN")}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-on-surface-variant/60 italic">Chưa lập lịch trình</p>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="flex flex-col gap-1">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${STATUS_CONFIG[tour.status]?.classes}`}>
                                            {STATUS_CONFIG[tour.status]?.label}
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <div className="font-medium text-sm text-on-surface">
                                        {formatPrice(tour.basePrice)}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end">
                                        {tour.status === "open" && (
                                            <button
                                                onClick={() => handleCloseRegistration(tour.id)}
                                                className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition"
                                            >
                                                Đóng đăng ký
                                            </button>
                                        )}
                                        {tour.status === "pending" && (
                                            <button
                                                onClick={() => navigate(`/operator/tours/${tour.id}`)}
                                                className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition"
                                                title="Xem chi tiết"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                                            </button>
                                        )}
                                        {tour.status === "closed" && (
                                            <button
                                                onClick={() => {
                                                    const schId = tour.schedules?.[0]?.id;
                                                    if (schId) navigate(`/operator/guides/assign?scheduleId=${schId}`);
                                                    else alert("Không có lịch trình khả dụng của tour này để phân công.");
                                                }}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">person_add</span>
                                                Giao cho HDV
                                            </button>
                                        )}
                                        {tour.status === "draft" && (
                                            <button
                                                onClick={() => navigate(`/operator/tours/${tour.id}`)}
                                                className="text-primary text-xs font-semibold underline hover:opacity-70 transition"
                                            >
                                                Tiếp tục chỉnh sửa
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-outline-variant/20 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-xs text-on-surface-variant">
                            Hiển thị {(currentPage - 1) * 5 + 1} - {Math.min(currentPage * 5, totalTours)} của {totalTours} tours
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-low transition disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-8 h-8 text-sm rounded-lg transition ${
                                        currentPage === p
                                            ? "bg-primary text-white font-bold"
                                            : "border border-outline-variant hover:bg-surface-container-low text-on-surface-variant"
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-low transition disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-s-lg">
                    {/* Overview Card */}
                    <div className="lg:col-span-2 bg-primary rounded-xl p-s-xl text-white relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-48 h-48 opacity-10">
                            <span className="material-symbols-outlined text-[180px]">explore</span>
                        </div>
                        <h3 className="font-bold text-lg mb-4">Tổng quan Vận Hành Tháng 10</h3>
                        {/* TODO: Lấy từ API thống kê - GET /api/operator/stats/monthly */}
                        <div className="grid grid-cols-3 gap-s-lg relative z-10">
                            <div>
                                <p className="text-xs text-white/70 mb-1">Tổng số khách</p>
                                <p className="text-3xl font-bold">1,280</p>
                                <p className="text-xs text-green-300 mt-1">+12%</p>
                            </div>
                            <div>
                                <p className="text-xs text-white/70 mb-1">Doanh thu dự kiến</p>
                                <p className="text-3xl font-bold">4.2 tỷ</p>
                                <p className="text-xs text-white/70 mt-1">VNĐ</p>
                            </div>
                            <div>
                                <p className="text-xs text-white/70 mb-1">Tỷ lệ lấp đầy</p>
                                <p className="text-3xl font-bold">92%</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Required Card */}
                    <div className="bg-white rounded-xl border border-outline-variant/30 p-s-xl shadow-sm">
                        <h3 className="font-semibold text-on-surface mb-4">Yêu cầu cần xử lý</h3>
                        {/* TODO: Lấy từ API - GET /api/operator/pending-actions */}
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-sm">
                                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
                                <span className="text-on-surface-variant">3 Tour cần cập nhật lịch trình</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
                                <span className="text-on-surface-variant">12 Giao dịch chờ xác nhận</span>
                            </li>
                        </ul>
                        <button className="mt-6 text-sm text-primary font-medium hover:underline transition">
                            Xem danh sách ưu tiên →
                        </button>
                    </div>
                </div>
            </main>

            <OperatorFooter />
        </div>
    );
};

export default OperatorToursPage;
