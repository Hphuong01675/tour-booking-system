import { useState, useEffect } from "react";
import OperatorHeader from "../../components/operator/OperatorHeader";
import OperatorFooter from "../../components/operator/OperatorFooter";
import { getOperatorProfile, searchCustomer, getCustomerBookings, getRefundEstimate, cancelBooking } from "../../api/operatorApi";

const OperatorCancelCustomerPage = () => {
    const [user, setUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [refundEstimate, setRefundEstimate] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingEstimate, setLoadingEstimate] = useState(false);

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

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSelectedBooking(null);
        setRefundEstimate(null);
        try {
            const customerData = await searchCustomer(searchQuery);
            const bookingsData = await getCustomerBookings(customerData.id);
            setSearchResult({
                ...customerData,
                bookings: bookingsData
            });
        } catch (err) {
            console.error("Failed to search customer", err);
            alert(err.response?.data?.error || "Không tìm thấy khách hàng ứng với thông tin tra cứu.");
            setSearchResult(null);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectBooking = async (booking) => {
        setSelectedBooking(booking);
        setLoadingEstimate(true);
        try {
            const estimate = await getRefundEstimate(booking.id);
            setRefundEstimate(estimate);
        } catch (err) {
            console.error("Failed to get refund estimate", err);
            alert("Lỗi khi tính toán hoàn tiền.");
            setRefundEstimate(null);
        } finally {
            setLoadingEstimate(false);
        }
    };

    const handleCancel = async (booking) => {
        const reason = window.prompt(`Nhập lý do hủy chuyến cho booking ${booking.code}:`);
        if (reason === null) return; // User clicked cancel
        if (!reason.trim()) {
            alert("Lý do hủy là bắt buộc.");
            return;
        }

        try {
            const res = await cancelBooking(booking.id, reason);
            alert(`Đã hủy chuyến đi thành công! Số tiền hoàn trả khách hàng: ${res.refundAmount.toLocaleString("vi-VN")} đ`);
            setSelectedBooking(null);
            setRefundEstimate(null);
            // Reload bookings
            if (searchResult) {
                const bookingsData = await getCustomerBookings(searchResult.id);
                setSearchResult(prev => ({
                    ...prev,
                    bookings: bookingsData
                }));
            }
        } catch (err) {
            console.error("Failed to cancel booking", err);
            alert(err.response?.data?.error || err.message || "Lỗi khi thực hiện hủy chuyến.");
        }
    };

    return (
        <div className="bg-background text-on-background min-h-screen flex flex-col">
            <OperatorHeader currentUser={user} />

            <main className="flex-grow pt-24 pb-s-xl px-s-margin-mobile md:px-s-margin-desktop max-w-[1440px] mx-auto w-full">
                <div className="max-w-5xl mx-auto">

                    {/* Page Header */}
                    <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-xl mb-s-lg">
                        <h1 className="text-2xl font-bold text-primary mb-1">Hủy chuyến & Hoàn tiền khách hàng</h1>
                        <p className="text-sm text-on-surface-variant mb-s-lg leading-relaxed">
                            Nhập thông tin email hoặc số điện thoại của khách hàng để tra cứu danh sách các
                            chuyến đi đang hoạt động và thực hiện quy trình hoàn tiền/hủy chuyến.
                        </p>
                        {/* Search Bar */}
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="Nhập Email hoặc Số điện thoại (ví dụ: customer1@gmail.com)"
                                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="px-6 py-3 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition disabled:opacity-60"
                            >
                                {isSearching ? "Đang tìm..." : "Tra cứu"}
                            </button>
                        </div>
                    </div>

                    {searchResult && (
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-s-lg">
                            {/* Left: Customer Info + Bookings */}
                            <div className="space-y-4">
                                {/* Customer Card */}
                                <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-primary text-[28px]">person</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h2 className="font-bold text-lg text-on-surface">{searchResult.fullName}</h2>
                                                <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                    {searchResult.tier}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-on-surface-variant flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">mail</span>
                                                    {searchResult.email}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">phone</span>
                                                    {searchResult.phone}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Bookings */}
                                <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
                                    <div className="px-s-lg py-4 border-b border-outline-variant/20 flex items-center justify-between">
                                        <h3 className="font-semibold text-on-surface">Chuyến đi đang hoạt động</h3>
                                        <span className="text-sm text-on-surface-variant">
                                            {searchResult.bookings.length} Kết quả tìm thấy
                                        </span>
                                    </div>

                                    {/* Table Header */}
                                    <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr] gap-4 px-s-lg py-3 bg-surface-container-low text-xs font-semibold uppercase text-on-surface-variant">
                                        <span>Tour / Booking ID</span>
                                        <span>Ngày khởi hành</span>
                                        <span>Tổng tiền</span>
                                        <span>Thao tác</span>
                                    </div>

                                    <div className="divide-y divide-outline-variant/20">
                                        {searchResult.bookings.length === 0 ? (
                                            <p className="p-6 text-sm text-on-surface-variant text-center">Không có chuyến đi nào đang hoạt động.</p>
                                        ) : (
                                            searchResult.bookings.map((booking) => (
                                                <div
                                                    key={booking.id}
                                                    className={`grid grid-cols-[2fr_1.2fr_1fr_1fr] gap-4 px-s-lg py-4 items-center transition cursor-pointer ${
                                                        selectedBooking?.id === booking.id
                                                            ? "bg-primary-fixed/30"
                                                            : "hover:bg-surface-container-low/50"
                                                    }`}
                                                    onClick={() => handleSelectBooking(booking)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={booking.thumbnail}
                                                            alt={booking.tourTitle}
                                                            className="w-14 h-10 rounded-lg object-cover flex-shrink-0"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-sm text-on-surface leading-snug">{booking.tourTitle}</p>
                                                            <p className="text-xs text-primary font-medium mt-0.5">{booking.code}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm text-on-surface">{booking.departureDate}</span>
                                                    <span className="text-sm font-semibold text-on-surface">
                                                        {booking.totalPrice.toLocaleString("vi-VN")} VNĐ
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCancel(booking); }}
                                                        className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-600 text-xs font-semibold hover:bg-rose-200 transition w-fit"
                                                    >
                                                        Hủy chuyến đi
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Refund Detail */}
                            <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-s-lg h-fit">
                                <div className="flex items-center gap-2 mb-s-lg">
                                    <span className="material-symbols-outlined text-secondary text-[22px]">receipt_long</span>
                                    <h3 className="font-semibold text-on-surface">Chi tiết hoàn tiền</h3>
                                </div>
                                {selectedBooking ? (
                                    <div className="space-y-3">
                                        {loadingEstimate ? (
                                            <p className="text-xs text-on-surface-variant">Đang tính toán hoàn tiền...</p>
                                        ) : refundEstimate ? (
                                            <>
                                                <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-700 leading-relaxed font-medium whitespace-pre-line">
                                                    {refundEstimate.refundPolicy}
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-on-surface-variant">Tổng tiền đã thanh toán</span>
                                                        <span className="font-medium">{refundEstimate.originalAmount.toLocaleString("vi-VN")} đ</span>
                                                    </div>
                                                    <div className="flex justify-between text-rose-500">
                                                        <span>Phí hủy</span>
                                                        <span className="font-medium">-{refundEstimate.cancelFee.toLocaleString("vi-VN")} đ</span>
                                                    </div>
                                                    <div className="border-t border-outline-variant/30 pt-2 flex justify-between font-bold text-green-700">
                                                        <span>Số tiền hoàn lại</span>
                                                        <span>{refundEstimate.refundAmount.toLocaleString("vi-VN")} đ</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleCancel(selectedBooking)}
                                                    className="w-full py-2.5 rounded-lg bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition mt-2"
                                                >
                                                    Xác nhận hủy &amp; Hoàn tiền
                                                </button>
                                            </>
                                        ) : (
                                            <p className="text-xs text-red-500 font-semibold">Lỗi tải dữ liệu hoàn tiền.</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-8 text-center">
                                        <span className="material-symbols-outlined text-[48px] text-outline-variant mb-3">touch_app</span>
                                        <p className="text-sm text-on-surface-variant">Chọn một chuyến đi để tính toán hoàn tiền.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!searchResult && !isSearching && (
                        <div className="flex flex-col items-center py-16 text-center text-on-surface-variant">
                            <span className="material-symbols-outlined text-[64px] text-outline-variant mb-4">manage_search</span>
                            <p className="text-lg font-medium">Tra cứu khách hàng</p>
                            <p className="text-sm mt-1">Nhập email hoặc số điện thoại để bắt đầu tìm kiếm</p>
                        </div>
                    )}
                </div>
            </main>

            <OperatorFooter />
        </div>
    );
};

export default OperatorCancelCustomerPage;
