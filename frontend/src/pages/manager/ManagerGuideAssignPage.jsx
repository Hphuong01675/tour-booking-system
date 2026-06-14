import { useState, useEffect } from "react";
import ManagerHeader from "../../components/manager/ManagerHeader";
import ManagerFooter from "../../components/manager/ManagerFooter";
import { getManagerProfile } from "../../api/managerApi";

// =============================================================
// TODO: Thay bằng API call khi có login
// Lấy thông tin tour: GET /api/managers/tour-schedules/{scheduleId}
// Lấy HDV đang rảnh: GET /api/managers/guides/available?scheduleId={id}
// Phân công HDV: POST /api/managers/tour-assignments {scheduleId, guideId, role}
// Dữ liệu dựa trên models: TourAssignment, User (role=guide), TourSchedule, Tour
// =============================================================
const FAKE_TOUR_INFO = {
    id: "schedule-001",
    scheduleCode: "#VN-4029",
    tourTitle: "Khám phá Vịnh Hạ Long 3 ngày 2 đêm",
    thumbnail: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=250&fit=crop",
    startDate: "15 Tháng 10, 2023",
    endDate: "17 Tháng 10, 2023",
    totalGuests: 24,
    requiredSkills: ["Tiếng Anh (C1)", "Lịch sử văn hóa", "Sơ cứu y tế"],
};

const FAKE_GUIDES = [
    {
        id: "guide-001",
        name: "Nguyễn Minh Quân",
        type: "HDV Quốc tế (Tiếng Anh)",
        phone: "090 123 4567",
        rating: 4.9,
        experience: "8 Năm",
        toursThisMonth: 2,
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&face",
        certifications: ["lang", "camera"],
    },
    {
        id: "guide-002",
        name: "Lê Thị Mai Anh",
        type: "HDV Nội địa",
        phone: "091 888 9999",
        rating: 4.8,
        experience: "5 Năm",
        toursThisMonth: 0,
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b977?w=80&h=80&fit=crop&face",
        certifications: ["email"],
    },
    {
        id: "guide-003",
        name: "Trần Hoàng Long",
        type: "HDV Chuyên gia (Tiếng Anh, Pháp)",
        phone: "098 765 4321",
        rating: 5.0,
        experience: "12 Năm",
        toursThisMonth: 1,
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&face",
        certifications: ["lang", "camera", "medical"],
    },
    {
        id: "guide-004",
        name: "Phạm Hải Yến",
        type: "HDV Quốc tế (Tiếng Trung)",
        phone: "094 555 6666",
        rating: 4.7,
        experience: "4 Năm",
        toursThisMonth: 3,
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&face",
        certifications: ["globe"],
    },
];

const CERT_ICONS = {
    lang: { icon: "language", color: "text-blue-500", label: "Đa ngôn ngữ" },
    camera: { icon: "photo_camera", color: "text-orange-500", label: "Nhiếp ảnh" },
    medical: { icon: "medical_services", color: "text-green-500", label: "Y tế" },
    globe: { icon: "travel_explore", color: "text-purple-500", label: "Quốc tế" },
    email: { icon: "mail", color: "text-teal-500", label: "Liên lạc" },
};

