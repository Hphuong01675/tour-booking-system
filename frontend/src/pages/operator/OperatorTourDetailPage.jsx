// Path: frontend/src/pages/operator/OperatorTourDetailPage.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import OperatorHeader from "../../components/operator/OperatorHeader";
import OperatorFooter from "../../components/operator/OperatorFooter";
import {
    getOperatorProfile,
    getOperatorTourBySlug,
    updateOperatorTour,
    uploadTourImages,
    deleteTourImage,
    getInfoCategories,
} from "../../api/operatorApi";

const STATUS_CONFIG = {
    open: { label: "Đang đăng ký", classes: "bg-blue-100 text-blue-700" },
    pending: { label: "Chờ duyệt", classes: "bg-amber-100 text-amber-700" },
    upcoming: { label: "Chưa mở", classes: "bg-gray-100 text-gray-600" },
    closed: { label: "Đã đóng", classes: "bg-rose-100 text-rose-600" },
    draft: { label: "Bản nháp", classes: "bg-gray-100 text-gray-500" },
    cancelled: { label: "Đã hủy", classes: "bg-red-100 text-red-600" },
};

// Helper: parse meals string "Sáng, Trưa, Tối" → { breakfast: bool, lunch: bool, dinner: bool }
const parseMealsString = (mealsStr) => {
    const str = (mealsStr || "").toLowerCase();
    return {
        breakfast: str.includes("sáng") || str.includes("breakfast"),
        lunch: str.includes("trưa") || str.includes("lunch"),
        dinner: str.includes("tối") || str.includes("dinner"),
    };
};

const OperatorTourDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const galleryRef = useRef(null);

    const handleScrollGallery = (direction) => {
        if (galleryRef.current) {
            galleryRef.current.scrollBy({
                left: direction === "left" ? -320 : 320,
                behavior: "smooth",
            });
        }
    };

    // ---- Core state ----
    const [user, setUser] = useState(null);
    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // ---- Categories for "Thông tin bổ sung" ----
    const [infoCategories, setInfoCategories] = useState([]);

    // ---- Form: basic info ----
    const [title, setTitle] = useState("");
    const [tourCode, setTourCode] = useState("");
    const [difficulty, setDifficulty] = useState("normal");
    const [basePrice, setBasePrice] = useState("");
    const [durationDays, setDurationDays] = useState(1);
    const [durationNights, setDurationNights] = useState(0);
    const [departureLocation, setDepartureLocation] = useState("");
    const [destination, setDestination] = useState("");
    const [description, setDescription] = useState("");

    // ---- Form: highlights (array of strings) ----
    const [highlights, setHighlights] = useState([""]);

    // ---- Form: schedules ----
    const [schedules, setSchedules] = useState([]);

    // ---- Form: itinerary days (rich, matching New Tour) ----
    const [itinerary, setItinerary] = useState([]);

    // ---- Form: additional info ----
    const [activeInfo, setActiveInfo] = useState({}); // { [categoryCode]: content }

    // ---- Thumbnail ----
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState("");

    // ---- Gallery ----
    const [pendingGalleryFiles, setPendingGalleryFiles] = useState([]);
    const [pendingGalleryPreviews, setPendingGalleryPreviews] = useState([]);

    // ---- Load profile & categories ----
    useEffect(() => {
        const init = async () => {
            try {
                const profileData = await getOperatorProfile();
                setUser(profileData);
                const cats = await getInfoCategories();
                setInfoCategories(cats || []);
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        init();
    }, []);

    // ---- Fetch tour detail ----
    const fetchTourDetail = async () => {
        setLoading(true);
        try {
            const data = await getOperatorTourBySlug(slug);
            setTour(data);
            populateForm(data);
        } catch (err) {
            console.error("Failed to load tour details", err);
            alert("Lỗi khi tải chi tiết tour.");
        } finally {
            setLoading(false);
        }
    };

    const populateForm = (data) => {
        setTitle(data.title || "");
        setTourCode(data.tourCode || "");
        setDifficulty(data.difficulty || "normal");
        setBasePrice(data.basePrice || "");
        setDurationDays(data.durationDays || 1);
        setDurationNights(data.durationNights || 0);
        setDepartureLocation(data.departureLocation || "");
        setDestination(data.destination || "");
        setDescription(data.description || "");

        // Highlights: split stored string into array
        const rawHighlights = data.highlights || "";
        const hlArr = rawHighlights
            .split(/\n|,/)
            .map((h) => h.trim())
            .filter(Boolean);
        setHighlights(hlArr.length > 0 ? hlArr : [""]);

        // Thumbnail preview from server
        setThumbnailPreview(data.thumbnailUrl || "");
        setThumbnailFile(null);

        // Schedules
        const schArr = (data.schedules || []).map((s) => ({
            id: s.id,
            departureDate: s.departureDate ? s.departureDate.substring(0, 10) : "",
            returnDate: s.returnDate ? s.returnDate.substring(0, 10) : "",
            price: s.price || "",
            maxCapacity: s.maxCapacity || "",
            registered: s.registered || 0,
            status: s.status || "open",
        }));
        setSchedules(schArr.length > 0 ? schArr : []);

        // Itinerary days — convert from server format to rich UI format
        const itArr = (data.itineraryDays || []).map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title || "",
            mainActivity: day.mainActivity || "",
            description: day.description || "",
            meals: parseMealsString(day.meals),
            imageUrl: day.imageUrl || "",
            imageFile: null,
            imagePreview: day.imageUrl || "",
            locations: (day.locations || []).map((loc) => ({
                id: loc.id,
                name: loc.name || "",
                description: loc.description || "",
                latitude: loc.latitude || "",
                longitude: loc.longitude || "",
                imageUrl: loc.imageUrl || "",
                imageFile: null,
                imagePreview: loc.imageUrl || "",
                visitOrder: loc.visitOrder,
            })),
            items: (day.items || []).map((item) => ({
                id: item.id,
                title: item.title || "",
                description: item.description || "",
                activityTime: item.activityTime || "",
                sortOrder: item.sortOrder || 0,
            })),
        }));
        setItinerary(itArr);

        // Additional information
        const infoMap = {};
        (data.information || []).forEach((info) => {
            if (info.category?.code) {
                infoMap[info.category.code] = info.content || "";
            }
        });
        setActiveInfo(infoMap);

        // Reset pending gallery
        setPendingGalleryFiles([]);
        setPendingGalleryPreviews([]);
    };

    useEffect(() => {
        fetchTourDetail();
    }, [slug]);

    // ==== Highlights handlers ====
    const addHighlight = () => setHighlights([...highlights, ""]);
    const updateHighlight = (i, val) => {
        const arr = [...highlights];
        arr[i] = val;
        setHighlights(arr);
    };
    const removeHighlight = (i) => setHighlights(highlights.filter((_, idx) => idx !== i));

    // ==== Schedules handlers ====
    const addSchedule = () =>
        setSchedules([...schedules, { departureDate: "", returnDate: "", price: basePrice, maxCapacity: "", registered: 0, status: "open" }]);
    const updateSchedule = (i, field, val) => {
        const arr = [...schedules];
        arr[i] = { ...arr[i], [field]: val };
        setSchedules(arr);
    };
    const removeSchedule = (i) => setSchedules(schedules.filter((_, idx) => idx !== i));

    // ==== Itinerary handlers ====
    const addDay = () =>
        setItinerary([
            ...itinerary,
            {
                dayNumber: itinerary.length + 1,
                title: "",
                mainActivity: "",
                description: "",
                meals: { breakfast: false, lunch: false, dinner: false },
                imageUrl: "",
                imageFile: null,
                imagePreview: "",
                locations: [],
                items: [],
            },
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
        setItinerary([...arr]);
    };
    const handleDayImageChange = (idx, file) => {
        if (!file) return;
        const arr = [...itinerary];
        arr[idx].imageFile = file;
        arr[idx].imagePreview = URL.createObjectURL(file);
        setItinerary(arr);
    };

    // Locations
    const addLocation = (dayIdx) => {
        const arr = [...itinerary];
        arr[dayIdx].locations.push({
            name: "", description: "", latitude: "", longitude: "",
            imageUrl: "", imageFile: null, imagePreview: "",
            visitOrder: arr[dayIdx].locations.length + 1,
        });
        setItinerary([...arr]);
    };
    const updateLocation = (dayIdx, locIdx, field, val) => {
        const arr = [...itinerary];
        arr[dayIdx].locations[locIdx] = { ...arr[dayIdx].locations[locIdx], [field]: val };
        setItinerary([...arr]);
    };
    const handleLocationImageChange = (dayIdx, locIdx, file) => {
        if (!file) return;
        const arr = [...itinerary];
        arr[dayIdx].locations[locIdx].imageFile = file;
        arr[dayIdx].locations[locIdx].imagePreview = URL.createObjectURL(file);
        setItinerary([...arr]);
    };
    const removeLocation = (dayIdx, locIdx) => {
        const arr = [...itinerary];
        const filtered = arr[dayIdx].locations.filter((_, i) => i !== locIdx);
        arr[dayIdx].locations = filtered.map((loc, i) => ({ ...loc, visitOrder: i + 1 }));
        setItinerary([...arr]);
    };

    // Activity items
    const addActivityItem = (dayIdx) => {
        const arr = [...itinerary];
        arr[dayIdx].items.push({ title: "", description: "", activityTime: "", sortOrder: arr[dayIdx].items.length });
        setItinerary([...arr]);
    };
    const updateActivityItem = (dayIdx, itemIdx, field, val) => {
        const arr = [...itinerary];
        arr[dayIdx].items[itemIdx] = { ...arr[dayIdx].items[itemIdx], [field]: val };
        setItinerary([...arr]);
    };
    const removeActivityItem = (dayIdx, itemIdx) => {
        const arr = [...itinerary];
        const filtered = arr[dayIdx].items.filter((_, i) => i !== itemIdx);
        arr[dayIdx].items = filtered.map((item, i) => ({ ...item, sortOrder: i }));
        setItinerary([...arr]);
    };

    // ==== Additional info handlers ====
    const toggleInfoCategory = (code) => {
        const updated = { ...activeInfo };
        if (code in updated) {
            delete updated[code];
        } else {
            updated[code] = "";
        }
        setActiveInfo(updated);
    };
    const handleInfoContentChange = (code, val) => setActiveInfo({ ...activeInfo, [code]: val });

    // ==== Thumbnail handler ====
    const handleThumbnailChange = (file) => {
        if (!file) return;
        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
    };

    // ==== Pending gallery (new images before save) ====
    const handlePendingGalleryChange = (files) => {
        if (!files) return;
        const fileArr = Array.from(files);
        setPendingGalleryFiles([...pendingGalleryFiles, ...fileArr]);
        setPendingGalleryPreviews([...pendingGalleryPreviews, ...fileArr.map((f) => URL.createObjectURL(f))]);
    };
    const removePendingGallery = (i) => {
        setPendingGalleryFiles(pendingGalleryFiles.filter((_, idx) => idx !== i));
        setPendingGalleryPreviews(pendingGalleryPreviews.filter((_, idx) => idx !== i));
    };

    // ==== Delete existing gallery image ====
    const handleDeleteGalleryImage = async (imageId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này? Ảnh sẽ bị xóa khỏi Cloudinary.")) return;
        try {
            await deleteTourImage(tour.id, imageId);
            fetchTourDetail();
        } catch (err) {
            console.error("Failed to delete image", err);
            alert(err.response?.data?.error || err.message || "Lỗi khi xóa ảnh.");
        }
    };

    // ==== Status transition ====
    const handleStatusTransition = async (newStatus) => {
        if (!tour) return;
        setSaving(true);
        try {
            await updateOperatorTour(tour.id, { status: newStatus });
            alert("Chuyển trạng thái tour thành công!");
            fetchTourDetail();
        } catch (err) {
            console.error("Failed to transition tour status", err);
            alert(err.response?.data?.error || err.message || "Lỗi khi chuyển trạng thái.");
        } finally {
            setSaving(false);
        }
    };

    // ==== Save changes ====
    const handleSaveChanges = async () => {
        if (!tour) return;
        setErrorMsg("");

        // Required field validation
        if (!title.trim()) {
            setErrorMsg("Tiêu đề tour không được để trống.");
            return;
        }
        const parsedDays = parseInt(durationDays);
        if (isNaN(parsedDays) || parsedDays < 1) {
            setErrorMsg("Số ngày du lịch không hợp lệ (phải lớn hơn 0).");
            return;
        }
        if (!departureLocation.trim()) {
            setErrorMsg("Điểm khởi hành không được để trống.");
            return;
        }
        if (!destination.trim()) {
            setErrorMsg("Điểm đến không được để trống.");
            return;
        }

        // Days/nights consistency
        const days = parseInt(durationDays);
        const nights = parseInt(durationNights) || 0;
        if (Math.abs(days - nights) > 1) {
            setErrorMsg("Số ngày và số đêm không hợp lệ (chỉ được lệch nhau tối đa 1 đơn vị).");
            return;
        }


        // Schedule dates validation
        for (let i = 0; i < schedules.length; i++) {
            const sch = schedules[i];
            if (sch.departureDate && sch.returnDate) {
                const dep = new Date(sch.departureDate);
                const ret = new Date(sch.returnDate);
                if (dep > ret) {
                    setErrorMsg(`Ngày kết thúc không được trước ngày khởi hành ở lịch thứ ${i + 1}.`);
                    return;
                }
                const diffDays = Math.round(Math.abs(ret - dep) / (1000 * 60 * 60 * 24));
                if (diffDays !== nights) {
                    setErrorMsg(`Ngày đi và ngày về ở lịch khởi hành thứ ${i + 1} không khớp với cấu hình số đêm (${nights} đêm) của tour.`);
                    return;
                }
            }
        }

        setSaving(true);
        try {
            // Format highlights
            const formattedHighlights = highlights.filter((h) => h.trim().length > 0).join("\n");

            // Format itinerary
            const formattedItinerary = itinerary.map((day) => ({
                dayNumber: day.dayNumber,
                title: day.title,
                mainActivity: day.mainActivity,
                description: day.description,
                meals: day.meals,
                imageUrl: day.imageUrl, // existing URL; new files uploaded separately
                locations: day.locations.map((loc) => ({
                    name: loc.name,
                    description: loc.description,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    imageUrl: loc.imageUrl,
                    visitOrder: loc.visitOrder,
                })),
                items: day.items.map((item) => ({
                    title: item.title,
                    description: item.description,
                    activityTime: item.activityTime,
                    sortOrder: item.sortOrder,
                })),
            }));

            // Format schedules
            const formattedSchedules = schedules.map((sch) => ({
                departureDate: sch.departureDate,
                returnDate: sch.returnDate,
                price: parseFloat(sch.price) || parseFloat(basePrice) || 0,
                maxCapacity: parseInt(sch.maxCapacity) || 20,
                registered: parseInt(sch.registered) || 0,
                status: sch.status || "open",
            }));

            // Format information
            const formattedInfo = Object.keys(activeInfo)
                .filter((code) => activeInfo[code].trim().length > 0)
                .map((code) => ({ categoryCode: code, content: activeInfo[code] }));

            await updateOperatorTour(tour.id, {
                title,
                tourCode,
                difficulty,
                basePrice: parseFloat(basePrice) || 0,
                durationDays: parseInt(durationDays) || 1,
                durationNights: parseInt(durationNights) || 0,
                departureLocation,
                destination,
                description,
                highlights: formattedHighlights,
                itineraryDays: formattedItinerary,
                schedules: formattedSchedules,
                information: formattedInfo,
            });

            // Upload images if any new ones selected
            const hasThumbnail = !!thumbnailFile;
            const hasGallery = pendingGalleryFiles.length > 0;
            const hasDayImages = itinerary.some(
                (day) => !!day.imageFile || day.locations.some((loc) => !!loc.imageFile)
            );

            if (hasThumbnail || hasGallery || hasDayImages) {
                setUploadingImages(true);
                setSaving(false); // switch to upload overlay
                const imgFormData = new FormData();
                if (thumbnailFile) imgFormData.append("thumbnail", thumbnailFile);
                pendingGalleryFiles.forEach((f) => imgFormData.append("images", f));
                itinerary.forEach((day) => {
                    if (day.imageFile) imgFormData.append(`dayImage_${day.dayNumber}`, day.imageFile);
                    day.locations.forEach((loc) => {
                        if (loc.imageFile) imgFormData.append(`locationImage_${day.dayNumber}_${loc.visitOrder}`, loc.imageFile);
                    });
                });
                await uploadTourImages(tour.id, imgFormData);
                setUploadingImages(false);
            }

            alert("Đã lưu thay đổi thành công!");
            setIsEditing(false);
            setErrorMsg("");
            fetchTourDetail();
        } catch (err) {
            console.error("Failed to update tour", err);
            setErrorMsg(err.response?.data?.error || err.message || "Lỗi khi lưu thay đổi.");
            setUploadingImages(false);
        } finally {
            setSaving(false);
        }
    };

    // ==== Loading / Not found screens ====
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
            {/* Full-Screen Saving Overlay */}
            {saving && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                    <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full text-center border border-outline-variant/30">
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                            <span className="material-symbols-outlined absolute inset-0 m-auto text-primary text-3xl animate-pulse">save</span>
                        </div>
                        <h3 className="text-lg font-bold text-on-surface">Đang lưu thay đổi...</h3>
                        <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                            Hệ thống đang cập nhật dữ liệu tour. Vui lòng không đóng trang.
                        </p>
                    </div>
                </div>
            )}

            {/* Full-Screen Upload Overlay */}
            {uploadingImages && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                    <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full text-center border border-outline-variant/30">
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                            <span className="material-symbols-outlined absolute inset-0 m-auto text-primary text-3xl animate-pulse">cloud_upload</span>
                        </div>
                        <h3 className="text-lg font-bold text-on-surface">Đang tải ảnh lên...</h3>
                        <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                            Hệ thống đang tải hình ảnh lên đám mây Cloudinary. Vui lòng không đóng trình duyệt.
                        </p>
                    </div>
                </div>
            )}

            <OperatorHeader currentUser={user} />

            <main className="flex-grow pt-24 pb-s-xl px-s-margin-mobile md:px-s-margin-desktop max-w-[1440px] mx-auto w-full">
                {/* Floating Error Toast */}
                {errorMsg && (
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="p-4 bg-white border-l-4 border-rose-500 rounded-r-lg text-rose-700 text-sm flex items-start gap-3 shadow-lg border border-outline-variant/30">
                            <span className="material-symbols-outlined text-rose-500 flex-shrink-0">error</span>
                            <div className="flex-grow">
                                <p className="font-semibold text-rose-800">Phát hiện lỗi</p>
                                <p className="mt-1 text-xs text-on-surface-variant">{errorMsg}</p>
                            </div>
                            <button onClick={() => setErrorMsg("")} type="button" className="text-on-surface-variant hover:text-rose-600 transition flex-shrink-0">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    </div>
                )}

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
                                {isEditing ? "Chỉnh sửa Tour" : title}
                            </h1>
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[tour.status]?.classes}`}>
                                {STATUS_CONFIG[tour.status]?.label}
                            </span>
                        </div>
                        <p className="text-sm text-on-surface-variant mt-1">
                            Mã tour: <span className="font-semibold">{tourCode || "N/A"}</span>
                        </p>
                    </div>
                    {isDraft && (
                        <div className="flex gap-2 flex-shrink-0">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => { setIsEditing(false); setErrorMsg(""); populateForm(tour); }}
                                        className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleSaveChanges}
                                        disabled={saving || uploadingImages}
                                        className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {(saving || uploadingImages) && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                        Lưu thay đổi
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
                    {/* ===== LEFT COLUMN ===== */}
                    <div className="space-y-6 min-w-0">

                        {/* 1. Thông tin chung */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-xl">
                            <div className="flex items-center gap-3 mb-s-lg">
                                <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">ℹ</span>
                                <h2 className="font-semibold text-on-surface text-lg">Thông tin chung</h2>
                            </div>
                            <div className="space-y-5">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">
                                        Tên tour du lịch <span className="text-rose-500">*</span>
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Ví dụ: Khám phá Vẻ đẹp Tiềm ẩn của Hà Giang"
                                            className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${!title.trim() ? "border-rose-400 bg-rose-50" : "border-outline-variant"}`}
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">{title}</p>
                                    )}
                                </div>
                                {/* Tour Code */}
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">Mã Tour</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={tourCode}
                                            onChange={(e) => setTourCode(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    ) : (
                                        <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">{tourCode || "N/A"}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Difficulty */}
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1.5">Cấp độ Tour <span className="text-rose-500">*</span></label>
                                        {isEditing ? (
                                            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                                                <option value="normal">Dễ (Phù hợp gia đình)</option>
                                                <option value="hard">Hard (Yêu cầu xác minh CCCD)</option>
                                            </select>
                                        ) : (
                                            <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">
                                                {difficulty === "hard" ? "Cấp độ Hard (Yêu cầu CCCD)" : "Thông thường"}
                                            </p>
                                        )}
                                    </div>
                                    {/* Duration Days */}
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1.5">Số ngày <span className="text-rose-500">*</span></label>
                                        {isEditing ? (
                                            <input type="number" min="1" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                        ) : (
                                            <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">{durationDays} Ngày</p>
                                        )}
                                    </div>
                                    {/* Duration Nights */}
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1.5">
                                            Số đêm {isEditing && <span className="text-xs font-normal text-on-surface-variant">(lệch tối đa 1)</span>}
                                        </label>
                                        {isEditing ? (
                                            <input type="number" min="0" value={durationNights} onChange={(e) => setDurationNights(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                        ) : (
                                            <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">{durationNights} Đêm</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Departure */}
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1.5">Điểm xuất phát <span className="text-rose-500">*</span></label>
                                        {isEditing ? (
                                            <input type="text" value={departureLocation} onChange={(e) => setDepartureLocation(e.target.value)} placeholder="Ví dụ: Hà Nội" className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${!departureLocation.trim() ? "border-rose-400 bg-rose-50" : "border-outline-variant"}`} />
                                        ) : (
                                            <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">{departureLocation || "N/A"}</p>
                                        )}
                                    </div>
                                    {/* Destination */}
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1.5">Điểm đến <span className="text-rose-500">*</span></label>
                                        {isEditing ? (
                                            <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Ví dụ: Hà Giang" className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${!destination.trim() ? "border-rose-400 bg-rose-50" : "border-outline-variant"}`} />
                                        ) : (
                                            <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">{destination || "N/A"}</p>
                                        )}
                                    </div>
                                    {/* Base Price */}
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1.5">Giá cơ bản (VNĐ)</label>
                                        {isEditing ? (
                                            <input type="number" min="0" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="Ví dụ: 2100000" className="w-full px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                        ) : (
                                            <p className="text-sm font-semibold text-on-surface bg-surface-container-low px-3 py-2 rounded-lg">
                                                {basePrice ? parseFloat(basePrice).toLocaleString("vi-VN") + "đ" : "N/A"}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-1.5">Mô tả Tour</label>
                                    {isEditing ? (
                                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nhập mô tả chi tiết..." rows={4} className="w-full p-4 text-sm rounded-lg border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                                    ) : (
                                        <p className="text-sm text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-lg whitespace-pre-wrap leading-relaxed">{description || "Chưa có mô tả."}</p>
                                    )}
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
                                {isEditing && (
                                    <button onClick={addHighlight} type="button" className="flex items-center gap-1 text-primary text-sm font-medium hover:opacity-75 transition">
                                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                        Thêm điểm nhấn
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {highlights.map((h, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        {isEditing ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={h}
                                                    onChange={(e) => updateHighlight(i, e.target.value)}
                                                    placeholder={`Điểm nhấn ${i + 1}`}
                                                    className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                                {highlights.length > 1 && (
                                                    <button onClick={() => removeHighlight(i)} type="button" className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition">
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex items-start gap-2">
                                                <span className="material-symbols-outlined text-primary text-[16px] mt-0.5">check_circle</span>
                                                <p className="text-sm text-on-surface">{h}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {!isEditing && highlights.filter(Boolean).length === 0 && (
                                    <p className="text-xs italic text-on-surface-variant">Chưa thiết lập điểm nhấn.</p>
                                )}
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
                                {isEditing && isDraft && (
                                    <button onClick={addSchedule} type="button" className="flex items-center gap-1 text-primary text-sm font-medium hover:opacity-75 transition">
                                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                        Thêm lịch trình
                                    </button>
                                )}
                            </div>
                            <div className="space-y-4">
                                {schedules.length === 0 ? (
                                    <p className="text-xs italic text-on-surface-variant">Chưa có lịch khởi hành nào.</p>
                                ) : (
                                    schedules.map((sch, i) => (
                                        <div key={i} className="p-4 border border-outline-variant/30 rounded-xl bg-surface-container-lowest grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                            <div>
                                                <label className="block text-xs font-medium text-on-surface-variant mb-1">Ngày đi <span className="text-rose-500">*</span></label>
                                                {isEditing && isDraft ? (
                                                    <input id={`schedule-dep-${i}`} type="date" value={sch.departureDate} onChange={(e) => updateSchedule(i, "departureDate", e.target.value)} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs focus:outline-none" />
                                                ) : (
                                                    <p className="text-xs font-semibold text-on-surface">{sch.departureDate || "N/A"}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-on-surface-variant mb-1">Ngày về <span className="text-rose-500">*</span></label>
                                                {isEditing && isDraft ? (
                                                    <input id={`schedule-ret-${i}`} type="date" value={sch.returnDate} onChange={(e) => updateSchedule(i, "returnDate", e.target.value)} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs focus:outline-none" />
                                                ) : (
                                                    <p className="text-xs font-semibold text-on-surface">{sch.returnDate || "N/A"}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-on-surface-variant mb-1">Giá (VNĐ)</label>
                                                {isEditing && isDraft ? (
                                                    <input type="number" placeholder={basePrice || "Giá riêng"} value={sch.price} onChange={(e) => updateSchedule(i, "price", e.target.value)} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs focus:outline-none" />
                                                ) : (
                                                    <p className="text-xs font-semibold text-on-surface">{sch.price ? Number(sch.price).toLocaleString("vi-VN") + "đ" : "N/A"}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-on-surface-variant mb-1">Chỗ tối đa <span className="text-rose-500">*</span></label>
                                                {isEditing && isDraft ? (
                                                    <input type="number" placeholder="Ví dụ: 20" value={sch.maxCapacity} onChange={(e) => updateSchedule(i, "maxCapacity", e.target.value)} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs focus:outline-none" />
                                                ) : (
                                                    <p className="text-xs font-semibold text-on-surface">{sch.maxCapacity} chỗ ({sch.registered || 0} đã đăng ký)</p>
                                                )}
                                            </div>
                                            <div className="flex justify-end">
                                                {isEditing && isDraft && schedules.length > 1 && (
                                                    <button onClick={() => removeSchedule(i)} type="button" className="px-3 py-2 border border-rose-200 text-rose-500 rounded-lg hover:bg-rose-50 text-xs font-medium transition w-full md:w-auto">
                                                        Xóa
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* 4. Lịch trình chi tiết theo ngày */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-xl">
                            <div className="flex items-center justify-between mb-s-lg">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                    </span>
                                    <h2 className="font-semibold text-on-surface text-lg">Lịch trình chi tiết theo ngày</h2>
                                </div>
                                {isEditing && (
                                    <button onClick={addDay} type="button" className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition shadow-sm">
                                        <span className="material-symbols-outlined text-[16px]">add</span>
                                        Thêm ngày mới
                                    </button>
                                )}
                            </div>

                            {itinerary.length === 0 ? (
                                <p className="text-xs italic text-on-surface-variant">Chưa thiết lập lịch trình chi tiết theo ngày.</p>
                            ) : (
                                <div className="space-y-6">
                                    {itinerary.map((day, idx) => (
                                        <div key={idx} className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm bg-white">
                                            {/* Day header */}
                                            <div className="flex items-center justify-between px-5 py-3 bg-surface-container-low border-b border-outline-variant/20">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{day.dayNumber}</span>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={day.title}
                                                            onChange={(e) => updateDay(idx, "title", e.target.value)}
                                                            placeholder="Tên chặng / Tiêu đề ngày"
                                                            className="bg-transparent text-sm font-semibold text-on-surface focus:outline-none border-b border-dashed border-outline-variant/40 focus:border-primary w-full max-w-md"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-semibold text-on-surface">{day.title || `Ngày ${day.dayNumber}`}</span>
                                                    )}
                                                </div>
                                                {isEditing && itinerary.length > 1 && (
                                                    <button onClick={() => removeDay(idx)} type="button" className="p-1 text-rose-500 hover:bg-rose-50 rounded transition" title="Xóa ngày">
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                )}
                                            </div>

                                            <div className="p-5 space-y-4">
                                                {/* Details & Illustration */}
                                                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Hoạt động chính trong ngày</label>
                                                            {isEditing ? (
                                                                <input type="text" placeholder="Ví dụ: Di chuyển, Check-in khách sạn..." value={day.mainActivity} onChange={(e) => updateDay(idx, "mainActivity", e.target.value)} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-xs focus:outline-none" />
                                                            ) : (
                                                                <p className="text-xs text-on-surface">{day.mainActivity || "Không có"}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Mô tả lịch trình ngày</label>
                                                            {isEditing ? (
                                                                <textarea placeholder="Mô tả chi tiết các trải nghiệm trong ngày..." value={day.description} onChange={(e) => updateDay(idx, "description", e.target.value)} rows={3} className="w-full p-3 border border-outline-variant rounded-lg text-xs focus:outline-none resize-none" />
                                                            ) : (
                                                                <p className="text-xs text-on-surface-variant leading-relaxed">{day.description || "Không có mô tả."}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Bữa ăn trong ngày</label>
                                                            {isEditing ? (
                                                                <div className="flex gap-4">
                                                                    {[["breakfast", "Sáng"], ["lunch", "Trưa"], ["dinner", "Tối"]].map(([key, label]) => (
                                                                        <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                                                                            <input type="checkbox" checked={day.meals[key]} onChange={() => toggleMeal(idx, key)} className="w-3.5 h-3.5 accent-primary" />
                                                                            <span className="text-xs text-on-surface font-medium">{label}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-on-surface-variant">
                                                                    {[day.meals?.breakfast && "Sáng", day.meals?.lunch && "Trưa", day.meals?.dinner && "Tối"].filter(Boolean).join(", ") || "Không có"}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Day illustration image */}
                                                    <div>
                                                        <label className="block text-xs font-semibold text-on-surface-variant mb-1">Ảnh minh họa ngày</label>
                                                        <div className="relative w-full aspect-[4/3] rounded-lg border border-dashed border-outline-variant bg-surface-container-low flex flex-col items-center justify-center overflow-hidden group hover:border-primary transition">
                                                            {day.imagePreview ? (
                                                                <img src={day.imagePreview} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="text-center p-2">
                                                                    <span className="material-symbols-outlined text-[24px] text-outline-variant group-hover:text-primary">add_photo_alternate</span>
                                                                    <span className="block text-[10px] text-on-surface-variant mt-1">Chọn ảnh</span>
                                                                </div>
                                                            )}
                                                            {isEditing && (
                                                                <input type="file" accept="image/*" onChange={(e) => handleDayImageChange(idx, e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Locations */}
                                                <div className="border-t border-outline-variant/20 pt-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                            Các địa điểm ghé thăm ({day.locations.length})
                                                        </h4>
                                                        {isEditing && (
                                                            <button onClick={() => addLocation(idx)} type="button" className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5">
                                                                + Thêm địa điểm
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-3">
                                                        {day.locations.map((loc, locIdx) => (
                                                            isEditing ? (
                                                                <div key={locIdx} className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg grid grid-cols-1 md:grid-cols-[1fr_100px_100px_48px_auto] gap-2 items-center">
                                                                    <input type="text" placeholder="Tên địa điểm" value={loc.name} onChange={(e) => updateLocation(idx, locIdx, "name", e.target.value)} className="px-2.5 py-1.5 border border-outline-variant rounded text-xs focus:outline-none" />
                                                                    <input type="number" step="any" placeholder="Vĩ độ (Lat)" value={loc.latitude} onChange={(e) => updateLocation(idx, locIdx, "latitude", e.target.value)} className="px-2.5 py-1.5 border border-outline-variant rounded text-xs focus:outline-none" />
                                                                    <input type="number" step="any" placeholder="Kinh độ (Lng)" value={loc.longitude} onChange={(e) => updateLocation(idx, locIdx, "longitude", e.target.value)} className="px-2.5 py-1.5 border border-outline-variant rounded text-xs focus:outline-none" />
                                                                    <div className="relative h-8 w-12 rounded border border-dashed border-outline-variant bg-surface-container-low flex items-center justify-center overflow-hidden hover:border-primary">
                                                                        {loc.imagePreview ? (
                                                                            <img src={loc.imagePreview} alt="" className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <span className="material-symbols-outlined text-[14px] text-outline-variant">add</span>
                                                                        )}
                                                                        <input type="file" accept="image/*" onChange={(e) => handleLocationImageChange(idx, locIdx, e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                                    </div>
                                                                    <button onClick={() => removeLocation(idx, locIdx)} type="button" className="text-rose-500 p-1 hover:bg-rose-50 rounded">
                                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div key={locIdx} className="flex items-center gap-2 text-xs text-on-surface-variant">
                                                                    <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                                                                    <span className="font-medium">{loc.name || "N/A"}</span>
                                                                    {(loc.latitude || loc.longitude) && (
                                                                        <span className="text-[10px] text-outline-variant">({loc.latitude}, {loc.longitude})</span>
                                                                    )}
                                                                </div>
                                                            )
                                                        ))}
                                                        {!isEditing && day.locations.length === 0 && (
                                                            <p className="text-[10px] italic text-on-surface-variant">Chưa có địa điểm.</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Activity Items */}
                                                <div className="border-t border-outline-variant/20 pt-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                            Chi tiết hoạt động ({day.items.length})
                                                        </h4>
                                                        {isEditing && (
                                                            <button onClick={() => addActivityItem(idx)} type="button" className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5">
                                                                + Thêm hoạt động
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        {day.items.map((item, itemIdx) => (
                                                            isEditing ? (
                                                                <div key={itemIdx} className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg grid grid-cols-1 md:grid-cols-[100px_1fr_2fr_auto] gap-2 items-center">
                                                                    <input type="time" value={item.activityTime} onChange={(e) => updateActivityItem(idx, itemIdx, "activityTime", e.target.value)} className="px-2.5 py-1.5 border border-outline-variant rounded text-xs focus:outline-none" />
                                                                    <input type="text" placeholder="Tên hoạt động" value={item.title} onChange={(e) => updateActivityItem(idx, itemIdx, "title", e.target.value)} className="px-2.5 py-1.5 border border-outline-variant rounded text-xs focus:outline-none" />
                                                                    <input type="text" placeholder="Mô tả chi tiết" value={item.description} onChange={(e) => updateActivityItem(idx, itemIdx, "description", e.target.value)} className="px-2.5 py-1.5 border border-outline-variant rounded text-xs focus:outline-none" />
                                                                    <button onClick={() => removeActivityItem(idx, itemIdx)} type="button" className="text-rose-500 p-1 hover:bg-rose-50 rounded">
                                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div key={itemIdx} className="flex items-start gap-3 text-xs">
                                                                    {item.activityTime && <span className="font-mono text-primary font-semibold shrink-0">{item.activityTime}</span>}
                                                                    <div>
                                                                        <p className="font-medium text-on-surface">{item.title || "N/A"}</p>
                                                                        {item.description && <p className="text-on-surface-variant">{item.description}</p>}
                                                                    </div>
                                                                </div>
                                                            )
                                                        ))}
                                                        {!isEditing && day.items.length === 0 && (
                                                            <p className="text-[10px] italic text-on-surface-variant">Chưa có hoạt động chi tiết.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* 5. Thư viện ảnh */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-xl">
                            <div className="flex items-center gap-3 mb-s-lg">
                                <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                    <span className="material-symbols-outlined text-[16px]">collections</span>
                                </span>
                                <h2 className="font-semibold text-on-surface text-lg">Thư viện ảnh Tour</h2>
                            </div>

                            {/* Thumbnail change (edit mode only) */}
                            {isEditing && isDraft && (
                                <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4 items-center border-b border-outline-variant/20 pb-4 mb-4">
                                    <div className="relative w-full aspect-[4/3] rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-low flex flex-col items-center justify-center cursor-pointer hover:border-primary overflow-hidden">
                                        {thumbnailPreview ? (
                                            <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-2">
                                                <span className="material-symbols-outlined text-[28px] text-outline-variant">add_photo_alternate</span>
                                                <span className="block text-[10px] text-on-surface-variant mt-1">Ảnh đại diện</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" onChange={(e) => handleThumbnailChange(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-on-surface">Thay đổi ảnh đại diện</h3>
                                        <p className="text-xs text-on-surface-variant mt-1">Tỷ lệ khuyến nghị: 4:3 hoặc 16:9. Click vào ô bên trái để chọn ảnh mới.</p>
                                    </div>
                                </div>
                            )}

                            {/* Pending new gallery images */}
                            {isEditing && isDraft && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-on-surface mb-2">Thêm ảnh vào thư viện</label>
                                    <div className="flex flex-wrap gap-3">
                                        {pendingGalleryPreviews.map((url, i) => (
                                            <div key={i} className="relative w-24 h-20 rounded-lg border overflow-hidden shadow-sm group">
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                                <button onClick={() => removePendingGallery(i)} type="button" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                        <div className="relative w-24 h-20 rounded-lg border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-low flex flex-col items-center justify-center cursor-pointer transition">
                                            <span className="material-symbols-outlined text-[20px] text-outline-variant">add_to_photos</span>
                                            <span className="text-[10px] text-on-surface-variant mt-0.5">Thêm ảnh</span>
                                            <input type="file" multiple accept="image/*" onChange={(e) => handlePendingGalleryChange(e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Existing gallery with horizontal scroll */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-on-surface">Ảnh hiện tại ({tour.images?.length || 0})</label>
                                </div>
                                <div className="relative group/gallery">
                                    {tour.images && tour.images.length > 0 && (
                                        <>
                                            <button type="button" onClick={() => handleScrollGallery("left")} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 border border-outline-variant/30 shadow-md hover:bg-primary hover:text-white transition-all duration-300 opacity-0 group-hover/gallery:opacity-100">
                                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                            </button>
                                            <button type="button" onClick={() => handleScrollGallery("right")} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 border border-outline-variant/30 shadow-md hover:bg-primary hover:text-white transition-all duration-300 opacity-0 group-hover/gallery:opacity-100">
                                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                            </button>
                                        </>
                                    )}
                                    <div ref={galleryRef} className="flex gap-3 overflow-x-auto pb-4 snap-x scroll-smooth no-scrollbar">
                                        {tour.images && tour.images.length > 0 ? (
                                            tour.images.map((img) => (
                                                <div key={img.id} className="relative w-40 h-32 flex-shrink-0 snap-start rounded-lg overflow-hidden border border-outline-variant/30 group shadow-sm">
                                                    <img src={img.imageUrl} alt="Tour gallery" className="w-full h-full object-cover" />
                                                    {isDraft && (
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                            <button onClick={() => handleDeleteGalleryImage(img.id)} className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition shadow" title="Xóa ảnh này">
                                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs italic text-on-surface-variant">Chưa có ảnh nào trong thư viện.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 6. Thông tin bổ sung */}
                        <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-xl">
                            <div className="flex items-center gap-3 mb-s-lg">
                                <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                                    <span className="material-symbols-outlined text-[16px]">list</span>
                                </span>
                                <h2 className="font-semibold text-on-surface text-lg">Thông tin bổ sung</h2>
                            </div>

                            {isEditing ? (
                                <>
                                    <p className="text-xs text-on-surface-variant mb-4">Chọn danh mục để đính kèm thông tin bổ sung cho tour.</p>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {infoCategories.map((cat) => {
                                            const isActive = cat.code in activeInfo;
                                            return (
                                                <button key={cat.id} type="button" onClick={() => toggleInfoCategory(cat.code)}
                                                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all flex items-center gap-1 hover:scale-105 active:scale-95 ${isActive ? "bg-primary text-white border-primary shadow-sm" : "bg-surface-container-low border-outline-variant text-on-surface-variant"}`}>
                                                    {cat.icon && <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>}
                                                    {cat.title}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="space-y-4">
                                        {Object.keys(activeInfo).map((code) => {
                                            const cat = infoCategories.find((c) => c.code === code);
                                            if (!cat) return null;
                                            return (
                                                <div key={code} className="p-4 border border-outline-variant/20 rounded-xl bg-surface-container-lowest">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-xs font-bold text-primary flex items-center gap-1">
                                                            {cat.icon && <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>}
                                                            {cat.title}
                                                        </label>
                                                        <button onClick={() => toggleInfoCategory(code)} type="button" className="text-[10px] text-rose-500 font-semibold hover:underline">Loại bỏ</button>
                                                    </div>
                                                    <textarea value={activeInfo[code]} onChange={(e) => handleInfoContentChange(code, e.target.value)} placeholder={`Nhập thông tin ${cat.title.toLowerCase()}...`} rows={3} className="w-full p-3 border border-outline-variant rounded-lg text-xs focus:outline-none resize-none focus:ring-2 focus:ring-primary/20 bg-white" />
                                                </div>
                                            );
                                        })}
                                        {Object.keys(activeInfo).length === 0 && (
                                            <div className="text-center py-6 text-xs text-on-surface-variant/40 italic">Chưa có danh mục thông tin bổ sung nào được chọn.</div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    {infoCategories
                                        .filter((cat) => cat.code in activeInfo && activeInfo[cat.code])
                                        .map((cat) => (
                                            <div key={cat.code} className="p-4 border border-outline-variant/20 rounded-xl bg-surface-container-lowest">
                                                <p className="text-xs font-bold text-primary flex items-center gap-1 mb-2">
                                                    {cat.icon && <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>}
                                                    {cat.title}
                                                </p>
                                                <p className="text-xs text-on-surface-variant whitespace-pre-wrap leading-relaxed">{activeInfo[cat.code]}</p>
                                            </div>
                                        ))}
                                    {Object.keys(activeInfo).filter((k) => activeInfo[k]).length === 0 && (
                                        <p className="text-xs italic text-on-surface-variant">Chưa có thông tin bổ sung.</p>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ===== RIGHT COLUMN: Sidebar ===== */}
                    <div className="space-y-s-lg sticky top-24">
                        {/* Thumbnail Card */}
                        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-outline-variant/20">
                                <h3 className="font-bold text-sm text-on-surface">Ảnh đại diện</h3>
                            </div>
                            <div className="relative aspect-[4/3] bg-surface-container flex items-center justify-center">
                                {thumbnailPreview ? (
                                    <img src={thumbnailPreview} alt={title} className="w-full h-full object-cover" />
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
                                    <span className="text-on-surface-variant">Phân loại:</span>
                                    <span className={`px-2 py-0.5 rounded font-medium ${difficulty === "hard" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                        {difficulty === "hard" ? "Cấp độ Hard" : "Thông thường"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-on-surface-variant">Trạng thái duyệt:</span>
                                    <span className="font-semibold">{tour.isPublished ? "Đã phát hành" : "Chưa phát hành"}</span>
                                </div>
                            </div>

                            {/* Status transitions */}
                            <div className="border-t border-outline-variant/20 pt-3 mt-3 space-y-2">
                                <p className="text-xs font-bold text-on-surface mb-2">Thao tác trạng thái:</p>
                                {tour.status === "draft" && (
                                    <button onClick={() => handleStatusTransition("pending")} disabled={saving} className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition">
                                        Gửi yêu cầu duyệt (Pending)
                                    </button>
                                )}
                                {tour.status === "pending" && (
                                    <div className="space-y-2">
                                        <button onClick={() => handleStatusTransition("draft")} disabled={saving} className="w-full py-2 bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition">
                                            Thu hồi về Bản nháp (Draft)
                                        </button>
                                        <button onClick={() => handleStatusTransition("open")} disabled={saving} className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition">
                                            Phê duyệt &amp; Mở đăng ký (Open)
                                        </button>
                                        <button onClick={() => handleStatusTransition("upcoming")} disabled={saving} className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition">
                                            Phê duyệt &amp; Để Chưa mở (Upcoming)
                                        </button>
                                    </div>
                                )}
                                {tour.status === "upcoming" && (
                                    <div className="space-y-2">
                                        <button onClick={() => handleStatusTransition("open")} disabled={saving} className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition">
                                            Mở đăng ký (Open)
                                        </button>
                                        <button onClick={() => handleStatusTransition("cancelled")} disabled={saving} className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition">
                                            Hủy Tour (Cancelled)
                                        </button>
                                    </div>
                                )}
                                {tour.status === "open" && (
                                    <div className="space-y-2">
                                        <button onClick={() => handleStatusTransition("closed")} disabled={saving} className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition">
                                            Đóng đăng ký (Closed)
                                        </button>
                                        <button onClick={() => handleStatusTransition("cancelled")} disabled={saving} className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition">
                                            Hủy Tour (Cancelled)
                                        </button>
                                    </div>
                                )}
                                {tour.status === "closed" && (
                                    <div className="space-y-2">
                                        <button onClick={() => handleStatusTransition("open")} disabled={saving} className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition">
                                            Mở lại đăng ký (Open)
                                        </button>
                                        <button onClick={() => handleStatusTransition("cancelled")} disabled={saving} className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition">
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
