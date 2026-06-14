import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ManagerHeader from "../../components/manager/ManagerHeader";
import ManagerFooter from "../../components/manager/ManagerFooter";
import { getManagerProfile } from "../../api/managerApi";

// =============================================================
// TODO: Thay bằng API call khi có login
// Lấy danh sách tour cấp độ Hard cần duyệt:
//   GET /api/managers/tours/hard-approval?page={page}&search={q}
// Dựa trên: Tour (difficulty=hard), TourSchedule, Booking (status=pending_approval), User (customers)
// Xem chi tiết: GET /api/managers/bookings/{bookingId}/verify
// =============================================================
const FAKE_HARD_TOURS = [
    {
        id: "tour-78291",
        tourId: "TOUR-78291",
        title: "Chinh phục Fansipan",
        thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=80&h=60&fit=crop",
        departureDate: "24/05/2024",
        pendingCustomers: 12,
        avatars: ["JD", "AS", "+10"],
        status: "pending",
    },
    {
        id: "tour-33102",
        tourId: "TOUR-33102",
        title: "Trekking Hang Sơn Đoòng",
        thumbnail: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=80&h=60&fit=crop",
        departureDate: "12/06/2024",
        pendingCustomers: 8,
        avatars: ["MK", "+6"],
        status: "pending",
    },
    {
        id: "tour-44910",
        tourId: "TOUR-44910",
        title: "Vượt thác Dam B'ri mạo hiểm",
        thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=80&h=60&fit=crop",
        departureDate: "18/06/2024",
        pendingCustomers: 5,
        avatars: ["BT", "+3"],
        status: "pending",
    },
    {
        id: "tour-11029",
        tourId: "TOUR-11029",
        title: "Khám phá Cao nguyên đá Hà Giang",
        thumbnail: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=80&h=60&fit=crop",
        departureDate: "30/06/2024",
        pendingCustomers: 7,
        avatars: ["LV", "+5"],
        status: "pending",
    },
];

const AVATAR_COLORS = [
    "bg-blue-500", "bg-purple-500", "bg-green-500",
    "bg-rose-500", "bg-amber-500", "bg-teal-500",
];