const ManagerGuideAssignPage = () => {
    const [user, setUser] = useState(null);
    const [assignedGuide, setAssignedGuide] = useState(null);

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

    const handleAssign = (guide) => {
        // TODO: POST /api/managers/tour-assignments
        setAssignedGuide(guide.id);
        alert(`Đã phân công ${guide.name} cho tour! (TODO: Kết nối API)`);
    };

    return (
        <div className="bg-background text-on-background min-h-screen flex flex-col">
            <ManagerHeader currentUser={user} />

            <main className="flex-grow pt-24 pb-xl px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto w-full">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
                    <span>Guides</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-primary font-semibold">Phân công HDV</span>
                </nav>

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-xl">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface">Phân Công Hướng Dẫn Viên</h1>
                        <p className="text-sm text-on-surface-variant mt-1">
                            Chọn nhân sự phù hợp nhất cho lịch trình tour sắp tới.
                        </p>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary-container text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition shadow-sm self-start">
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        + Thêm HDV mới
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-lg items-start">
                    {/* Left: Tour Info Panel */}
                    <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
                        <div className="relative">
                            <img
                                src={FAKE_TOUR_INFO.thumbnail}
                                alt={FAKE_TOUR_INFO.tourTitle}
                                className="w-full h-48 object-cover"
                            />
                            <span className="absolute top-3 right-3 px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-lg">
                                {FAKE_TOUR_INFO.scheduleCode}
                            </span>
                        </div>
                        <div className="p-lg">
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Thông tin Tour</p>
                            <h2 className="font-bold text-on-surface text-base leading-snug mb-lg">
                                {FAKE_TOUR_INFO.tourTitle}
                            </h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                                    <div>
                                        <p className="text-xs text-on-surface-variant">Ngày bắt đầu</p>
                                        <p className="font-semibold text-on-surface">{FAKE_TOUR_INFO.startDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">event</span>
                                    <div>
                                        <p className="text-xs text-on-surface-variant">Ngày kết thúc</p>
                                        <p className="font-semibold text-on-surface">{FAKE_TOUR_INFO.endDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">group</span>
                                    <div>
                                        <p className="text-xs text-on-surface-variant">Số lượng khách</p>
                                        <p className="font-semibold text-on-surface">{FAKE_TOUR_INFO.totalGuests} Thành viên</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-lg">
                                <p className="text-xs font-medium text-on-surface-variant mb-2">Yêu cầu kỹ năng:</p>
                                <div className="flex flex-wrap gap-2">
                                    {FAKE_TOUR_INFO.requiredSkills.map((s) => (
                                        <span key={s} className="px-2.5 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-xs font-medium">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-lg p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                                <span className="material-symbols-outlined text-blue-500 text-[16px] mt-0.5">info</span>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Hệ thống tự động lọc ra những hướng dẫn viên không có lịch trình trùng lắp trong khoảng thời gian trên.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Available Guides */}
                    <div>
                        <div className="flex items-center justify-between mb-lg">
                            <h2 className="font-semibold text-on-surface">
                                Hướng dẫn viên đang trống lịch ({FAKE_GUIDES.length})
                            </h2>
                            <div className="flex gap-2">
                                <button className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-low transition">
                                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">filter_list</span>
                                </button>
                                <button className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-low transition">
                                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">grid_view</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                            {FAKE_GUIDES.map((guide) => (
                                <div
                                    key={guide.id}
                                    className={`bg-white rounded-xl border shadow-sm p-lg transition ${
                                        assignedGuide === guide.id
                                            ? "border-green-400 ring-2 ring-green-200"
                                            : "border-outline-variant/30 hover:shadow-md"
                                    }`}
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <img
                                            src={guide.avatar}
                                            alt={guide.name}
                                            className="w-14 h-14 rounded-full object-cover flex-shrink-0 border border-outline-variant/30"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-on-surface text-sm">{guide.name}</h3>
                                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-full">
                                                    <span className="material-symbols-outlined text-[12px]" style={{fontVariationSettings:"'FILL' 1"}}>star</span>
                                                    {guide.rating}
                                                </span>
                                            </div>
                                            <p className="text-xs text-on-surface-variant mt-0.5">{guide.type}</p>
                                            <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                                                <span className="material-symbols-outlined text-[13px]">phone</span>
                                                {guide.phone}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-surface-container-low rounded-lg p-2.5">
                                            <p className="text-[10px] uppercase text-on-surface-variant font-semibold tracking-wide mb-0.5">Kinh nghiệm</p>
                                            <p className="text-sm font-bold text-on-surface">{guide.experience}</p>
                                        </div>
                                        <div className="bg-surface-container-low rounded-lg p-2.5">
                                            <p className="text-[10px] uppercase text-on-surface-variant font-semibold tracking-wide mb-0.5">Số Tour Tháng Này</p>
                                            <p className="text-sm font-bold text-on-surface">{guide.toursThisMonth} Tours</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-1.5">
                                            {guide.certifications.map((cert) => (
                                                <span
                                                    key={cert}
                                                    title={CERT_ICONS[cert]?.label}
                                                    className={`material-symbols-outlined text-[18px] ${CERT_ICONS[cert]?.color}`}
                                                >
                                                    {CERT_ICONS[cert]?.icon}
                                                </span>
                                            ))}
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

                        <button className="w-full mt-lg py-3 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-low transition">
                            Xem thêm hướng dẫn viên ↓
                        </button>
                    </div>
                </div>
            </main>

            <ManagerFooter />
        </div>
    );
};

export default ManagerGuideAssignPage;
