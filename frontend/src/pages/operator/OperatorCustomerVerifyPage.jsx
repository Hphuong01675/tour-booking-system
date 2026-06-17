import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OperatorHeader from "../../components/operator/OperatorHeader";
import OperatorFooter from "../../components/operator/OperatorFooter";
import { getOperatorProfile, getBookingVerification, approveBooking, rejectBooking } from "../../api/operatorApi";

const OperatorCustomerVerifyPage = () => {
    const { id } = useParams(); // bookingId
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    
    // Rejection modal state
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [submittingReject, setSubmittingReject] = useState(false);

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

    const fetchVerificationData = async () => {
        setLoading(true);
        try {
            const result = await getBookingVerification(id);
            setData(result);
        } catch (err) {
            console.error("Failed to load verification data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchVerificationData();
        }
    }, [id]);

    const showToast = (type) => {
        setToast(type);
        setTimeout(() => setToast(null), 3000);
    };

    const handleApprove = async () => {
        if (!data) return;
        const totalPeople = 1 + (data.companions?.length || 0);
        const peopleList = [
            `${data.customer.fullName} (Trưởng đoàn)`,
            ...(data.companions?.map((c) => `${c.name} (Người đi cùng)`) || [])
        ].join("\n- ");

        const confirmMessage = `Bạn có chắc chắn muốn phê duyệt hồ sơ đặt chỗ này?\n\n` +
            `Số lượng người sẽ được phê duyệt: ${totalPeople} người\n` +
            `Danh sách:\n- ${peopleList}`;

        if (!window.confirm(confirmMessage)) return;
        try {
            await approveBooking(id);
            showToast("approve");
            fetchVerificationData();
        } catch (err) {
            console.error("Failed to approve booking", err);
            alert("Lỗi khi phê duyệt: " + (err.message || err));
        }
    };

    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        if (!rejectReason.trim()) {
            alert("Vui lòng nhập lý do từ chối.");
            return;
        }
        setSubmittingReject(true);
        try {
            await rejectBooking(id, rejectReason);
            setShowRejectModal(false);
            setRejectReason("");
            showToast("reject");
            fetchVerificationData();
        } catch (err) {
            console.error("Failed to reject booking", err);
            alert("Lỗi khi từ chối phê duyệt: " + (err.message || err));
        } finally {
            setSubmittingReject(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-background text-on-background min-h-screen flex flex-col">
                <OperatorHeader currentUser={user} />
                <main className="flex-grow pt-24 text-center text-sm text-on-surface-variant">
                    Đang tải thông tin xác thực...
                </main>
                <OperatorFooter />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-background text-on-background min-h-screen flex flex-col">
                <OperatorHeader currentUser={user} />
                <main className="flex-grow pt-24 text-center text-sm text-red-500 font-semibold">
                    Không tìm thấy thông tin đặt chỗ/xác thực.
                </main>
                <OperatorFooter />
            </div>
        );
    }

    return (
        <div className="bg-background text-on-background min-h-screen flex flex-col">
            <OperatorHeader currentUser={user} />

            <main className="flex-grow pt-24 pb-s-xl px-s-margin-mobile md:px-s-margin-desktop max-w-[1440px] mx-auto w-full">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-s-xl gap-4">
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-primary text-sm font-medium hover:opacity-70 transition"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                            Quay lại danh sách
                        </button>
                        <h1 className="text-2xl font-bold text-on-surface">Chi tiết Xác thực Khách hàng</h1>
                        <p className="text-sm text-on-surface-variant">
                            Đang xét duyệt yêu cầu cho Tour:{" "}
                            <span className="font-bold text-on-surface">{data.tourName}</span>
                        </p>
                    </div>
                    {data.documents.status === "pending" && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectModal(true)}
                                className="px-6 py-2.5 rounded-lg border border-error text-error text-sm font-semibold hover:bg-error-container/10 transition"
                            >
                                Từ chối
                            </button>
                            <button
                                onClick={handleApprove}
                                className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow-sm hover:opacity-90 active:scale-95 transition"
                            >
                                Phê duyệt
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                    {/* Left Column: Profile & Docs */}
                    <div className="lg:col-span-8 flex flex-col gap-gutter">
                        {/* Customer Profile Section */}
                        <section className="bg-white p-s-xl rounded-xl shadow-sm border border-outline-variant/30">
                            <div className="flex items-center gap-3 mb-s-lg">
                                <span className="material-symbols-outlined text-primary p-2 bg-primary-fixed rounded-lg">person</span>
                                <h2 className="text-lg font-semibold text-on-surface">Thông tin khách hàng</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-gutter">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-outline font-semibold mb-1">Họ và tên</p>
                                    <p className="text-sm font-semibold text-on-surface">{data.customer.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-outline font-semibold mb-1">Ngày sinh</p>
                                    <p className="text-sm font-semibold text-on-surface">{data.customer.dateOfBirth}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-outline font-semibold mb-1">Số điện thoại</p>
                                    <p className="text-sm font-semibold text-on-surface">{data.customer.phone}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-outline font-semibold mb-1">Email</p>
                                    <p className="text-sm font-semibold text-primary underline">{data.customer.email}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-xs uppercase tracking-wider text-outline font-semibold mb-1">Địa chỉ thường trú</p>
                                    <p className="text-sm font-semibold text-on-surface">{data.customer.address}</p>
                                </div>
                            </div>
                        </section>

                        {/* Document Verification Section */}
                        <section className="bg-white p-s-xl rounded-xl shadow-sm border border-outline-variant/30">
                            <div className="flex justify-between items-center mb-s-lg">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary p-2 bg-primary-fixed rounded-lg">id_card</span>
                                    <h2 className="text-lg font-semibold text-on-surface">Giấy tờ định danh</h2>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                    data.documents.status === "pending" ? "bg-amber-100 text-amber-700" :
                                    data.documents.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}>
                                    <span className="material-symbols-outlined text-[14px]">
                                        {data.documents.status === "pending" ? "pending" :
                                         data.documents.status === "approved" ? "check_circle" : "cancel"}
                                    </span>
                                    {data.documents.status === "pending" ? "Chờ duyệt" :
                                     data.documents.status === "approved" ? "Đã duyệt" : "Đã từ chối"}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-s-lg">
                                {[
                                    { label: "Mặt trước CMND/CCCD/Hộ chiếu", src: data.documents.frontImage },
                                    { label: "Mặt sau CMND/CCCD/Hộ chiếu", src: data.documents.backImage },
                                ].map((doc) => (
                                    <div
                                        key={doc.label}
                                        onClick={() => window.open(doc.src, "_blank")}
                                        className="group relative overflow-hidden rounded-xl border-2 border-dashed border-outline-variant aspect-video flex flex-col items-center justify-center bg-surface-container-low hover:border-primary transition-colors cursor-pointer"
                                    >
                                        <img
                                            src={doc.src}
                                            alt={doc.label}
                                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="relative z-10 flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-[36px] text-primary drop-shadow">zoom_in</span>
                                            <p className="text-sm font-medium text-on-surface bg-white/80 px-3 py-1 rounded-full">
                                                {doc.label}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Booking Summary & Companions */}
                    <div className="lg:col-span-4 flex flex-col gap-gutter">
                        {/* Booking Summary Card */}
                        <div className="bg-primary text-on-primary p-s-xl rounded-xl shadow-lg relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                            <h3 className="font-semibold text-lg mb-4">Mã đặt chỗ: {data.bookingCode}</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                                    <span className="text-xs font-semibold opacity-80">Ngày đăng ký</span>
                                    <span className="text-sm">{data.booking.registeredDate}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                                    <span className="text-xs font-semibold opacity-80">Tổng số khách</span>
                                    <span className="text-sm">{data.booking.totalGuests}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold opacity-80">Trạng thái thanh toán</span>
                                    <span className="px-2 py-0.5 rounded bg-teal-400/30 text-teal-100 text-xs font-semibold font-mono">
                                        {data.booking.paymentStatus}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Accompanied Persons */}
                        <section className="bg-white p-s-xl rounded-xl shadow-sm border border-outline-variant/30 flex-grow">
                            <div className="flex items-center gap-3 mb-s-lg">
                                <span className="material-symbols-outlined text-primary p-2 bg-primary-fixed rounded-lg">group</span>
                                <h2 className="text-lg font-semibold text-on-surface">Người đi cùng</h2>
                            </div>
                            {data.companions.length === 0 ? (
                                <p className="text-xs italic text-on-surface-variant">Không có người đi cùng.</p>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-outline-variant/30">
                                            <th className="pb-3 text-xs font-semibold uppercase text-outline">Họ tên</th>
                                            <th className="pb-3 text-xs font-semibold uppercase text-outline text-center">Loại</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/20">
                                        {data.companions.map((c, idx) => (
                                            <tr key={idx}>
                                                <td className="py-4">
                                                    <p className="text-sm font-semibold text-on-surface">{c.name}</p>
                                                    <p className="text-xs text-on-surface-variant">{c.dateOfBirth}</p>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        c.type === "Người lớn"
                                                            ? "bg-surface-container-high text-on-surface-variant"
                                                            : "bg-primary-fixed text-on-primary-fixed"
                                                    }`}>
                                                        {c.type}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            <div className="mt-6 p-4 bg-surface-container-low rounded-lg">
                                <p className="text-xs text-on-surface-variant mb-2 font-medium">Ghi chú / Lý do hủy:</p>
                                <p className="text-xs italic text-on-surface-variant leading-relaxed">
                                    "{data.customerNote}"
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b border-outline-variant/20">
                            <h3 className="font-bold text-lg text-on-surface">Lý do từ chối hồ sơ</h3>
                            <p className="text-xs text-on-surface-variant mt-1">
                                Vui lòng cho biết lý do từ chối hồ sơ đặt chỗ này của khách hàng.
                            </p>
                        </div>
                        <form onSubmit={handleRejectSubmit}>
                            <div className="p-6">
                                <textarea
                                    required
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Ví dụ: Ảnh CCCD bị mờ, không khớp thông tin đăng ký..."
                                    rows={4}
                                    className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                />
                            </div>
                            <div className="p-6 bg-surface-container-low flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
                                    className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReject}
                                    className="px-5 py-2 rounded-lg bg-error text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                                >
                                    {submittingReject ? "Đang xử lý..." : "Xác nhận từ chối"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl text-white z-50 flex items-center gap-3 animate-fadeIn ${
                    toast === "approve" ? "bg-primary" : "bg-error"
                }`}>
                    <span className="material-symbols-outlined">
                        {toast === "approve" ? "check_circle" : "cancel"}
                    </span>
                    <span className="font-bold">
                        {toast === "approve" ? "Đã phê duyệt hồ sơ" : "Đã từ chối hồ sơ"}
                    </span>
                </div>
            )}

            <OperatorFooter />
        </div>
    );
};

export default OperatorCustomerVerifyPage;
