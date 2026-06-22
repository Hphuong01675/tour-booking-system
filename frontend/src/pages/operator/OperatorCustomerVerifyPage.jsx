import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OperatorHeader from "../../components/operator/OperatorHeader";
import OperatorFooter from "../../components/operator/OperatorFooter";
import { getOperatorProfile, getBookingVerification, approveBooking, rejectBooking, updateParticipantCCCD, addParticipantToBooking } from "../../api/operatorApi";

const OperatorCustomerVerifyPage = () => {
    const { id } = useParams(); // bookingId
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [approvedParticipantIds, setApprovedParticipantIds] = useState([]);
    
    // Rejection modal state
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [submittingReject, setSubmittingReject] = useState(false);

    // Add Participant Modal State
    const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
    const [newParticipant, setNewParticipant] = useState({
        fullName: "",
        dateOfBirth: "",
        participantType: "adult",
        address: "",
        phone: "",
        frontImage: null,
        backImage: null
    });
    const [submittingAdd, setSubmittingAdd] = useState(false);

    // Update CCCD Modal State
    const [showUpdateCCCDModal, setShowUpdateCCCDModal] = useState(false);
    const [selectedParticipantId, setSelectedParticipantId] = useState(null);
    const [updateCCCDFiles, setUpdateCCCDFiles] = useState({
        frontImage: null,
        backImage: null
    });
    const [submittingUpdateCCCD, setSubmittingUpdateCCCD] = useState(false);

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
            if (result.participants) {
                setApprovedParticipantIds(result.participants.map(p => p.id));
            }
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

    const showToastMessage = (type) => {
        setToast(type);
        setTimeout(() => setToast(null), 3000);
    };

    const toggleParticipantApproval = (participantId) => {
        setApprovedParticipantIds(prev => 
            prev.includes(participantId) 
                ? prev.filter(id => id !== participantId) 
                : [...prev, participantId]
        );
    };

    const openUpdateCCCDModal = (participantId) => {
        setSelectedParticipantId(participantId);
        setUpdateCCCDFiles({ frontImage: null, backImage: null });
        setShowUpdateCCCDModal(true);
    };

    const handleUpdateCCCDSubmit = async (e) => {
        e.preventDefault();
        if (!updateCCCDFiles.frontImage && !updateCCCDFiles.backImage) {
            alert("Vui lòng chọn ít nhất 1 ảnh để cập nhật!");
            return;
        }

        setSubmittingUpdateCCCD(true);
        try {
            const formData = new FormData();
            if (updateCCCDFiles.frontImage) formData.append("frontImage", updateCCCDFiles.frontImage);
            if (updateCCCDFiles.backImage) formData.append("backImage", updateCCCDFiles.backImage);

            await updateParticipantCCCD(selectedParticipantId, formData);
            setShowUpdateCCCDModal(false);
            showToastMessage("success");
            fetchVerificationData();
        } catch (err) {
            alert("Lỗi cập nhật CCCD: " + (err.response?.data?.error || err.message));
        } finally {
            setSubmittingUpdateCCCD(false);
        }
    };

    const handleAddParticipant = async (e) => {
        e.preventDefault();
        setSubmittingAdd(true);
        try {
            const formData = new FormData();
            formData.append("fullName", newParticipant.fullName);
            formData.append("dateOfBirth", newParticipant.dateOfBirth);
            formData.append("participantType", newParticipant.participantType);
            formData.append("address", newParticipant.address);
            formData.append("phone", newParticipant.phone);
            if (newParticipant.frontImage) formData.append("frontImage", newParticipant.frontImage);
            if (newParticipant.backImage) formData.append("backImage", newParticipant.backImage);

            await addParticipantToBooking(id, formData);
            setShowAddParticipantModal(false);
            setNewParticipant({
                fullName: "",
                dateOfBirth: "",
                participantType: "adult",
                address: "",
                phone: "",
                frontImage: null,
                backImage: null
            });
            showToastMessage("success");
            fetchVerificationData();
        } catch (err) {
            alert("Lỗi thêm hành khách: " + (err.response?.data?.error || err.message));
        } finally {
            setSubmittingAdd(false);
        }
    };

    const handleApprove = async () => {
        if (!data) return;
        if (approvedParticipantIds.length === 0) {
            alert("Phải chọn ít nhất 1 người tham gia để duyệt!");
            return;
        }

        const approvedCount = approvedParticipantIds.length;
        const confirmMessage = `Bạn có chắc chắn muốn phê duyệt hồ sơ đặt chỗ này?\n\n` +
            `Số lượng người sẽ được phê duyệt: ${approvedCount} người\n\n` +
            `Lưu ý: Những hành khách không được chọn sẽ bị xóa khỏi booking và giá sẽ được tính lại!`;

        if (!window.confirm(confirmMessage)) return;
        try {
            await approveBooking(id, approvedParticipantIds);
            showToastMessage("approve");
            fetchVerificationData();
        } catch (err) {
            console.error("Failed to approve booking", err);
            alert("Lỗi khi phê duyệt: " + (err.response?.data?.error || err.message));
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
            showToastMessage("reject");
            fetchVerificationData();
        } catch (err) {
            console.error("Failed to reject booking", err);
            alert("Lỗi khi từ chối phê duyệt: " + (err.response?.data?.error || err.message));
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
                    {/* Left Column: Participants & Profile */}
                    <div className="lg:col-span-8 flex flex-col gap-gutter">
                        {/* Customer Profile Section */}
                        <section className="bg-white p-s-xl rounded-xl shadow-sm border border-outline-variant/30">
                            <div className="flex items-center gap-3 mb-s-lg">
                                <span className="material-symbols-outlined text-primary p-2 bg-primary-fixed rounded-lg">person</span>
                                <h2 className="text-lg font-semibold text-on-surface">Người đặt (Đại diện)</h2>
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
                            </div>
                        </section>

                        {/* Participants List */}
                        <section className="bg-white p-s-xl rounded-xl shadow-sm border border-outline-variant/30">
                            <div className="flex justify-between items-center mb-s-lg">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary p-2 bg-primary-fixed rounded-lg">group</span>
                                    <h2 className="text-lg font-semibold text-on-surface">Danh sách hành khách tham gia</h2>
                                </div>
                                {data.documents.status === "pending" && (
                                    <button 
                                        onClick={() => setShowAddParticipantModal(true)}
                                        className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">add</span>
                                        Thêm khách
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col gap-6">
                                {data.participants?.map((p, idx) => (
                                    <div key={p.id} className="border border-outline-variant/50 rounded-xl p-4 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                {data.documents.status === "pending" && (
                                                    <input 
                                                        type="checkbox" 
                                                        checked={approvedParticipantIds.includes(p.id)}
                                                        onChange={() => toggleParticipantApproval(p.id)}
                                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                                    />
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-on-surface flex items-center gap-2">
                                                        {p.name}
                                                        {p.isLead && <span className="bg-primary-fixed text-primary-fixed-dim px-2 py-0.5 rounded text-[10px] uppercase font-bold">Leader</span>}
                                                    </h3>
                                                    <p className="text-xs text-on-surface-variant mt-1">
                                                        Sinh: {p.dateOfBirth} | Loại: {p.type}
                                                    </p>
                                                </div>
                                            </div>
                                            {data.documents.status === "pending" && (
                                                <button 
                                                    onClick={() => openUpdateCCCDModal(p.id)}
                                                    className="text-xs px-3 py-1 bg-surface-container-low border border-outline-variant/50 rounded hover:bg-surface-container transition font-medium text-on-surface"
                                                >
                                                    Cập nhật ảnh
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { label: "Mặt trước CCCD", src: p.cccdFrontUrl },
                                                { label: "Mặt sau CCCD", src: p.cccdBackUrl },
                                            ].map((doc, docIdx) => (
                                                <div
                                                    key={docIdx}
                                                    onClick={() => window.open(doc.src, "_blank")}
                                                    className="group relative overflow-hidden rounded-lg border border-dashed border-outline-variant aspect-[16/9] flex flex-col items-center justify-center bg-surface-container-lowest hover:border-primary transition-colors cursor-pointer"
                                                >
                                                    <img
                                                        src={doc.src}
                                                        alt={doc.label}
                                                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="relative z-10 flex flex-col items-center gap-1 bg-white/70 p-2 rounded-lg backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="material-symbols-outlined text-[24px] text-primary">zoom_in</span>
                                                        <p className="text-xs font-semibold text-on-surface">
                                                            {doc.label}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Booking Summary */}
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

                        <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 mt-gutter">
                            <p className="text-xs text-on-surface-variant mb-2 font-medium">Ghi chú từ khách hàng:</p>
                            <p className="text-xs italic text-on-surface-variant leading-relaxed">
                                "{data.customerNote}"
                            </p>
                        </div>
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

            {/* Update CCCD Modal */}
            {showUpdateCCCDModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b border-outline-variant/20">
                            <h3 className="font-bold text-lg text-on-surface">Cập nhật ảnh CCCD</h3>
                            <p className="text-xs text-on-surface-variant mt-1">
                                Tải lên ảnh mặt trước hoặc mặt sau (hoặc cả hai) để cập nhật.
                            </p>
                        </div>
                        <form onSubmit={handleUpdateCCCDSubmit}>
                            <div className="p-6 flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-semibold mb-1 block">Ảnh CCCD Mặt trước</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="w-full border rounded p-2 text-sm" 
                                        onChange={e => setUpdateCCCDFiles({...updateCCCDFiles, frontImage: e.target.files[0]})} 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold mb-1 block">Ảnh CCCD Mặt sau</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="w-full border rounded p-2 text-sm" 
                                        onChange={e => setUpdateCCCDFiles({...updateCCCDFiles, backImage: e.target.files[0]})} 
                                    />
                                </div>
                            </div>
                            <div className="p-6 bg-surface-container-low flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowUpdateCCCDModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingUpdateCCCD}
                                    className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                                >
                                    {submittingUpdateCCCD ? "Đang xử lý..." : "Cập nhật ảnh"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Participant Modal */}
            {showAddParticipantModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b border-outline-variant/20">
                            <h3 className="font-bold text-lg text-on-surface">Thêm hành khách</h3>
                            <p className="text-xs text-on-surface-variant mt-1">
                                Điền thông tin hành khách tham gia tour.
                            </p>
                        </div>
                        <form onSubmit={handleAddParticipant}>
                            <div className="p-6 flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-semibold mb-1 block">Họ và tên *</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full border rounded p-2 text-sm" 
                                        value={newParticipant.fullName} 
                                        onChange={e => setNewParticipant({...newParticipant, fullName: e.target.value})} 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block">Ngày sinh *</label>
                                        <input 
                                            required
                                            type="date" 
                                            className="w-full border rounded p-2 text-sm" 
                                            value={newParticipant.dateOfBirth} 
                                            onChange={e => setNewParticipant({...newParticipant, dateOfBirth: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block">Loại hình *</label>
                                        <select 
                                            required
                                            className="w-full border rounded p-2 text-sm" 
                                            value={newParticipant.participantType} 
                                            onChange={e => setNewParticipant({...newParticipant, participantType: e.target.value})}
                                        >
                                            <option value="adult">Người lớn</option>
                                            <option value="child">Trẻ em (70%)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold mb-1 block">Địa chỉ</label>
                                    <input 
                                        type="text" 
                                        className="w-full border rounded p-2 text-sm" 
                                        value={newParticipant.address} 
                                        onChange={e => setNewParticipant({...newParticipant, address: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold mb-1 block">Số điện thoại</label>
                                    <input 
                                        type="tel" 
                                        className="w-full border rounded p-2 text-sm" 
                                        value={newParticipant.phone} 
                                        onChange={e => setNewParticipant({...newParticipant, phone: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold mb-1 block">Ảnh CCCD Mặt trước</label>
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        className="w-full border rounded p-2 text-sm" 
                                        onChange={e => setNewParticipant({...newParticipant, frontImage: e.target.files[0]})} 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold mb-1 block">Ảnh CCCD Mặt sau</label>
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        className="w-full border rounded p-2 text-sm" 
                                        onChange={e => setNewParticipant({...newParticipant, backImage: e.target.files[0]})} 
                                    />
                                </div>
                            </div>
                            <div className="p-6 bg-surface-container-low flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddParticipantModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAdd}
                                    className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                                >
                                    {submittingAdd ? "Đang xử lý..." : "Thêm hành khách"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl text-white z-50 flex items-center gap-3 animate-fadeIn ${
                    toast === "reject" ? "bg-error" : "bg-primary"
                }`}>
                    <span className="material-symbols-outlined">
                        {toast === "reject" ? "cancel" : "check_circle"}
                    </span>
                    <span className="font-bold">
                        {toast === "approve" ? "Đã phê duyệt hồ sơ" : 
                         toast === "reject" ? "Đã từ chối hồ sơ" : "Thao tác thành công"}
                    </span>
                </div>
            )}

            <OperatorFooter />
        </div>
    );
};

export default OperatorCustomerVerifyPage;
