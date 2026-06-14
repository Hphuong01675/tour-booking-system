import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ManagerHeader from "../../components/manager/ManagerHeader";
import ManagerFooter from "../../components/manager/ManagerFooter";
import { getManagerProfile } from "../../api/managerApi";

// =============================================================
// TODO: Thay bằng API call khi có login
// Ví dụ: POST /api/managers/tours — tạo tour mới với operator ID
// Dữ liệu tương ứng với models: Tour, TourItineraryDay, TourInformation,
// TourImage, TourSchedule, TourInformationCategory (enums: TOUR_DIFFICULTY, TOUR_STATUS)
// =============================================================

const DESTINATIONS_SUGGESTIONS = [
    "Hà Giang", "Đèo Mã Pì Lèng", "Sapa", "Hạ Long", "Huế", "Đà Nẵng",
    "Hội An", "Đà Lạt", "Phú Quốc", "Hang Sơn Đoòng", "Fansipan",
];

const INCLUDED_DEFAULTS = [
    "Vé máy bay / xe khách khứ hồi",
    "Khách sạn theo tiêu chuẩn",
    "Bữa ăn theo chương trình",
    "Hướng dẫn viên chuyên nghiệp",
    "Bảo hiểm du lịch",
];

const NOT_INCLUDED_DEFAULTS = [
    "Chi phí cá nhân",
    "Đồ uống không theo chương trình",
    "Tip cho HDV và tài xế",
];

const defaultDay = (num) => ({
    id: num,
    title: "",
    description: "",
    imageUrl: "",
    meals: { breakfast: true, lunch: true, dinner: true },
    locations: [],
});

