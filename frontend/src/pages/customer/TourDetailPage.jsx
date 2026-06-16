import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchCurrentUser, logoutUser } from "../../features/auth/authSlice";
import axiosInstance from "../../api/axiosInstance";
import TopNavBar from "../../components/TopNavBar";

const TourDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);

    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Gallery state
    const [selectedImage, setSelectedImage] = useState("");

    // Booking configuration states
    const [selectedScheduleId, setSelectedScheduleId] = useState("");
    const [bookingConfigTour, setBookingConfigTour] = useState(null);
    const [travelerInfo, setTravelerInfo] = useState({ fullName: "", phone: "", idNumber: "" });
    const [paymentMethod, setPaymentMethod] = useState("vnpay");
    const [mascotAnimation, setMascotAnimation] = useState(null);
    const [showPaymentSimulator, setShowPaymentSimulator] = useState(null);
    const [bookingSuccessModal, setBookingSuccessModal] = useState(null);

    // Chat Bubble States
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { id: 1, sender: "bot", text: "Xin chào! Cảm ơn bạn đã ghé thăm GlobalExplore. Mình có thể giúp gì cho bạn hôm nay?", time: "Vừa xong" }
    ]);
    const [currentChatMessage, setCurrentChatMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    const fetchTourDetail = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/api/tours/${id}`);
            if (response.data.success) {
                const tourData = response.data.tour;
                setTour(tourData);
                setSelectedImage(tourData.thumbnailUrl || "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&h=500&fit=crop");
                if (tourData.schedules && tourData.schedules.length > 0) {
                    setSelectedScheduleId(tourData.schedules[0].id);
                }
            } else {
                setError("Không tải được chi tiết tour.");
            }
        } catch (err) {
            console.error("Lỗi khi tải chi tiết tour:", err);
            setError("Không tìm thấy tour hoặc lỗi kết nối mạng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchTourDetail();
        }
    }, [id]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/");
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    const handleAddToWishlist = async (e) => {
        if (!isAuthenticated) {
            alert("Vui lòng đăng nhập để lưu tour vào Kho hàng của bạn.");
            navigate("/login");
            return;
        }

        const startRect = e.currentTarget.getBoundingClientRect();
        const targetEl = document.getElementById("my-tours-nav-btn");
        const targetRect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth - 180, top: 20, width: 100, height: 40 };

        const startX = startRect.left + startRect.width / 2;
        const startY = startRect.top + startRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;

        setMascotAnimation({
            type: "heart",
            startX,
            startY,
            endX,
            endY
        });

        setTimeout(async () => {
            setMascotAnimation(null);
            try {
                const response = await axiosInstance.post("/api/customer/wishlist", {
                    tourId: tour.id
                });
                if (response.data.success) {
                    alert("Đã lưu tour vào yêu thích thành công!");
                }
            } catch (err) {
                console.error("Lỗi khi thêm wishlist:", err);
                alert("Không thể lưu tour. Vui lòng thử lại.");
            }
        }, 3000);
    };

    const handleBookTour = () => {
        if (!selectedScheduleId) {
            alert("Hiện tại chưa có lịch khởi hành mở đăng ký cho tour này.");
            return;
        }

        if (!isAuthenticated) {
            // Guest pending flow
            axiosInstance.post("/api/bookings/pending-guest", {
                tourId: tour.id,
                scheduleId: selectedScheduleId
            }).then((response) => {
                if (response.data.success) {
                    localStorage.setItem("pendingBookingId", response.data.pendingId);
                    navigate("/login");
                }
            }).catch((err) => {
                console.error("Lỗi đặt tạm thời:", err);
                alert("Đã xảy ra lỗi. Vui lòng thử lại.");
            });
        } else {
            if (user.role !== "customer") {
                alert("Vui lòng đăng nhập tài khoản Khách hàng để đặt tour.");
                return;
            }

            setBookingConfigTour(tour);
            setTravelerInfo({
                fullName: user.fullName || "",
                phone: user.phone || "",
                idNumber: ""
            });
            setPaymentMethod("vnpay");
        }
    };

    const handleConfirmBooking = (event) => {
        event.preventDefault();
        const submitBtn = document.getElementById("confirm-booking-btn-submit");
        const startRect = submitBtn ? submitBtn.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 200, height: 50 };
        const targetEl = document.getElementById("my-tours-nav-btn");
        const targetRect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth - 180, top: 20, width: 100, height: 40 };

        setMascotAnimation({
            startX: startRect.left + startRect.width / 2,
            startY: startRect.top + startRect.height / 2,
            endX: targetRect.left + targetRect.width / 2,
            endY: targetRect.top + targetRect.height / 2
        });

        setTimeout(() => {
            setMascotAnimation(null);
            setBookingConfigTour(null);
            setShowPaymentSimulator(paymentMethod);
        }, 3000);
    };

    const handleSimulatorPaymentSuccess = async () => {
        try {
            const response = await axiosInstance.post("/api/customer/bookings", {
                scheduleId: selectedScheduleId,
                status: "paid",
                participants: [
                    {
                        fullName: travelerInfo.fullName,
                        isLead: true,
                        address: "",
                        dateOfBirth: new Date("1995-01-01")
                    }
                ]
            });

            if (response.data.success) {
                setShowPaymentSimulator(null);
                setBookingSuccessModal({
                    tourTitle: response.data.booking.schedule?.tour?.title || tour.title,
                    bookingCode: response.data.booking.bookingCode
                });
            }
        } catch (err) {
            console.error("Lỗi tạo booking:", err);
            alert(err.response?.data?.error || "Không thể hoàn tất giao dịch.");
        }
    };

    const handleSendChatMessage = (e) => {
        if (e) e.preventDefault();
        if (!currentChatMessage.trim()) return;

        const userMsg = {
            id: Date.now(),
            sender: "user",
            text: currentChatMessage,
            time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        };

        setChatMessages(prev => [...prev, userMsg]);
        const userText = currentChatMessage;
        setCurrentChatMessage("");
        setIsTyping(true);

        setTimeout(() => {
            let replyText = "Cảm ơn thông tin của bạn. Hỗ trợ viên GlobalExplore sẽ phản hồi ngay lập tức hoặc bạn có thể liên hệ hotline 1900.6789 nhé!";
            const textLower = userText.toLowerCase();
            if (textLower.includes("tour") || textLower.includes("lộ trình") || textLower.includes("ngày")) {
                replyText = `Bạn đang xem chi tiết tour: ${tour?.title || "Tour đặc sắc"}. Lịch trình diễn ra trong ${tour?.durationDays} ngày ${tour?.durationNights} đêm.`;
            } else if (textLower.includes("giá") || textLower.includes("tiền") || textLower.includes("thanh toán")) {
                replyText = `Tour này có giá trọn gói từ ${formatPrice(tour?.basePrice || 0)}. Chúng tôi hỗ trợ thanh toán qua VNPay & MoMo mô phỏng.`;
            }

            setChatMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: "bot",
                text: replyText,
                time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
            }]);
            setIsTyping(false);
        }, 1200);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-rose-500 border-solid"></div>
                <p className="mt-4 text-neutral-500 font-bold text-sm">Đang tải thông tin chi tiết tour...</p>
            </div>
        );
    }

    if (error || !tour) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined text-5xl text-rose-500 mb-4">error</span>
                <h3 className="text-lg font-black text-neutral-800 mb-2">{error || "Không tìm thấy thông tin tour."}</h3>
                <Link to="/" className="px-6 py-2.5 bg-rose-500 text-white rounded-xl font-bold shadow-md hover:bg-rose-600 transition">
                    Quay về Trang chủ
                </Link>
            </div>
        );
    }

    // Default thumbnails for gallery if none uploaded
    const defaultImages = [
        tour.thumbnailUrl,
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&h=300&fit=crop"
    ].filter(Boolean);

    const imagesToDisplay = tour.images && tour.images.length > 0
        ? tour.images.map(img => img.imageUrl)
        : defaultImages;

    // Split highlights by newline or commas
    const highlightList = tour.highlights
        ? tour.highlights.split(/[,\n]/).map(h => h.trim()).filter(Boolean)
        : ["Hành trình chất lượng cao, chuẩn 4-5 sao.", "Hướng dẫn viên giàu kinh nghiệm, chu đáo.", "Hỗ trợ bảo hiểm du lịch trọn gói."];

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-800 flex flex-col font-sans overflow-x-hidden selection:bg-rose-500 selection:text-white">
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes flyMascot {
                    0% { transform: translate(0, 0) scale(0.3) rotate(0deg); opacity: 0; }
                    15% { opacity: 1; transform: translate(calc(var(--tx) * 0.15), calc(var(--ty) * 0.15 - 120px)) scale(1.3) rotate(-15deg); }
                    85% { opacity: 1; transform: translate(calc(var(--tx) * 0.85), calc(var(--ty) * 0.85 - 80px)) scale(1) rotate(15deg); }
                    100% { transform: translate(var(--tx), var(--ty)) scale(0.2) rotate(360deg); opacity: 0; }
                }
                .flying-mascot {
                    position: fixed;
                    z-index: 9999;
                    pointer-events: none;
                    animation: flyMascot 3.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                }
                .fiery-button {
                    background: linear-gradient(135deg, #f97316, #e11d48);
                    transition: all 0.3s ease;
                }
                .fiery-button:hover {
                    box-shadow: 0 8px 20px -4px rgba(244, 63, 94, 0.4);
                    filter: brightness(1.05);
                }
            `}</style>

            {/* TopNavBar */}
            <TopNavBar />

            {/* Main Section */}
            <main className="max-w-7xl mx-auto px-6 py-8 md:px-12 w-full flex-grow animate-fade-in-up">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
                    <Link to="/" className="hover:text-rose-600 font-semibold">Trang chủ</Link>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-neutral-400">Chi tiết Tour</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Tour Title Header */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex items-center gap-3.5">
                            <span className="material-symbols-outlined text-rose-500 p-2.5 bg-rose-50 rounded-xl">workspace_premium</span>
                            <div>
                                <h1 className="text-xl md:text-2xl font-black text-neutral-900 leading-tight">{tour.title}</h1>
                                <p className="text-xs text-neutral-400 font-bold uppercase mt-1 tracking-wider">Mã tour: {tour.tourCode}</p>
                            </div>
                        </div>

                        {/* Gallery component */}
                        <section className="space-y-4">
                            <div className="relative group overflow-hidden rounded-2xl shadow-md border border-neutral-200">
                                <img
                                    src={selectedImage}
                                    alt={tour.title}
                                    className="w-full h-[320px] md:h-[450px] object-cover transition-all duration-300"
                                />
                            </div>
                            {imagesToDisplay.length > 1 && (
                                <div className="grid grid-cols-5 gap-2.5">
                                    {imagesToDisplay.map((img, index) => (
                                        <img
                                            key={index}
                                            src={img}
                                            alt=""
                                            onClick={() => setSelectedImage(img)}
                                            className={`aspect-square object-cover rounded-xl cursor-pointer border-2 transition-all hover:opacity-90 ${selectedImage === img ? 'border-rose-500' : 'border-transparent'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Info Chips */}
                        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4.5 rounded-2xl border border-neutral-200 flex flex-col gap-1 shadow-sm">
                                <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm uppercase tracking-wide">
                                    <span className="material-symbols-outlined">explore</span>
                                    <span>Điểm đến</span>
                                </div>
                                <p className="text-xs text-neutral-600 font-bold leading-relaxed">{tour.destination}</p>
                            </div>
                            <div className="bg-white p-4.5 rounded-2xl border border-neutral-200 flex flex-col gap-1 shadow-sm">
                                <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm uppercase tracking-wide">
                                    <span className="material-symbols-outlined">schedule</span>
                                    <span>Thời gian</span>
                                </div>
                                <p className="text-xs text-neutral-600 font-bold leading-relaxed">{tour.durationDays} ngày {tour.durationNights} đêm</p>
                            </div>
                            <div className="bg-white p-4.5 rounded-2xl border border-neutral-200 flex flex-col gap-1 shadow-sm">
                                <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm uppercase tracking-wide">
                                    <span className="material-symbols-outlined">directions_bus</span>
                                    <span>Phương tiện</span>
                                </div>
                                <p className="text-xs text-neutral-600 font-bold leading-relaxed">Xe đời mới chất lượng cao</p>
                            </div>
                            <div className="bg-white p-4.5 rounded-2xl border border-neutral-200 flex flex-col gap-1 shadow-sm">
                                <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm uppercase tracking-wide">
                                    <span className="material-symbols-outlined">restaurant</span>
                                    <span>Ẩm thực</span>
                                </div>
                                <p className="text-xs text-neutral-600 font-bold leading-relaxed">Theo lịch trình (Đặc sản địa phương)</p>
                            </div>
                            <div className="bg-white p-4.5 rounded-2xl border border-neutral-200 flex flex-col gap-1 shadow-sm">
                                <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm uppercase tracking-wide">
                                    <span className="material-symbols-outlined">payments</span>
                                    <span>Độ khó</span>
                                </div>
                                <p className="text-xs text-neutral-600 font-bold leading-relaxed capitalize">{tour.difficulty === "hard" ? "Thám hiểm (Hard)" : "Thông thường"}</p>
                            </div>
                            <div className="bg-white p-4.5 rounded-2xl border border-neutral-200 flex flex-col gap-1 shadow-sm">
                                <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm uppercase tracking-wide">
                                    <span className="material-symbols-outlined">verified</span>
                                    <span>Khuyến mãi</span>
                                </div>
                                <p className="text-xs text-neutral-600 font-bold leading-relaxed">Trẻ em giảm giá lên đến 30%</p>
                            </div>
                        </section>

                        {/* Program Highlights */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-rose-500">campaign</span>
                                Điểm nhấn chương trình
                            </h2>
                            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                                <ul className="space-y-3.5 text-sm font-semibold text-neutral-600">
                                    {highlightList.map((highlight, index) => (
                                        <li key={index} className="flex gap-3 items-start">
                                            <span className="material-symbols-outlined text-teal-600 text-[20px] shrink-0" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                                            <span className="leading-relaxed">{highlight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* Program Details with Timeline */}
                        <section className="space-y-6">
                            <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-rose-500">map</span>
                                Lịch trình chi tiết
                            </h2>

                            {tour.itineraryDays && tour.itineraryDays.length > 0 ? (
                                <div className="relative border-l-2 border-neutral-200 ml-4.5 pl-6 md:pl-8 space-y-8">
                                    {tour.itineraryDays.map((day, index) => {
                                        // Pick a sample scenic travel photo for each day card dynamically based on the day number
                                        const samplePhotos = [
                                            "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=250&fit=crop",
                                            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop",
                                            "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=250&fit=crop",
                                            "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&h=250&fit=crop",
                                            "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=250&fit=crop"
                                        ];
                                        const dayPhoto = samplePhotos[index % samplePhotos.length];

                                        return (
                                            <div key={day.id || index} className="relative">
                                                {/* Timeline Bullet Node */}
                                                <div className="absolute -left-[31px] md:-left-[45px] top-1 bg-rose-500 text-white rounded-full w-7 h-7 flex items-center justify-center border-4 border-white shadow-md text-[10px] font-black">
                                                    {day.dayNumber}
                                                </div>

                                                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden flex flex-col md:flex-row group">
                                                    {/* Day Content */}
                                                    <div className="p-6 flex-grow space-y-4">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                                                            <h3 className="font-black text-neutral-900 text-base">
                                                                Ngày {day.dayNumber}: {day.title || `Khám phá hành trình ngày ${day.dayNumber}`}
                                                            </h3>
                                                            {day.meals && (
                                                                <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] font-extrabold border border-teal-100 uppercase tracking-wider">
                                                                    <span className="material-symbols-outlined text-[13px]">restaurant</span>
                                                                    {day.meals}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                                                            {day.description || "Đang cập nhật chi tiết hoạt động..."}
                                                        </p>
                                                    </div>

                                                    {/* Day Image on the Right */}
                                                    <div className="w-full md:w-56 h-36 md:h-auto shrink-0 overflow-hidden relative border-t md:border-t-0 md:border-l border-neutral-200">
                                                        <img
                                                            src={dayPhoto}
                                                            alt=""
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-white p-8 rounded-2xl border border-neutral-200 text-center shadow-sm">
                                    <span className="material-symbols-outlined text-4xl text-neutral-300 mb-2">map</span>
                                    <p className="text-neutral-500 text-sm font-bold">Lịch trình chi tiết theo từng ngày sẽ sớm được cập nhật.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Sticky Sidebar / Pricing Card */}
                    <div className="lg:col-span-4 sticky top-24 space-y-6">
                        <div className="bg-white rounded-3xl border border-neutral-200 shadow-lg p-6 space-y-6">
                            <div>
                                <span className="text-neutral-400 text-[10px] font-black uppercase tracking-wider block">Giá trọn gói từ</span>
                                <div className="flex items-baseline gap-1.5 mt-1">
                                    <span className="text-2xl md:text-3xl font-black text-rose-600">{formatPrice(tour.basePrice)}</span>
                                    <span className="text-xs text-neutral-400 font-bold">/ khách</span>
                                </div>
                            </div>

                            {/* Schedule Selector */}
                            <div className="space-y-2 pt-4 border-t border-neutral-100">
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Chọn ngày khởi hành:</label>
                                {tour.schedules && tour.schedules.length > 0 ? (
                                    <select
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-neutral-700 outline-none cursor-pointer focus:border-rose-500 focus:bg-white transition-all shadow-sm"
                                        value={selectedScheduleId}
                                        onChange={(e) => setSelectedScheduleId(e.target.value)}
                                    >
                                        {tour.schedules.map((sch) => (
                                            <option key={sch.id} value={sch.id}>
                                                {formatDate(sch.departureDate)} - Còn {sch.maxCapacity - sch.registered} chỗ
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-xs font-bold text-orange-600 bg-orange-50 p-4.5 rounded-2xl text-center border border-orange-100">
                                        Hiện tại chưa có đợt khởi hành nào khả dụng. Hãy liên hệ bộ phận hỗ trợ khách hàng.
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleBookTour}
                                disabled={!tour.schedules || tour.schedules.length === 0}
                                className="w-full py-4 text-sm font-black text-white fiery-button rounded-2xl shadow-md transform active:scale-95 disabled:from-neutral-200 disabled:to-neutral-300 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:transform-none cursor-pointer flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                                Đặt Tour Ngay
                            </button>

                            {/* Wishlist toggle */}
                            <button
                                onClick={handleAddToWishlist}
                                className="w-full py-3.5 border border-neutral-200 hover:border-rose-200 hover:bg-rose-50/30 rounded-2xl text-xs font-black text-neutral-600 hover:text-rose-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">favorite</span>
                                Lưu vào danh sách mong muốn
                            </button>
                        </div>

                        {/* Customer support card */}
                        <div className="bg-neutral-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                            <div className="absolute -right-12 -top-12 w-36 h-36 bg-white/5 rounded-full blur-2xl"></div>
                            <h3 className="font-black text-md mb-2">Hỗ trợ tư vấn</h3>
                            <p className="text-xs text-neutral-400 leading-relaxed mb-4">Bạn có câu hỏi hoặc cần điều chỉnh lịch trình riêng? Liên hệ ngay với đội ngũ chuyên gia.</p>
                            <div className="space-y-2.5 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-rose-500 text-[18px]">phone_in_talk</span>
                                    <span className="font-bold">Hotline: 1900.6789 (24/7)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-rose-500 text-[18px]">mail</span>
                                    <span className="font-bold">Email: support@globalexplore.com</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full bg-neutral-900 text-neutral-400 py-12 px-6 md:px-12 border-t border-neutral-800">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-rose-500 text-2xl font-black">explore</span>
                            <span className="text-xl font-black text-white tracking-tight">GlobalExplore</span>
                        </div>
                        <p className="text-xs leading-relaxed text-neutral-400">
                            Đồng hành cùng bạn trên mọi nẻo đường thế giới. Chất lượng và uy tín là kim chỉ nam hàng đầu của chúng tôi.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase text-neutral-200 tracking-wider mb-4">Công ty</h4>
                        <ul className="space-y-2 text-xs">
                            <li><a href="#" className="hover:text-white transition">Về chúng tôi</a></li>
                            <li><a href="#" className="hover:text-white transition">Tuyển dụng</a></li>
                            <li><a href="#" className="hover:text-white transition">Đối tác du lịch</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase text-neutral-200 tracking-wider mb-4">Hỗ trợ</h4>
                        <ul className="space-y-2 text-xs">
                            <li><a href="#" className="hover:text-white transition">Trung tâm trợ giúp</a></li>
                            <li><a href="#" className="hover:text-white transition">Chính sách bảo mật</a></li>
                            <li><a href="#" className="hover:text-white transition">Điều khoản sử dụng</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase text-neutral-200 tracking-wider mb-4">Kết nối mạng xã hội</h4>
                        <div className="flex gap-3.5">
                            <span className="w-9 h-9 rounded-full bg-neutral-800 text-white flex items-center justify-center hover:bg-rose-500 transition cursor-pointer">
                                <span className="material-symbols-outlined text-[18px]">public</span>
                            </span>
                            <span className="w-9 h-9 rounded-full bg-neutral-800 text-white flex items-center justify-center hover:bg-rose-500 transition cursor-pointer">
                                <span className="material-symbols-outlined text-[18px]">share</span>
                            </span>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto border-t border-neutral-800 pt-6 text-center text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    © 2026 GlobalExplore Travel Ecosystem. All rights reserved.
                </div>
            </footer>

            {/* Interactive Booking Config Modal */}
            {bookingConfigTour && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-[32px] max-w-lg w-full p-8 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200 my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-neutral-900">Thông Tin Đặt Tour</h3>
                            <button
                                onClick={() => setBookingConfigTour(null)}
                                className="text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="bg-orange-50/60 border border-orange-100 p-4 rounded-2xl mb-6 flex items-start gap-4 text-neutral-800">
                            <img
                                src={bookingConfigTour.thumbnailUrl || "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=120&h=80&fit=crop"}
                                alt=""
                                className="w-20 h-16 object-cover rounded-xl border border-orange-200/50"
                            />
                            <div>
                                <h4 className="font-black text-neutral-900 text-sm leading-snug">{bookingConfigTour.title}</h4>
                                <p className="text-rose-600 text-xs font-bold mt-1">{formatPrice(bookingConfigTour.basePrice)}</p>
                                <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">Thời lượng: {bookingConfigTour.durationDays}N{bookingConfigTour.durationNights}Đ</span>
                            </div>
                        </div>

                        <form onSubmit={handleConfirmBooking} className="space-y-5 text-neutral-800">
                            <div>
                                <label className="text-xs font-black text-neutral-700 uppercase tracking-wider block mb-1.5">Họ tên hành khách trưởng đoàn</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                                    value={travelerInfo.fullName}
                                    onChange={(e) => setTravelerInfo(prev => ({ ...prev, fullName: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-neutral-700 uppercase tracking-wider block mb-1.5">Số điện thoại liên hệ</label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                                        value={travelerInfo.phone}
                                        onChange={(e) => setTravelerInfo(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-neutral-700 uppercase tracking-wider block mb-1.5">Số CCCD / Hộ chiếu</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: 030095123456"
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                                        value={travelerInfo.idNumber}
                                        onChange={(e) => setTravelerInfo(prev => ({ ...prev, idNumber: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-neutral-700 uppercase tracking-wider block mb-2.5">Phương thức thanh toán mô phỏng</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`border rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${paymentMethod === 'vnpay' ? 'border-blue-500 bg-blue-50/20 text-blue-700 font-black' : 'border-neutral-200 hover:bg-neutral-50 text-neutral-500'}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="vnpay"
                                            className="sr-only"
                                            checked={paymentMethod === 'vnpay'}
                                            onChange={() => setPaymentMethod('vnpay')}
                                        />
                                        <span className="material-symbols-outlined text-3xl text-blue-600 mb-1">payments</span>
                                        <span className="text-xs uppercase tracking-wide">VNPay Simulator</span>
                                    </label>

                                    <label className={`border rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${paymentMethod === 'momo' ? 'border-pink-500 bg-pink-50/20 text-pink-700 font-black' : 'border-neutral-200 hover:bg-neutral-50 text-neutral-500'}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="momo"
                                            className="sr-only"
                                            checked={paymentMethod === 'momo'}
                                            onChange={() => setPaymentMethod('momo')}
                                        />
                                        <span className="material-symbols-outlined text-3xl text-pink-600 mb-1">qr_code_2</span>
                                        <span className="text-xs uppercase tracking-wide">MoMo Simulator</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                id="confirm-booking-btn-submit"
                                className="w-full fiery-button text-white font-black py-4 rounded-2xl shadow-lg mt-6 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span className="material-symbols-outlined">shopping_cart_checkout</span>
                                Đặt đơn hàng
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Flying Mascot Animation */}
            {mascotAnimation && (
                <div
                    className="flying-mascot flex flex-col items-center justify-center"
                    style={{
                        left: `${mascotAnimation.startX}px`,
                        top: `${mascotAnimation.startY}px`,
                        "--tx": `${mascotAnimation.endX - mascotAnimation.startX}px`,
                        "--ty": `${mascotAnimation.endY - mascotAnimation.startY}px`
                    }}
                >
                    <div className="text-5xl select-none animate-bounce">
                        {mascotAnimation.type === "heart" ? "❤️" : "🐱🎒"}
                    </div>
                    <div className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full shadow border border-white whitespace-nowrap mt-1 uppercase tracking-wider animate-pulse">
                        {mascotAnimation.type === "heart" ? "Đã thêm vào yêu thích!" : "Đang tạo đơn hàng..."}
                    </div>
                </div>
            )}

            {/* Mock Payment Simulators */}
            {showPaymentSimulator === 'vnpay' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-blue-200 animate-in fade-in zoom-in-95 duration-200 text-neutral-800">
                        <div className="bg-blue-600 text-white p-6 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-3xl">account_balance</span>
                                <div>
                                    <h3 className="font-extrabold text-md tracking-tight uppercase">CỔNG THANH TOÁN MÔ PHỎNG VNPAY</h3>
                                    <p className="text-[10px] text-blue-200 font-medium uppercase tracking-wider">VNPay Sandbox Environment</p>
                                </div>
                            </div>
                            <span className="bg-white text-blue-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">MOCKUP</span>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="bg-neutral-50 p-4.5 rounded-xl border border-neutral-200/60 space-y-3.5 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-500 font-semibold">Đơn vị thụ hưởng:</span>
                                    <span className="font-black text-neutral-800">GLOBALEXPLORE TRAVELS CO.</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-500 font-semibold">Khách hàng:</span>
                                    <span className="font-black text-neutral-800">{travelerInfo.fullName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-500 font-semibold">Số điện thoại:</span>
                                    <span className="font-black text-neutral-800">{travelerInfo.phone}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-dashed border-neutral-200">
                                    <span className="text-neutral-500 font-bold">Số tiền giao dịch:</span>
                                    <span className="text-lg font-black text-blue-600">{formatPrice(tour.basePrice)}</span>
                                </div>
                            </div>

                            <div className="border border-amber-200 bg-amber-50 p-4 rounded-xl text-xs text-amber-800 leading-relaxed">
                                <strong>⚠️ Lưu ý:</strong> Đây là cổng thanh toán mô phỏng sandbox giúp hoàn thành nhanh quy trình đặt tour và cấp vé QR Code tự động tức thì.
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleSimulatorPaymentSuccess}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 text-sm"
                                >
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    Thanh toán thành công
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPaymentSimulator(null);
                                        alert("Giao dịch thanh toán mô phỏng đã bị hủy.");
                                    }}
                                    className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3.5 rounded-xl transition-all text-sm cursor-pointer"
                                >
                                    Hủy giao dịch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showPaymentSimulator === 'momo' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-pink-200 animate-in fade-in zoom-in-95 duration-200 text-neutral-800">
                        <div className="bg-pink-600 text-white p-6 text-center relative">
                            <span className="material-symbols-outlined text-4xl animate-pulse">qr_code_2</span>
                            <h3 className="font-extrabold text-lg tracking-tight mt-1">THANH TOÁN QUA VÍ MOMO</h3>
                            <p className="text-pink-200 text-[10px] uppercase font-bold tracking-wider">MoMo Sandbox Simulated</p>
                        </div>

                        <div className="p-6 flex flex-col items-center">
                            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center mb-6">
                                <div className="w-36 h-36 border-4 border-pink-600 flex items-center justify-center relative p-1">
                                    <span className="material-symbols-outlined text-[100px] text-pink-600">qr_code_2</span>
                                </div>
                            </div>

                            <div className="text-center w-full mb-6 bg-neutral-50 py-3 px-4 rounded-xl border border-neutral-200/50">
                                <span className="text-xs text-neutral-400 font-bold block uppercase tracking-wider">Số tiền cần thanh toán</span>
                                <span className="text-xl font-black text-pink-600">{formatPrice(tour.basePrice)}</span>
                            </div>

                            <button
                                onClick={handleSimulatorPaymentSuccess}
                                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 text-sm mb-3"
                            >
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Xác nhận đã chuyển tiền
                            </button>
                            <button
                                onClick={() => {
                                    setShowPaymentSimulator(null);
                                    alert("Giao dịch thanh toán MoMo mô phỏng đã hủy.");
                                }}
                                className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3.5 rounded-xl transition-all text-sm cursor-pointer"
                            >
                                Quay lại
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Success Modal */}
            {bookingSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl border border-neutral-100 text-center animate-in fade-in zoom-in-95 duration-200 text-neutral-800">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 animate-bounce">
                            <span className="material-symbols-outlined text-3xl">check_circle</span>
                        </div>
                        <h3 className="text-2xl font-black text-neutral-900 tracking-tight">Đặt Tour Thành Công!</h3>
                        <p className="text-neutral-500 text-xs mt-2 px-4 leading-relaxed">
                            Mã đặt chỗ: <strong className="text-teal-600 font-black">{bookingSuccessModal.bookingCode}</strong>.
                            Hồ sơ đã được lưu trữ trong danh sách chuyến đi của bạn.
                        </p>

                        <div className="bg-neutral-50 rounded-2xl p-4.5 border border-neutral-200/60 text-left space-y-2 mt-6 mb-8 text-xs font-semibold text-neutral-700">
                            <p>🗺️ <strong>Tour:</strong> {bookingSuccessModal.tourTitle}</p>
                            <p>👤 <strong>Trưởng đoàn:</strong> {travelerInfo.fullName}</p>
                            <p>📞 <strong>SĐT:</strong> {travelerInfo.phone}</p>
                        </div>

                        <div className="space-y-3">
                            <Link
                                to="/customer/tours"
                                className="block w-full py-4 text-xs font-black text-white fiery-button rounded-2xl shadow-md uppercase tracking-wider text-center"
                            >
                                Xem danh sách My Tours
                            </Link>
                            <button
                                onClick={() => setBookingSuccessModal(null)}
                                className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-4 rounded-2xl transition-all text-sm"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Chat Bubble */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
                {isChatOpen && (
                    <div className="w-80 md:w-96 h-[480px] bg-white/95 backdrop-blur-md rounded-[28px] border border-neutral-200/80 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 text-neutral-855">
                        <div className="bg-gradient-to-r from-orange-500 to-rose-500 text-white p-4 flex items-center justify-between shadow-md">
                            <div className="flex items-center gap-2.5">
                                <div className="relative">
                                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                                        🎧
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black tracking-wide uppercase">Hỗ Trợ Trực Tuyến</h4>
                                    <p className="text-[10px] text-orange-100 font-medium">Sẵn sàng phản hồi 24/7</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="text-white hover:text-orange-200 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-neutral-50/50">
                            {chatMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'items-start'}`}
                                >
                                    <div className={`px-4 py-2.5 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${
                                        msg.sender === 'user'
                                            ? 'bg-rose-500 text-white rounded-tr-none'
                                            : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[9px] text-neutral-400 font-bold mt-1 px-1">
                                        {msg.time}
                                    </span>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex flex-col items-start max-w-[80%]">
                                    <div className="bg-white border border-neutral-200 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSendChatMessage} className="p-3 border-t border-neutral-200 bg-white flex gap-2">
                            <input
                                type="text"
                                placeholder="Nhập tin nhắn hỗ trợ..."
                                className="flex-grow bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-neutral-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                                value={currentChatMessage}
                                onChange={(e) => setCurrentChatMessage(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="w-9 h-9 bg-rose-500 hover:bg-rose-600 text-white rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                        </form>
                    </div>
                )}

                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="w-14 h-14 bg-gradient-to-tr from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
                >
                    <span className="material-symbols-outlined text-[26px]">
                        {isChatOpen ? "close" : "forum"}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default TourDetailPage;