const ManagerHardApprovalPage = () => {
    const [user, setUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();
    const totalPages = 8;
    const totalPending = 32;

    useEffect(() => {
        // TODO: Lấy thông tin manager từ token/session
        const fetchProfile = async () => {
            try {
                const profileData = await getManagerProfile();
                setUser(profileData);
            } catch (err) {
                console.error("Failed to load profile", err);
            }
        };
        fetchProfile();
    }, []);

    const filtered = FAKE_HARD_TOURS.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tourId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-background text-on-background min-h-screen flex flex-col">
            <ManagerHeader currentUser={user} />

            <main className="flex-grow pt-24 pb-xl px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto w-full">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-xl">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface">Danh sách Duyệt Tour (Cấp độ Hard)</h1>
                        <p className="text-sm text-on-surface-variant mt-1">
                            Các tour yêu cầu xác minh CCCD/Hộ chiếu từ khách hàng.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant bg-white shadow-sm">
                            <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                            <span className="font-semibold text-on-surface text-sm">{totalPending} Chờ duyệt</span>
                        </div>
                        <button className="p-2.5 rounded-lg border border-outline-variant bg-white hover:bg-surface-container-low transition">
                            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">filter_list</span>
                        </button>
                    </div>
                </div>

                {/* Banner + Stats Row */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-lg mb-lg">
                    {/* Priority Banner */}
                    <div className="bg-primary rounded-xl p-xl text-white relative overflow-hidden">
                        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
                        <div className="absolute right-8 bottom-0 w-24 h-24 bg-white/5 rounded-full" />
                        <div className="relative z-10">
                            <p className="font-bold text-lg mb-2">Ưu tiên xác minh ngay</p>
                            {/* TODO: Lấy tour sắp khởi hành từ API */}
                            <p className="text-sm text-white/80 mb-lg leading-relaxed">
                                Có 12 khách hàng cho tour 'Chinh phục Fansipan' sắp khởi hành
                                trong 48h tới cần được duyệt giấy tờ ngay lập tức.
                            </p>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-secondary-container text-white rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition">
                                <span className="material-symbols-outlined text-[18px]">bolt</span>
                                Bắt đầu duyệt nhanh
                            </button>
                        </div>
                    </div>

                    {/* Performance Card */}
                    <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-xl">
                        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">Hiệu suất tháng</p>
                        {/* TODO: GET /api/managers/stats/approval-efficiency */}
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-5xl font-bold text-on-surface">94%</span>
                            <span className="text-green-500 font-semibold text-sm mb-2">+2.4%</span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                            Tỷ lệ duyệt hồ sơ thành công tăng so với tháng trước nhờ quy trình AI mới.
                        </p>
                    </div>
                </div>

                {/* Queue Table */}
                <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
                    <div className="p-lg border-b border-outline-variant/20 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <h2 className="font-semibold text-on-surface">Danh sách hàng đợi</h2>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm tên tour..."
                                className="pl-10 pr-4 py-2 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-64"
                            />
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-[2.5fr_1fr_1.5fr_1fr_1fr] gap-4 px-lg py-3 bg-surface-container-low text-xs font-semibold uppercase text-on-surface-variant tracking-wide">
                        <span>Thông tin Tour</span>
                        <span>Ngày khởi hành</span>
                        <span>Khách chờ duyệt</span>
                        <span>Trạng thái</span>
                        <span className="text-right">Thao tác</span>
                    </div>

                    <div className="divide-y divide-outline-variant/20">
                        {filtered.map((tour, rowIdx) => (
                            <div
                                key={tour.id}
                                className="grid grid-cols-[2.5fr_1fr_1.5fr_1fr_1fr] gap-4 px-lg py-4 items-center hover:bg-surface-container-low/50 transition"
                            >
                                {/* Tour Info */}
                                <div className="flex items-center gap-3">
                                    <img
                                        src={tour.thumbnail}
                                        alt={tour.title}
                                        className="w-16 h-11 rounded-lg object-cover flex-shrink-0"
                                    />
                                    <div>
                                        <p className="font-semibold text-sm text-on-surface">{tour.title}</p>
                                        <p className="text-xs text-on-surface-variant mt-0.5">ID: {tour.tourId}</p>
                                    </div>
                                </div>

                                {/* Departure Date */}
                                <span className="text-sm text-on-surface">{tour.departureDate}</span>

                                {/* Pending Customers with Avatars */}
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {tour.avatars.map((av, i) => (
                                            <div
                                                key={i}
                                                className={`w-7 h-7 rounded-full ${AVATAR_COLORS[(rowIdx + i) % AVATAR_COLORS.length]} text-white text-[10px] font-bold flex items-center justify-center border-2 border-white`}
                                            >
                                                {av}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-sm font-semibold text-primary">
                                        {tour.pendingCustomers} khách
                                    </span>
                                </div>

                                {/* Status */}
                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 w-fit">
                                    Chờ duyệt
                                </span>

                                {/* Action */}
                                <div className="text-right">
                                    <button
                                        onClick={() => navigate(`/managers/customers/verify/${tour.id}`)}
                                        className="text-primary text-sm font-semibold hover:underline transition"
                                    >
                                        Xem chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="px-lg py-4 border-t border-outline-variant/20 flex items-center justify-between flex-wrap gap-3">
                        <p className="text-xs text-on-surface-variant">
                            Đang hiển thị {filtered.length} trong tổng số {totalPending} tour yêu cầu xác minh.
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
                                className="w-8 h-8 text-sm rounded-lg border border-outline-variant hover:bg-surface-container-low text-on-surface-variant transition"
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
            </main>

            <ManagerFooter />
        </div>
    );
};

export default ManagerHardApprovalPage;