const ManagerNewTourPage = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // --- Form State ---
    const [title, setTitle] = useState("");
    const [difficulty, setDifficulty] = useState("normal");
    const [durationDays, setDurationDays] = useState("");
    const [durationNights, setDurationNights] = useState("");
    const [destinations, setDestinations] = useState([]);
    const [destInput, setDestInput] = useState("");
    const [departureLocation, setDepartureLocation] = useState("");
    const [description, setDescription] = useState("");
    const [highlights, setHighlights] = useState(["", ""]);
    const [itinerary, setItinerary] = useState([defaultDay(1)]);
    const [basePrice, setBasePrice] = useState("");
    const [maxCapacity, setMaxCapacity] = useState("");
    const [departureDate, setDepartureDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [included, setIncluded] = useState(INCLUDED_DEFAULTS);
    const [notIncluded, setNotIncluded] = useState(NOT_INCLUDED_DEFAULTS);
    const [requirements, setRequirements] = useState("");
    const [transportation, setTransportation] = useState("");
    const [accommodation, setAccommodation] = useState("");

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

    // Completion check
    const completionSteps = [
        { label: "Thông tin chung", done: title.length > 0 && durationDays > 0 },
        { label: "Điểm nhấn", done: highlights.some((h) => h.trim().length > 0) },
        { label: "Lịch trình (Cần ít nhất 1 ngày)", done: itinerary.some((d) => d.title.trim().length > 0) },
        { label: "Thư viện ảnh (Cần 3 ảnh)", done: false },
    ];
    const completionPct = Math.round((completionSteps.filter((s) => s.done).length / completionSteps.length) * 100);

    // Destinations
    const addDestination = (val) => {
        const v = val || destInput.trim();
        if (v && !destinations.includes(v)) setDestinations([...destinations, v]);
        setDestInput("");
    };
    const removeDestination = (d) => setDestinations(destinations.filter((x) => x !== d));

    // Highlights
    const updateHighlight = (i, val) => {
        const arr = [...highlights];
        arr[i] = val;
        setHighlights(arr);
    };
    const addHighlight = () => setHighlights([...highlights, ""]);
    const removeHighlight = (i) => setHighlights(highlights.filter((_, idx) => idx !== i));

    // Itinerary
    const addDay = () => setItinerary([...itinerary, defaultDay(itinerary.length + 1)]);
    const removeDay = (id) => setItinerary(itinerary.filter((d) => d.id !== id));
    const updateDay = (id, field, val) =>
        setItinerary(itinerary.map((d) => (d.id === id ? { ...d, [field]: val } : d)));
    const toggleMeal = (dayId, meal) =>
        setItinerary(itinerary.map((d) =>
            d.id === dayId ? { ...d, meals: { ...d.meals, [meal]: !d.meals[meal] } } : d
        ));

    // Included/Not-included
    const updateList = (list, setList, i, val) => {
        const arr = [...list];
        arr[i] = val;
        setList(arr);
    };

    const handleSaveDraft = () => {
        // TODO: POST /api/managers/tours với status: 'draft'
        alert("Đã lưu bản nháp! (TODO: Kết nối API)");
    };
    const handleSubmit = () => {
        // TODO: POST /api/managers/tours với status: 'pending'
        alert("Đã gửi duyệt! (TODO: Kết nối API)");
    };

    return (
        <div className="bg-background text-on-background min-h-screen flex flex-col">
            <ManagerHeader currentUser={user} />

            <main className="flex-grow pt-20 pb-xl px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto w-full">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-4 pt-4">
                    <button onClick={() => navigate("/managers/tours")} className="hover:text-primary transition">
                        Admin Dashboard
                    </button>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <button onClick={() => navigate("/managers/tours")} className="hover:text-primary transition">
                        Tất cả Tour
                    </button>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-primary font-semibold">Tạo Tour Mới</span>
                </nav>

                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-xl">
                    <h1 className="text-2xl font-bold text-on-surface">Thiết kế Hành trình Tour mới</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveDraft}
                            className="px-5 py-2 rounded-lg border border-outline-variant text-on-surface text-sm font-medium hover:bg-surface-container-low transition"
                        >
                            Lưu bản nháp
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-5 py-2 rounded-lg bg-secondary-container text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition shadow-sm"
                        >
                            Gửi duyệt
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-gutter items-start">
                    {/* ========== LEFT FORM COLUMN ========== */}
                    <div className="space-y-lg">

                        {/* 1. Thông tin chung */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-xl">
                            <div className="flex items-center gap-3 mb-lg">
                                <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">ℹ</span>
                                <h2 className="font-semibold text-on-surface text-lg">Thông tin chung</h2>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">
                                        Tên tour du lịch <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ví dụ: Khám phá Vẻ đẹp Tiềm ẩn của Hà Giang"
                                        className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1.5">
                                            Cấp độ Tour <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={difficulty}
                                            onChange={(e) => setDifficulty(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        >
                                            <option value="normal">Dễ (Phù hợp gia đình)</option>
                                            <option value="hard">Hard (Yêu cầu xác minh CCCD)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1.5">Số ngày</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={durationDays}
                                            onChange={(e) => setDurationDays(e.target.value)}
                                            placeholder="Số ngày"
                                            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1.5">Số đêm</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={durationNights}
                                            onChange={(e) => setDurationNights(e.target.value)}
                                            placeholder="Số đêm"
                                            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">
                                        Điểm xuất phát <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={departureLocation}
                                        onChange={(e) => setDepartureLocation(e.target.value)}
                                        placeholder="Ví dụ: Hà Nội, TP. Hồ Chí Minh..."
                                        className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">
                                        Điểm đến (Gần thẻ) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-outline-variant min-h-[46px] focus-within:ring-2 focus-within:ring-primary/30">
                                        {destinations.map((d) => (
                                            <span key={d} className="flex items-center gap-1 px-2.5 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-xs font-medium">
                                                {d}
                                                <button onClick={() => removeDestination(d)} className="hover:opacity-60">
                                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={destInput}
                                            onChange={(e) => setDestInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && addDestination()}
                                            placeholder="Thêm điểm đến..."
                                            className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {DESTINATIONS_SUGGESTIONS.filter((s) => !destinations.includes(s)).slice(0, 6).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => addDestination(s)}
                                                className="px-2 py-0.5 text-xs rounded-full border border-outline-variant text-on-surface-variant hover:bg-primary-fixed hover:text-primary transition"
                                            >
                                                + {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">Mô tả Tour</label>
                                    <div className="rounded-lg border border-outline-variant overflow-hidden">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low border-b border-outline-variant/30">
                                            <button className="p-1 rounded hover:bg-surface-container font-bold text-sm">B</button>
                                            <button className="p-1 rounded hover:bg-surface-container italic text-sm">I</button>
                                            <button className="p-1 rounded hover:bg-surface-container text-sm">
                                                <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                                            </button>
                                            <button className="p-1 rounded hover:bg-surface-container text-sm">
                                                <span className="material-symbols-outlined text-[16px]">link</span>
                                            </button>
                                        </div>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Nhập mô tả chi tiết về tour du lịch tại đây..."
                                            rows={5}
                                            className="w-full p-4 text-sm resize-none focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Điểm nhấn hành trình */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-xl">
                            <div className="flex items-center justify-between mb-lg">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                        <span className="material-symbols-outlined text-[16px]">star</span>
                                    </span>
                                    <h2 className="font-semibold text-on-surface text-lg">Điểm nhấn hành trình</h2>
                                </div>
                                <button
                                    onClick={addHighlight}
                                    className="flex items-center gap-1 text-primary text-sm font-medium hover:opacity-70 transition"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                    Thêm điểm nhấn
                                </button>
                            </div>
                            <div className="space-y-3">
                                {highlights.map((h, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-on-surface-variant/40 cursor-grab text-[20px]">drag_indicator</span>
                                        <input
                                            type="text"
                                            value={h}
                                            onChange={(e) => updateHighlight(i, e.target.value)}
                                            placeholder={`Điểm nhấn ${i + 1} (ví dụ: Chinh phục đỉnh Fansipan...)`}
                                            className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                        {highlights.length > 1 && (
                                            <button onClick={() => removeHighlight(i)} className="p-1.5 rounded hover:bg-rose-50 text-rose-400 transition">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 3. Lịch trình chi tiết */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-xl">
                            <div className="flex items-center justify-between mb-lg">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                    </span>
                                    <h2 className="font-semibold text-on-surface text-lg">Lịch trình chi tiết</h2>
                                </div>
                                <button
                                    onClick={addDay}
                                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Thêm ngày mới
                                </button>
                            </div>
                            <div className="space-y-4">
                                {itinerary.map((day, idx) => (
                                    <div key={day.id} className="border border-outline-variant/30 rounded-xl overflow-hidden">
                                        <div className="flex items-center justify-between px-5 py-3 bg-surface-container-low">
                                            <div className="flex items-center gap-3">
                                                <span className="w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                                                    {idx + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={day.title}
                                                    onChange={(e) => updateDay(day.id, "title", e.target.value)}
                                                    placeholder={`Tiêu đề ngày (ví dụ: Hà Nội - Hà Giang)`}
                                                    className="bg-transparent text-sm font-medium text-on-surface focus:outline-none w-64"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {itinerary.length > 1 && (
                                                    <button onClick={() => removeDay(day.id)} className="p-1 hover:text-rose-500 text-on-surface-variant transition">
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                )}
                                                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">expand_less</span>
                                            </div>
                                        </div>
                                        <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_160px] gap-4">
                                            <div>
                                                <label className="block text-xs text-on-surface-variant mb-1.5">Mô tả hoạt động</label>
                                                <textarea
                                                    value={day.description}
                                                    onChange={(e) => updateDay(day.id, "description", e.target.value)}
                                                    placeholder="Mô tả chi tiết lịch trình của ngày đầu tiên..."
                                                    rows={4}
                                                    className="w-full p-3 rounded-lg border border-outline-variant text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                                <div className="mt-3">
                                                    <label className="block text-xs text-on-surface-variant mb-2">Bữa ăn trong ngày</label>
                                                    <div className="flex gap-4">
                                                        {[["breakfast", "Sáng"], ["lunch", "Trưa"], ["dinner", "Tối"]].map(([key, label]) => (
                                                            <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={day.meals[key]}
                                                                    onChange={() => toggleMeal(day.id, key)}
                                                                    className="w-3.5 h-3.5 accent-primary"
                                                                />
                                                                <span className="text-sm text-on-surface">{label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-on-surface-variant mb-1.5">Ảnh đại diện ngày</label>
                                                <div className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-low flex flex-col items-center justify-center cursor-pointer hover:border-primary transition group">
                                                    {day.imageUrl ? (
                                                        <img src={day.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined text-[32px] text-outline-variant group-hover:text-primary transition">add_photo_alternate</span>
                                                            <span className="text-xs text-on-surface-variant mt-1">Thay đổi ảnh</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 4. Chính sách & Giá */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-xl">
                            <div className="flex items-center gap-3 mb-lg">
                                <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                    <span className="material-symbols-outlined text-[16px]">payments</span>
                                </span>
                                <h2 className="font-semibold text-on-surface text-lg">Chính sách &amp; Giá</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">
                                        Giá cơ bản (VNĐ/người) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={basePrice}
                                        onChange={(e) => setBasePrice(e.target.value)}
                                        placeholder="Ví dụ: 3500000"
                                        className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">
                                        Số chỗ tối đa <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={maxCapacity}
                                        onChange={(e) => setMaxCapacity(e.target.value)}
                                        placeholder="Ví dụ: 30"
                                        className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">Ngày khởi hành dự kiến</label>
                                    <input
                                        type="date"
                                        value={departureDate}
                                        onChange={(e) => setDepartureDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">Ngày kết thúc dự kiến</label>
                                    <input
                                        type="date"
                                        value={returnDate}
                                        onChange={(e) => setReturnDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-2">Bao gồm</label>
                                    <div className="space-y-2">
                                        {included.map((item, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <span className="text-green-500 text-[18px] material-symbols-outlined">check_circle</span>
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => updateList(included, setIncluded, i, e.target.value)}
                                                    className="flex-1 px-3 py-1.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setIncluded([...included, ""])}
                                            className="text-xs text-primary hover:underline"
                                        >+ Thêm</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-2">Không bao gồm</label>
                                    <div className="space-y-2">
                                        {notIncluded.map((item, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <span className="text-rose-400 text-[18px] material-symbols-outlined">cancel</span>
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => updateList(notIncluded, setNotIncluded, i, e.target.value)}
                                                    className="flex-1 px-3 py-1.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setNotIncluded([...notIncluded, ""])}
                                            className="text-xs text-primary hover:underline"
                                        >+ Thêm</button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5">
                                <label className="block text-sm font-medium text-on-surface mb-1.5">Yêu cầu đặc biệt / Lưu ý</label>
                                <textarea
                                    value={requirements}
                                    onChange={(e) => setRequirements(e.target.value)}
                                    placeholder="Các yêu cầu về sức khỏe, giấy tờ, trang thiết bị..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </section>

                        {/* 5. Thông tin bổ sung */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-xl">
                            <div className="flex items-center gap-3 mb-lg">
                                <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                    <span className="material-symbols-outlined text-[16px]">info</span>
                                </span>
                                <h2 className="font-semibold text-on-surface text-lg">Thông tin bổ sung</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">Phương tiện di chuyển</label>
                                    <textarea
                                        value={transportation}
                                        onChange={(e) => setTransportation(e.target.value)}
                                        placeholder="Xe limousine, máy bay, tàu hỏa..."
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">Lưu trú</label>
                                    <textarea
                                        value={accommodation}
                                        onChange={(e) => setAccommodation(e.target.value)}
                                        placeholder="Khách sạn 3-4 sao, homestay địa phương..."
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* ========== RIGHT PREVIEW COLUMN ========== */}
                    <div className="sticky top-24">
                        <div className="bg-primary rounded-xl p-xl text-white shadow-lg">
                            <p className="text-xs font-medium uppercase tracking-widest opacity-70 mb-1">Xem trước tóm tắt</p>
                            <p className="text-xs opacity-60 mb-lg">Thông tin tour đang được khởi tạo</p>

                            <div className="space-y-3 mb-lg text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px] opacity-70">Trạng thái</span>
                                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs">Đang chỉnh sửa</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-80">
                                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                                    <span>{destinations.length > 0 ? destinations.join(", ") : "Chưa chọn điểm đến"}</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-80">
                                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                                    <span>
                                        {durationDays || "--"} Ngày – {durationNights || "--"} Đêm
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 opacity-80">
                                    <span className="material-symbols-outlined text-[16px]">group</span>
                                    <span>
                                        Giá:{" "}
                                        {basePrice
                                            ? Number(basePrice).toLocaleString("vi-VN") + " VNĐ"
                                            : "3,500,000 VNĐ (mẫu)"}
                                    </span>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium">Độ hoàn thiện: {completionPct}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/20 rounded-full mb-3">
                                    <div
                                        className="h-2 bg-white rounded-full transition-all duration-500"
                                        style={{ width: `${completionPct}%` }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    {completionSteps.map((step) => (
                                        <div key={step.label} className="flex items-center gap-2 text-xs">
                                            <span className={`material-symbols-outlined text-[14px] ${step.done ? "text-green-300" : "opacity-40"}`}>
                                                {step.done ? "check_circle" : "radio_button_unchecked"}
                                            </span>
                                            <span className={step.done ? "opacity-100" : "opacity-50"}>{step.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            <button
                                onClick={handleSaveDraft}
                                className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition"
                            >
                                Lưu &amp; Tiếp tục sau
                            </button>
                            <button
                                onClick={() => navigate("/managers/tours")}
                                className="w-full py-3 rounded-xl border border-rose-300 text-rose-500 font-medium text-sm hover:bg-rose-50 transition"
                            >
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <ManagerFooter />
        </div>
    );
};

export default ManagerNewTourPage;
