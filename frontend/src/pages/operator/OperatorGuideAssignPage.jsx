// Path: frontend/src/pages/operator/OperatorGuideAssignPage.jsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import OperatorHeader from "../../components/operator/OperatorHeader";
import OperatorFooter from "../../components/operator/OperatorFooter";
import { getOperatorProfile, getScheduleDetail, getAvailableGuides, assignGuide } from "../../api/operatorApi";

const OperatorGuideAssignPage = () => {
    const [searchParams] = useSearchParams();
    const scheduleId = searchParams.get("scheduleId");
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [tourInfo, setTourInfo] = useState(null);
    const [guides, setGuides] = useState([]);
    const [assignedGuide, setAssignedGuide] = useState(null);
    
    // Pagination and lazy loading state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

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

    // Fetch schedule and tour details
    useEffect(() => {
        if (!scheduleId) return;

        const fetchTourInfo = async () => {
            try {
                const sch = await getScheduleDetail(scheduleId);
                setTourInfo({
                    id: sch.id,
                    scheduleCode: sch.scheduleCode,
                    tourTitle: sch.tour.title,
                    thumbnail: sch.tour.thumbnailUrl || "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=250&fit=crop",
                    startDate: sch.departureDate ? new Date(sch.departureDate).toLocaleDateString("vi-VN") : "N/A",
                    endDate: sch.returnDate ? new Date(sch.returnDate).toLocaleDateString("vi-VN") : "N/A",
                    totalGuests: sch.registered,
                    requiredSkills: sch.tour.difficulty === "hard" ? ["CCCD Xác thực", "Trekking", "Sức khỏe tốt"] : ["Thông thường", "Thân thiện"],
                });
            } catch (err) {
                console.error("Failed to load schedule details", err);
            }
        };

        fetchTourInfo();
        setPage(1); // Reset page on schedule change
    }, [scheduleId]);

    // Fetch available guides page by page
    const fetchGuidesList = async (pageNum) => {
        if (!scheduleId) return;
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const data = await getAvailableGuides(scheduleId, pageNum);
            if (pageNum === 1) {
                setGuides(data.guides || []);
            } else {
                setGuides((prev) => [...prev, ...(data.guides || [])]);
            }
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error("Failed to fetch guides list", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchGuidesList(page);
    }, [scheduleId, page]);

    // Infinite Scroll Intersection Observer
    useEffect(() => {
        if (!scheduleId || page >= totalPages || loading || loadingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setPage((p) => p + 1);
                }
            },
            { threshold: 1.0 }
        );

        const sentinel = document.getElementById("infinite-scroll-sentinel");
        if (sentinel) observer.observe(sentinel);

        return () => {
            if (sentinel) observer.unobserve(sentinel);
        };
    }, [scheduleId, page, totalPages, loading, loadingMore]);

    const handleAssign = async (guide) => {
        try {
            await assignGuide(scheduleId, guide.id);
            setAssignedGuide(guide.id);
            alert(`Đã phân công ${guide.fullName} cho tour!`);
        } catch (err) {
            console.error("Failed to assign guide", err);
            alert(err.message || "Lỗi khi thực hiện phân công.");
        }
    };

    if (!scheduleId) {
        return (
            <div className="bg-background text-on-background min-h-screen flex flex-col">
                <OperatorHeader currentUser={user} />
                <main className="flex-grow pt-24 text-center text-sm font-semibold text-red-500">
                    Vui lòng cung cấp mã lịch trình scheduleId.
                </main>
                <OperatorFooter />
            </div>
        );
    }

    return (
        <div className="bg-background text-on-background min-h-screen flex flex-col">
            <OperatorHeader currentUser={user} />

            <main className="flex-grow pt-24 pb-s-xl px-s-margin-mobile md:px-s-margin-desktop max-w-[1440px] mx-auto w-full">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
                    <span className="cursor-pointer hover:text-primary transition" onClick={() => navigate("/operator/tours")}>
                        Quản lý Tour
                    </span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-primary font-semibold">Phân công HDV</span>
                </nav>

                {/* Page Header - Removed Thêm HDV button */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-s-xl">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface">Phân Công Hướng Dẫn Viên</h1>
                        <p className="text-sm text-on-surface-variant mt-1">
                            Chọn nhân sự phù hợp nhất cho lịch trình tour sắp tới.
                        </p>
                    </div>
                </div>

                {tourInfo ? (
                    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-s-lg items-start">
                        {/* Left: Tour Info Panel */}
                        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
                            <div className="relative">
                                <img
                                    src={tourInfo.thumbnail}
                                    alt={tourInfo.tourTitle}
                                    className="w-full h-48 object-cover"
                                />
                                <span className="absolute top-3 right-3 px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-lg">
                                    {tourInfo.scheduleCode}
                                </span>
                            </div>
                            <div className="p-s-lg">
                                <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Thông tin Tour</p>
                                <h2 className="font-bold text-on-surface text-base leading-snug mb-s-lg">
                                    {tourInfo.tourTitle}
                                </h2>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                                        <div>
                                            <p className="text-xs text-on-surface-variant">Ngày bắt đầu</p>
                                            <p className="font-semibold text-on-surface">{tourInfo.startDate}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary">event</span>
                                        <div>
                                            <p className="text-xs text-on-surface-variant">Ngày kết thúc</p>
                                            <p className="font-semibold text-on-surface">{tourInfo.endDate}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary">group</span>
                                        <div>
                                            <p className="text-xs text-on-surface-variant">Số lượng khách</p>
                                            <p className="font-semibold text-on-surface">{tourInfo.totalGuests} Thành viên</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-s-lg">
                                    <p className="text-xs font-medium text-on-surface-variant mb-2">Yêu cầu kỹ năng:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {tourInfo.requiredSkills.map((s) => (
                                            <span key={s} className="px-2.5 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-xs font-medium">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-s-lg p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                                    <span className="material-symbols-outlined text-blue-500 text-[16px] mt-0.5">info</span>
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        Hệ thống tự động sắp xếp những hướng dẫn viên trống lịch trình trong khoảng thời gian diễn ra tour lên đầu danh sách.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Available Guides */}
                        <div>
                            <div className="flex items-center justify-between mb-s-lg">
                                <h2 className="font-semibold text-on-surface">
                                    Danh sách hướng dẫn viên ({guides.length})
                                </h2>
                            </div>

                            {loading ? (
                                <div className="text-center py-12 text-sm text-on-surface-variant bg-white rounded-xl border">
                                    Đang tải danh sách hướng dẫn viên...
                                </div>
                            ) : guides.length === 0 ? (
                                <div className="text-center py-12 text-sm text-on-surface-variant bg-white rounded-xl border">
                                    Không tìm thấy hướng dẫn viên nào hoạt động.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-s-lg">
                                    {guides.map((guide) => (
                                        <div
                                            key={guide.id}
                                            className={`bg-white rounded-xl border shadow-sm p-s-lg transition ${
                                                assignedGuide === guide.id
                                                    ? "border-green-400 ring-2 ring-green-200"
                                                    : "border-outline-variant/30 hover:shadow-md"
                                            }`}
                                        >
                                            <div className="flex items-start gap-3 mb-4">
                                                <img
                                                    src={guide.avatarUrl}
                                                    alt={guide.fullName}
                                                    className="w-14 h-14 rounded-full object-cover flex-shrink-0 border border-outline-variant/30"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold text-on-surface text-sm truncate">{guide.fullName}</h3>
                                                        
                                                        {/* Status label: isFree */}
                                                        {guide.isFree ? (
                                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                                                                Trống lịch
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                                                                Bận lịch
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-on-surface-variant mt-0.5">Hướng dẫn viên du lịch</p>
                                                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                                                        <span className="material-symbols-outlined text-[13px]">phone</span>
                                                        {guide.phone || "N/A"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Removed years of experience and monthly tours count cards */}

                                            <div className="flex items-center justify-between mt-4 border-t border-outline-variant/20 pt-3">
                                                <div className="flex gap-1.5">
                                                    <span className="material-symbols-outlined text-[18px] text-blue-500" title="Đa ngôn ngữ">language</span>
                                                    <span className="material-symbols-outlined text-[18px] text-orange-500" title="Y tế">medical_services</span>
                                                </div>
                                                <button
                                                    onClick={() => handleAssign(guide)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                                        assignedGuide === guide.id
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-primary text-white hover:opacity-90 active:scale-95"
                                                    }`}
                                                >
                                                    {assignedGuide === guide.id ? "Đã phân công ✓" : "Phân công"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Infinite Scroll sentinel element */}
                            <div id="infinite-scroll-sentinel" className="w-full h-8 flex items-center justify-center mt-4">
                                {loadingMore && (
                                    <div className="text-xs text-on-surface-variant animate-pulse">
                                        Đang tải thêm hướng dẫn viên...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-sm text-on-surface-variant">
                        Đang tải chi tiết lịch trình tour...
                    </div>
                )}
            </main>

            <OperatorFooter />
        </div>
    );
};

export default OperatorGuideAssignPage;
