// Path: frontend/src/pages/operator/OperatorNewTourPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OperatorHeader from "../../components/operator/OperatorHeader";
import OperatorFooter from "../../components/operator/OperatorFooter";
import { 
    getOperatorProfile, 
    createOperatorTour, 
    uploadTourImages, 
    getInfoCategories 
} from "../../api/operatorApi";

const OperatorNewTourPage = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // --- Dynamic Categories ---
    const [infoCategories, setInfoCategories] = useState([]);
    const [activeInfo, setActiveInfo] = useState({}); // { [categoryCode]: content }

    // --- Form States ---
    const [title, setTitle] = useState("");
    const [difficulty, setDifficulty] = useState("normal");
    const [durationDays, setDurationDays] = useState("");
    const [durationNights, setDurationNights] = useState("");
    const [departureLocation, setDepartureLocation] = useState("");
    const [destination, setDestination] = useState("");
    const [description, setDescription] = useState("");
    const [highlights, setHighlights] = useState([""]);
    const [basePrice, setBasePrice] = useState("");
    
    // Schedules
    const [schedules, setSchedules] = useState([
        { departureDate: "", returnDate: "", price: "", maxCapacity: "" }
    ]);

    // Itinerary
    const [itinerary, setItinerary] = useState([
        {
            dayNumber: 1,
            title: "",
            mainActivity: "",
            description: "",
            meals: { breakfast: false, lunch: false, dinner: false },
            imageFile: null,
            imagePreview: "",
            locations: [],
            items: []
        }
    ]);

    // Gallery & Thumbnail Images
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState("");
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);

    useEffect(() => {
        const fetchInitData = async () => {
            try {
                const profileData = await getOperatorProfile();
                setUser(profileData);

                const cats = await getInfoCategories();
                setInfoCategories(cats || []);
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        fetchInitData();
    }, []);

    // --- Validation & Steps ---
    const completionSteps = [
        { label: "Thông tin chung", done: title.trim().length > 0 && durationDays > 0 && departureLocation.trim().length > 0 && destination.trim().length > 0 },
        { label: "Ảnh đại diện tour (Thumbnail)", done: !!thumbnailFile },
        { label: "Lịch trình (Ít nhất 1 ngày)", done: itinerary.length > 0 && itinerary.some(d => d.title.trim().length > 0) },
        { label: "Lịch khởi hành (Ít nhất 1 lịch)", done: schedules.length > 0 && schedules.some(s => s.departureDate && s.returnDate) }
    ];
    const completionPct = Math.round((completionSteps.filter(s => s.done).length / completionSteps.length) * 100);

    // Highlights handlers
    const addHighlight = () => setHighlights([...highlights, ""]);
    const updateHighlight = (i, val) => {
        const arr = [...highlights];
        arr[i] = val;
        setHighlights(arr);
    };
    const removeHighlight = (i) => setHighlights(highlights.filter((_, idx) => idx !== i));

    // Schedules handlers
    const addSchedule = () => setSchedules([...schedules, { departureDate: "", returnDate: "", price: basePrice, maxCapacity: "" }]);
    const updateSchedule = (i, field, val) => {
        const arr = [...schedules];
        arr[i] = { ...arr[i], [field]: val };
        setSchedules(arr);
    };
    const removeSchedule = (i) => setSchedules(schedules.filter((_, idx) => idx !== i));

    // Itinerary Handlers
    const addDay = () => setItinerary([
        ...itinerary,
        {
            dayNumber: itinerary.length + 1,
            title: "",
            mainActivity: "",
            description: "",
            meals: { breakfast: false, lunch: false, dinner: false },
            imageFile: null,
            imagePreview: "",
            locations: [],
            items: []
        }
    ]);
    const removeDay = (idx) => {
        const filtered = itinerary.filter((_, i) => i !== idx);
        setItinerary(filtered.map((day, i) => ({ ...day, dayNumber: i + 1 })));
    };
    const updateDay = (idx, field, val) => {
        const arr = [...itinerary];
        arr[idx] = { ...arr[idx], [field]: val };
        setItinerary(arr);
    };
    const toggleMeal = (idx, meal) => {
        const arr = [...itinerary];
        arr[idx].meals[meal] = !arr[idx].meals[meal];
        setItinerary(arr);
    };
    const handleDayImageChange = (idx, file) => {
        if (!file) return;
        const arr = [...itinerary];
        arr[idx].imageFile = file;
        arr[idx].imagePreview = URL.createObjectURL(file);
        setItinerary(arr);
    };

    // Locations inside Itinerary
    const addLocation = (dayIdx) => {
        const arr = [...itinerary];
        arr[dayIdx].locations.push({
            name: "",
            description: "",
            latitude: "",
            longitude: "",
            imageFile: null,
            imagePreview: "",
            visitOrder: arr[dayIdx].locations.length + 1
        });
        setItinerary(arr);
    };
    const updateLocation = (dayIdx, locIdx, field, val) => {
        const arr = [...itinerary];
        arr[dayIdx].locations[locIdx] = { ...arr[dayIdx].locations[locIdx], [field]: val };
        setItinerary(arr);
    };
    const handleLocationImageChange = (dayIdx, locIdx, file) => {
        if (!file) return;
        const arr = [...itinerary];
        arr[dayIdx].locations[locIdx].imageFile = file;
        arr[dayIdx].locations[locIdx].imagePreview = URL.createObjectURL(file);
        setItinerary(arr);
    };
    const removeLocation = (dayIdx, locIdx) => {
        const arr = [...itinerary];
        const filtered = arr[dayIdx].locations.filter((_, i) => i !== locIdx);
        arr[dayIdx].locations = filtered.map((loc, i) => ({ ...loc, visitOrder: i + 1 }));
        setItinerary(arr);
    };

    // Activities (Itinerary Items) inside Itinerary
    const addActivityItem = (dayIdx) => {
        const arr = [...itinerary];
        arr[dayIdx].items.push({
            title: "",
            description: "",
            activityTime: "",
            sortOrder: arr[dayIdx].items.length
        });
        setItinerary(arr);
    };
    const updateActivityItem = (dayIdx, itemIdx, field, val) => {
        const arr = [...itinerary];
        arr[dayIdx].items[itemIdx] = { ...arr[dayIdx].items[itemIdx], [field]: val };
        setItinerary(arr);
    };
    const removeActivityItem = (dayIdx, itemIdx) => {
        const arr = [...itinerary];
        const filtered = arr[dayIdx].items.filter((_, i) => i !== itemIdx);
        arr[dayIdx].items = filtered.map((item, i) => ({ ...item, sortOrder: i }));
        setItinerary(arr);
    };

    // Additional info toggler
    const toggleInfoCategory = (code) => {
        const updated = { ...activeInfo };
        if (code in updated) {
            delete updated[code];
        } else {
            updated[code] = "";
        }
        setActiveInfo(updated);
    };
    const handleInfoContentChange = (code, val) => {
        setActiveInfo({ ...activeInfo, [code]: val });
    };

    // Images handlers
    const handleThumbnailChange = (file) => {
        if (!file) return;
        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
    };

    const handleGalleryChange = (files) => {
        if (!files) return;
        const fileArr = Array.from(files);
        setGalleryFiles([...galleryFiles, ...fileArr]);
        
        const previewArr = fileArr.map(f => URL.createObjectURL(f));
        setGalleryPreviews([...galleryPreviews, ...previewArr]);
    };

    const removeGalleryImage = (idx) => {
        setGalleryFiles(galleryFiles.filter((_, i) => i !== idx));
        setGalleryPreviews(galleryPreviews.filter((_, i) => i !== idx));
    };

    // Form Submission
    const handleSubmit = async (submitStatus) => {
        setErrorMsg("");

        const focusAndScroll = (id) => {
            const el = document.getElementById(id);
            if (el) {
                el.focus();
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        };

        // Basic front validation
        if (!title.trim()) {
            setErrorMsg("Vui lòng điền tên tour du lịch.");
            focusAndScroll("tour-title");
            return;
        }
        const parsedDays = parseInt(durationDays);
        if (isNaN(parsedDays) || parsedDays < 1) {
            setErrorMsg("Số ngày du lịch không hợp lệ.");
            focusAndScroll("tour-duration-days");
            return;
        }
        if (!departureLocation.trim()) {
            setErrorMsg("Vui lòng nhập điểm xuất phát.");
            focusAndScroll("tour-departure-location");
            return;
        }
        if (!destination.trim()) {
            setErrorMsg("Vui lòng nhập điểm đến.");
            focusAndScroll("tour-destination");
            return;
        }
        const parsedPrice = parseFloat(basePrice);
        if (submitStatus === "pending") {
            if (basePrice === "" || isNaN(parsedPrice) || parsedPrice < 0) {
                setErrorMsg("Giá cơ bản không hợp lệ (phải là số không âm khi gửi duyệt).");
                focusAndScroll("tour-base-price");
                return;
            }
            if (!thumbnailFile) {
                setErrorMsg("Vui lòng tải lên ảnh đại diện của tour (thumbnail) khi gửi duyệt.");
                focusAndScroll("tour-thumbnail");
                return;
            }
        } else {
            // For draft, allow empty or 0, but if entered, must be non-negative
            if (basePrice !== "" && (isNaN(parsedPrice) || parsedPrice < 0)) {
                setErrorMsg("Giá cơ bản không hợp lệ (phải là số không âm).");
                focusAndScroll("tour-base-price");
                return;
            }
        }

        const days = parseInt(durationDays);
        const nights = parseInt(durationNights);
        if (Math.abs(days - nights) > 1) {
            setErrorMsg("Số ngày và số đêm không hợp lệ (chỉ được lệch nhau tối đa 1 đơn vị).");
            focusAndScroll("tour-duration-nights");
            return;
        }

        for (let i = 0; i < schedules.length; i++) {
            const sch = schedules[i];
            if (sch.departureDate && sch.returnDate) {
                const dep = new Date(sch.departureDate);
                const ret = new Date(sch.returnDate);
                if (dep > ret) {
                    setErrorMsg(`Ngày kết thúc không được trước ngày khởi hành ở lịch khởi hành thứ ${i + 1}.`);
                    focusAndScroll(`schedule-ret-${i}`);
                    return;
                }
                const diffTime = Math.abs(ret - dep);
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays !== days - 1) {
                    setErrorMsg(`Ngày đi và ngày về ở lịch khởi hành thứ ${i + 1} không khớp với tổng số ngày của tour (${days} ngày).`);
                    focusAndScroll(`schedule-ret-${i}`);
                    return;
                }
            }
        }

        setLoading(true);
        try {
            // 1. Prepare JSON Data for step 1
            const formattedHighlights = highlights.filter(h => h.trim().length > 0).join("\n");
            
            const formattedItinerary = itinerary.map(day => ({
                dayNumber: day.dayNumber,
                title: day.title,
                mainActivity: day.mainActivity,
                description: day.description,
                meals: day.meals,
                // Nested locations
                locations: day.locations.map(loc => ({
                    name: loc.name,
                    description: loc.description,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    visitOrder: loc.visitOrder
                })),
                // Nested items
                items: day.items.map(item => ({
                    title: item.title,
                    description: item.description,
                    activityTime: item.activityTime,
                    sortOrder: item.sortOrder
                }))
            }));

            const formattedSchedules = schedules
                .filter(s => s.departureDate && s.returnDate)
                .map(s => ({
                    departureDate: s.departureDate,
                    returnDate: s.returnDate,
                    price: parseFloat(s.price) || parseFloat(basePrice),
                    maxCapacity: parseInt(s.maxCapacity) || 20
                }));

            const formattedInfo = Object.keys(activeInfo)
                .filter(code => activeInfo[code].trim().length > 0)
                .map(code => ({
                    categoryCode: code,
                    content: activeInfo[code]
                }));

            const payload = {
                title,
                difficulty,
                durationDays: parseInt(durationDays),
                durationNights: parseInt(durationNights) || 0,
                departureLocation,
                destination,
                description,
                highlights: formattedHighlights,
                basePrice: parseFloat(basePrice) || 0,
                status: submitStatus,
                itineraryDays: formattedItinerary,
                schedules: formattedSchedules,
                information: formattedInfo
            };

            // Step 1: Create tour text data
            const res = await createOperatorTour(payload);
            const tourId = res.tour.id;
            const slug = res.tour.slug;

            // Step 2: Prepare image files for upload only if there are files selected
            const hasThumbnail = !!thumbnailFile;
            const hasGallery = galleryFiles.length > 0;
            const hasItineraryImages = itinerary.some(day => 
                !!day.imageFile || day.locations.some(loc => !!loc.imageFile)
            );

            if (hasThumbnail || hasGallery || hasItineraryImages) {
                const imgFormData = new FormData();
                if (thumbnailFile) {
                    imgFormData.append("thumbnail", thumbnailFile);
                }

                galleryFiles.forEach(file => {
                    imgFormData.append("images", file);
                });

                itinerary.forEach(day => {
                    if (day.imageFile) {
                        imgFormData.append(`dayImage_${day.dayNumber}`, day.imageFile);
                    }
                    day.locations.forEach(loc => {
                        if (loc.imageFile) {
                            imgFormData.append(`locationImage_${day.dayNumber}_${loc.visitOrder}`, loc.imageFile);
                        }
                    });
                });

                // Upload pictures to Cloudinary
                await uploadTourImages(tourId, imgFormData);
            }

            alert(submitStatus === "pending" ? "Đã gửi phê duyệt tour thành công!" : "Đã lưu bản nháp tour thành công!");
            navigate(`/operator/tours/${slug}`);
        } catch (err) {
            console.error("Error creating tour:", err);
            setErrorMsg(err.response?.data?.error || err.message || "Đã xảy ra lỗi khi tạo tour.");
            // Scroll to top of screen so the user sees the error message container / floating toast
            window.scrollTo({ top: 0, behavior: "smooth" });
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="bg-background text-on-background min-h-screen flex flex-col">
            {/* Full-Screen Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full text-center border border-outline-variant/30">
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                            <span className="material-symbols-outlined absolute inset-0 m-auto text-primary text-3xl animate-pulse">cloud_upload</span>
                        </div>
                        <h3 className="text-lg font-bold text-on-surface">Đang xử lý dữ liệu...</h3>
                        <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                            Hệ thống đang lưu thông tin hành trình và tải các tệp hình ảnh của bạn lên đám mây Cloudinary. Vui lòng không đóng trình duyệt hoặc tải lại trang.
                        </p>
                    </div>
                </div>
            )}

            <OperatorHeader currentUser={user} />

            <main className="flex-grow pt-20 pb-s-xl px-s-margin-mobile md:px-s-margin-desktop max-w-[1440px] mx-auto w-full">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-4 pt-4">
                    <button onClick={() => navigate("/operator/tours")} className="hover:text-primary transition">
                        Operator Dashboard
                    </button>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <button onClick={() => navigate("/operator/tours")} className="hover:text-primary transition">
                        Tất cả Tour
                    </button>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-primary font-semibold">Tạo Tour Mới</span>
                </nav>
                {/* Floating Error Toast */}
                {errorMsg && (
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="p-4 bg-white border-l-4 border-rose-500 rounded-r-lg text-rose-700 text-sm flex items-start gap-3 shadow-lg border border-outline-variant/30">
                            <span className="material-symbols-outlined text-rose-500 flex-shrink-0">error</span>
                            <div className="flex-grow">
                                <p className="font-semibold text-rose-800">Phát hiện lỗi</p>
                                <p className="mt-1 text-xs text-on-surface-variant">{errorMsg}</p>
                            </div>
                            <button 
                                onClick={() => setErrorMsg("")} 
                                type="button"
                                className="text-on-surface-variant hover:text-rose-600 transition flex-shrink-0"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-s-xl">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface">Thiết kế Hành trình Tour mới</h1>
                        <p className="text-sm text-on-surface-variant mt-1">Cung cấp đầy đủ thông tin hành trình để thu hút hành khách và lưu trữ chi tiết.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleSubmit("draft")}
                            disabled={loading}
                            className="px-5 py-2 rounded-lg border border-outline-variant text-on-surface text-sm font-medium hover:bg-surface-container-low transition disabled:opacity-50"
                        >
                            Lưu bản nháp
                        </button>
                        <button
                            onClick={() => handleSubmit("pending")}
                            disabled={loading}
                            className="px-5 py-2 rounded-lg bg-secondary-container text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                            Gửi duyệt
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-gutter items-start">
                    {/* ========== LEFT FORM COLUMN ========== */}
                    <div className="space-y-lg">

                        {/* 1. Thông tin chung */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-xl">
                            <div className="flex items-center gap-3 mb-s-lg">
                                <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">ℹ</span>
                                <h2 className="font-semibold text-on-surface text-lg">Thông tin chung</h2>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">
                                        Tên tour du lịch <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="tour-title"
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
                                            id="tour-difficulty"
                                            value={difficulty}
                                            onChange={(e) => setDifficulty(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        >
                                            <option value="normal">Dễ (Phù hợp gia đình)</option>
                                            <option value="hard">Hard (Yêu cầu xác minh CCCD)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1.5">Số ngày <span className="text-rose-500">*</span></label>
                                        <input
                                            id="tour-duration-days"
                                            type="number"
                                            min="1"
                                            value={durationDays}
                                            onChange={(e) => setDurationDays(e.target.value)}
                                            placeholder="Số ngày"
                                            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1.5">Số đêm <span className="text-rose-500">*</span></label>
                                        <input
                                            id="tour-duration-nights"
                                            type="number"
                                            min="0"
                                            value={durationNights}
                                            onChange={(e) => setDurationNights(e.target.value)}
                                            placeholder="Số đêm"
                                            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1.5">
                                            Điểm xuất phát <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            id="tour-departure-location"
                                            type="text"
                                            value={departureLocation}
                                            onChange={(e) => setDepartureLocation(e.target.value)}
                                            placeholder="Ví dụ: Hà Nội, TP. Hồ Chí Minh..."
                                            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1.5">
                                            Điểm đến <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            id="tour-destination"
                                            type="text"
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            placeholder="Ví dụ: Hà Giang, Vịnh Hạ Long..."
                                            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1.5">
                                            Giá cơ bản (VNĐ)
                                        </label>
                                        <input
                                            id="tour-base-price"
                                            type="number"
                                            min="0"
                                            value={basePrice}
                                            onChange={(e) => setBasePrice(e.target.value)}
                                            placeholder="Ví dụ: 2100000"
                                            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">Mô tả Tour</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Nhập mô tả chi tiết về tour du lịch tại đây..."
                                        rows={4}
                                        className="w-full p-4 text-sm rounded-lg border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 2. Điểm nhấn hành trình */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-xl">
                            <div className="flex items-center justify-between mb-s-lg">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                        <span className="material-symbols-outlined text-[16px]">star</span>
                                    </span>
                                    <h2 className="font-semibold text-on-surface text-lg">Điểm nhấn hành trình</h2>
                                </div>
                                <button
                                    onClick={addHighlight}
                                    type="button"
                                    className="flex items-center gap-1 text-primary text-sm font-medium hover:opacity-75 transition"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                    Thêm điểm nhấn
                                </button>
                            </div>
                            <div className="space-y-3">
                                {highlights.map((h, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={h}
                                            onChange={(e) => updateHighlight(i, e.target.value)}
                                            placeholder={`Điểm nhấn ${i + 1} (ví dụ: Đón hoàng hôn trên Đèo Mã Pì Lèng...)`}
                                            className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                        {highlights.length > 1 && (
                                            <button 
                                                onClick={() => removeHighlight(i)} 
                                                type="button"
                                                className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 3. Lịch khởi hành */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-xl">
                            <div className="flex items-center justify-between mb-s-lg">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                        <span className="material-symbols-outlined text-[16px]">event</span>
                                    </span>
                                    <h2 className="font-semibold text-on-surface text-lg">Lịch khởi hành tour</h2>
                                </div>
                                <button
                                    onClick={addSchedule}
                                    type="button"
                                    className="flex items-center gap-1 text-primary text-sm font-medium hover:opacity-75 transition"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                    Thêm lịch trình
                                </button>
                            </div>
                            <div className="space-y-4">
                                {schedules.map((sch, i) => (
                                    <div key={i} className="p-4 border border-outline-variant/30 rounded-xl bg-surface-container-lowest grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                        <div>
                                            <label className="block text-xs font-medium text-on-surface-variant mb-1">Ngày đi <span className="text-rose-500">*</span></label>
                                            <input
                                                id={`schedule-dep-${i}`}
                                                type="date"
                                                value={sch.departureDate}
                                                onChange={(e) => updateSchedule(i, "departureDate", e.target.value)}
                                                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-on-surface-variant mb-1">Ngày về <span className="text-rose-500">*</span></label>
                                            <input
                                                id={`schedule-ret-${i}`}
                                                type="date"
                                                value={sch.returnDate}
                                                onChange={(e) => updateSchedule(i, "returnDate", e.target.value)}
                                                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-on-surface-variant mb-1">Giá (VNĐ)</label>
                                            <input
                                                type="number"
                                                placeholder={basePrice || "Giá riêng"}
                                                value={sch.price}
                                                onChange={(e) => updateSchedule(i, "price", e.target.value)}
                                                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-on-surface-variant mb-1">Chỗ tối đa <span className="text-rose-500">*</span></label>
                                            <input
                                                type="number"
                                                placeholder="Ví dụ: 20"
                                                value={sch.maxCapacity}
                                                onChange={(e) => updateSchedule(i, "maxCapacity", e.target.value)}
                                                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            {schedules.length > 1 && (
                                                <button
                                                    onClick={() => removeSchedule(i)}
                                                    type="button"
                                                    className="px-3 py-2 border border-rose-200 text-rose-500 rounded-lg hover:bg-rose-50 text-xs font-medium transition w-full md:w-auto"
                                                >
                                                    Xóa
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 4. Lịch trình chi tiết (days, locations, items) */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-xl">
                            <div className="flex items-center justify-between mb-s-lg">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                    </span>
                                    <h2 className="font-semibold text-on-surface text-lg">Lịch trình chi tiết theo ngày</h2>
                                </div>
                                <button
                                    onClick={addDay}
                                    type="button"
                                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Thêm ngày mới
                                </button>
                            </div>
                            <div className="space-y-6">
                                {itinerary.map((day, idx) => (
                                    <div key={idx} className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm bg-white">
                                        {/* Day header */}
                                        <div className="flex items-center justify-between px-5 py-3 bg-surface-container-low border-b border-outline-variant/20">
                                            <div className="flex items-center gap-3 flex-1">
                                                <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                                                    {day.dayNumber}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={day.title}
                                                    onChange={(e) => updateDay(idx, "title", e.target.value)}
                                                    placeholder="Tên chặng / Tiêu đề ngày (ví dụ: Hà Nội - Hà Giang)"
                                                    className="bg-transparent text-sm font-semibold text-on-surface focus:outline-none border-b border-dashed border-outline-variant/40 focus:border-primary w-full max-w-md"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {itinerary.length > 1 && (
                                                    <button 
                                                        onClick={() => removeDay(idx)} 
                                                        type="button"
                                                        className="p-1 text-rose-500 hover:bg-rose-50 rounded transition"
                                                        title="Xóa ngày"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-5 space-y-4">
                                            {/* Details & Illustration image */}
                                            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-on-surface-variant mb-1">Hoạt động chính trong ngày</label>
                                                        <input 
                                                            type="text"
                                                            placeholder="Ví dụ: Di chuyển, Check-in khách sạn, Ăn tối phố cổ..."
                                                            value={day.mainActivity}
                                                            onChange={(e) => updateDay(idx, "mainActivity", e.target.value)}
                                                            className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs focus:outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-on-surface-variant mb-1">Mô tả lịch trình ngày</label>
                                                        <textarea
                                                            placeholder="Mô tả chi tiết các trải nghiệm, chặng đường di chuyển trong ngày..."
                                                            value={day.description}
                                                            onChange={(e) => updateDay(idx, "description", e.target.value)}
                                                            rows={3}
                                                            className="w-full p-3 border border-outline-variant rounded-lg text-xs focus:outline-none resize-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-on-surface-variant mb-1">Bữa ăn trong ngày</label>
                                                        <div className="flex gap-4">
                                                            {[["breakfast", "Sáng"], ["lunch", "Trưa"], ["dinner", "Tối"]].map(([key, label]) => (
                                                                <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={day.meals[key]}
                                                                        onChange={() => toggleMeal(idx, key)}
                                                                        className="w-3.5 h-3.5 accent-primary"
                                                                    />
                                                                    <span className="text-xs text-on-surface font-medium">{label}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Day Illustration Image */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Ảnh minh họa ngày</label>
                                                    <div className="relative w-full aspect-[4/3] rounded-lg border border-dashed border-outline-variant bg-surface-container-low flex flex-col items-center justify-center cursor-pointer hover:border-primary transition group overflow-hidden">
                                                        {day.imagePreview ? (
                                                            <img src={day.imagePreview} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="text-center p-2">
                                                                <span className="material-symbols-outlined text-[24px] text-outline-variant group-hover:text-primary">add_photo_alternate</span>
                                                                <span className="block text-[10px] text-on-surface-variant mt-1">Chọn ảnh</span>
                                                            </div>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleDayImageChange(idx, e.target.files[0])}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sub-section: Locations (Bảng tour_itinerary_locations) */}
                                            <div className="border-t border-outline-variant/20 pt-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                        Các địa điểm ghé thăm ({day.locations.length})
                                                    </h4>
                                                    <button
                                                        onClick={() => addLocation(idx)}
                                                        type="button"
                                                        className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5"
                                                    >
                                                        + Thêm địa điểm
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    {day.locations.map((loc, locIdx) => (
                                                        <div key={locIdx} className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg grid grid-cols-1 md:grid-cols-[1fr_120px_120px_60px_auto] gap-2 items-center">
                                                            <input
                                                                type="text"
                                                                placeholder="Tên địa điểm (Cột cờ Lũng Cú...)"
                                                                value={loc.name}
                                                                onChange={(e) => updateLocation(idx, locIdx, "name", e.target.value)}
                                                                className="px-2.5 py-1.5 border border-outline-variant rounded text-xs focus:outline-none"
                                                            />
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                placeholder="Vĩ độ (Lat)"
                                                                value={loc.latitude}
                                                                onChange={(e) => updateLocation(idx, locIdx, "latitude", e.target.value)}
                                                                className="px-2.5 py-1.5 border border-outline-variant rounded text-xs focus:outline-none"
                                                            />
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                placeholder="Kinh độ (Lng)"
                                                                value={loc.longitude}
                                                                onChange={(e) => updateLocation(idx, locIdx, "longitude", e.target.value)}
                                                                className="px-2.5 py-1.5 border border-outline-variant rounded text-xs focus:outline-none"
                                                            />
                                                            
                                                            {/* Location image upload */}
                                                            <div className="relative h-8 w-12 rounded border border-dashed border-outline-variant bg-surface-container-low flex items-center justify-center overflow-hidden hover:border-primary">
                                                                {loc.imagePreview ? (
                                                                    <img src={loc.imagePreview} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="material-symbols-outlined text-[14px] text-outline-variant">add</span>
                                                                )}
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => handleLocationImageChange(idx, locIdx, e.target.files[0])}
                                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                                />
                                                            </div>

                                                            <button
                                                                onClick={() => removeLocation(idx, locIdx)}
                                                                type="button"
                                                                className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Sub-section: Activity Items (Bảng tour_itinerary_items) */}
                                            <div className="border-t border-outline-variant/20 pt-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                        Chi tiết hoạt động trong ngày ({day.items.length})
                                                    </h4>
                                                    <button
                                                        onClick={() => addActivityItem(idx)}
                                                        type="button"
                                                        className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5"
                                                    >
                                                        + Thêm hoạt động
                                                    </button>
                                                </div>

                                                <div className="space-y-2">
                                                    {day.items.map((item, itemIdx) => (
                                                        <div key={itemIdx} className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg grid grid-cols-1 md:grid-cols-[100px_1fr_2fr_auto] gap-2 items-center">
                                                            <input
                                                                type="time"
                                                                value={item.activityTime}
                                                                onChange={(e) => updateActivityItem(idx, itemIdx, "activityTime", e.target.value)}
                                                                className="px-2.5 py-1.5 border border-outline-variant rounded text-xs focus:outline-none"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Tên hoạt động (Ăn tối...)"
                                                                value={item.title}
                                                                onChange={(e) => updateActivityItem(idx, itemIdx, "title", e.target.value)}
                                                                className="px-2.5 py-1.5 border border-outline-variant rounded text-xs focus:outline-none"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Mô tả chi tiết"
                                                                value={item.description}
                                                                onChange={(e) => updateActivityItem(idx, itemIdx, "description", e.target.value)}
                                                                className="px-2.5 py-1.5 border border-outline-variant rounded text-xs focus:outline-none"
                                                            />
                                                            <button
                                                                onClick={() => removeActivityItem(idx, itemIdx)}
                                                                type="button"
                                                                className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 5. Thư viện ảnh */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-xl">
                            <div className="flex items-center gap-3 mb-s-lg">
                                <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                    <span className="material-symbols-outlined text-[16px]">collections</span>
                                </span>
                                <h2 className="font-semibold text-on-surface text-lg">Thư viện ảnh Tour</h2>
                            </div>

                            <div className="space-y-4">
                                {/* Thumbnail */}
                                <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4 items-center border-b border-outline-variant/20 pb-4">
                                    <div className="relative w-full aspect-[4/3] rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-low flex flex-col items-center justify-center cursor-pointer hover:border-primary overflow-hidden">
                                        {thumbnailPreview ? (
                                            <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-2">
                                                <span className="material-symbols-outlined text-[28px] text-outline-variant">add_photo_alternate</span>
                                                <span className="block text-[10px] text-on-surface-variant mt-1">Ảnh đại diện *</span>
                                            </div>
                                        )}
                                        <input
                                            id="tour-thumbnail"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleThumbnailChange(e.target.files[0])}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-on-surface">Ảnh đại diện chính của Tour</h3>
                                        <p className="text-xs text-on-surface-variant mt-1">Tỷ lệ khuyến nghị: 4:3 hoặc 16:9. Ảnh này hiển thị đầu tiên trên danh sách tour của khách hàng.</p>
                                    </div>
                                </div>

                                {/* Gallery */}
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-2">Thư viện ảnh chi tiết (Nhiều ảnh)</label>
                                    <div className="flex flex-wrap gap-3">
                                        {galleryPreviews.map((url, i) => (
                                            <div key={i} className="relative w-24 h-20 rounded-lg border overflow-hidden shadow-sm group">
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeGalleryImage(i)}
                                                    type="button"
                                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                        <div className="relative w-24 h-20 rounded-lg border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-low flex flex-col items-center justify-center cursor-pointer transition">
                                            <span className="material-symbols-outlined text-[20px] text-outline-variant">add_to_photos</span>
                                            <span className="text-[10px] text-on-surface-variant mt-0.5">Thêm ảnh</span>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={(e) => handleGalleryChange(e.target.files)}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 6. Thông tin bổ sung (tour_information_categories & tour_information) */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-xl">
                            <div className="flex items-center gap-3 mb-s-lg">
                                <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                    <span className="material-symbols-outlined text-[16px]">list</span>
                                </span>
                                <h2 className="font-semibold text-on-surface text-lg">Thông tin bổ sung</h2>
                            </div>

                            <p className="text-xs text-on-surface-variant mb-4">
                                Chọn danh mục để đính kèm thông tin cho tour du lịch. Tour của bạn có gì thì tích chọn và điền vào đó.
                            </p>

                            {/* Category selectors */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {infoCategories.map((cat) => {
                                    const isActive = cat.code in activeInfo;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => toggleInfoCategory(cat.code)}
                                            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all flex items-center gap-1 hover:scale-105 active:scale-95 ${
                                                isActive 
                                                    ? "bg-primary text-white border-primary shadow-sm" 
                                                    : "bg-surface-container-low border-outline-variant text-on-surface-variant"
                                            }`}
                                        >
                                            {cat.icon && <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>}
                                            {cat.title}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Content inputs for active categories */}
                            <div className="space-y-4">
                                {Object.keys(activeInfo).map((code) => {
                                    const cat = infoCategories.find(c => c.code === code);
                                    if (!cat) return null;
                                    return (
                                        <div key={code} className="p-4 border border-outline-variant/20 rounded-xl bg-surface-container-lowest">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-primary flex items-center gap-1">
                                                    {cat.icon && <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>}
                                                    {cat.title}
                                                </label>
                                                <button
                                                    onClick={() => toggleInfoCategory(code)}
                                                    type="button"
                                                    className="text-[10px] text-rose-500 font-semibold hover:underline"
                                                >
                                                    Loại bỏ
                                                </button>
                                            </div>
                                            <textarea
                                                value={activeInfo[code]}
                                                onChange={(e) => handleInfoContentChange(code, e.target.value)}
                                                placeholder={`Nhập thông tin chi tiết về ${cat.title.toLowerCase()}...`}
                                                rows={3}
                                                className="w-full p-3 border border-outline-variant rounded-lg text-xs focus:outline-none resize-none focus:ring-2 focus:ring-primary/20 bg-white"
                                            />
                                        </div>
                                    );
                                })}
                                {Object.keys(activeInfo).length === 0 && (
                                    <div className="text-center py-6 text-xs text-on-surface-variant/40 italic">
                                        Chưa có danh mục thông tin bổ sung nào được chọn.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* ========== RIGHT PREVIEW COLUMN ========== */}
                    <div className="sticky top-24 space-y-4">
                        <div className="bg-primary rounded-xl p-s-xl text-white shadow-lg">
                            <p className="text-xs font-medium uppercase tracking-widest opacity-70 mb-1">Xem trước tóm tắt</p>
                            <p className="text-xs opacity-60 mb-s-lg">Thông tin tour đang khởi tạo</p>

                            <div className="space-y-3 mb-s-lg text-sm border-b border-white/20 pb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px] opacity-70">shield_person</span>
                                    <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-semibold tracking-wider">Đang chỉnh sửa</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-80">
                                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                                    <span className="truncate">{destination || "Chưa chọn điểm đến"}</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-80">
                                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                                    <span>
                                        {durationDays || "--"} Ngày – {durationNights || "--"} Đêm
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 opacity-80">
                                    <span className="material-symbols-outlined text-[16px]">payments</span>
                                    <span>
                                        Giá: {basePrice ? Number(basePrice).toLocaleString("vi-VN") + "đ" : "TBC"}
                                    </span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium">Độ hoàn thiện: {completionPct}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/20 rounded-full mb-3 overflow-hidden">
                                    <div
                                        className="h-full bg-white rounded-full transition-all duration-500"
                                        style={{ width: `${completionPct}%` }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    {completionSteps.map((step, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[10px]">
                                            <span className={`material-symbols-outlined text-[14px] ${step.done ? "text-green-300" : "opacity-45"}`}>
                                                {step.done ? "check_circle" : "radio_button_unchecked"}
                                            </span>
                                            <span className={step.done ? "opacity-100 font-medium" : "opacity-60"}>{step.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleSubmit("draft")}
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-white border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-low transition shadow-sm disabled:opacity-50"
                            >
                                Lưu bản nháp
                            </button>
                            <button
                                onClick={() => navigate("/operator/tours")}
                                className="w-full py-3 rounded-xl border border-rose-200 text-rose-500 font-semibold text-sm hover:bg-rose-50 transition"
                            >
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <OperatorFooter />
        </div>
    );
};

export default OperatorNewTourPage;
