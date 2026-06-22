import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { fetchCurrentUser, logoutUser } from "../../features/auth/authSlice";
import axiosInstance from "../../api/axiosInstance";
import TopNavBar from "../../components/TopNavBar";

const CustomerTransactionsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading } = useSelector((state) => state.auth);

    const [bookings, setBookings] = useState([]);
    const [fetchingBookings, setFetchingBookings] = useState(true);
    const [bookingsError, setBookingsError] = useState(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState("all");

    // Modal states
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [cancellationReasonModal, setCancellationReasonModal] = useState(null);
    const [confirmCancelBooking, setConfirmCancelBooking] = useState(null);
    const [cancelReasonInput, setCancelReasonInput] = useState("");
    const [simulatedPaymentBooking, setSimulatedPaymentBooking] = useState(null);

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    const fetchBookings = async () => {
        try {
            setFetchingBookings(true);
            const response = await axiosInstance.get("/api/customer/bookings");
            setBookings(response.data.bookings || []);
        } catch (err) {
            console.error("Lỗi khi tải đơn giao dịch:", err);
            setBookingsError("Không thể tải lịch sử giao dịch.");
        } finally {
            setFetchingBookings(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/login", { replace: true });
    };

    const handlePayPendingBooking = async () => {
        if (!simulatedPaymentBooking) return;
        try {
            const response = await axiosInstance.put(`/api/customer/bookings/${simulatedPaymentBooking.id}/pay`);
            if (response.data.success) {
                alert("Thanh toán thành công! Vé của bạn đã được cập nhật trạng thái.");
                setSimulatedPaymentBooking(null);
                fetchBookings();
            }
        } catch (err) {
            console.error("Lỗi thanh toán:", err);
            alert(err.response?.data?.error || "Không thể thực hiện giao dịch.");
        }
    };

    const handleCancelBookingSubmit = async (e) => {
        e.preventDefault();
        if (!confirmCancelBooking) return;
        try {
            const response = await axiosInstance.put(`/api/customer/bookings/${confirmCancelBooking.id}/cancel`, {
                reason: cancelReasonInput
            });
            if (response.data.success) {
                alert("Hủy đặt tour thành công.");
                setConfirmCancelBooking(null);
                setCancelReasonInput("");
                fetchBookings();
            }
        } catch (err) {
            console.error("Lỗi khi hủy đơn:", err);
            alert(err.response?.data?.error || "Không thể hủy đơn. Vui lòng thử lại.");
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

    const formatDateTime = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getStatusConfig = (status) => {
        const styles = {
            paid: {
                bg: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
                text: "Thành công",
                icon: "check_circle"
            },
            pending_payment: {
                bg: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
                text: "Chờ thanh toán",
                icon: "pending"
            },
            pending_approval: {
                bg: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
                text: "Chờ duyệt",
                icon: "hourglass_empty"
            },
            cancelled: {
                bg: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
                text: "Đã hủy",
                icon: "cancel"
            }
        };
        return styles[status] || {
            bg: "bg-neutral-50 text-neutral-700 border-neutral-100",
            text: status,
            icon: "info"
        };
    };

    // Filter & Search Logic
    const filteredBookings = bookings.filter((booking) => {
        // Search Term
        const tourTitle = booking.schedule?.tour?.title || "";
        const bookingCode = booking.bookingCode || "";
        const matchesSearch =
            tourTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bookingCode.toLowerCase().includes(searchTerm.toLowerCase());

        // Status Filter
        const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

        // Time Filter
        let matchesTime = true;
        if (timeFilter !== "all") {
            const bookingDate = new Date(booking.bookedAt);
            const now = new Date();
            if (timeFilter === "30_days") {
                const diffTime = Math.abs(now - bookingDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                matchesTime = diffDays <= 30;
            } else if (timeFilter === "3_months") {
                const diffTime = Math.abs(now - bookingDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                matchesTime = diffDays <= 90;
            } else if (timeFilter === "this_year") {
                matchesTime = bookingDate.getFullYear() === now.getFullYear();
            }
        }

        return matchesSearch && matchesStatus && matchesTime;
    });

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-800 flex flex-col font-sans">
            {/* TopNavBar */}
            <TopNavBar />

            {/* Banner Section */}
            <section className="bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-purple-500/10 text-neutral-800 py-12 px-6 md:px-12 border-b border-neutral-200">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <span className="text-rose-600 font-black text-xs uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                            📜 Lịch sử giao dịch
                        </span>
                        <h1 className="text-3xl font-black mt-3 text-neutral-900">
                            Quản lý thanh toán & hóa đơn
                        </h1>
                        <p className="text-neutral-500 text-sm mt-1 font-semibold">
                            Tra cứu chi tiết đơn hàng, xem hóa đơn điện tử hoặc hoàn tất thanh toán.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl border border-white/80 shadow-sm">
                        <span className="material-symbols-outlined text-rose-500 text-3xl">payments</span>
                        <div>
                            <span className="text-[10px] font-black text-neutral-400 block uppercase">Tổng đơn hàng</span>
                            <span className="text-lg font-black text-neutral-800">{bookings.length} giao dịch</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Area */}
            <main className="flex-grow max-w-7xl mx-auto px-6 py-10 md:px-12 w-full">
                {/* Search & Filters Row */}
                <div className="bg-white p-6 rounded-3xl border border-neutral-200/60 shadow-sm mb-8 flex flex-col lg:flex-row justify-between gap-4">
                    {/* Search Field */}
                    <div className="bg-neutral-50 border border-neutral-200 px-4 py-3 rounded-2xl flex items-center gap-2.5 flex-1 max-w-md">
                        <span className="material-symbols-outlined text-neutral-400">search</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm mã booking, tên tour..."
                            className="w-full bg-transparent border-none outline-none text-sm font-semibold text-neutral-700 placeholder-neutral-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-neutral-400 uppercase tracking-wider">Thời gian</span>
                            <select
                                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-bold text-neutral-700 outline-none focus:border-rose-500"
                                value={timeFilter}
                                onChange={(e) => setTimeFilter(e.target.value)}
                            >
                                <option value="all">Tất cả thời gian</option>
                                <option value="30_days">30 ngày gần nhất</option>
                                <option value="3_months">3 tháng gần nhất</option>
                                <option value="this_year">Năm nay</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-neutral-400 uppercase tracking-wider">Trạng thái</span>
                            <select
                                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-bold text-neutral-700 outline-none focus:border-rose-500"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="paid">Thành công / Đã thanh toán</option>
                                <option value="pending_payment">Chờ thanh toán</option>
                                <option value="pending_approval">Chờ duyệt</option>
                                <option value="cancelled">Đã hủy</option>
                            </select>
                        </div>
                    </div>
                </div>

                {fetchingBookings ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-500" />
                    </div>
                ) : bookingsError ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 text-center max-w-lg mx-auto shadow-inner">
                        <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
                        <p className="font-bold">{bookingsError}</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-neutral-200 p-16 text-center shadow-sm max-w-lg mx-auto">
                        <span className="material-symbols-outlined text-5xl text-neutral-300 mb-4 font-light">receipt_long</span>
                        <h3 className="text-lg font-black text-neutral-800 mb-1.5">Không tìm thấy giao dịch nào</h3>
                        <p className="text-neutral-500 text-sm">Vui lòng điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                    </div>
                ) : (
                    /* Transaction Table */
                    <div className="bg-white rounded-3xl border border-neutral-200/60 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50/50 border-b border-neutral-200/50 text-[11px] font-black text-neutral-400 uppercase tracking-wider">
                                        <th className="py-4 px-6">Mã giao dịch</th>
                                        <th className="py-4 px-6">Thông tin Tour du lịch</th>
                                        <th className="py-4 px-6">Ngày đặt chỗ</th>
                                        <th className="py-4 px-6 text-right">Tổng thanh toán</th>
                                        <th className="py-4 px-6 text-center">Trạng thái</th>
                                        <th className="py-4 px-6 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 text-sm font-semibold text-neutral-700">
                                    {filteredBookings.map((booking) => {
                                        const tour = booking.schedule?.tour || {};
                                        const schedule = booking.schedule || {};
                                        const statusConfig = getStatusConfig(booking.status);

                                        return (
                                            <tr key={booking.id} className="hover:bg-neutral-50/40 transition-colors">
                                                {/* Code */}
                                                <td className="py-5 px-6 font-mono font-bold text-teal-600">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{booking.bookingCode}</span>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(booking.bookingCode);
                                                                alert("Đã sao chép mã booking!");
                                                            }}
                                                            className="text-neutral-400 hover:text-teal-600 transition-colors cursor-pointer"
                                                            title="Sao chép mã đơn hàng"
                                                        >
                                                            <span className="material-symbols-outlined text-[15px]">content_copy</span>
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Tour Info */}
                                                <td className="py-5 px-6 max-w-sm">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={tour.thumbnailUrl || "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=120&h=80&fit=crop"}
                                                            alt={tour.title}
                                                            className="w-12 h-12 object-cover rounded-lg border border-neutral-200"
                                                        />
                                                        <div>
                                                            <h4 className="font-extrabold text-neutral-900 line-clamp-1 leading-snug hover:text-rose-600 transition-colors">
                                                                <Link to={`/tours/${tour.id}`}>{tour.title}</Link>
                                                            </h4>
                                                            <span className="text-[10px] text-neutral-400 font-bold flex items-center gap-0.5 mt-1 uppercase tracking-wider">
                                                                <span className="material-symbols-outlined text-[12px] text-orange-500">schedule</span>
                                                                {formatDate(schedule.departureDate)} - {formatDate(schedule.returnDate)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Booking Date */}
                                                <td className="py-5 px-6 text-neutral-500 text-xs">
                                                    {formatDateTime(booking.bookedAt)}
                                                </td>

                                                {/* Price */}
                                                <td className="py-5 px-6 text-right font-black text-neutral-900">
                                                    {formatPrice(booking.finalPrice)}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-5 px-6 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold border ${statusConfig.bg}`}>
                                                        <span className="material-symbols-outlined text-[13px]">{statusConfig.icon}</span>
                                                        {statusConfig.text}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-5 px-6 text-center">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <button
                                                            onClick={() => setSelectedInvoice(booking)}
                                                            className="px-3 py-1.5 bg-neutral-100 hover:bg-rose-50 text-neutral-600 hover:text-rose-600 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[15px]">receipt</span>
                                                            Hóa đơn
                                                        </button>

                                                        {booking.status === "pending_payment" && (
                                                            <button
                                                                onClick={() => setSimulatedPaymentBooking(booking)}
                                                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <span className="material-symbols-outlined text-[15px]">payment</span>
                                                                Thanh toán
                                                            </button>
                                                        )}

                                                        {(booking.status === "pending_payment" || booking.status === "pending_approval") && (
                                                            <button
                                                                onClick={() => {
                                                                    setConfirmCancelBooking(booking);
                                                                    setCancelReasonInput("");
                                                                }}
                                                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <span className="material-symbols-outlined text-[15px]">cancel</span>
                                                                Hủy đơn
                                                            </button>
                                                        )}

                                                        {booking.status === "cancelled" && booking.cancellationReason && (
                                                            <button
                                                                onClick={() => setCancellationReasonModal(booking.cancellationReason)}
                                                                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <span className="material-symbols-outlined text-[15px]">help_center</span>
                                                                Lý do hủy
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Detailed Invoice Receipt Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-100/80 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Receipt */}
                        <div className="bg-neutral-900 text-white p-6 relative">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-black tracking-tight flex items-center gap-1.5 text-teal-400">
                                        <span className="material-symbols-outlined text-2xl text-rose-500">explore</span>
                                        Chip3Chip Receipt
                                    </h3>
                                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mt-1">HÓA ĐƠN ĐIỆN TỬ CỦA KHÁCH HÀNG</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                        {selectedInvoice.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Content Receipt */}
                        <div className="p-6 bg-white space-y-5">
                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-4 text-xs border-b border-neutral-100 pb-4">
                                <div>
                                    <span className="text-neutral-400 font-bold block uppercase tracking-wider text-[9px]">Mã đơn hàng</span>
                                    <span className="font-extrabold text-neutral-800">{selectedInvoice.bookingCode}</span>
                                </div>
                                <div>
                                    <span className="text-neutral-400 font-bold block uppercase tracking-wider text-[9px]">Thời gian lập</span>
                                    <span className="font-extrabold text-neutral-800">{formatDateTime(selectedInvoice.bookedAt)}</span>
                                </div>
                            </div>

                            {/* Tour & Schedule Details */}
                            <div>
                                <span className="text-neutral-400 font-bold block uppercase tracking-wider text-[9px] mb-2">Thông tin Tour du lịch</span>
                                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/50 space-y-2 text-xs">
                                    <h4 className="font-black text-neutral-900 leading-snug">{selectedInvoice.schedule?.tour?.title}</h4>
                                    <div className="grid grid-cols-2 gap-2 text-neutral-600 mt-1">
                                        <div><strong>Điểm đi:</strong> {selectedInvoice.schedule?.tour?.departureLocation || "N/A"}</div>
                                        <div><strong>Điểm đến:</strong> {selectedInvoice.schedule?.tour?.destination}</div>
                                        <div><strong>Khởi hành:</strong> {formatDate(selectedInvoice.schedule?.departureDate)}</div>
                                        <div><strong>Về ngày:</strong> {formatDate(selectedInvoice.schedule?.returnDate)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Participant details */}
                            <div>
                                <span className="text-neutral-400 font-bold block uppercase tracking-wider text-[9px] mb-2">Thông tin hành khách</span>
                                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                    {selectedInvoice.participants && selectedInvoice.participants.map((p, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs border-b border-neutral-100 pb-1.5 last:border-none last:pb-0">
                                            <span className="font-bold text-neutral-700">{p.fullName} {p.isLead && "(Trưởng đoàn)"}</span>
                                            <span className="text-neutral-400 font-semibold uppercase">{p.participantType || "Người lớn"}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pricing break-down */}
                            <div className="border-t border-neutral-100 pt-4 space-y-2.5">
                                <div className="flex justify-between text-xs text-neutral-500 font-bold">
                                    <span>Giá gốc chuyến đi:</span>
                                    <span>{formatPrice(selectedInvoice.totalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-neutral-500 font-bold">
                                    <span>Mã giảm giá (voucher):</span>
                                    <span className="text-emerald-600">-{formatPrice(selectedInvoice.discountAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-neutral-200 pt-3">
                                    <span className="text-sm font-black text-neutral-800">Thành tiền thực tế:</span>
                                    <span className="text-xl font-black text-rose-600">{formatPrice(selectedInvoice.finalPrice)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Receipt */}
                        <div className="p-6 bg-neutral-50 flex gap-3">
                            <button
                                onClick={() => {
                                    window.print();
                                }}
                                className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold py-3 text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-[16px]">print</span>
                                In hóa đơn
                            </button>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="flex-1 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 font-extrabold py-3 text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                                Đóng lại
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Cancellation Reason Modal */}
            {cancellationReasonModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <span className="material-symbols-outlined text-3xl">info_outline</span>
                            <h3 className="text-lg font-black">Lý do hủy đơn hàng</h3>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/50 mb-6 text-sm text-neutral-700 font-medium whitespace-pre-wrap">
                            {cancellationReasonModal}
                        </div>
                        <button
                            onClick={() => setCancellationReasonModal(null)}
                            className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            {/* Confirm Cancel Booking Modal */}
            {confirmCancelBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 text-red-600 mb-2">
                            <span className="material-symbols-outlined text-3xl">warning</span>
                            <h3 className="text-lg font-black">Xác nhận hủy đơn hàng</h3>
                        </div>
                        <p className="text-neutral-500 text-xs mb-4">
                            Bạn có chắc chắn muốn hủy đơn hàng <strong>{confirmCancelBooking.bookingCode}</strong>? Hành động này không thể hoàn tác.
                        </p>
                        
                        <form onSubmit={handleCancelBookingSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-neutral-600 uppercase tracking-wider block mb-1">Lý do hủy đơn hàng (tùy chọn)</label>
                                <textarea
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 outline-none focus:border-red-500 focus:bg-white transition-all resize-none"
                                    rows={3}
                                    placeholder="Vui lòng nhập lý do bạn muốn hủy đơn đặt này..."
                                    value={cancelReasonInput}
                                    onChange={(e) => setCancelReasonInput(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                                >
                                    Đồng ý hủy đơn
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setConfirmCancelBooking(null);
                                        setCancelReasonInput("");
                                    }}
                                    className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                >
                                    Quay lại
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mock Payment Simulator Modal */}
            {simulatedPaymentBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-orange-500 to-rose-500 text-white p-6 text-center">
                            <h3 className="font-extrabold text-md uppercase">Cổng thanh toán điện tử (Simulated)</h3>
                            <p className="text-orange-100 text-[10px] uppercase font-bold tracking-wider">Mã thanh toán: {simulatedPaymentBooking.bookingCode}</p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/50 text-sm">
                                <div className="flex justify-between mb-2">
                                    <span className="text-neutral-500 font-semibold">Tour đặt:</span>
                                    <span className="font-extrabold text-neutral-800 text-right max-w-[200px]">{simulatedPaymentBooking.schedule?.tour?.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500 font-bold">Số tiền cần thanh toán:</span>
                                    <span className="font-black text-rose-600">{formatPrice(simulatedPaymentBooking.finalPrice)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePayPendingBooking}
                                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:brightness-105 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
                            >
                                Xác nhận thanh toán thành công
                            </button>
                            <button
                                onClick={() => setSimulatedPaymentBooking(null)}
                                className="w-full py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                                Hủy bỏ giao dịch
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerTransactionsPage;
