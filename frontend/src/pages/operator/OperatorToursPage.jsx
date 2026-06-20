import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OperatorHeader from "../../components/operator/OperatorHeader";
import OperatorFooter from "../../components/operator/OperatorFooter";
import { getOperatorProfile, getOperatorTours } from "../../api/operatorApi";

// =============================================================
// TODO: Thay bằng API call khi có login
// Ví dụ: const { data } = await getToursByOperator(currentUser.id);
// API endpoint gợi ý: GET /api/operator/tours?status=open&page=1
// Dữ liệu dựa trên model: Tour, TourSchedule, TourImage
// =============================================================
const FAKE_TOURS = [
    {
        id: "1",
        code: "HL-2024-001",
        title: "Vẻ đẹp Vịnh Hạ Long 2N1Đ",
        thumbnail: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=120&h=80&fit=crop",
        openDate: "01/10/2023",
        closeDate: "30/10/2023",
        status: "open",
        price: 3500000,
        difficulty: "normal",
    },
    {
        id: "2",
        code: "SP-2024-042",
        title: "Khám phá Sapa Mùa Lúa Chín",
        thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120&h=80&fit=crop",
        openDate: null,
        closeDate: null,
        status: "pending",
        approvalProgress: 85,
        price: 2800000,
        difficulty: "normal",
    },
    {
        id: "3",
        code: "HU-2024-015",
        title: "Cố đô Huế - Vang bóng một thời",
        thumbnail: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=120&h=80&fit=crop",
        openDate: "15/09/2023",
        closeDate: "01/10/2023",
        status: "closed",
        price: 1950000,
        difficulty: "normal",
    },
    {
        id: "4",
        code: null,
        title: "Tour Đà Lạt: Sân Mây Đại Ngàn",
        thumbnail: null,
        openDate: null,
        closeDate: null,
        status: "draft",
        draftNumber: "4421",
        price: null,
        difficulty: "normal",
    },
];

const TABS = [
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
};

const formatPrice = (p) =>
    p != null ? p.toLocaleString("vi-VN") + "đ" : "TBC";

const OperatorToursPage = () => {
    const [user, setUser] = useState(null);
    const [tours, setTours] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("open");
    const [category, setCategory] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();
    const totalPages = 7;
    const totalTours = tours.length;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profileData = await getOperatorProfile();
                setUser(profileData);
                const toursData = await getOperatorTours();
                setTours(toursData.data || toursData);
            } catch (err) {
                console.error("Failed to load data in tours page", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

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
                                onClick={() => setActiveTab(tab.key)}
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

                    {/* Filter Row */}
                    <div className="p-5 border-b border-outline-variant/20 flex flex-wrap gap-3 items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[180px]">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm tour..."
                                className="pl-9 pr-4 py-2 w-full rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        {/* Category filter */}
                        <div className="flex flex-col">
                            <label className="text-xs text-on-surface-variant mb-1">Phân loại</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-outline-variant text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[160px]"
                            >
                                <option value="all">Tất cả danh mục</option>
                                <option value="normal">Thông thường</option>
                                <option value="hard">Cấp độ Hard</option>
                            </select>
                        </div>
                        {/* Date filter */}
                        <div className="flex flex-col">
                            <label className="text-xs text-on-surface-variant mb-1">Ngày khởi hành</label>
                            <input
                                type="date"
                                className="px-3 py-2 rounded-lg border border-outline-variant text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[160px]"
                                placeholder="Chọn khoảng ngày"
                            />
                        </div>
                        <button className="self-end px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition">
                            Áp dụng lọc
                        </button>
                        <button className="self-end px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition">
                            Đặt lại
                        </button>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold uppercase text-on-surface-variant tracking-wide">
                        <span>Thông tin Tour</span>
                        <span>Thời gian đăng ký</span>
                        <span>Trạng thái</span>
                        <span>Giá Tour</span>
                        <span className="text-right">Thao tác</span>
                    </div>

                    {/* Tour Rows */}
                    <div className="divide-y divide-outline-variant/20">
                        {isLoading ? (
                            <div className="p-8 text-center text-on-surface-variant">Đang tải dữ liệu...</div>
                        ) : tours.length === 0 ? (
                            <div className="p-8 text-center text-on-surface-variant">Không có tour nào.</div>
                        ) : tours.map((tour) => (
                            <div
                                key={tour.id}
                                className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-surface-container-low/50 transition-colors"
                            >
                                {/* Tour Info */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-16 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                                        {tour.thumbnail ? (
                                            <img src={tour.thumbnail} alt={tour.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-outline-variant text-[20px]">image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-on-surface truncate">{tour.title}</p>
                                        <p className="text-xs text-on-surface-variant mt-0.5">
                                            {tour.code ? `Mã: ${tour.code}` : `Bản nháp #${tour.draftNumber}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Time */}
                                <div className="text-sm">
                                    {tour.openDate ? (
                                        <>
                                            <p className="flex items-center gap-1 text-on-surface-variant">
                                                <span className="material-symbols-outlined text-[14px]">login</span>
                                                Mở: {tour.openDate}
                                            </p>
                                            <p className="flex items-center gap-1 text-rose-500 mt-0.5">
                                                <span className="material-symbols-outlined text-[14px]">logout</span>
                                                Đóng: {tour.closeDate}
                                            </p>
                                        </>
                                    ) : tour.status === "pending" ? (
                                        <>
                                            <p className="text-on-surface-variant">Mở: -/-/----</p>
                                            <p className="text-xs text-on-surface-variant/70 italic mt-0.5">Đang chờ xét duyệt</p>
                                        </>
                                    ) : (
                                        <p className="text-on-surface-variant/60 italic">Chưa thiết lập</p>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="flex flex-col gap-1">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${STATUS_CONFIG[tour.status]?.classes}`}>
                                        {STATUS_CONFIG[tour.status]?.label}
                                    </span>
                                    {tour.status === "pending" && tour.approvalProgress && (
                                        <div className="flex items-center gap-1">
                                            <div className="flex-1 h-1 bg-amber-100 rounded-full">
                                                <div
                                                    className="h-1 bg-amber-400 rounded-full"
                                                    style={{ width: `${tour.approvalProgress}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-amber-600 font-medium">
                                                Đang duyệt: {tour.approvalProgress}%
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="font-medium text-sm text-on-surface">
                                    {formatPrice(tour.price)}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end">
                                    {tour.status === "open" && (
                                        <button className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition">
                                            Đóng đăng ký
                                        </button>
                                    )}
                                    {tour.status === "pending" && (
                                        <button className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition">
                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        </button>
                                    )}
                                    {tour.status === "closed" && (
                                        <button
                                            onClick={() => navigate("/operator/guides/assign")}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">person_add</span>
                                            Giao cho HDV
                                        </button>
                                    )}
                                    {tour.status === "draft" && (
                                        <button
                                            onClick={() => navigate("/operator/tours/new")}
                                            className="text-primary text-xs font-semibold underline hover:opacity-70 transition"
                                        >
                                            Tiếp tục chỉnh sửa
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-outline-variant/20 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-xs text-on-surface-variant">
                            Hiển thị 1 - {tours.length} của {totalTours} tours
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-low transition"
                            >
                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                            </button>
                            {[1, 2, 3].map((p) => (
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
                            <span className="w-8 h-8 flex items-center justify-center text-on-surface-variant text-sm">...</span>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                className={`w-8 h-8 text-sm rounded-lg border border-outline-variant hover:bg-surface-container-low text-on-surface-variant transition`}
                            >
                                {totalPages}
                            </button>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-low transition"
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
