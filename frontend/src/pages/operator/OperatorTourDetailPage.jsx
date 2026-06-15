// Path: frontend/src/pages/operator/OperatorTourDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import OperatorHeader from "../../components/operator/OperatorHeader";
import OperatorFooter from "../../components/operator/OperatorFooter";
import { getOperatorProfile, getOperatorTourDetail, updateOperatorTour } from "../../api/operatorApi";

const STATUS_CONFIG = {
    open: { label: "Đang đăng ký", classes: "bg-blue-100 text-blue-700" },
    pending: { label: "Chờ duyệt", classes: "bg-amber-100 text-amber-700" },
    upcoming: { label: "Chưa mở", classes: "bg-gray-100 text-gray-600" },
    closed: { label: "Đã đóng", classes: "bg-rose-100 text-rose-600" },
    draft: { label: "Bản nháp", classes: "bg-gray-100 text-gray-500" },
    cancelled: { label: "Đã hủy", classes: "bg-red-100 text-red-600" },
};

const OperatorTourDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // --- Form state ---
    const [title, setTitle] = useState("");
    const [tourCode, setTourCode] = useState("");
    const [difficulty, setDifficulty] = useState("normal");
    const [basePrice, setBasePrice] = useState("");
    const [durationDays, setDurationDays] = useState(1);
    const [durationNights, setDurationNights] = useState(0);
    const [departureLocation, setDepartureLocation] = useState("");
    const [destination, setDestination] = useState("");
    const [description, setDescription] = useState("");
    const [highlights, setHighlights] = useState("");
    const [itineraryDays, setItineraryDays] = useState([]);

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

    const fetchTourDetail = async () => {
        setLoading(true);
        try {
            const data = await getOperatorTourDetail(id);
            setTour(data);
            
            // Populate form state
            setTitle(data.title || "");
            setTourCode(data.tourCode || "");
            setDifficulty(data.difficulty || "normal");
            setBasePrice(data.basePrice || "");
            setDurationDays(data.durationDays || 1);
            setDurationNights(data.durationNights || 0);
            setDepartureLocation(data.departureLocation || "");
            setDestination(data.destination || "");
            setDescription(data.description || "");
            setHighlights(data.highlights || "");
            setItineraryDays(data.itineraryDays || []);
        } catch (err) {
            console.error("Failed to load tour details", err);
            alert("Lỗi khi tải chi tiết tour.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTourDetail();
    }, [id]);

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            await updateOperatorTour(id, {
                title,
                tourCode,
                difficulty,
                basePrice: parseFloat(basePrice) || 0,
                durationDays: parseInt(durationDays) || 1,
                durationNights: parseInt(durationNights) || 0,
                departureLocation,
                destination,
                description,
                highlights,
                itineraryDays
            });
            alert("Đã lưu thay đổi thành công!");
            setIsEditing(false);
            fetchTourDetail(); // Reload updated data
        } catch (err) {
            console.error("Failed to update tour", err);
            alert(err.message || "Lỗi khi lưu thay đổi.");
        } finally {
            setSaving(false);
        }
    };

    const handleStatusTransition = async (newStatus) => {
        setSaving(true);
        try {
            await updateOperatorTour(id, { status: newStatus });
            alert("Chuyển trạng thái tour thành công!");
            fetchTourDetail(); // Reload updated data
        } catch (err) {
            console.error("Failed to transition tour status", err);
            alert(err.response?.data?.error || err.message || "Lỗi khi chuyển trạng thái.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateItineraryDay = (index, field, value) => {
        const updated = [...itineraryDays];
        updated[index] = { ...updated[index], [field]: value };
        setItineraryDays(updated);
    };

    const handleAddItineraryDay = () => {
        setItineraryDays([
            ...itineraryDays,
            { dayNumber: itineraryDays.length + 1, title: "", meals: "", description: "" }
        ]);
    };

    const handleRemoveItineraryDay = (index) => {
        const filtered = itineraryDays.filter((_, idx) => idx !== index);
        // Re-index days
        const reindexed = filtered.map((day, idx) => ({ ...day, dayNumber: idx + 1 }));
        setItineraryDays(reindexed);
    };

    if (loading) {
        return (
            <div className="bg-background text-on-background min-h-screen flex flex-col">
                <OperatorHeader currentUser={user} />
                <main className="flex-grow pt-24 text-center text-sm text-on-surface-variant">
                    Đang tải thông tin chi tiết tour...
                </main>
                <OperatorFooter />
            </div>
        );
    }

    if (!tour) {
        return (
            <div className="bg-background text-on-background min-h-screen flex flex-col">
                <OperatorHeader currentUser={user} />
                <main className="flex-grow pt-24 text-center text-sm text-red-500 font-semibold">
                    Không tìm thấy thông tin tour.
                </main>
                <OperatorFooter />
            </div>
        );
    }

    const isDraft = tour.status === "draft";

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
                    <span className="text-primary font-semibold">Chi tiết Tour</span>
                </nav>

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-s-xl border-b border-outline-variant/20 pb-4">
                    <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold text-on-surface truncate">
                                {isEditing ? "Chỉnh sửa Bản nháp" : title}
                            </h1>
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[tour.status]?.classes}`}>
                                {STATUS_CONFIG[tour.status]?.label}
                            </span>
                        </div>
                        <p className="text-sm text-on-surface-variant mt-1">
                            Mã tour: <span className="font-semibold">{tourCode || "N/A"}</span>
                        </p>
                    </div>
                    
                    {/* Action button – Only visible for Draft status */}
                    {isDraft && (
                        <div className="flex gap-2 flex-shrink-0">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleSaveChanges}
                                        disabled={saving}
                                        className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:opacity-90 transition disabled:opacity-50"
                                    >
                                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                    Chỉnh sửa Tour
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-s-lg items-start">
                    {/* Left: Main Details / Edit Form */}
                    <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-lg space-y-6">
                        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                            <span className="material-symbols-outlined">info</span>
                            Thông tin chung
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Title (Only editable if draft and in edit mode) */}
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold text-on-surface-variant mb-1">Tiêu đề Tour</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-outline-variant text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">{title}</p>
                                )}
                            </div>

                            {/* Tour Code */}
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold text-on-surface-variant mb-1">Mã Tour</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={tourCode}
                                        onChange={(e) => setTourCode(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-outline-variant text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">{tourCode || "N/A"}</p>
                                )}
                            </div>

                            {/* Difficulty */}
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold text-on-surface-variant mb-1">Độ khó</label>
                                {isEditing ? (
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-outline-variant text-sm bg-white focus:ring-2 focus:ring-primary/30 outline-none"
                                    >
                                        <option value="normal">Thông thường</option>
                                        <option value="hard">Cấp độ Hard</option>
                                    </select>
                                ) : (
                                    <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg capitalize">
                                        {difficulty === "hard" ? "Cấp độ Hard (Yêu cầu CCCD)" : "Thông thường"}
                                    </p>
                                )}
                            </div>

                            {/* Base Price */}
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold text-on-surface-variant mb-1">Giá khởi điểm (VNĐ)</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={basePrice}
                                        onChange={(e) => setBasePrice(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-outline-variant text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">
                                        {basePrice ? parseFloat(basePrice).toLocaleString("vi-VN") + "đ" : "N/A"}
                                    </p>
                                )}
                            </div>

                            {/* Duration Days */}
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold text-on-surface-variant mb-1">Số ngày</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={durationDays}
                                        onChange={(e) => setDurationDays(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-outline-variant text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">{durationDays} Ngày</p>
                                )}
                            </div>

                            {/* Duration Nights */}
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold text-on-surface-variant mb-1">Số đêm</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={durationNights}
                                        onChange={(e) => setDurationNights(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-outline-variant text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">{durationNights} Đêm</p>
                                )}
                            </div>

                            {/* Departure Location */}
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold text-on-surface-variant mb-1">Điểm khởi hành</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={departureLocation}
                                        onChange={(e) => setDepartureLocation(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-outline-variant text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">{departureLocation || "N/A"}</p>
                                )}
                            </div>

                            {/* Destination */}
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold text-on-surface-variant mb-1">Điểm đến</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-outline-variant text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">{destination || "N/A"}</p>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex flex-col">
                            <label className="text-xs font-semibold text-on-surface-variant mb-1">Mô tả tổng quan</label>
                            {isEditing ? (
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="px-3 py-2 rounded-lg border border-outline-variant text-sm focus:ring-2 focus:ring-primary/30 outline-none resize-y"
                                />
                            ) : (
                                <p className="text-sm text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-lg whitespace-pre-wrap leading-relaxed">
                                    {description || "Chưa có mô tả."}
                                </p>
                            )}
                        </div>

                        {/* Highlights */}
                        <div className="flex flex-col">
                            <label className="text-xs font-semibold text-on-surface-variant mb-1">Điểm nhấn chương trình</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={highlights}
                                    onChange={(e) => setHighlights(e.target.value)}
                                    placeholder="Cách nhau bởi dấu phẩy hoặc gạch đầu dòng"
                                    className="px-3 py-2 rounded-lg border border-outline-variant text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                                />
                            ) : (
                                <p className="text-sm text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-lg">
                                    {highlights || "Chưa thiết lập điểm nhấn."}
                                </p>
                            )}
                        </div>

                        {/* Itinerary Section */}
                        <div className="border-t border-outline-variant/20 pt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-primary flex items-center gap-2">
                                    <span className="material-symbols-outlined">map</span>
                                    Lịch trình chi tiết
                                </h3>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={handleAddItineraryDay}
                                        className="flex items-center gap-1 text-xs font-bold text-primary hover:opacity-75"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">add</span>
                                        Thêm ngày
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {itineraryDays.length === 0 ? (
                                    <p className="text-xs italic text-on-surface-variant">Chưa thiết lập lịch trình chi tiết theo ngày.</p>
                                ) : (
                                    itineraryDays.map((day, index) => (
                                        <div key={index} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 relative">
                                            {isEditing && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItineraryDay(index)}
                                                    className="absolute top-2 right-2 text-rose-500 hover:opacity-75"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            )}
                                            <p className="text-xs font-bold text-secondary mb-2">Ngày {day.dayNumber}</p>
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="flex flex-col">
                                                    <label className="text-[10px] uppercase font-semibold text-on-surface-variant mb-1">Tiêu đề ngày</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={day.title}
                                                            onChange={(e) => handleUpdateItineraryDay(index, "title", e.target.value)}
                                                            className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm outline-none"
                                                        />
                                                    ) : (
                                                        <p className="text-sm font-semibold">{day.title || "N/A"}</p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-[10px] uppercase font-semibold text-on-surface-variant mb-1">Bữa ăn</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={day.meals}
                                                            onChange={(e) => handleUpdateItineraryDay(index, "meals", e.target.value)}
                                                            placeholder="Ví dụ: Sáng, Trưa, Tối"
                                                            className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm outline-none"
                                                        />
                                                    ) : (
                                                        <p className="text-xs text-on-surface-variant font-medium">Bữa ăn: {day.meals || "Không có"}</p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-[10px] uppercase font-semibold text-on-surface-variant mb-1">Mô tả hoạt động</label>
                                                    {isEditing ? (
                                                        <textarea
                                                            value={day.description}
                                                            onChange={(e) => handleUpdateItineraryDay(index, "description", e.target.value)}
                                                            rows={2}
                                                            className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm outline-none resize-none"
                                                        />
                                                    ) : (
                                                        <p className="text-xs text-on-surface-variant/90 leading-relaxed">{day.description || "Không có mô tả chi tiết."}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sidebar / Thumbnail / Info */}
                    <div className="space-y-s-lg">
                        {/* Image Thumbnail Card */}
                        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-outline-variant/20">
                                <h3 className="font-bold text-sm text-on-surface">Ảnh đại diện</h3>
                            </div>
                            <div className="relative aspect-[4/3] bg-surface-container flex items-center justify-center">
                                {tour.thumbnailUrl ? (
                                    <img src={tour.thumbnailUrl} alt={title} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-[48px] text-outline-variant">image</span>
                                )}
                            </div>
                        </div>

                        {/* Operational Stats */}
                        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-lg space-y-4">
                            <h3 className="font-bold text-sm text-on-surface border-b border-outline-variant/20 pb-2">Trạng thái vận hành</h3>
                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-variant">Lịch trình đã lên:</span>
                                    <span className="font-bold text-on-surface">{tour.schedules?.length || 0} đợt</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-variant">Phân loại chuyến đi:</span>
                                    <span className={`px-2 py-0.5 rounded font-medium ${difficulty === "hard" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                        {difficulty === "hard" ? "Cấp độ Hard" : "Thông thường"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-variant">Trạng thái duyệt:</span>
                                    <span className="font-semibold">{tour.isPublished ? "Đã phát hành" : "Chưa phát hành"}</span>
                                </div>
                            </div>

                            {/* Status transitions buttons */}
                            <div className="border-t border-outline-variant/20 pt-3 mt-3 space-y-2">
                                <p className="text-xs font-bold text-on-surface mb-2">Thao tác trạng thái:</p>
                                {tour.status === "draft" && (
                                    <button
                                        onClick={() => handleStatusTransition("pending")}
                                        disabled={saving}
                                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                    >
                                        Gửi yêu cầu duyệt (Pending)
                                    </button>
                                )}
                                {tour.status === "pending" && (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleStatusTransition("draft")}
                                            disabled={saving}
                                            className="w-full py-2 bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                        >
                                            Thu hồi về Bản nháp (Draft)
                                        </button>
                                        <button
                                            onClick={() => handleStatusTransition("open")}
                                            disabled={saving}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                        >
                                            Phê duyệt & Mở đăng ký (Open)
                                        </button>
                                        <button
                                            onClick={() => handleStatusTransition("upcoming")}
                                            disabled={saving}
                                            className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                        >
                                            Phê duyệt & Để Chưa mở (Upcoming)
                                        </button>
                                    </div>
                                )}
                                {tour.status === "upcoming" && (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleStatusTransition("open")}
                                            disabled={saving}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                        >
                                            Mở đăng ký (Open)
                                        </button>
                                        <button
                                            onClick={() => handleStatusTransition("cancelled")}
                                            disabled={saving}
                                            className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                        >
                                            Hủy Tour (Cancelled)
                                        </button>
                                    </div>
                                )}
                                {tour.status === "open" && (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleStatusTransition("closed")}
                                            disabled={saving}
                                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                        >
                                            Đóng đăng ký (Closed)
                                        </button>
                                        <button
                                            onClick={() => handleStatusTransition("cancelled")}
                                            disabled={saving}
                                            className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                        >
                                            Hủy Tour (Cancelled)
                                        </button>
                                    </div>
                                )}
                                {tour.status === "closed" && (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleStatusTransition("open")}
                                            disabled={saving}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                        >
                                            Mở lại đăng ký (Open)
                                        </button>
                                        <button
                                            onClick={() => handleStatusTransition("cancelled")}
                                            disabled={saving}
                                            className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                        >
                                            Hủy Tour (Cancelled)
                                        </button>
                                    </div>
                                )}
                                {tour.status === "cancelled" && (
                                    <p className="text-center text-xs text-rose-500 font-semibold italic">Tour này đã bị hủy bỏ.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <OperatorFooter />
        </div>
    );
};

export default OperatorTourDetailPage;
