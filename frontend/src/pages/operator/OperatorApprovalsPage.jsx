import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OperatorHeader from "../../components/operator/OperatorHeader";
import OperatorFooter from "../../components/operator/OperatorFooter";
import { getOperatorProfile, getHardApprovalTours } from "../../api/operatorApi";

const AVATAR_COLORS = [
    "bg-blue-500", "bg-purple-500", "bg-green-500",
    "bg-rose-500", "bg-amber-500", "bg-teal-500",
];

const OperatorApprovalsPage = () => {
    const [user, setUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileData = await getOperatorProfile();
                setUser(profileData);
            } catch (err) {
                console.error("Failed to load profile", err);
            }
        };
        fetchProfile();
    }, []);

    const fetchHardToursList = async () => {
        setLoading(true);
        try {
            const data = await getHardApprovalTours();
            setTours(data.tours || []);
        } catch (err) {
            console.error("Failed to fetch hard approval tours", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHardToursList();
    }, []);

    const filtered = tours.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tourId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const limit = 5;
    const totalPending = filtered.reduce((sum, t) => sum + t.pendingCustomers, 0);
    const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
    const paginatedTours = filtered.slice((currentPage - 1) * limit, currentPage * limit);

    return (
        <div className="bg-background text-on-background min-h-screen flex flex-col">
            <OperatorHeader currentUser={user} />

            <main className="flex-grow pt-24 pb-s-xl px-s-margin-mobile md:px-s-margin-desktop max-w-[1440px] mx-auto w-full">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-s-xl">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface">Danh sách Duyệt Tour (Cấp độ Hard)</h1>
                        <p className="text-sm text-on-surface-variant mt-1">
                            Các tour yêu cầu xác minh CCCD/Hộ chiếu từ khách hàng được quản lý bởi bạn.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant bg-white shadow-sm">
                            <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                            <span className="font-semibold text-on-surface text-sm">{totalPending} Chờ duyệt</span>
                        </div>
                    </div>
                </div>

                {/* Banner + Stats Row */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-s-lg mb-s-lg">
                    {/* Priority Banner */}
                    <div className="bg-primary rounded-xl p-s-xl text-white relative overflow-hidden animate-pulse">
                        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
                        <div className="absolute right-8 bottom-0 w-24 h-24 bg-white/5 rounded-full" />
                        <div className="relative z-10">
                            <p className="font-bold text-lg mb-2">Ưu tiên xác minh hồ sơ</p>
                            <p className="text-sm text-white/80 mb-s-lg leading-relaxed">
                                Hãy kiểm tra kỹ ảnh chụp CCCD/Hộ chiếu mặt trước và mặt sau của các hành khách trong các tour Hard dưới đây trước khi duyệt.
                            </p>
                        </div>
                    </div>

                    {/* Performance Card */}
                    <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-xl">
                        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">Hiệu suất</p>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-bold text-on-surface">100%</span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                            Hoàn tất kiểm duyệt hồ sơ nhanh chóng giúp cải thiện tỷ lệ checkin đúng giờ.
                        </p>
                    </div>
                </div>

                {/* Queue Table */}
                <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
                    <div className="p-s-lg border-b border-outline-variant/20 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <h2 className="font-semibold text-on-surface">Danh sách hàng đợi duyệt</h2>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                placeholder="Tìm kiếm tên tour..."
                                className="pl-10 pr-4 py-2 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-64"
                            />
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-[2.5fr_1fr_1.5fr_1fr_1fr] gap-4 px-s-lg py-3 bg-surface-container-low text-xs font-semibold uppercase text-on-surface-variant tracking-wide">
                        <span>Thông tin Tour</span>
                        <span>Ngày khởi hành</span>
                        <span>Khách chờ duyệt</span>
                        <span>Trạng thái</span>
                        <span className="text-right">Thao tác</span>
                    </div>

                    <div className="divide-y divide-outline-variant/20">
                        {loading ? (
                            <div className="text-center py-12 text-sm text-on-surface-variant">
                                Đang tải danh sách hàng đợi duyệt...
                            </div>
                        ) : paginatedTours.length === 0 ? (
                            <div className="text-center py-12 text-sm text-on-surface-variant">
                                Không có tour nào cần phê duyệt hồ sơ.
                            </div>
                        ) : (
                            paginatedTours.map((tour, rowIdx) => (
                                <div
                                    key={tour.id}
                                    className="grid grid-cols-[2.5fr_1fr_1.5fr_1fr_1fr] gap-4 px-s-lg py-4 items-center hover:bg-surface-container-low/50 transition"
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

                                    {/* Action - Redirects to Participants list page */}
                                    <div className="text-right">
                                        <button
                                            onClick={() => navigate(`/operator/tours/${tour.id}/participants`)}
                                            className="text-primary text-sm font-semibold hover:underline transition"
                                        >
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-s-lg py-4 border-t border-outline-variant/20 flex items-center justify-between flex-wrap gap-3">
                            <p className="text-xs text-on-surface-variant">
                                Đang hiển thị {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, filtered.length)} trong tổng số {filtered.length} tour.
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
                    )}
                </div>
            </main>

            <OperatorFooter />
        </div>
    );
};

export default OperatorApprovalsPage;
