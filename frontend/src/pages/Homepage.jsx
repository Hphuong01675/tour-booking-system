import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../features/auth/authSlice";
import axiosInstance from "../api/axiosInstance";

const Homepage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDestination, setSelectedDestination] = useState("");
    const [bookingSuccessModal, setBookingSuccessModal] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    
    // Tab States: "tours" (left), "home" (middle, default), "about" (right)
    const [activeTab, setActiveTab] = useState("home");

    // Booking & Simulation Flow States
    const [bookingConfigTour, setBookingConfigTour] = useState(null);
    const [bookingConfigScheduleId, setBookingConfigScheduleId] = useState(null);
    const [travelerInfo, setTravelerInfo] = useState({ fullName: "", phone: "", idNumber: "" });
    const [paymentMethod, setPaymentMethod] = useState("vnpay");
    const [mascotAnimation, setMascotAnimation] = useState(null); // { startX, startY, endX, endY }
    const [shakeMyTours, setShakeMyTours] = useState(false);
    const [showPaymentSimulator, setShowPaymentSimulator] = useState(null); // 'vnpay' | 'momo' | null

    // Chat Bubble States
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { id: 1, sender: "bot", text: "Xin chào! Cảm ơn bạn đã ghé thăm Chip3Chip. Mình có thể giúp gì cho bạn hôm nay?", time: "Vừa xong" }
    ]);
    const [currentChatMessage, setCurrentChatMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);

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
            let replyText = "Cảm ơn thông tin của bạn. Hỗ trợ viên Chip3Chip sẽ phản hồi ngay lập tức hoặc bạn có thể liên hệ hotline 1900.6868 nhé!";
            const textLower = userText.toLowerCase();
            if (textLower.includes("tour") || textLower.includes("lộ trình") || textLower.includes("ngày")) {
                replyText = "Hiện tại Chip3Chip đang mở bán nhiều tour hấp dẫn (Hạ Long, Đà Lạt, Sơn Đoòng). Bạn có thể xem chi tiết ở Tab 'Tour du lịch' nhé!";
            } else if (textLower.includes("giá") || textLower.includes("tiền") || textLower.includes("vnpay") || textLower.includes("momo") || textLower.includes("thanh toán")) {
                replyText = "Hệ thống hỗ trợ thanh toán tự động tiện lợi qua VNPay & MoMo mô phỏng. Vé QR Code sẽ được gửi ngay sau khi xác nhận thanh toán thành công!";
            } else if (textLower.includes("chào") || textLower.includes("hello") || textLower.includes("hi")) {
                replyText = "Xin chào! Chúc bạn một ngày tốt lành. Mình có thể hỗ trợ thông tin gì về các chặng tour sắp khởi hành không?";
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

    const handleQuickQuestion = (questionText) => {
        const userMsg = {
            id: Date.now(),
            sender: "user",
            text: questionText,
            time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        };

        setChatMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        setTimeout(() => {
            let replyText = "Cảm ơn thông tin của bạn. Hỗ trợ viên Chip3Chip sẽ phản hồi ngay lập tức hoặc bạn có thể liên hệ hotline 1900.6868 nhé!";
            const textLower = questionText.toLowerCase();
            if (textLower.includes("tour")) {
                replyText = "Hiện tại Chip3Chip đang mở bán nhiều tour hấp dẫn (Hạ Long, Đà Lạt, Sơn Đoòng). Bạn có thể chọn ngày và nhấn 'Đặt Tour' để trải nghiệm!";
            } else if (textLower.includes("thanh toán")) {
                replyText = "Hệ thống hỗ trợ thanh toán mô phỏng tiện lợi qua VNPay hoặc MoMo. Trải nghiệm đặt tour mượt mà, cập nhật chỗ tức thì!";
            } else if (textLower.includes("yêu thích")) {
                replyText = "Bạn có thể nhấn vào biểu tượng trái tim ❤️ ở mỗi tour để lưu vào mục yêu thích. Sẽ có hiệu ứng trái tim bay cực đẹp hướng về nút My Tours đấy!";
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

    // Track scroll to change header style dynamically
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Fetch tours on load
    useEffect(() => {
        const fetchTours = async () => {
            try {
                const response = await axiosInstance.get("/api/tours");
                setTours(response.data.tours || []);
            } catch (err) {
                setError("Không thể tải danh sách tour. Vui lòng thử lại sau.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTours();
    }, []);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/");
    };

    const [selectedSchedules, setSelectedSchedules] = useState({});

    const handleScheduleChange = (tourId, scheduleId) => {
        setSelectedSchedules((prev) => ({ ...prev, [tourId]: scheduleId }));
    };

    const handleAddToWishlist = async (e, tourId) => {
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
            setShakeMyTours(true);
            setTimeout(() => setShakeMyTours(false), 1200);
            setMascotAnimation(null);

            try {
                const response = await axiosInstance.post("/api/customer/wishlist", {
                    tourId
                });
                if (response.data.success) {
                    // Added successfully!
                }
            } catch (err) {
                console.error("Lỗi khi thêm wishlist:", err);
                alert("Không thể lưu tour. Vui lòng thử lại.");
            }
        }, 3000);
    };

    const handleBookTour = async (tour) => {
        const scheduleId = selectedSchedules[tour.id] || (tour.schedules && tour.schedules[0]?.id);

        if (!scheduleId) {
            alert("Xin lỗi, tour này hiện tại chưa có lịch trình mở đăng ký.");
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
                alert("Đã xảy ra lỗi. Vui lòng thử lại.");
            }
        } else {
            if (user.role !== "customer") {
                alert("Tài khoản của bạn không phải là Khách hàng. Vui lòng đăng nhập tài khoản Khách hàng để đặt tour.");
                return;
            }

            // Open the interactive details setup screen modal
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
        
        // Find the button within the form to get coordinates
        const submitBtn = document.getElementById("confirm-booking-btn-submit");
        const startRect = submitBtn ? submitBtn.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 200, height: 50 };
        
        const targetEl = document.getElementById("my-tours-nav-btn");
        const targetRect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth - 180, top: 20, width: 100, height: 40 };

        const startX = startRect.left + startRect.width / 2;
        const startY = startRect.top + startRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;

        setMascotAnimation({
            startX,
            startY,
            endX,
            endY
        });

        // Trigger Mascot flight (Slowed down to 3.0s)
        setTimeout(() => {
            setShakeMyTours(true);
            setTimeout(() => setShakeMyTours(false), 1200);
            setMascotAnimation(null);
            
            // Switch from config modal to payment simulator
            setBookingConfigTour(null);
            setShowPaymentSimulator(paymentMethod);
        }, 3000);
    };

    const handleSimulatorPaymentSuccess = async () => {
        try {
            const response = await axiosInstance.post("/api/customer/bookings", {
                scheduleId: bookingConfigScheduleId,
                status: "paid", // Set status directly to paid since simulated successfully
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
            console.error("Lỗi khi tạo booking:", err);
            alert(err.response?.data?.error || "Không thể hoàn tất đơn đặt tour. Vui lòng thử lại.");
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

    const filteredTours = tours.filter((tour) => {
        const matchesSearch = tour.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tour.destination.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDest = selectedDestination === "" || tour.destination.toLowerCase().includes(selectedDestination.toLowerCase());
        return matchesSearch && matchesDest;
    });

    const uniqueDestinations = Array.from(new Set(tours.map((t) => t.destination.split(" - ")[0])));

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-800 flex flex-col font-sans overflow-x-hidden selection:bg-rose-500 selection:text-white">
            {/* Inject CSS Animations & Custom Glowing classes */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes floatEffect {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes pulseSoft {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
                    50% { box-shadow: 0 0 20px 4px rgba(244, 63, 94, 0.15); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-float {
                    animation: floatEffect 4s ease-in-out infinite;
                }
                .animate-pulse-soft {
                    animation: pulseSoft 2s infinite;
                }
                .stagger-1 { animation-delay: 0.05s; }
                .stagger-2 { animation-delay: 0.1s; }
                .stagger-3 { animation-delay: 0.15s; }
                .stagger-4 { animation-delay: 0.2s; }
                
                .glass-header {
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .glass-header-active {
                    background: rgba(255, 255, 255, 0.85) !important;
                    backdrop-filter: blur(16px);
                    border-bottom: 1px solid rgba(229, 231, 235, 0.8);
                    padding-top: 12px !important;
                    padding-bottom: 12px !important;
                    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
                }
                .tour-card {
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .tour-card:hover {
                    transform: translateY(-8px) scale(1.01);
                    box-shadow: 0 20px 30px -10px rgba(244, 63, 94, 0.12);
                    border-color: rgba(244, 63, 94, 0.3);
                }
                .tour-image-zoom {
                    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .tour-card:hover .tour-image-zoom {
                    transform: scale(1.08);
                }
                .fiery-gradient-text {
                    background: linear-gradient(to right, #f97316, #e11d48, #d946ef);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .fiery-button {
                    background: linear-gradient(135deg, #f97316, #e11d48);
                    transition: all 0.3s ease;
                }
                .fiery-button:hover {
                    box-shadow: 0 8px 20px -4px rgba(244, 63, 94, 0.4);
                    filter: brightness(1.05);
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0) scale(1); }
                    25% { transform: translateX(-6px) rotate(-4deg) scale(1.1); }
                    75% { transform: translateX(6px) rotate(4deg) scale(1.1); }
                }
                .shake-btn {
                    animation: shake 0.25s ease infinite;
                }
                @keyframes flyMascot {
                    0% {
                        transform: translate(0, 0) scale(0.3) rotate(0deg);
                        opacity: 0;
                    }
                    15% {
                        opacity: 1;
                        transform: translate(calc(var(--tx) * 0.15), calc(var(--ty) * 0.15 - 120px)) scale(1.3) rotate(-15deg);
                    }
                    85% {
                        opacity: 1;
                        transform: translate(calc(var(--tx) * 0.85), calc(var(--ty) * 0.85 - 80px)) scale(1) rotate(15deg);
                    }
                    100% {
                        transform: translate(var(--tx), var(--ty)) scale(0.2) rotate(360deg);
                        opacity: 0;
                    }
                }
                .flying-mascot {
                    position: fixed;
                    z-index: 9999;
                    pointer-events: none;
                    animation: flyMascot 3.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                }
            `}</style>

            {/* Navigation Header */}
            <header className={`sticky top-0 z-50 w-full bg-white/80 border-b border-neutral-200/50 px-6 py-5 md:px-12 flex justify-between items-center glass-header ${scrolled ? "glass-header-active" : ""}`}>
                <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-rose-500 text-3xl font-black animate-float">explore</span>
                    <Link className="text-2xl font-black tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent" to="/">
                        Chip3Chip
                    </Link>
                </div>

                {/* 3-Tab Sliding Navigation Pill (Vibrant Sunset Style on Light theme) */}
                <div className="relative flex bg-neutral-200/60 p-1 rounded-full border border-neutral-300/40 w-full max-w-[390px] md:max-w-[420px]">
                    <div 
                        className="absolute top-1 bottom-1 bg-white rounded-full shadow-md transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)" 
                        style={{
                            left: activeTab === "tours" ? "4px" : activeTab === "home" ? "calc(33.333% + 2px)" : "calc(66.666% + 2px)",
                            width: "calc(33.333% - 6px)"
                        }}
                    />
                    <button 
                        onClick={() => {
                            setActiveTab("tours");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }} 
                        className={`relative z-10 flex-1 text-center py-2.5 text-[10px] md:text-xs font-black uppercase tracking-wider transition-colors duration-300 cursor-pointer ${activeTab === 'tours' ? 'text-rose-600' : 'text-neutral-500'}`}
                    >
                        Tour du lịch
                    </button>
                    <button 
                        onClick={() => {
                            setActiveTab("home");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }} 
                        className={`relative z-10 flex-1 text-center py-2.5 text-[10px] md:text-xs font-black uppercase tracking-wider transition-colors duration-300 cursor-pointer ${activeTab === 'home' ? 'text-rose-600' : 'text-neutral-500'}`}
                    >
                        Trang chủ
                    </button>
                    <button 
                        onClick={() => {
                            setActiveTab("about");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }} 
                        className={`relative z-10 flex-1 text-center py-2.5 text-[10px] md:text-xs font-black uppercase tracking-wider transition-colors duration-300 cursor-pointer ${activeTab === 'about' ? 'text-rose-600' : 'text-neutral-500'}`}
                    >
                        Về chúng tôi
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-gradient-to-r from-rose-500/10 to-orange-500/10 px-3.5 py-1.5 rounded-full border border-orange-200/50 shadow-sm">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-rose-500 text-white flex items-center justify-center text-xs font-black shadow-sm uppercase">
                                    {user?.fullName?.charAt(0) || "U"}
                                </div>
                                <span className="hidden lg:inline text-xs font-black text-neutral-800">
                                    {user?.fullName}
                                </span>
                            </div>
                            <Link
                                id="my-tours-nav-btn"
                                to={user.role === "customer" ? "/customer/tours" : user.role === "guide" ? "/guides/tours" : user.role === "operator" ? "/operator/dashboard" : "/admin/dashboard"}
                                className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white fiery-button rounded-full shadow-md hover:shadow-lg transform active:scale-95 transition-all ${shakeMyTours ? "shake-btn" : ""}`}
                            >
                                {user.role === "customer" ? "🎒 My Tours" : "🔑 Dashboard"}
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-3.5 py-2 text-xs font-bold text-neutral-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]">logout</span>
                                Đăng xuất
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/login" className="px-4 py-2.5 text-sm font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all">
                                Đăng nhập
                            </Link>
                            <Link to="/register" className="px-5 py-2.5 text-sm font-extrabold text-white fiery-button rounded-xl shadow-md transform active:scale-95">
                                Đăng ký
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            {/* Sliding Content Container (3 columns: Left, Middle, Right) */}
            <div className="w-full overflow-hidden flex-grow bg-white">
                <div 
                    className="flex w-[300%] transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1)"
                    style={{
                        transform: activeTab === "tours" ? "translateX(0%)" : activeTab === "home" ? "translateX(-33.3333%)" : "translateX(-66.6666%)"
                    }}
                >
                    {/* View 1: Left Tab - Tours List */}
                    <div className="w-1/3 shrink-0 flex flex-col">
                        {/* Tours List Content */}
                        <div className="max-w-7xl mx-auto px-6 py-16 md:px-12 w-full">
                            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                                <div>
                                    <span className="text-rose-500 font-black text-xs uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100">Khám phá Việt Nam</span>
                                    <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mt-2.5">Các Hành Trình Đang Mở Đăng Ký</h2>
                                </div>
                                <div className="text-sm text-neutral-500 font-semibold bg-neutral-100 px-4 py-2 rounded-full border border-neutral-200">
                                    Hiển thị <span className="text-rose-600 font-black">{filteredTours.length}</span> tour
                                </div>
                            </div>

                            {/* Filter bar */}
                            <div className="bg-white p-4 rounded-3xl shadow-md flex flex-col md:flex-row gap-3 text-neutral-850 max-w-3xl mx-auto border border-neutral-200/80 mb-12">
                                <div className="flex-1 flex items-center gap-2.5 border border-neutral-200 rounded-2xl px-4 py-3 bg-neutral-50 focus-within:bg-white transition-all">
                                    <span className="material-symbols-outlined text-neutral-400">search</span>
                                    <input
                                        type="text"
                                        placeholder="Tìm tour, điểm đến..."
                                        className="w-full bg-transparent border-none outline-none text-sm font-semibold text-neutral-700 placeholder-neutral-400"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1 flex items-center gap-2.5 border border-neutral-200 rounded-2xl px-4 py-3 bg-neutral-50 focus-within:bg-white transition-all">
                                    <span className="material-symbols-outlined text-neutral-400">location_on</span>
                                    <select
                                        className="w-full bg-transparent border-none outline-none text-sm font-semibold text-neutral-600 cursor-pointer"
                                        value={selectedDestination}
                                        onChange={(e) => setSelectedDestination(e.target.value)}
                                    >
                                        <option value="">Tất cả địa điểm</option>
                                        {uniqueDestinations.map((dest) => (
                                            <option key={dest} value={dest}>{dest}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex justify-center items-center h-48">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-500" />
                                </div>
                            ) : error ? (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 text-center">
                                    {error}
                                </div>
                            ) : filteredTours.length === 0 ? (
                                <div className="bg-white rounded-3xl border border-neutral-200 p-16 text-center shadow-sm max-w-lg mx-auto">
                                    <span className="material-symbols-outlined text-5xl text-neutral-300 mb-3">sentiment_dissatisfied</span>
                                    <p className="text-neutral-500 text-lg font-bold">Không tìm thấy tour phù hợp.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredTours.map((tour, index) => {
                                        const currentSelectedSchedule = selectedSchedules[tour.id] || (tour.schedules && tour.schedules[0]?.id);
                                        const animationDelayClass = `stagger-${(index % 4) + 1}`;

                                        return (
                                            <div key={tour.id} className={`bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-sm tour-card flex flex-col group h-full animate-fade-in-up ${animationDelayClass}`}>
                                                <div className="relative h-52 overflow-hidden">
                                                    <img
                                                        src={tour.thumbnailUrl || "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=250&fit=crop"}
                                                        alt={tour.title}
                                                        className="w-full h-full object-cover tour-image-zoom"
                                                    />
                                                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3.5 py-1.5 rounded-full text-[10px] font-black text-rose-600 border border-rose-100 uppercase tracking-wider shadow-sm">
                                                        {tour.difficulty === "hard" ? "Thám hiểm" : "Nghỉ dưỡng"}
                                                    </div>
                                                    <div className="absolute bottom-4 right-4 bg-neutral-900/75 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[15px] text-orange-400">schedule</span>
                                                        {tour.durationDays} Ngày {tour.durationNights} Đêm
                                                    </div>
                                                </div>

                                                <div className="p-6 flex-grow flex flex-col justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-black text-neutral-900 leading-snug group-hover:text-rose-600 transition-colors mb-2 line-clamp-2">
                                                            {tour.title}
                                                        </h3>
                                                        <p className="text-rose-500 text-xs font-extrabold flex items-center gap-1 mb-4 uppercase tracking-wider">
                                                            <span className="material-symbols-outlined text-sm text-orange-500">location_on</span>
                                                            {tour.destination}
                                                        </p>
                                                        <p className="text-neutral-500 text-sm line-clamp-3 mb-6 leading-relaxed">
                                                            {tour.description}
                                                        </p>
                                                    </div>

                                                    <div className="pt-6 border-t border-neutral-100 space-y-4">
                                                        {tour.schedules && tour.schedules.length > 0 ? (
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Chọn ngày khởi hành:</label>
                                                                <select
                                                                    className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl px-4 py-3 text-sm font-bold text-neutral-700 outline-none cursor-pointer focus:border-rose-500 focus:bg-white transition-all shadow-sm"
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
                                                            <p className="text-xs font-bold text-orange-600 bg-orange-50 p-3 rounded-2xl text-center border border-orange-100">Lịch khởi hành sắp cập nhật</p>
                                                        )}

                                                        <div className="flex items-center justify-between gap-4 pt-2">
                                                            <div>
                                                                <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">Giá trọn gói</span>
                                                                <span className="text-xl font-black text-rose-600">{formatPrice(tour.basePrice)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => handleAddToWishlist(e, tour.id)}
                                                                    className="p-3 rounded-2xl border border-neutral-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 transition-colors flex items-center justify-center cursor-pointer"
                                                                    title="Thêm vào kho lưu trữ"
                                                                >
                                                                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleBookTour(tour)}
                                                                    disabled={!tour.schedules || tour.schedules.length === 0}
                                                                    className="px-6 py-3.5 text-sm font-black text-white fiery-button rounded-2xl shadow-md transform active:scale-95 disabled:from-neutral-200 disabled:to-neutral-300 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:transform-none"
                                                                >
                                                                    Đặt Tour
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* View 2: Middle Tab - Main Homepage */}
                    <div className="w-1/3 shrink-0 flex flex-col">
                        <div className="max-w-7xl mx-auto px-6 py-16 md:px-12 w-full text-center">
                            <span className="text-rose-600 font-black text-xs uppercase tracking-widest bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-100 animate-pulse-soft">Chào mừng đến với Chip3Chip</span>
                            <h2 className="text-3xl md:text-5xl font-black text-neutral-900 leading-tight tracking-tight mt-6">
                                Trải Nghiệm Du Lịch Đỉnh Cao <br /><span className="fiery-gradient-text">Bùng Cháy Cảm Xúc</span>
                            </h2>
                            <p className="text-neutral-500 text-sm md:text-base mt-4 max-w-xl mx-auto leading-relaxed">
                                Chúng đồng hành cùng bạn trên mọi nẻo đường, cung cấp giải pháp đặt giữ chỗ tour du lịch trực tuyến nhanh chóng, bảo mật và tốt nhất.
                            </p>

                            <div className="flex flex-wrap justify-center gap-4 mt-10">
                                <button 
                                    onClick={() => setActiveTab("tours")}
                                    className="px-8 py-4 fiery-button text-white font-extrabold rounded-2xl shadow-lg transform active:scale-95 text-sm flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">explore</span> Khám phá Tour
                                </button>
                                <button 
                                    onClick={() => setActiveTab("about")}
                                    className="px-8 py-4 bg-neutral-200/60 hover:bg-neutral-200 text-neutral-800 font-extrabold rounded-2xl transition-all transform active:scale-95 text-sm"
                                >
                                    Về chúng tôi
                                </button>
                            </div>

                            {/* Vibrant Image Cards Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-16 max-w-5xl mx-auto">
                                <div className="h-44 md:h-64 rounded-3xl overflow-hidden shadow-sm relative group border border-neutral-200 hover:border-rose-500/40 transition-all duration-300">
                                    <img src="https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=300&h=400&fit=crop" alt="Hạ Long" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent" />
                                    <span className="absolute bottom-4 left-4 font-black text-white text-sm">Vịnh Hạ Long</span>
                                </div>
                                <div className="h-44 md:h-64 rounded-3xl overflow-hidden shadow-sm relative group mt-4 md:mt-8 border border-neutral-200 hover:border-rose-500/40 transition-all duration-300">
                                    <img src="https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=300&h=400&fit=crop" alt="Đà Lạt" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent" />
                                    <span className="absolute bottom-4 left-4 font-black text-white text-sm">Đà Lạt</span>
                                </div>
                                <div className="h-44 md:h-64 rounded-3xl overflow-hidden shadow-sm relative group border border-neutral-200 hover:border-rose-500/40 transition-all duration-300">
                                    <img src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=300&h=400&fit=crop" alt="Sơn Đoòng" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent" />
                                    <span className="absolute bottom-4 left-4 font-black text-white text-sm">Hang Sơn Đoòng</span>
                                </div>
                                <div className="h-44 md:h-64 rounded-3xl overflow-hidden shadow-sm relative group mt-4 md:mt-8 border border-neutral-200 hover:border-rose-500/40 transition-all duration-300">
                                    <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop" alt="Tây Nguyên" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent" />
                                    <span className="absolute bottom-4 left-4 font-black text-white text-sm">Tây Nguyên</span>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto mt-20 p-8 bg-neutral-100 rounded-[32px] border border-neutral-200 shadow-inner">
                                <div className="text-center border-r border-neutral-200">
                                    <span className="text-2xl md:text-3xl font-black text-rose-600 block">10,000+</span>
                                    <span className="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-wider">Khách hàng hài lòng</span>
                                </div>
                                <div className="text-center border-r border-neutral-200">
                                    <span className="text-2xl md:text-3xl font-black text-orange-500 block">50+</span>
                                    <span className="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-wider">Hành trình độc đáo</span>
                                </div>
                                <div className="text-center">
                                    <span className="text-2xl md:text-3xl font-black text-purple-600 block">24/7</span>
                                    <span className="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-wider">Đội ngũ hỗ trợ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* View 3: Right Tab - About Us */}
                    <div className="w-1/3 shrink-0 flex flex-col">
                        <div className="max-w-7xl mx-auto px-6 py-16 md:px-12 w-full">
                            <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up stagger-1">
                                <span className="text-rose-600 font-black text-xs uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100">Giá trị cốt lõi</span>
                                <h2 className="text-3xl font-extrabold text-neutral-900 mt-3">Vì Sao Lựa Chọn Dịch Vụ Của Chip3Chip?</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up stagger-2">
                                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-neutral-200 hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group">
                                    <div className="bg-orange-50 p-5 rounded-2xl text-orange-500 mb-6 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                                        <span className="material-symbols-outlined text-4xl">local_police</span>
                                    </div>
                                    <h3 className="text-lg font-black text-neutral-900 mb-2">Đảm Bảo An Toàn Tuyệt Đối</h3>
                                    <p className="text-neutral-500 text-sm leading-relaxed">Bảo hiểm du lịch trọn gói cao cấp đi kèm sự đồng hành của đội ngũ HDV bản địa nhiều năm kinh nghiệm thực chiến.</p>
                                </div>
                                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-neutral-200 hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group">
                                    <div className="bg-rose-50 p-5 rounded-2xl text-rose-500 mb-6 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                                        <span className="material-symbols-outlined text-4xl">payments</span>
                                    </div>
                                    <h3 className="text-lg font-black text-neutral-900 mb-2">Giá Cả Cạnh Tranh & Rõ Ràng</h3>
                                    <p className="text-neutral-500 text-sm leading-relaxed">Cam kết chi phí minh bạch, không phí ẩn. Luôn có chiết khấu tốt nhất cho đặt tour sớm hoặc nhóm đông người.</p>
                                </div>
                                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-neutral-200 hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group">
                                    <div className="bg-purple-50 p-5 rounded-2xl text-purple-500 mb-6 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                                        <span className="material-symbols-outlined text-4xl">thumb_up</span>
                                    </div>
                                    <h3 className="text-lg font-black text-neutral-900 mb-2">Đặt Chỗ & Quản Lý Dễ Dàng</h3>
                                    <p className="text-neutral-500 text-sm leading-relaxed">Xác nhận giữ chỗ trực tiếp tích hợp thanh toán bảo mật. Quản lý toàn bộ vé hành trình, vé QR code chuyên nghiệp.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer id="footer" className="bg-neutral-900 text-neutral-400 py-16 px-6 md:px-12 w-full border-t border-neutral-800 shrink-0">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-rose-500 text-3xl font-black animate-float">explore</span>
                        <span className="text-white font-black text-xl tracking-tight">Chip3Chip</span>
                        <span className="text-neutral-700">|</span>
                        <span className="text-xs font-semibold text-neutral-500">© 2026 Chip3Chip. Tất cả bản quyền được bảo lưu.</span>
                    </div>
                    <div className="flex gap-8 text-xs font-bold">
                        <a href="#" className="hover:text-rose-500 transition-colors uppercase tracking-wider">Điều khoản sử dụng</a>
                        <a href="#" className="hover:text-rose-500 transition-colors uppercase tracking-wider">Chính sách bảo mật</a>
                        <a href="#" className="hover:text-rose-500 transition-colors uppercase tracking-wider">Hỗ trợ khách hàng</a>
                    </div>
                </div>
            </footer>

            {/* Booking Success Modal */}
            {bookingSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl border border-neutral-100 text-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl">check_circle</span>
                        </div>
                        <h3 className="text-2xl font-black text-neutral-900 mb-2">Đặt Tour Thành Công!</h3>
                        <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
                            Cảm ơn bạn đã đồng hành cùng Chip3Chip! Bạn đã đặt thành công tour <span className="text-neutral-950 font-bold">"{bookingSuccessModal.tourTitle}"</span>. 
                            Mã đơn đặt tour là <span className="text-rose-500 font-black bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">{bookingSuccessModal.bookingCode}</span>.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Link
                                to="/customer/tours"
                                className="w-full fiery-button text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.97] block text-sm"
                            >
                                Đi Tới Lịch Trình Đặt Tour
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

            {/* Step 1: Interactive Booking Configuration Modal */}
            {bookingConfigTour && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-[32px] max-w-lg w-full p-8 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200 my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-neutral-900">Thiết Lập Thông Tin Đặt Tour</h3>
                            <button 
                                onClick={() => setBookingConfigTour(null)}
                                className="text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Tour mini card summary */}
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

                            {/* Payment Method Selector */}
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
                        {mascotAnimation.type === "heart" ? "Đã thêm vào yêu thích!" : "Đang chuyển đơn vào My Tours..."}
                    </div>
                </div>
            )}

            {/* Step 3: Payment Mock Simulators */}
            {showPaymentSimulator === 'vnpay' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-blue-200 animate-in fade-in zoom-in-95 duration-200">
                        {/* VNPay Mock Header */}
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

                        {/* VNPay Mock Content */}
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
                                    <span className="text-lg font-black text-blue-600">{formatPrice(bookingConfigTour?.basePrice || 0)}</span>
                                </div>
                            </div>

                            <div className="border border-amber-200 bg-amber-50 p-4 rounded-xl text-xs text-amber-800 leading-relaxed">
                                <strong>⚠️ Lưu ý:</strong> Đây là cổng thanh toán mô phỏng sandbox giúp hoàn thành nhanh quy trình đặt tour và cấp vé QR Code tự động tức thì. Không thực hiện trừ tiền thật trên tài khoản của bạn.
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
                    <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-pink-200 animate-in fade-in zoom-in-95 duration-200">
                        {/* MoMo Mock Header */}
                        <div className="bg-pink-600 text-white p-6 text-center relative">
                            <span className="material-symbols-outlined text-4xl animate-pulse">qr_code_2</span>
                            <h3 className="font-extrabold text-lg tracking-tight mt-1">THANH TOÁN QUA VÍ MOMO</h3>
                            <p className="text-pink-200 text-[10px] uppercase font-bold tracking-wider">MoMo Sandbox Simulated</p>
                        </div>

                        {/* MoMo Mock Content */}
                        <div className="p-6 flex flex-col items-center">
                            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center mb-6">
                                <div className="w-36 h-36 border-4 border-pink-600 flex items-center justify-center relative p-1">
                                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-neutral-900" />
                                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-neutral-900" />
                                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-neutral-900" />
                                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-neutral-900" />
                                    <span className="material-symbols-outlined text-[100px] text-pink-600">qr_code_2</span>
                                </div>
                                <span className="text-[10px] text-neutral-400 font-mono font-bold mt-2">MÃ GIAO DỊCH: MOMO-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                            </div>

                            <div className="text-center w-full mb-6 bg-neutral-50 py-3 px-4 rounded-xl border border-neutral-200/50">
                                <span className="text-xs text-neutral-400 font-bold block uppercase tracking-wider">Số tiền cần thanh toán</span>
                                <span className="text-xl font-black text-pink-600">{formatPrice(bookingConfigTour?.basePrice || 0)}</span>
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
            {/* Mock Floating Chat Bubble */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
                {isChatOpen && (
                    <div className="w-80 md:w-96 h-[480px] bg-white/95 backdrop-blur-md rounded-[28px] border border-neutral-200/80 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-rose-500 text-white p-4 flex items-center justify-between shadow-md">
                            <div className="flex items-center gap-2.5">
                                <div className="relative">
                                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm uppercase">
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

                        {/* Message list */}
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

                        {/* Quick Questions suggestion pills */}
                        <div className="px-4 py-2 bg-neutral-100/50 border-t border-neutral-200/50 flex flex-wrap gap-1.5">
                            <button 
                                onClick={() => handleQuickQuestion("Tư vấn chọn Tour du lịch")}
                                className="text-[10px] bg-white hover:bg-rose-50 hover:text-rose-600 transition-all border border-neutral-200/60 rounded-full px-2.5 py-1 text-neutral-600 font-semibold"
                            >
                                🗺️ Chọn Tour
                            </button>
                            <button 
                                onClick={() => handleQuickQuestion("Thanh toán như thế nào?")}
                                className="text-[10px] bg-white hover:bg-rose-50 hover:text-rose-600 transition-all border border-neutral-200/60 rounded-full px-2.5 py-1 text-neutral-600 font-semibold"
                            >
                                💳 Thanh toán
                            </button>
                            <button 
                                onClick={() => handleQuickQuestion("Tính năng Yêu thích là gì?")}
                                className="text-[10px] bg-white hover:bg-rose-50 hover:text-rose-600 transition-all border border-neutral-200/60 rounded-full px-2.5 py-1 text-neutral-600 font-semibold"
                            >
                                ❤️ Yêu thích
                            </button>
                        </div>

                        {/* Footer Form */}
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

                {/* Floating Chat Trigger Button */}
                <button 
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="w-14 h-14 bg-gradient-to-tr from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
                >
                    <span className="material-symbols-outlined text-[26px]">
                        {isChatOpen ? "close" : "forum"}
                    </span>
                    {!isChatOpen && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600 border border-white"></span>
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Homepage;
