import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../features/auth/authSlice";
import axiosInstance from "../api/axiosInstance";
import TopNavBar from "../components/TopNavBar";

const Homepage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Advanced search states
    const [searchTerm, setSearchTerm] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [priceRange, setPriceRange] = useState("all"); // "all" | "under2" | "2to5" | "5to10" | "over10"

    // Booking states
    const [bookingConfigTour, setBookingConfigTour] = useState(null);
    const [bookingConfigScheduleId, setBookingConfigScheduleId] = useState(null);
    const [travelerInfo, setTravelerInfo] = useState({ fullName: "", phone: "", idNumber: "" });
    const [paymentMethod, setPaymentMethod] = useState("vnpay");
    const [mascotAnimation, setMascotAnimation] = useState(null);
    const [showPaymentSimulator, setShowPaymentSimulator] = useState(null);
    const [bookingSuccessModal, setBookingSuccessModal] = useState(null);
    const [selectedSchedules, setSelectedSchedules] = useState({});

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalTours, setTotalTours] = useState(0);
    const itemsPerPage = 3;
    const [showAll, setShowAll] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
    };

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Reset pagination to page 1 when search filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, searchDate, priceRange]);



    // Scroll state for header opacity
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const fetchTours = async () => {
        setLoading(true);
        try {
            const limit = showAll ? 1000 : itemsPerPage;
            const response = await axiosInstance.get(
                `/api/tours?page=${currentPage}&limit=${limit}&search=${searchTerm}&priceRange=${priceRange}&date=${searchDate}`
            );
            setTours(response.data.tours || []);
            setTotalTours(response.data.total || 0);
        } catch (err) {
            setError("Không thể tải danh sách tour. Vui lòng thử lại sau.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTours();
    }, [currentPage, searchTerm, searchDate, priceRange, showAll]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/");
    };

    const handleScheduleChange = (tourId, scheduleId) => {
        setSelectedSchedules((prev) => ({ ...prev, [tourId]: scheduleId }));
    };

    const handleAddToWishlist = async (e, tourId) => {
        if (!isAuthenticated) {
            showToast("Vui lòng đăng nhập để lưu tour vào Kho hàng của bạn.", "info");
            navigate("/login");
            return;
        }

        const startRect = e.currentTarget.getBoundingClientRect();
        const targetEl = document.getElementById("my-tours-nav-btn");
        const targetRect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth - 180, top: 20, width: 100, height: 40 };

        setMascotAnimation({
            type: "heart",
            startX: startRect.left + startRect.width / 2,
            startY: startRect.top + startRect.height / 2,
            endX: targetRect.left + targetRect.width / 2,
            endY: targetRect.top + targetRect.height / 2
        });

        setTimeout(async () => {
            setMascotAnimation(null);
            try {
                await axiosInstance.post("/api/customer/wishlist", { tourId });
                showToast("Đã thêm tour vào danh sách yêu thích thành công!", "success");
            } catch (err) {
                console.error("Lỗi khi thêm wishlist:", err);
                showToast("Không thể lưu tour. Vui lòng thử lại.", "error");
            }
        }, 3000);
    };

    const handleBookTour = async (tour) => {
        const scheduleId = selectedSchedules[tour.id] || (tour.schedules && tour.schedules[0]?.id);

        if (!scheduleId) {
            showToast("Xin lỗi, tour này hiện tại chưa có lịch trình mở đăng ký.", "info");
            return;
        }

        if (!isAuthenticated) {
            try {
                const response = await axiosInstance.post("/api/bookings/pending-guest", {
                    tourId: tour.id,
                    scheduleId
                });
                if (response.data.success) {
                    localStorage.setItem("pendingBookingId", response.data.pendingId);
                    navigate("/login");
                }
            } catch (err) {
                console.error("Lỗi khi lưu thông tin đặt tour tạm thời:", err);
                showToast("Đã xảy ra lỗi. Vui lòng thử lại.", "error");
            }
        } else {
            if (user.role !== "customer") {
                showToast("Tài khoản của bạn không phải là Khách hàng. Vui lòng đăng nhập tài khoản Khách hàng để đặt tour.", "warning");
                return;
            }

            setBookingConfigTour(tour);
            setBookingConfigScheduleId(scheduleId);
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
                scheduleId: bookingConfigScheduleId,
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
                    tourTitle: response.data.booking.schedule?.tour?.title || "Tour du lịch",
                    bookingCode: response.data.booking.bookingCode
                });
            }
        } catch (err) {
            console.error("Lỗi tạo booking:", err);
            showToast(err.response?.data?.error || "Không thể hoàn tất đơn đặt tour.", "error");
        }
    };



    const handleSearchClick = () => {
        const toursSection = document.getElementById("featured-tours-section");
        if (toursSection) {
            toursSection.scrollIntoView({ behavior: "smooth" });
        }
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

    // Filters logic (handled by backend now)
    const filteredTours = tours;

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col font-sans overflow-x-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .stagger-1 { animation-delay: 0.05s; }
                .stagger-2 { animation-delay: 0.1s; }
                .stagger-3 { animation-delay: 0.15s; }
                .stagger-4 { animation-delay: 0.2s; }
                .tour-card { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                .tour-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 28px -8px rgba(0, 61, 155, 0.15);
                }
                .fiery-button {
                    background: linear-gradient(135deg, #fe6b00, #a04100);
                    transition: all 0.3s ease;
                }
                .fiery-button:hover {
                    filter: brightness(1.08);
                    box-shadow: 0 8px 16px -4px rgba(160, 65, 0, 0.3);
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
            `}</style>

            {/* TopNavBar */}
            <TopNavBar />

            {/* Hero Section with dark premium gradient instead of background image */}
            <section className="relative h-[400px] w-full overflow-hidden bg-gradient-to-br from-neutral-950 via-slate-900 to-zinc-950 text-white flex flex-col justify-center items-center">
                <div className="absolute inset-0 opacity-60">
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
                </div>
                <div className="relative h-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col justify-center items-center text-center pb-16 z-10">
                    <h1 className="text-white text-2xl md:text-4xl font-black tracking-tight leading-tight animate-fade-in-up">
                        Khám Phá Thế Giới Cùng Chip3Chip
                    </h1>
                    <p className="text-neutral-300 text-xs md:text-sm mt-2 max-w-xl animate-fade-in-up stagger-1">
                        Hành trình trải nghiệm đẳng cấp dành cho gia đình và chuyên gia du lịch.
                    </p>
                </div>

                {/* Advanced Search Bar - Compact version */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-20">
                    <div className="bg-white rounded-2xl shadow-[0_16px_36px_-8px_rgba(0,0,0,0.12)] p-4 md:p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end border border-neutral-200/80 transition-all duration-300 hover:shadow-[0_24px_48px_-8px_rgba(0,0,0,0.18)]">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">Địa điểm đến</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">location_on</span>
                                <input 
                                    className="w-full pl-9 pr-3 py-1.5 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none font-semibold text-neutral-800" 
                                    placeholder="Bạn muốn đi đâu?" 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">Ngày khởi hành</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">calendar_month</span>
                                <input 
                                    className="w-full pl-9 pr-3 py-1.5 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none font-semibold text-neutral-700" 
                                    type="date"
                                    value={searchDate}
                                    onChange={(e) => setSearchDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">Khoảng giá</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">payments</span>
                                <select 
                                    className="w-full pl-9 pr-3 py-1.5 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none appearance-none bg-white font-semibold text-neutral-700 cursor-pointer"
                                    value={priceRange}
                                    onChange={(e) => setPriceRange(e.target.value)}
                                >
                                    <option value="all">Tất cả mức giá</option>
                                    <option value="under2">Dưới 2 triệu</option>
                                    <option value="2to5">2 - 5 triệu</option>
                                    <option value="5to10">5 - 10 triệu</option>
                                    <option value="over10">Trên 10 triệu</option>
                                </select>
                            </div>
                        </div>
                        <button 
                            onClick={handleSearchClick}
                            className="bg-secondary text-on-secondary font-extrabold py-2 px-5 rounded-xl hover:bg-secondary-container transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-sm text-xs"
                        >
                            <span className="material-symbols-outlined text-[16px]">search</span>
                            Tìm kiếm
                        </button>
                    </div>
                </div>
            </section>

            {/* Featured Tours Section */}
            <section id="featured-tours-section" className="py-20 bg-white">
                <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop">
                    <div className="flex justify-between items-end mb-12 border-b border-neutral-100 pb-6">
                        <div>
                            <span className="text-secondary font-black text-xs uppercase tracking-widest bg-secondary-fixed/30 px-3 py-1 rounded-full border border-secondary-fixed/50">Hành trình đặc sắc</span>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface mt-2">Tour Đặc Sắc</h2>
                            <p className="text-on-surface-variant font-body-md text-body-md mt-1">Những hành trình được yêu thích nhất bởi du khách</p>
                        </div>
                        <button 
                            onClick={() => {
                                if (showAll) {
                                    setShowAll(false);
                                } else {
                                    setSearchTerm("");
                                    setSearchDate("");
                                    setPriceRange("all");
                                    setShowAll(true);
                                }
                            }}
                            className="text-primary font-bold text-label-md flex items-center gap-xs hover:underline cursor-pointer"
                        >
                            {showAll ? (
                                <>Thu gọn <span className="material-symbols-outlined">expand_less</span></>
                            ) : (
                                <>Xem tất cả <span className="material-symbols-outlined">chevron_right</span></>
                            )}
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
                        </div>
                    ) : error ? (
                        <div className="bg-error-container text-on-error-container border border-error/20 rounded-2xl p-6 text-center max-w-lg mx-auto shadow-inner">
                            {error}
                        </div>
                    ) : filteredTours.length === 0 ? (
                        <div className="bg-background rounded-3xl border border-outline-variant p-16 text-center shadow-sm max-w-lg mx-auto">
                            <span className="material-symbols-outlined text-5xl text-neutral-300 mb-3">sentiment_dissatisfied</span>
                            <p className="text-neutral-500 text-sm font-bold">Không tìm thấy tour phù hợp với bộ lọc tìm kiếm.</p>
                        </div>
                    ) : (
                        (() => {
                            const totalPages = Math.ceil(totalTours / itemsPerPage);
                            const paginatedTours = tours;

                            return (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {paginatedTours.map((tour, index) => {
                                            const currentSelectedSchedule = selectedSchedules[tour.id] || (tour.schedules && tour.schedules[0]?.id);
                                            const animationDelayClass = `stagger-${(index % 4) + 1}`;

                                            return (
                                                <div key={tour.id} className={`bg-white rounded-[24px] shadow-sm border border-neutral-200/80 overflow-hidden group tour-card flex flex-col justify-between h-full animate-fade-in-up ${animationDelayClass} hover:shadow-xl hover:-translate-y-2 hover:border-primary/20 transition-all duration-300`}>
                                                    <div className="relative h-56 overflow-hidden">
                                                        <Link to={`/tours/${tour.id}`} className="block w-full h-full">
                                                            <img 
                                                                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500" 
                                                                alt={tour.title}
                                                                src={tour.thumbnailUrl || "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=250&fit=crop"}
                                                            />
                                                        </Link>
                                                        <div className="absolute bottom-3 left-3 bg-neutral-900/70 backdrop-blur px-3 py-1 rounded-xl text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                            {tour.durationDays}N{tour.durationNights}Đ
                                                        </div>
                                                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider shadow-md border ${
                                                            tour.difficulty === "hard"
                                                                ? "bg-rose-50 text-rose-600 border-rose-100"
                                                                : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                        }`}>
                                                            {tour.difficulty === "hard" ? "Thám hiểm" : "Nghỉ dưỡng"}
                                                        </div>
                                                    </div>
                                                    <div className="p-6 flex-grow flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                                <span className="material-symbols-outlined text-amber-500 text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                                                                <span className="text-[11px] font-bold text-neutral-500">4.9 (120 đánh giá)</span>
                                                            </div>
                                                            <Link to={`/tours/${tour.id}`} className="block hover:text-primary transition-colors">
                                                                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2 line-clamp-1">{tour.title}</h3>
                                                            </Link>
                                                            <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 mb-3">
                                                                <span className="material-symbols-outlined text-[12px]">sell</span>
                                                                Trẻ em giảm 30%
                                                            </div>
                                                            <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed mb-6">
                                                                {tour.description}
                                                            </p>
                                                        </div>

                                                        <div className="pt-4 border-t border-outline-variant/30 space-y-4">
                                                            {tour.schedules && tour.schedules.length > 0 ? (
                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Chọn lịch trình:</label>
                                                                    <select
                                                                        className="w-full bg-neutral-50 border border-neutral-200/80 rounded-xl px-3 py-2 text-xs font-bold text-neutral-700 outline-none cursor-pointer focus:border-primary focus:bg-white transition-all shadow-sm"
                                                                        value={currentSelectedSchedule}
                                                                        onChange={(e) => handleScheduleChange(tour.id, e.target.value)}
                                                                    >
                                                                        {tour.schedules.map((sch) => (
                                                                            <option key={sch.id} value={sch.id}>
                                                                                {formatDate(sch.departureDate)} - Còn {sch.maxCapacity - sch.registered} chỗ
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <p className="text-[10px] font-bold text-orange-600 bg-orange-50 p-2.5 rounded-lg text-center border border-orange-100">Sắp cập nhật lịch trình mới</p>
                                                            )}

                                                            <div className="flex justify-between items-center gap-3">
                                                                <div>
                                                                    <div className="text-neutral-400 line-through text-[11px] font-bold">{formatPrice(tour.basePrice * 1.15)}</div>
                                                                    <div className="text-primary font-black text-lg leading-none mt-0.5">{formatPrice(tour.basePrice)}</div>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        onClick={(e) => handleAddToWishlist(e, tour.id)}
                                                                        className="p-2.5 rounded-xl border border-neutral-200 text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                                                                        title="Yêu thích"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">favorite</span>
                                                                    </button>
                                                                    <Link 
                                                                        to={`/tours/${tour.id}`} 
                                                                        className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-extrabold text-xs uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all cursor-pointer text-center"
                                                                    >
                                                                        Chi tiết
                                                                    </Link>
                                                                    <Link 
                                                                        to={`/tours/${tour.id}`}
                                                                        className="bg-primary hover:bg-primary-container text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl active:scale-95 transition-all text-center flex items-center justify-center shadow-md shadow-primary/10 cursor-pointer"
                                                                    >
                                                                        Đặt Tour
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center items-center gap-2 mt-12 animate-fade-in-up">
                                            <button
                                                onClick={() => {
                                                    if (currentPage > 1) {
                                                        setCurrentPage(currentPage - 1);
                                                        document.getElementById("featured-tours-section")?.scrollIntoView({ behavior: "smooth" });
                                                    }
                                                }}
                                                disabled={currentPage === 1}
                                                className="p-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-primary transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => {
                                                        setCurrentPage(page);
                                                        document.getElementById("featured-tours-section")?.scrollIntoView({ behavior: "smooth" });
                                                    }}
                                                    className={`w-10 h-10 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center cursor-pointer ${
                                                        currentPage === page
                                                            ? "bg-primary text-white shadow-md shadow-primary/25 scale-105"
                                                            : "border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-primary"
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    if (currentPage < totalPages) {
                                                        setCurrentPage(currentPage + 1);
                                                        document.getElementById("featured-tours-section")?.scrollIntoView({ behavior: "smooth" });
                                                    }
                                                }}
                                                disabled={currentPage === totalPages}
                                                className="p-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-primary transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                            </button>
                                        </div>
                                    )}
                                </>
                            );
                        })()
                    )}
                </div>
            </section>

            {/* About Us Section */}
            <section id="about-us-section" className="py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-t border-slate-100 relative overflow-hidden">
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/3 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Left Side: Content & Statistics */}
                        <div className="lg:col-span-6 space-y-6 text-left">
                            <span className="text-primary font-black text-xs uppercase tracking-widest bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 inline-block">
                                Về Chúng Tôi
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                                Về <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">Chip3Chip</span>
                            </h2>
                            <p className="text-slate-600 font-body-md text-body-md leading-relaxed">
                                Với hơn 15 năm kinh nghiệm trong ngành du lịch, Chip3Chip tự hào là đơn vị tiên phong mang đến những hành trình khám phá thế giới chuyên nghiệp, an toàn và đẳng cấp. Chúng tôi không ngừng cải tiến dịch vụ để mang lại những giá trị trải nghiệm trọn vẹn và an tâm nhất cho mỗi hành trình của bạn.
                            </p>
                            
                            {/* Stats Cards */}
                            <div className="grid grid-cols-3 gap-4 pt-4">
                                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm text-center transition-all duration-300 hover:shadow-md">
                                    <div className="text-2xl md:text-3xl font-black text-primary">15+</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Năm kinh nghiệm</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm text-center transition-all duration-300 hover:shadow-md">
                                    <div className="text-2xl md:text-3xl font-black text-secondary">1M+</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Khách hài lòng</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm text-center transition-all duration-300 hover:shadow-md">
                                    <div className="text-2xl md:text-3xl font-black text-emerald-600">99.8%</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Đánh giá 5 sao</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Features Grid */}
                        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Feature Card 1 */}
                            <div className="flex flex-col gap-4 p-6 rounded-3xl bg-white shadow-sm border border-slate-100/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                                    <span className="material-symbols-outlined text-[26px]">verified</span>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-base">Uy tín hàng đầu</h3>
                                    <p className="text-xs text-slate-550 mt-2 leading-relaxed">
                                        Chúng tôi được tin tưởng bởi hơn 1 triệu lượt khách hàng. Cam kết bảo đảm quyền lợi tối đa cho mọi chuyến đi.
                                    </p>
                                </div>
                            </div>

                            {/* Feature Card 2 */}
                            <div className="flex flex-col gap-4 p-6 rounded-3xl bg-white shadow-sm border border-slate-100/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
                                    <span className="material-symbols-outlined text-[26px]">support_agent</span>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-base">Hỗ trợ 24/7</h3>
                                    <p className="text-xs text-slate-550 mt-2 leading-relaxed">
                                        Đội ngũ chuyên nghiệp luôn sẵn sàng hỗ trợ khách hàng mọi lúc, mọi nơi trên phạm vi toàn cầu.
                                    </p>
                                </div>
                            </div>

                            {/* Feature Card 3 */}
                            <div className="flex flex-col gap-4 p-6 rounded-3xl bg-white shadow-sm border border-slate-100/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 shadow-inner">
                                    <span className="material-symbols-outlined text-[26px]">security</span>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-base">An toàn tuyệt đối</h3>
                                    <p className="text-xs text-slate-555 mt-2 leading-relaxed">
                                        Lịch trình được khảo sát kỹ lưỡng, hướng dẫn viên chuyên nghiệp và bảo hiểm du lịch toàn diện.
                                    </p>
                                </div>
                            </div>

                            {/* Feature Card 4 */}
                            <div className="flex flex-col gap-4 p-6 rounded-3xl bg-white shadow-sm border border-slate-100/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-inner">
                                    <span className="material-symbols-outlined text-[26px]">local_activity</span>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-base">Trải nghiệm độc bản</h3>
                                    <p className="text-xs text-slate-555 mt-2 leading-relaxed">
                                        Các hoạt động khám phá độc quyền, dịch vụ lưu trú thượng hạng chuẩn quốc tế.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-24 bg-white border-t border-b border-slate-100">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <span className="text-secondary font-bold text-xs uppercase tracking-widest bg-secondary/10 px-4 py-1.5 rounded-full border border-secondary/20">
                            Cảm nhận khách hàng
                        </span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Đánh giá từ khách hàng</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Testimonial 1 */}
                        <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-200/60 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <p className="text-slate-650 font-medium text-xs leading-relaxed mb-6 italic">
                                "Dịch vụ tuyệt vời! Tour Sapa của Chip3Chip tổ chức rất chu đáo, hướng dẫn viên nhiệt tình và khách sạn 5 sao cực kỳ đẳng cấp. Gia đình tôi rất hài lòng."
                            </p>
                            <div className="flex items-center gap-4 border-t border-slate-200/50 pt-4">
                                <img className="w-12 h-12 rounded-full object-cover border border-primary/10 shadow-sm" alt="Nguyễn Văn Nam avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyYDTaLlcjUSexakPA_46fM-8-WdqU_dtNwTlsfsT1iO7aFkPUpj_wsFjnQgBJPN8P74-7Ut_swk6zZ73sWAb-kToL8HPg3XRLzfbr5X-jd78naVcp8O6-fq5doWfJ854C-s4vlxxEfZY2IfH4pmVbdsyPtxjrv35xaA2CN9Yhjl6d_U-jNDPR3VyOeGEQ0ksQjr5OjYGcQlyw-ggX0QFoUwqKCfYGlje8fyylJoMH8zreDud10K5znyU_ZTF17UqQnwF0iPrQCnpK" />
                                <div>
                                    <div className="font-bold text-xs text-slate-800">Nguyễn Văn Nam</div>
                                    <div className="flex text-amber-500 mt-1">
                                        {[1,2,3,4,5].map(star => <span key={star} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Testimonial 2 */}
                        <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-200/60 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <p className="text-slate-650 font-medium text-xs leading-relaxed mb-6 italic">
                                "Tôi đã đặt tour Phú Quốc qua ứng dụng, thao tác rất nhanh và tiện lợi. Giá cả cạnh tranh so với các bên khác. Chắc chắn sẽ quay lại!"
                            </p>
                            <div className="flex items-center gap-4 border-t border-slate-200/50 pt-4">
                                <img className="w-12 h-12 rounded-full object-cover border border-primary/10 shadow-sm" alt="Trần Thị Lan avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAe4c7PZCMoftBFS93iygVzLAHuYGa-Zmz04MSnUt3Yj5K6nm2sEFdLpw2v9G8Z7X-tXp_9kmXFpwdzcU1vyZNw3kP8QViDNeLliy1w47USIFzjWdmuP5BPhVlOhLJWaxVFA8sEvbxzVPNTpNtk8HE4VdWUCmUiwg0HWBr4uCAnA8wHA-eLfgAttedVYgUjEFH824tM0LgstjBKo7AXdt5RjpHJDP17lYcfVJj-QGKk-EXvGz8X3eIXQ8rxebIJgikFXSd0cFefNGcy" />
                                <div>
                                    <div className="font-bold text-xs text-slate-800">Trần Thị Lan</div>
                                    <div className="flex text-amber-500 mt-1">
                                        {[1,2,3,4,5].map(star => <span key={star} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Testimonial 3 */}
                        <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-200/60 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <p className="text-slate-650 font-medium text-xs leading-relaxed mb-6 italic">
                                "Sự an tâm là điều tôi tìm kiếm và Chip3Chip đã đáp ứng hoàn hảo. Lịch trình hợp lý cho người lớn tuổi, không quá dồn dập."
                            </p>
                            <div className="flex items-center gap-4 border-t border-slate-200/50 pt-4">
                                <img className="w-12 h-12 rounded-full object-cover border border-primary/10 shadow-sm" alt="Phạm Minh Đức avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAc1JW0LzjP55KRD_9x-zl9Qz8QvYS05IxZ_F-SCS6DwXKYXD0Dc_xVnvxKwPASEjONZSq7L_nGf-nJXO0424cS5MjruxwEbYa_G8vu0m4JVdAnU_n_wG9LH6BriFxBCBnEz7XVqIWTCSx-ba6g9nJJhM41yAc5cSaOkxQJoWsURtuctf8pkc13ZfuJe5pZqxmNTko_57oiH3r-5vfPSkY4i8EE_E3kkwCgIiNTEoyVxlSTBk0VpqZemKK8aUOytEK1vj500k7Hgax2" />
                                <div>
                                    <div className="font-bold text-xs text-slate-800">Phạm Minh Đức</div>
                                    <div className="flex text-amber-500 mt-1">
                                        {[1,2,3,4,5].map(star => <span key={star} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section - Bright premium background */}
            <section id="contact-section" className="py-24 bg-slate-50 text-slate-800">
                <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
                        <div>
                            <span className="text-primary font-bold text-xs uppercase tracking-widest bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                                Kết nối ngay
                            </span>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">Liên Hệ Với Chúng Tôi</h2>
                            <p className="text-slate-500 text-sm mt-3 leading-relaxed">Đừng ngần ngại liên hệ nếu bạn có bất kỳ thắc mắc nào về chuyến đi sắp tới.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
                                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-primary text-[20px]">call</span>
                                </div>
                                <span className="font-bold text-xs md:text-sm text-slate-700">Hotline: 1900 6789 (24/7)</span>
                            </div>
                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
                                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
                                </div>
                                <span className="font-bold text-xs md:text-sm text-slate-700">Địa chỉ: Số 1, đường Võ Văn Ngân, phường Thủ Đức, Thành phố Hồ Chí Minh</span>
                            </div>
                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
                                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-primary text-[20px]">mail</span>
                                </div>
                                <span className="font-bold text-xs md:text-sm text-slate-700">Email: contact@chip3chip.com</span>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-7 bg-white p-8 rounded-[32px] text-slate-800 shadow-xl border border-slate-100">
                        <form onSubmit={(e) => { e.preventDefault(); showToast("Cảm ơn yêu cầu tư vấn! Chúng tôi sẽ liên hệ lại sớm nhất.", "success"); e.target.reset(); }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input required className="w-full px-4 py-3.5 border border-slate-200 rounded-xl font-bold text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Họ và tên" type="text" />
                                <input required className="w-full px-4 py-3.5 border border-slate-200 rounded-xl font-bold text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Email" type="email" />
                            </div>
                            <input required className="w-full px-4 py-3.5 border border-slate-200 rounded-xl font-bold text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Số điện thoại" type="text" />
                            <textarea required className="w-full px-4 py-3.5 border border-slate-200 rounded-xl font-bold text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all" placeholder="Lời nhắn của bạn" rows="4"></textarea>
                            <button className="w-full bg-primary hover:bg-primary-container text-white font-extrabold text-xs uppercase tracking-wider py-4 rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-primary/10">Gửi yêu cầu tư vấn</button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Footer - Clean light style */}
            <footer className="w-full py-16 px-6 bg-slate-50 grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-slate-200">
                <div className="flex flex-col gap-4">
                    <div className="text-xl font-black text-primary tracking-tight">Chip3Chip</div>
                    <p className="text-slate-500 font-semibold text-xs leading-relaxed">
                        Đồng hành cùng bạn trên mọi nẻo đường thế giới. Chất lượng và uy tín là kim chỉ nam của chúng tôi.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">Công Ty</h4>
                    <a className="text-slate-500 hover:text-primary transition-all font-semibold text-xs" href="#about-us-section">Về chúng tôi</a>
                    <a className="text-slate-500 hover:text-primary transition-all font-semibold text-xs" href="#featured-tours-section">Đội ngũ chuyên gia</a>
                    <a className="text-slate-500 hover:text-primary transition-all font-semibold text-xs" href="#contact-section">Tuyển dụng</a>
                </div>
                <div className="flex flex-col gap-3">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">Hỗ Trợ</h4>
                    <a className="text-slate-500 hover:text-primary transition-all font-semibold text-xs" href="#contact-section">Trung tâm trợ giúp</a>
                    <a className="text-slate-500 hover:text-primary transition-all font-semibold text-xs" href="#contact-section">Chính sách bảo mật</a>
                    <a className="text-slate-500 hover:text-primary transition-all font-semibold text-xs" href="#contact-section">Điều khoản dịch vụ</a>
                </div>
                <div className="flex flex-col gap-3">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">Kết Nối</h4>
                    <div className="flex gap-3">
                        <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:scale-105 transition cursor-pointer shadow-sm"><span className="material-symbols-outlined text-[18px]">public</span></span>
                        <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:scale-105 transition cursor-pointer shadow-sm"><span className="material-symbols-outlined text-[18px]">share</span></span>
                    </div>
                    <div className="mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                        © 2026 Hệ sinh thái du lịch Chip3Chip. Bảo lưu mọi quyền.
                    </div>
                </div>
            </footer>

            {/* Step 1: Interactive Booking Configuration Modal */}
            {bookingConfigTour && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="app-modal-panel app-modal-panel-lg bg-white rounded-[32px] p-8 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200 my-8 text-neutral-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-neutral-900">Thông Tin Đặt Tour</h3>
                            <button 
                                onClick={() => setBookingConfigTour(null)}
                                className="text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="bg-orange-50/60 border border-orange-100 p-4 rounded-2xl mb-6 flex items-start gap-4">
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

                        <form onSubmit={handleConfirmBooking} className="space-y-5">
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

            {/* Step 2: Flying Mascot Animation */}
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

            {/* Step 3: Payment Mock Simulators */}
            {showPaymentSimulator === 'vnpay' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
                    <div className="app-modal-panel app-modal-panel-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-blue-200 animate-in fade-in zoom-in-95 duration-200 text-neutral-800">
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
                                    <span className="font-black text-neutral-800">CHIP3CHIP TRAVELS CO.</span>
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
                                    <span className="text-lg font-black text-blue-600">{formatPrice(bookingConfigTour?.basePrice)}</span>
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
                                        showToast("Giao dịch thanh toán mô phỏng đã bị hủy.", "info");
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
                    <div className="app-modal-panel app-modal-panel-sm bg-white rounded-2xl overflow-hidden shadow-2xl border border-pink-200 animate-in fade-in zoom-in-95 duration-200 text-neutral-850">
                        <div className="bg-pink-600 text-white p-6 text-center relative">
                            <span className="material-symbols-outlined text-4xl animate-pulse">qr_code_2</span>
                            <h3 className="font-extrabold text-lg tracking-tight mt-1">THANH TOÁN QUA VÍ MOMO</h3>
                            <p className="text-pink-200 text-[10px] uppercase font-bold tracking-wider">MoMo Sandbox Simulated</p>
                        </div>

                        <div className="p-6 flex flex-col items-center">
                            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center mb-6">
                                <span className="material-symbols-outlined text-[100px] text-pink-600 animate-pulse">qr_code_2</span>
                            </div>

                            <div className="text-center w-full mb-6 bg-neutral-50 py-3 px-4 rounded-xl border border-neutral-200/50 text-neutral-800">
                                <span className="text-xs text-neutral-400 font-bold block uppercase tracking-wider">Số tiền cần thanh toán</span>
                                <span className="text-xl font-black text-pink-600">{formatPrice(bookingConfigTour?.basePrice)}</span>
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
                                    showToast("Giao dịch thanh toán MoMo mô phỏng đã hủy.", "info");
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
                    <div className="app-modal-panel bg-white rounded-[32px] p-8 shadow-2xl border border-neutral-100 text-center animate-in fade-in zoom-in-95 duration-200 text-neutral-800">
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

            {toast && (
                <div className="fixed bottom-6 right-6 z-[10000] animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-md ${
                        toast.type === 'success' 
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' 
                            : toast.type === 'error' 
                            ? 'bg-rose-50/90 border-rose-200 text-rose-800' 
                            : 'bg-blue-50/90 border-blue-200 text-blue-800'
                    }`}>
                        <span className="material-symbols-outlined text-[22px]">
                            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
                        </span>
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] font-black uppercase tracking-wider">
                                {toast.type === 'success' ? 'Thành công' : toast.type === 'error' ? 'Thất bại' : 'Thông báo'}
                            </span>
                            <span className="text-[13px] font-semibold mt-0.5">{toast.message}</span>
                        </div>
                        <button 
                            onClick={() => setToast(null)} 
                            className="ml-2 hover:opacity-75 transition-opacity cursor-pointer flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Homepage;
