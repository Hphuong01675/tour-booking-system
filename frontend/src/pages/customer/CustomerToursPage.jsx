import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { fetchCurrentUser, logoutUser } from "../../features/auth/authSlice";
import axiosInstance from "../../api/axiosInstance";
import TopNavBar from "../../components/TopNavBar";

const CustomerToursPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading } = useSelector((state) => state.auth);

    const [bookings, setBookings] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [fetchingBookings, setFetchingBookings] = useState(true);
    const [fetchingWishlist, setFetchingWishlist] = useState(true);
    
    const [bookingsError, setBookingsError] = useState(null);
    const [wishlistError, setWishlistError] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);

    // Active Dashboard Tab: "bookings" or "wishlist" (Kho hàng)
    const [activeTab, setActiveTab] = useState("bookings");

    const searchParams = new URLSearchParams(location.search);
    const isReviewMode = searchParams.get("tab") === "review";

    useEffect(() => {
        if (isReviewMode) {
            setActiveTab("bookings");
        }
    }, [isReviewMode]);

    // Search and Filters
    const [bookingSearch, setBookingSearch] = useState("");

    // Review Modal States
    const [selectedReviewBooking, setSelectedReviewBooking] = useState(null);
    const [reviewStars, setReviewStars] = useState(5);
    const [reviewComment, setReviewComment] = useState("");

    // Invoice Modal States
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Details Modal States
    const [selectedDetailBooking, setSelectedDetailBooking] = useState(null);

    // Update Traveler Modal States
    const [selectedUpdateBooking, setSelectedUpdateBooking] = useState(null);
    const [editTravelerName, setEditTravelerName] = useState("");
    const [editTravelerPhone, setEditTravelerPhone] = useState("");

    // Payment method simulator
    const [simulatedPaymentBooking, setSimulatedPaymentBooking] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("vnpay");

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    const fetchBookings = async () => {
        try {
            setFetchingBookings(true);
            const response = await axiosInstance.get("/api/customer/bookings");
            setBookings(response.data.bookings || []);
        } catch (err) {
            console.error("Lỗi khi tải đơn đặt:", err);
            setBookingsError("Không thể tải thông tin đặt tour.");
        } finally {
            setFetchingBookings(false);
        }
    };

    const fetchWishlist = async () => {
        try {
            setFetchingWishlist(true);
            const response = await axiosInstance.get("/api/customer/wishlist");
            setWishlist(response.data.wishlist || []);
        } catch (err) {
            console.error("Lỗi khi tải wishlist:", err);
            setWishlistError("Không thể tải kho lưu trữ.");
        } finally {
            setFetchingWishlist(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchBookings();
            fetchWishlist();
        }
    }, [user]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/login", { replace: true });
    };

    const handleRemoveFromWishlist = async (tourId) => {
        try {
            const response = await axiosInstance.delete(`/api/customer/wishlist/${tourId}`);
            if (response.data.success) {
                // Refresh wishlist
                fetchWishlist();
            }
        } catch (err) {
            console.error("Lỗi khi xóa khỏi wishlist:", err);
            alert("Không thể xóa tour. Vui lòng thử lại.");
        }
    };

    const handleBookWishlistTour = async (tour) => {
        const scheduleId = tour.schedules && tour.schedules[0]?.id;
        if (!scheduleId) {
            alert("Hiện tại tour này không có lịch trình nào đang mở đăng ký.");
            return;
        }

        try {
            const response = await axiosInstance.post("/api/customer/bookings", {
                scheduleId
            });

            if (response.data.success) {
                alert(`Đặt thành công tour: ${tour.title}`);
                // Refresh data
                fetchBookings();
                // Switch to bookings tab
                setActiveTab("bookings");
            }
        } catch (err) {
            console.error("Lỗi khi đặt tour:", err);
            alert(err.message || "Không thể đặt tour. Vui lòng thử lại.");
        }
    };

    const handleUpdateTravelerSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosInstance.put(`/api/customer/bookings/${selectedUpdateBooking.id}/participants`, {
                fullName: editTravelerName,
                phone: editTravelerPhone
            });
            if (response.data.success) {
                alert("Cập nhật thông tin hành khách thành công!");
                setSelectedUpdateBooking(null);
                fetchBookings();
            } else {
                alert(response.data.error || "Lỗi khi cập nhật thông tin.");
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Lỗi khi cập nhật thông tin.");
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosInstance.post(`/api/customer/bookings/${selectedReviewBooking.id}/reviews`, {
                overallRating: reviewStars,
                generalComment: reviewComment
            });
            if (response.data.success) {
                alert(`Đã gửi đánh giá ${reviewStars} sao thành công cho chuyến đi!`);
                setSelectedReviewBooking(null);
                setReviewComment("");
                setReviewStars(5);
                fetchBookings();
            } else {
                alert(response.data.error || "Lỗi khi gửi đánh giá.");
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Lỗi khi gửi đánh giá.");
        }
    };

    const handlePayPendingBooking = async () => {
        if (!simulatedPaymentBooking) return;
        try {
            const response = await axiosInstance.put(`/api/customer/bookings/${simulatedPaymentBooking.id}/pay`);
            if (response.data.success) {
                alert("Thanh toán thành công! Vé QR Code đã được cập nhật.");
                setSimulatedPaymentBooking(null);
                fetchBookings();
            }
        } catch (err) {
            console.error("Lỗi thanh toán:", err);
            alert(err.response?.data?.error || "Không thể thực hiện giao dịch.");
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

    const getStatusBadge = (status) => {
        const styles = {
            paid: {
                bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
                text: "Đã thanh toán",
                icon: "check_circle"
            },
            pending_payment: {
                bg: "bg-amber-50 text-amber-700 border-amber-100",
                text: "Chờ thanh toán",
                icon: "pending"
            },
            pending_approval: {
                bg: "bg-blue-50 text-blue-700 border-blue-100",
                text: "Chờ duyệt",
                icon: "hourglass_empty"
            },
            cancelled: {
                bg: "bg-red-50 text-red-700 border-red-100",
                text: "Đã hủy",
                icon: "cancel"
            }
        };

        const config = styles[status] || {
            bg: "bg-neutral-50 text-neutral-700 border-neutral-100",
            text: status,
            icon: "info"
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border ${config.bg}`}>
                <span className="material-symbols-outlined text-[15px]">{config.icon}</span>
                {config.text}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-800 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
            {/* Inject Premium CSS Animations */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(24px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .stagger-1 { animation-delay: 0.05s; }
                .stagger-2 { animation-delay: 0.1s; }
                .stagger-3 { animation-delay: 0.15s; }
                
                .booking-card {
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .booking-card:hover {
                    transform: translateY(-8px) scale(1.01);
                    box-shadow: 0 20px 30px -10px rgba(244, 63, 94, 0.1);
                    border-color: rgba(244, 63, 94, 0.3);
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
                .ticket-cutout-left, .ticket-cutout-right {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    background: rgb(245, 245, 245);
                    border-radius: 9999px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .ticket-cutout-left { left: -10px; }
                .ticket-cutout-right { right: -10px; }
            `}</style>

            {/* TopNavBar */}
            <TopNavBar />

            {/* Premium Dashboard Banner with bright Sunset theme */}
            <section className="bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-purple-500/10 text-neutral-800 py-16 px-6 md:px-12 relative overflow-hidden border-b border-neutral-200">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-rose-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                    <div className="animate-fade-in-up stagger-1">
                        <span className="text-orange-600 font-black text-xs uppercase tracking-widest bg-gradient-to-r from-orange-500/20 to-rose-500/20 px-3 py-1 rounded-full border border-orange-500/30">
                            🎒 MY TOURS & KHO HÀNG
                        </span>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-4 text-neutral-900">
                            {loading ? "Đang tải..." : `Xin chào, ${user?.fullName || "Quý khách"}`}
                        </h1>
                        <p className="text-neutral-600 text-sm mt-3 font-semibold flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[17px] text-orange-500">mail</span> {user?.email}</span>
                            <span className="hidden sm:inline text-neutral-400">•</span>
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[17px] text-rose-500">phone</span> {user?.phone || "Chưa cập nhật SĐT"}</span>
                        </p>
                    </div>
                    <Link
                        to="/"
                        className="px-8 py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center gap-2 animate-fade-in-up stagger-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">explore</span> Đặt thêm Tour du lịch mới
                    </Link>
                </div>
            </section>

            {/* Main Tabs Selector */}
            <div className="border-b border-neutral-200 bg-white sticky top-[73px] z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 md:px-12 flex gap-8">
                    <button
                        onClick={() => setActiveTab("bookings")}
                        className={`py-5 font-black text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === "bookings" ? "border-rose-500 text-rose-600" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">book_online</span> Lịch trình đã đặt ({bookings.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("wishlist")}
                        className={`py-5 font-black text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === "wishlist" ? "border-rose-500 text-rose-600" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">favorite</span> Kho lưu trữ / Đã lưu ({wishlist.length})
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-grow max-w-7xl mx-auto px-6 py-12 md:px-12 w-full">
                {activeTab === "bookings" ? (
                    <div>
                        {isReviewMode && (
                            <div className="mb-6 p-4 bg-purple-50 border border-purple-100 text-purple-800 rounded-2xl flex items-center gap-3 animate-fade-in-up">
                                <span className="material-symbols-outlined text-purple-600 text-[24px]">rate_review</span>
                                <span className="text-sm font-semibold">
                                    Vui lòng chọn chuyến đi đã hoàn tất bên dưới và nhấn <strong>Đánh giá</strong> để gửi cảm nhận của bạn!
                                </span>
                            </div>
                        )}

                        {/* Transaction Search & Filter Bar */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200/60 mb-8 max-w-md flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-neutral-400">search</span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm mã booking, tên tour..."
                                className="w-full bg-transparent border-none outline-none text-sm font-semibold text-neutral-700 placeholder-neutral-400"
                                value={bookingSearch}
                                onChange={(e) => setBookingSearch(e.target.value)}
                            />
                        </div>

                        {fetchingBookings ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-500" />
                            </div>
                        ) : bookingsError ? (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 text-center shadow-inner">
                                <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
                                <p className="font-bold">{bookingsError}</p>
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-neutral-200 p-16 text-center shadow-sm max-w-lg mx-auto">
                                <span className="material-symbols-outlined text-5xl text-neutral-300 mb-4">luggage</span>
                                <h3 className="text-lg font-black text-neutral-800 mb-1.5">Bạn chưa có đơn đặt tour nào</h3>
                                <p className="text-neutral-500 text-sm mb-6">Hãy đặt chỗ ngay tour du lịch của bạn.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {(() => {
                                    const filtered = bookings.filter((b) => {
                                        if (isReviewMode && b.status !== "paid") return false;
                                        const title = b.schedule?.tour?.title || "";
                                        const dest = b.schedule?.tour?.destination || "";
                                        const code = b.bookingCode || "";
                                        const q = bookingSearch.toLowerCase();
                                        return title.toLowerCase().includes(q) || dest.toLowerCase().includes(q) || code.toLowerCase().includes(q);
                                    });

                                    // Sort: Upcoming (departure in future) comes first
                                    const sorted = [...filtered].sort((a, b) => {
                                        const dateA = new Date(a.schedule?.departureDate || 0);
                                        const dateB = new Date(b.schedule?.departureDate || 0);
                                        const now = new Date();
                                        const upA = dateA >= now;
                                        const upB = dateB >= now;
                                        if (upA && !upB) return -1;
                                        if (!upA && upB) return 1;
                                        return dateA - dateB;
                                    });

                                    if (sorted.length === 0) {
                                        return (
                                            <div className="col-span-full text-center py-10 bg-white rounded-2xl border border-neutral-200/50">
                                                <p className="text-neutral-500 font-bold">Không tìm thấy đơn hàng trùng khớp.</p>
                                            </div>
                                        );
                                    }

                                    return sorted.map((booking, index) => {
                                        const tour = booking.schedule?.tour || {};
                                        const schedule = booking.schedule || {};
                                        const leadParticipant = booking.participants?.find((p) => p.isLead) || booking.participants?.[0];
                                        const delayClass = `stagger-${(index % 3) + 1}`;

                                        return (
                                            <div key={booking.id} className={`bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-sm booking-card flex flex-col md:flex-row group animate-fade-in-up ${delayClass}`}>
                                                <div className="w-full md:w-48 h-48 md:h-auto shrink-0 relative overflow-hidden">
                                                    <img
                                                        src={tour.thumbnailUrl || "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=250&fit=crop"}
                                                        alt={tour.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur px-2.5 py-1 rounded text-[10px] font-black text-white uppercase tracking-wider">
                                                        {tour.durationDays}N{tour.durationNights}Đ
                                                    </div>
                                                </div>

                                                <div className="p-6 flex-grow flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center justify-between gap-4 mb-3">
                                                            <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100 uppercase tracking-wider">
                                                                Mã: {booking.bookingCode}
                                                            </span>
                                                            {getStatusBadge(booking.status)}
                                                        </div>
                                                        <h3 className="text-md font-black text-neutral-900 line-clamp-1 group-hover:text-rose-600 transition-colors">
                                                            {tour.title}
                                                        </h3>
                                                        <p className="text-neutral-500 text-xs font-bold flex items-center gap-1 mt-1.5 uppercase tracking-wider">
                                                            <span className="material-symbols-outlined text-[14px] text-orange-500">location_on</span> {tour.destination}
                                                        </p>

                                                        <div className="grid grid-cols-2 gap-3 mt-4 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/40">
                                                            <div>
                                                                <span className="text-[9px] font-black text-neutral-400 block uppercase tracking-wider">Ngày khởi hành</span>
                                                                <span className="text-xs font-extrabold text-neutral-700">{formatDate(schedule.departureDate)}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[9px] font-black text-neutral-400 block uppercase tracking-wider">Ngày kết thúc</span>
                                                                <span className="text-xs font-extrabold text-neutral-700">{formatDate(schedule.returnDate)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-col gap-4">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <span className="text-[9px] font-black text-neutral-400 block uppercase tracking-wider">Tổng chi phí</span>
                                                                <span className="text-lg font-black text-rose-600">{formatPrice(booking.finalPrice)}</span>
                                                            </div>
                                                            {booking.status === "paid" && leadParticipant && (
                                                                <button
                                                                    onClick={() => setSelectedTicket({
                                                                        tourTitle: tour.title,
                                                                        bookingCode: booking.bookingCode,
                                                                        checkinCode: leadParticipant.checkinCode,
                                                                        fullName: leadParticipant.fullName,
                                                                        departureDate: schedule.departureDate,
                                                                        departureLocation: tour.departureLocation
                                                                    })}
                                                                    className="px-4.5 py-2.5 text-xs font-extrabold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-all active:scale-[0.97] flex items-center gap-1.5"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">qr_code</span> Vé QR Code
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Interactive Action Buttons */}
                                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100/50">
                                                            <button
                                                                onClick={() => setSelectedDetailBooking(booking)}
                                                                className="px-3.5 py-2 text-xs font-bold text-neutral-600 hover:text-rose-600 bg-neutral-100 hover:bg-rose-50 rounded-xl transition-all cursor-pointer flex-1 text-center"
                                                            >
                                                                Xem chi tiết
                                                            </button>

                                                            {booking.status === "pending_payment" && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSimulatedPaymentBooking(booking);
                                                                        setPaymentMethod("vnpay");
                                                                    }}
                                                                    className="px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer flex-1 text-center"
                                                                >
                                                                    Thanh toán
                                                                </button>
                                                            )}

                                                            {(booking.status === "cancelled" || booking.status === "rejected") && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedUpdateBooking(booking);
                                                                        setEditTravelerName(leadParticipant?.fullName || "");
                                                                        setEditTravelerPhone(user?.phone || "");
                                                                    }}
                                                                    className="px-3.5 py-2 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all cursor-pointer flex-1 text-center"
                                                                >
                                                                    Cập nhật
                                                                </button>
                                                            )}

                                                            {booking.status === "paid" && (
                                                                <>
                                                                    {booking.review ? (
                                                                        <span className="px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 rounded-xl border border-purple-100 flex-1 text-center select-none flex items-center justify-center gap-1">
                                                                            <span className="material-symbols-outlined text-[14px]">star</span>
                                                                            Đã đánh giá ({booking.review.overallRating}★)
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => setSelectedReviewBooking(booking)}
                                                                            className="px-3.5 py-2 text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all cursor-pointer flex-1 text-center"
                                                                        >
                                                                            Đánh giá
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => setSelectedInvoice(booking)}
                                                                        className="px-3.5 py-2 text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-all cursor-pointer flex-1 text-center"
                                                                    >
                                                                        Hóa đơn
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>
                ) : (
                    // Tab 2: Wishlist (Kho hàng)
                    <div>
                        {fetchingWishlist ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-500" />
                            </div>
                        ) : wishlistError ? (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 text-center shadow-inner">
                                <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
                                <p className="font-bold">{wishlistError}</p>
                            </div>
                        ) : wishlist.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-neutral-200 p-16 text-center shadow-sm max-w-lg mx-auto">
                                <span className="material-symbols-outlined text-5xl text-neutral-300 mb-4">favorite_border</span>
                                <h3 className="text-lg font-black text-neutral-800 mb-1.5">Kho lưu trữ trống</h3>
                                <p className="text-neutral-500 text-sm mb-6">Hãy lưu lại các tour du lịch yêu thích của bạn từ Trang chủ để đặt lại bất cứ lúc nào!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {wishlist.map((item, index) => {
                                    const tour = item.tour || {};
                                    const delayClass = `stagger-${(index % 3) + 1}`;

                                    return (
                                        <div key={item.id} className={`bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm booking-card flex flex-col group h-full animate-fade-in-up ${delayClass}`}>
                                            <div className="relative h-48 overflow-hidden">
                                                <img
                                                    src={tour.thumbnailUrl || "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=250&fit=crop"}
                                                    alt={tour.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <button
                                                    onClick={() => handleRemoveFromWishlist(tour.id)}
                                                    className="absolute top-3 right-3 bg-white/95 text-red-500 p-2 rounded-full shadow-md hover:bg-red-50 transition-colors flex items-center justify-center cursor-pointer"
                                                    title="Xóa khỏi kho lưu trữ"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                                                </button>
                                                <div className="absolute bottom-3 left-3 bg-neutral-900/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-black text-white uppercase">
                                                    {tour.durationDays}N{tour.durationNights}Đ
                                                </div>
                                            </div>

                                            <div className="p-6 flex-grow flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-md font-black text-neutral-900 leading-snug group-hover:text-rose-600 transition-colors line-clamp-2">
                                                        {tour.title}
                                                    </h3>
                                                    <p className="text-neutral-500 text-xs font-bold flex items-center gap-1 mt-1.5 uppercase tracking-wider">
                                                        <span className="material-symbols-outlined text-[14px] text-orange-500">location_on</span> {tour.destination}
                                                    </p>
                                                    <p className="text-neutral-500 text-xs mt-3 line-clamp-3 leading-relaxed">
                                                        {tour.description}
                                                    </p>
                                                </div>

                                                <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between gap-4">
                                                    <div>
                                                        <span className="text-[9px] font-black text-neutral-400 block uppercase">Giá từ</span>
                                                        <span className="text-md font-extrabold text-rose-600">{formatPrice(tour.basePrice)}</span>
                                                    </div>

                                                    <button
                                                        onClick={() => handleBookWishlistTour(tour)}
                                                        className="px-4 py-2 text-xs font-extrabold text-white fiery-button rounded-xl shadow-md transition-all active:scale-[0.97]"
                                                    >
                                                        Đặt ngay
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Ticket QR Modal */}
            {/* Ticket QR Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] max-w-sm w-full overflow-hidden shadow-2xl border border-neutral-100/80 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Ticket */}
                        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6 text-center relative">
                            <span className="material-symbols-outlined text-4xl animate-float">confirmation_number</span>
                            <h3 className="text-lg font-black mt-2 tracking-tight">VÉ TOUR DU LỊCH</h3>
                            <p className="text-white/80 text-xs font-bold uppercase tracking-wider">GlobalExplore Boarding Pass</p>

                            <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-neutral-900 rounded-full" />
                            <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-neutral-900 rounded-full" />
                        </div>

                        {/* Content Ticket */}
                        <div className="p-6 bg-white border-b-2 border-dashed border-neutral-200 relative text-neutral-800">
                            <div className="ticket-cutout-left" />
                            <div className="ticket-cutout-right" />
                            
                            <h4 className="text-sm font-black text-center mb-5 leading-snug">{selectedTicket.tourTitle}</h4>

                            <div className="space-y-3.5 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Hành khách</span>
                                    <span className="font-extrabold text-neutral-900">{selectedTicket.fullName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Mã đặt chỗ</span>
                                    <span className="font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">{selectedTicket.bookingCode}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Ngày khởi hành</span>
                                    <span className="font-extrabold text-neutral-900">{formatDate(selectedTicket.departureDate)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Điểm tập trung</span>
                                    <span className="font-extrabold text-neutral-900">{selectedTicket.departureLocation}</span>
                                </div>
                            </div>
                        </div>

                        {/* QR Code Segment */}
                        <div className="p-6 bg-neutral-50 flex flex-col items-center justify-center">
                            <div className="bg-white p-4.5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center">
                                <div className="w-40 h-40 border-4 border-teal-600 flex items-center justify-center relative p-2">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-8 border-l-8 border-neutral-900" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-8 border-r-8 border-neutral-900" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-8 border-l-8 border-neutral-900" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-8 border-r-8 border-neutral-900" />
                                    <span className="material-symbols-outlined text-6xl text-neutral-300">qr_code_2</span>
                                </div>
                                <span className="text-xs font-mono font-black mt-2.5 text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">{selectedTicket.checkinCode}</span>
                            </div>

                            <p className="text-neutral-400 text-[9px] text-center mt-4 uppercase tracking-widest font-black leading-relaxed">
                                Vui lòng xuất trình mã QR này để làm thủ tục lên đoàn du lịch
                            </p>

                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="w-full mt-6 bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold py-3.5 rounded-2xl transition-all"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review / Rating Modal */}
            {selectedReviewBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-neutral-900 mb-4">Đánh giá hành trình</h3>
                        <p className="text-neutral-500 text-xs mb-6">Hãy chia sẻ trải nghiệm của bạn về tour: <strong>{selectedReviewBooking.schedule?.tour?.title}</strong></p>
                        
                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                            <div className="flex justify-center gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setReviewStars(star)}
                                        className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-4xl">
                                            {star <= reviewStars ? "star" : "star_border"}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <textarea
                                required
                                rows={4}
                                placeholder="Nhập cảm nhận của bạn về chuyến đi..."
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm font-semibold outline-none focus:border-rose-500 focus:bg-white transition-all resize-none"
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                            />

                            <div className="flex gap-3 pt-4 border-t border-neutral-100">
                                <button type="submit" className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer">Gửi Đánh Giá</button>
                                <button type="button" onClick={() => setSelectedReviewBooking(null)} className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">Đóng</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Electronic Invoice Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl border border-neutral-100/80 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden text-neutral-800">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-rose-500" />
                        
                        <div className="text-center mb-6">
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block mb-1">E-Receipt / Hóa Đơn Điện Tử</span>
                            <h3 className="text-md font-black text-neutral-900">GLOBALEXPLORE TRAVEL SYSTEM</h3>
                        </div>

                        <div className="space-y-4 border-t border-b border-dashed border-neutral-200 py-6 text-xs text-neutral-700 font-medium">
                            <div className="flex justify-between">
                                <span>Mã giao dịch:</span>
                                <span className="font-extrabold text-neutral-900">{selectedInvoice.bookingCode}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Thời gian thanh toán:</span>
                                <span className="font-extrabold text-neutral-900">{formatDate(selectedInvoice.bookedAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tour đặt mua:</span>
                                <span className="font-extrabold text-neutral-900 text-right max-w-[200px]">{selectedInvoice.schedule?.tour?.title}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Giá gốc:</span>
                                <span className="font-extrabold text-neutral-900">{formatPrice(selectedInvoice.schedule?.tour?.basePrice || 0)}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-neutral-100 text-sm">
                                <span className="font-bold text-neutral-800">Tổng tiền thanh toán:</span>
                                <span className="font-black text-rose-600">{formatPrice(selectedInvoice.finalPrice)}</span>
                            </div>
                        </div>

                        <div className="text-center mt-6">
                            <div className="inline-block border-2 border-emerald-600 text-emerald-600 px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest mb-4">
                                Đã Thanh Toán
                            </div>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                                Đóng hóa đơn
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Inspection Modal */}
            {selectedDetailBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] max-w-lg w-full p-8 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-neutral-900">Chi Tiết Lịch Trình & Đặt Chỗ</h3>
                            <button onClick={() => setSelectedDetailBooking(null)} className="text-neutral-400 hover:text-rose-500 cursor-pointer">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="bg-neutral-50 p-4.5 rounded-2xl border border-neutral-200/50">
                                <span className="text-[10px] font-black text-neutral-400 block uppercase tracking-wider mb-1">Tên hành trình</span>
                                <span className="font-extrabold text-neutral-850">{selectedDetailBooking.schedule?.tour?.title}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/50">
                                    <span className="text-[10px] font-black text-neutral-400 block uppercase tracking-wider mb-1">Ngày khởi hành</span>
                                    <span className="font-extrabold text-neutral-800">{formatDate(selectedDetailBooking.schedule?.departureDate)}</span>
                                </div>
                                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/50">
                                    <span className="text-[10px] font-black text-neutral-400 block uppercase tracking-wider mb-1">Ngày kết thúc</span>
                                    <span className="font-extrabold text-neutral-800">{formatDate(selectedDetailBooking.schedule?.returnDate)}</span>
                                </div>
                            </div>
                            <div className="bg-neutral-50 p-4.5 rounded-2xl border border-neutral-200/50">
                                <span className="text-[10px] font-black text-neutral-400 block uppercase tracking-wider mb-2">Thông tin hành khách</span>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {selectedDetailBooking.participants && selectedDetailBooking.participants.map((p, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs border-b border-neutral-100 pb-1.5 last:border-none last:pb-0">
                                            <span className="font-bold text-neutral-700">{p.fullName} {p.isLead && "(Trưởng đoàn)"}</span>
                                            <span className="text-neutral-400 font-semibold uppercase">{p.participantType || "Người lớn"}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedDetailBooking(null)}
                            className="w-full mt-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            )}

            {/* Update Traveler Info Modal */}
            {selectedUpdateBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-neutral-900 mb-2">Cập nhật thông tin hành khách</h3>
                        <p className="text-neutral-500 text-xs mb-6">Đơn đặt tour: <strong>{selectedUpdateBooking.bookingCode}</strong> đang cần điều chỉnh thông tin hành khách.</p>

                        <form onSubmit={handleUpdateTravelerSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-neutral-600 uppercase tracking-wider block mb-1.5">Họ tên hành khách trưởng đoàn</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                                    value={editTravelerName}
                                    onChange={(e) => setEditTravelerName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-neutral-600 uppercase tracking-wider block mb-1.5">Số điện thoại liên hệ</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                                    value={editTravelerPhone}
                                    onChange={(e) => setEditTravelerPhone(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-neutral-100">
                                <button type="submit" className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer">Lưu cập nhật</button>
                                <button type="button" onClick={() => setSelectedUpdateBooking(null)} className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">Hủy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mock Payment Simulator Modal */}
            {simulatedPaymentBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-orange-500 to-rose-500 text-white p-6 text-center">
                            <h3 className="font-extrabold text-md uppercase">Thanh toán hóa đơn còn thiếu</h3>
                            <p className="text-orange-100 text-[10px] uppercase font-bold tracking-wider">Mã Booking: {simulatedPaymentBooking.bookingCode}</p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/50 text-sm">
                                <div className="flex justify-between mb-2">
                                    <span className="text-neutral-500 font-semibold">Tên tour:</span>
                                    <span className="font-extrabold text-neutral-800 text-right max-w-[200px]">{simulatedPaymentBooking.schedule?.tour?.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500 font-bold">Số tiền cần trả:</span>
                                    <span className="font-black text-rose-600">{formatPrice(simulatedPaymentBooking.finalPrice)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePayPendingBooking}
                                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
                            >
                                Xác nhận thanh toán thành công
                            </button>
                            <button
                                onClick={() => setSimulatedPaymentBooking(null)}
                                className="w-full py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerToursPage;
