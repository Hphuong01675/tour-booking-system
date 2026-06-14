import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ManagerHeader from "../../components/manager/ManagerHeader";
import ManagerFooter from "../../components/manager/ManagerFooter";
import { getManagerProfile } from "../../api/managerApi";

// =============================================================
// TODO: Thay bằng API call khi có login
// Lấy chi tiết xác thực: GET /api/managers/bookings/{bookingId}/verify
// Phê duyệt: PUT /api/managers/bookings/{bookingId}/approve
// Từ chối: PUT /api/managers/bookings/{bookingId}/reject {reason}
// Dựa trên: Booking, Participant, User, TourSchedule, Tour, Payment
// =============================================================
const FAKE_VERIFICATION_DATA = {
    bookingCode: "#GE-88291",
    tourName: "Khám phá Hang Sơn Đoòng - 5N4Đ",
    customer: {
        fullName: "Nguyễn Văn Hoàng Anh",
        dateOfBirth: "12/05/1990",
        phone: "+84 901 234 567",
        email: "hoanganh.nguyen@email.com",
        address: "456 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
    },
    booking: {
        registeredDate: "24/05/2024",
        totalGuests: "03 người",
        paymentStatus: "Đã đặt cọc 50%",
    },
    documents: {
        status: "pending",
        frontImage: "https://images.unsplash.com/photo-1618044619888-009e412ff12a?w=400&h=250&fit=crop",
        backImage: "https://images.unsplash.com/photo-1618044733555-e6f1d85e4dcb?w=400&h=250&fit=crop",
    },
    companions: [
        { name: "Trần Thu Thủy", dateOfBirth: "15/09/1992", type: "Người lớn" },
        { name: "Nguyễn Văn Bình", dateOfBirth: "02/01/2018", type: "Trẻ em" },
    ],
    customerNote: "Gia đình có trẻ em, vui lòng sắp xếp HDV có kinh nghiệm hỗ trợ trẻ nhỏ. Chúng tôi đã hoàn tất tiêm chủng định kỳ.",
};

const ManagerCustomerVerifyPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [toast, setToast] = useState(null);

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

    // TODO: Fetch verification data by id: GET /api/managers/bookings/{id}/verify
    const data = FAKE_VERIFICATION_DATA;

    const showToast = (type) => {
        setToast(type);
        setTimeout(() => setToast(null), 3000);
    };

    const handleApprove = () => {
        // TODO: PUT /api/managers/bookings/{id}/approve
        showToast("approve");
    };

    const handleReject = () => {
        // TODO: PUT /api/managers/bookings/{id}/reject
        showToast("reject");
    };

    return (
        <div className="bg-background text-on-background min-h-screen flex flex-col">
            <ManagerHeader currentUser={user} />

            <main className="flex-grow pt-24 pb-xl px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto w-full">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-xl gap-4">
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
                    <div className="flex gap-3">
                        <button
                            onClick={handleReject}
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                    {/* Left Column: Profile & Docs */}
                    <div className="lg:col-span-8 flex flex-col gap-gutter">
                        {/* Customer Profile Section */}
                        <section className="bg-white p-xl rounded-xl shadow-sm border border-outline-variant/30">
                            <div className="flex items-center gap-3 mb-lg">
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
                        <section className="bg-white p-xl rounded-xl shadow-sm border border-outline-variant/30">
                            <div className="flex justify-between items-center mb-lg">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary p-2 bg-primary-fixed rounded-lg">id_card</span>
                                    <h2 className="text-lg font-semibold text-on-surface">Giấy tờ định danh</h2>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">pending</span>
                                    Pending
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                                {[
                                    { label: "Mặt trước CMND/CCCD", src: data.documents.frontImage },
                                    { label: "Mặt sau CMND/CCCD", src: data.documents.backImage },
                                ].map((doc) => (
                                    <div
                                        key={doc.label}
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
                        <div className="bg-primary text-on-primary p-xl rounded-xl shadow-lg relative overflow-hidden">
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
                                    <span className="px-2 py-0.5 rounded bg-teal-400/30 text-teal-100 text-xs font-semibold">
                                        {data.booking.paymentStatus}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Accompanied Persons */}
                        <section className="bg-white p-xl rounded-xl shadow-sm border border-outline-variant/30 flex-grow">
                            <div className="flex items-center gap-3 mb-lg">
                                <span className="material-symbols-outlined text-primary p-2 bg-primary-fixed rounded-lg">group</span>
                                <h2 className="text-lg font-semibold text-on-surface">Người đi cùng</h2>
                            </div>
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-outline-variant/30">
                                        <th className="pb-3 text-xs font-semibold uppercase text-outline">Họ tên</th>
                                        <th className="pb-3 text-xs font-semibold uppercase text-outline text-center">Loại</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/20">
                                    {data.companions.map((c) => (
                                        <tr key={c.name}>
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
                            <div className="mt-6 p-4 bg-surface-container-low rounded-lg">
                                <p className="text-xs text-on-surface-variant mb-2 font-medium">Ghi chú từ khách hàng:</p>
                                <p className="text-xs italic text-on-surface-variant leading-relaxed">
                                    "{data.customerNote}"
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

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

            <ManagerFooter />
        </div>
    );
};

export default ManagerCustomerVerifyPage;
