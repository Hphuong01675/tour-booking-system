import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getTourAssignmentDetail,
    exportCustomers,
    sendGroupNotification,
    checkinParticipant,
    uploadParticipantCccd
} from '../../api/guideApi';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import ChecklistTab from '../../components/Guide/ChecklistTab';
import { useAppModal } from '../../components/Guide/AppModal';
import * as chatApi from '../../api/chatApi';

const formatChatPreview = (content) => {
    if (!content) return 'Chưa có tin nhắn.';

    try {
        const parsed = JSON.parse(content);
        if (parsed?.type === 'cccd_review') {
            return `Khách đã gửi CCCD để kiểm tra${parsed.participantName ? `: ${parsed.participantName}` : ''}.`;
        }
        if (parsed?.type === 'image') return 'Khách đã gửi hình ảnh.';
        if (parsed?.type === 'video') return 'Khách đã gửi video.';
    } catch {
        // Plain text message.
    }

    return content;
};

const QRScanner = ({ assignmentId, onClose, onCheckinSuccess }) => {
    const [manualCode, setManualCode] = useState('');
    const [scanStatus, setScanStatus] = useState('scanning'); // scanning, processing, success, error
    const [statusMsg, setStatusMsg] = useState('');
    const isProcessing = useRef(false);
    const [isProcessingFlag, setIsProcessingFlag] = useState(false);

    // Use a ref to keep track of the latest callback without triggering useEffect re-runs
    const onCheckinSuccessRef = useRef(onCheckinSuccess);
    useEffect(() => {
        onCheckinSuccessRef.current = onCheckinSuccess;
    }, [onCheckinSuccess]);

    const resetScannerAfter = (delay) => {
        setTimeout(() => {
            isProcessing.current = false;
            setIsProcessingFlag(false);
            setScanStatus('scanning');
            setStatusMsg('');
        }, delay);
    };

    const getCheckinCode = (participant, fallbackCode) => {
        return participant?.checkinCode || participant?.checkin_code || fallbackCode || '';
    };

    const getCheckinErrorMessage = (err) => {
        const message = err.response?.data?.error || err.response?.data?.message || '';
        const normalized = String(message).toLowerCase();

        if (normalized.includes('check-in trước') || normalized.includes('already') || normalized.includes('đã được check-in')) {
            return 'Khách hàng này đã được check-in trước đó.';
        }

        return 'Mã không hợp lệ hoặc tour không tồn tại / không thuộc về bạn.';
    };

    const handleCheckinCode = async (rawCode) => {
        const checkinCode = String(rawCode || '').trim();
        if (!checkinCode || isProcessing.current) return;

        isProcessing.current = true;
        setIsProcessingFlag(true);
        setScanStatus('processing');
        setStatusMsg('Đang xử lý...');

        try {
            const response = await checkinParticipant(assignmentId, checkinCode);
            if (response.success) {
                const participant = response.participant || {};
                const participantName = participant.fullName || 'Khách hàng';
                const displayCode = getCheckinCode(participant, checkinCode);
                setScanStatus('success');
                setStatusMsg(`Thành công: ${participantName} - ${displayCode}`);
                onCheckinSuccessRef.current?.();
                resetScannerAfter(2000);
            }
        } catch (err) {
            setScanStatus('error');
            setStatusMsg(getCheckinErrorMessage(err));
            resetScannerAfter(3000);
        }
    };

    useEffect(() => {
        let scanner = null;
        let isCancelled = false;

        const startCameraScanner = async () => {
            try {
                if (isCancelled) return;

                scanner = new Html5Qrcode('qr-reader', false);
                const cameras = await Html5Qrcode.getCameras();
                if (isCancelled) return;

                const preferredCamera = cameras.find((camera) => {
                    const label = String(camera.label || '').toLowerCase();
                    return label.includes('back') || label.includes('rear') || label.includes('environment');
                }) || cameras[0];
                const scannerConfig = {
                    fps: 15,
                    disableFlip: true,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true,
                    },
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const boxSize = Math.min(360, Math.max(220, Math.floor(minEdge * 0.84)));
                        return { width: boxSize, height: boxSize };
                    },
                };
                const cameraCandidates = [
                    preferredCamera?.id,
                    { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
                    { facingMode: 'environment' },
                    true,
                ].filter(Boolean);

                let lastCameraError = null;
                for (const candidate of cameraCandidates) {
                    if (isCancelled) return;
                    try {
                        await scanner.start(
                            candidate,
                            scannerConfig,
                            (decodedText) => {
                                handleCheckinCode(decodedText);
                            },
                            () => {}
                        );
                        return;
                    } catch (cameraErr) {
                        lastCameraError = cameraErr;
                        console.warn('QR camera candidate failed:', candidate, cameraErr);
                    }
                }

                throw lastCameraError || new Error('No camera candidate could be started');
            } catch (err) {
                console.error('Failed to start QR camera:', err);
                if (!isCancelled) {
                    setScanStatus('error');
                    const reason = err?.name || err?.message || '';
                    setStatusMsg(`Không thể mở camera${reason ? ` (${reason})` : ''}. Vui lòng kiểm tra trình duyệt đang dùng localhost/HTTPS, đóng app khác đang dùng camera hoặc nhập mã thủ công.`);
                    resetScannerAfter(4000);
                }
            }
        };

        startCameraScanner();

        return () => {
            isCancelled = true;
            if (scanner) {
                Promise.resolve()
                    .then(() => (scanner.isScanning ? scanner.stop() : undefined))
                    .then(() => scanner.clear())
                    .catch((err) => console.error('Failed to stop QR camera:', err));
            }
        };
    }, [assignmentId]);

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        const checkinCode = manualCode.trim();
        if (!checkinCode || isProcessing.current) return;

        setManualCode('');
        await handleCheckinCode(checkinCode);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-on-background/40 backdrop-blur-sm p-4">
            <div className="app-modal-panel app-modal-panel-sm bg-surface-container-lowest rounded-2xl p-xl shadow-2xl relative overflow-hidden">

                {/* Lớp phủ trạng thái thành công/lỗi */}
                {scanStatus !== 'scanning' && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-container-lowest/90 backdrop-blur-sm p-lg text-center animate-fade-in">
                        {scanStatus === 'processing' && <span className="material-symbols-outlined text-[64px] text-primary animate-spin">sync</span>}
                        {scanStatus === 'success' && <span className="material-symbols-outlined text-[80px] text-green-500 mb-sm">check_circle</span>}
                        {scanStatus === 'error' && <span className="material-symbols-outlined text-[80px] text-error mb-sm">error</span>}
                        <h4 className={`font-headline-sm ${scanStatus === 'error' ? 'text-error' : 'text-primary'}`}>{statusMsg}</h4>
                        {scanStatus === 'success' && <p className="text-on-surface-variant text-sm mt-xs">Đang chuẩn bị quét tiếp...</p>}
                    </div>
                )}

                <div className="flex justify-between items-center mb-md border-b border-outline-variant/30 pb-xs">
                    <h3 className="font-headline-sm text-primary flex items-center gap-xs">
                        <span className="material-symbols-outlined">qr_code_scanner</span>
                        Quét mã check-in
                    </h3>
                    <button onClick={onClose} className="text-on-surface-variant hover:text-primary z-20">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Khung quét Camera */}
                <div id="qr-reader" className="w-full rounded-xl overflow-hidden mb-lg border border-outline-variant"></div>

                {/* Nhập thủ công */}
                <div className="mt-md border-t border-outline-variant/30 pt-md">
                    <label className="block text-label-sm text-outline mb-xs">Hoặc nhập thủ công (nếu quét khó)</label>
                    <form onSubmit={handleManualSubmit} className="flex gap-sm">
                        <input
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="VD: QR-GH-103"
                            className="flex-1 px-sm py-2 bg-surface-container border border-outline-variant rounded-lg font-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                        <button
                            type="submit"
                            disabled={isProcessingFlag || !manualCode.trim()}
                            className="bg-primary text-on-primary px-md rounded-lg font-bold hover:bg-primary-container disabled:opacity-50"
                        >
                            Gửi
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};



const GuideTourDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showModal, AppModal } = useAppModal();

    // State
    const [assignment, setAssignment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('info'); // 'info' or 'customers'
    const [customerViewMode, setCustomerViewMode] = useState('checkin'); // 'checkin' or 'payment'

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCheckin, setFilterCheckin] = useState('all'); // 'all', 'checked', 'unchecked'
    const [filterLeader, setFilterLeader] = useState('all'); // 'all', 'lead'

    // Modals state
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notificationMsg, setNotificationMsg] = useState({});
    const [notificationErrors, setNotificationErrors] = useState({});
    const [isSending, setIsSending] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);

    // Private Email state
    const [showPrivateEmailModal, setShowPrivateEmailModal] = useState(false);
    const [privateEmailTarget, setPrivateEmailTarget] = useState(null);
    const [privateEmailSubject, setPrivateEmailSubject] = useState('');
    const [privateEmailContent, setPrivateEmailContent] = useState('');
    const [isSendingPrivateEmail, setIsSendingPrivateEmail] = useState(false);
    const [showChatHistoryModal, setShowChatHistoryModal] = useState(false);
    const [chatHistoryTarget, setChatHistoryTarget] = useState(null);
    const [chatHistories, setChatHistories] = useState([]);
    const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);
    const [isReopeningChat, setIsReopeningChat] = useState(false);

    // Upload CCCD state
    const frontInputRef = useRef(null);
    const backInputRef = useRef(null);
    const [showCccdModal, setShowCccdModal] = useState(false);
    const [cccdTargetParticipant, setCccdTargetParticipant] = useState(null);
    const [selectedFront, setSelectedFront] = useState(null);
    const [selectedBack, setSelectedBack] = useState(null);
    const [uploadingParticipantId, setUploadingParticipantId] = useState(null);

    // View CCCD state
    const [showViewCccdModal, setShowViewCccdModal] = useState(false);
    const [viewCccdParticipant, setViewCccdParticipant] = useState(null);

    const openCccdModal = (participant) => {
        setCccdTargetParticipant(participant);
        setSelectedFront(null);
        setSelectedBack(null);
        setShowCccdModal(true);
    };

    const handleUploadCccdSubmit = async () => {
        if (!selectedFront && !selectedBack) return;

        try {
            setUploadingParticipantId(cccdTargetParticipant.id);
            const formData = new FormData();
            if (selectedFront) formData.append('front', selectedFront);
            if (selectedBack) formData.append('back', selectedBack);

            const response = await uploadParticipantCccd(id, cccdTargetParticipant.id, formData);
            if (response.success) {
                // Update local state without re-fetching
                setAssignment(prev => {
                    const newAssignment = { ...prev };
                    newAssignment.schedule.bookings.forEach(b => {
                        b.participants.forEach(p => {
                            if (p.id === cccdTargetParticipant.id) {
                                if (response.participant?.cccdFrontUrl) p.cccdFrontUrl = response.participant.cccdFrontUrl;
                                if (response.participant?.cccdBackUrl) p.cccdBackUrl = response.participant.cccdBackUrl;
                            }
                        });
                    });
                    return newAssignment;
                });
                showModal('Tải ảnh CCCD thành công!', 'success');
                setShowCccdModal(false);
                setSelectedFront(null);
                setSelectedBack(null);
            }
        } catch (err) {
            console.error(err);
            showModal('Tải ảnh thất bại. Vui lòng thử lại.', 'error');
        } finally {
            setUploadingParticipantId(null);
        }
    };

    const openPrivateEmailModal = (participant) => {
        setPrivateEmailTarget(participant);
        setPrivateEmailSubject(`Thông tin từ Hướng dẫn viên`);
        setPrivateEmailContent('');
        setShowPrivateEmailModal(true);
    };

    const handleSendPrivateEmail = async () => {
        if (!privateEmailSubject.trim() || !privateEmailContent.trim()) {
            showModal('Vui lòng nhập đầy đủ tiêu đề và nội dung!', 'warning');
            return;
        }

        // Only allow sending private emails to group leader
        if (!privateEmailTarget?.isLead) {
            showModal('Chỉ được phép gửi email cá nhân cho Trưởng nhóm.', 'warning');
            return;
        }

        try {
            setIsSendingPrivateEmail(true);
            await sendGroupNotification(id, {
                type: 'announcement',
                subject: privateEmailSubject.trim(),
                content: privateEmailContent.trim(),
                bookingId: privateEmailTarget.bookingId
            });
            showModal('Đã gửi email thành công!', 'success');
            setShowPrivateEmailModal(false);
        } catch (err) {
            showModal(err.response?.data?.message || err.response?.data?.error || 'Không thể gửi email. Vui lòng thử lại.', 'error');
        } finally {
            setIsSendingPrivateEmail(false);
        }
    };

    const openCustomerChatHistory = async (participant) => {
        if (!participant?.isLead) {
            showModal('Chỉ có thể nhắn tin trực tiếp với trưởng nhóm.', 'warning');
            return;
        }

        if (!participant?.customerId) {
            showModal('Không tìm thấy tài khoản khách hàng để nhắn tin.', 'error');
            return;
        }

        setChatHistoryTarget(participant);
        setShowChatHistoryModal(true);
        setIsLoadingChatHistory(true);
        setChatHistories([]);

        try {
            const histories = await chatApi.getCustomerChatHistory(participant.customerId);
            setChatHistories(Array.isArray(histories) ? histories : []);
        } catch (err) {
            console.error('Failed to load customer chat history:', err);
            showModal(err.response?.data?.error || 'Không thể tải lịch sử tin nhắn.', 'error');
        } finally {
            setIsLoadingChatHistory(false);
        }
    };

    const handleReopenCustomerChat = async (conversationId = null) => {
        if (!chatHistoryTarget?.customerId || isReopeningChat) return;

        try {
            setIsReopeningChat(true);
            await chatApi.reopenCustomerConversation(chatHistoryTarget.customerId, conversationId);
            showModal('Đã đưa cuộc trò chuyện vào hàng chờ tiếp nhận.', 'success');
            setShowChatHistoryModal(false);
            navigate('/guides/consultations');
        } catch (err) {
            console.error('Failed to reopen customer conversation:', err);
            showModal(err.response?.data?.error || 'Không thể mở lại cuộc trò chuyện.', 'error');
        } finally {
            setIsReopeningChat(false);
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    // Load Data
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                if (!assignment) setIsLoading(true);
                else setIsFetching(true);
                setError(null);
                // Try calling real API
                const data = await getTourAssignmentDetail(id, {
                    search: searchTerm,
                    checkinStatus: filterCheckin,
                    isLead: filterLeader
                });
                setAssignment(data || null);
            } catch (err) {
                console.warn('API error while fetching assignment detail:', err);
                setError('Không thể tải dữ liệu lịch trình. Vui lòng thử lại sau.');
                setAssignment(null);
            } finally {
                setIsLoading(false);
                setIsFetching(false);
            }
        };
        const timeoutId = setTimeout(fetchDetail, 300);
        return () => clearTimeout(timeoutId);
    }, [id, searchTerm, filterCheckin, filterLeader]);

    if (isLoading) {
        return (
            <>
                <main className="flex-grow flex items-center justify-center p-xl">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-primary text-[48px] animate-spin">sync</span>
                        <p className="font-body-md text-on-surface-variant mt-sm">Đang tải thông tin lịch trình...</p>
                    </div>
                </main>
            </>
        );
    }

    // If not loading but no assignment was found, show a friendly empty state
    if (!assignment) {
        return (
            <>
                <main className="flex-grow flex items-center justify-center p-xl">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-outline text-[48px]">inventory_2</span>
                        <h3 className="font-headline-sm text-on-surface mt-md">Không tìm thấy lịch trình</h3>
                        <p className="font-body-md text-on-surface-variant mt-sm">{error || 'Lịch trình có thể đã bị xóa hoặc không tồn tại.'}</p>
                        <div className="mt-lg">
                            <button
                                onClick={() => navigate('/guides/tours')}
                                className="px-xl py-3 bg-primary text-on-primary rounded-lg font-bold"
                            >Quay lại danh sách tour</button>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    const schedule = assignment?.schedule || {};
    const tour = schedule?.tour || {};
    const guide = assignment?.guide || {};
    const bookings = schedule?.bookings || [];

    // Helper date formatting
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    const parseMoney = (value) => {
        const amount = Number(value);
        return Number.isFinite(amount) ? amount : 0;
    };

    const getBookingPaidAmount = (booking) => {
        return (booking.payments || [])
            .filter(payment => String(payment.status || '').toLowerCase() === 'success')
            .reduce((sum, payment) => sum + parseMoney(payment.amount), 0);
    };

    const getBookingPaymentInfo = (booking) => {
        const status = String(booking.status || '').toLowerCase();
        const finalPrice = parseMoney(booking.finalPrice || booking.totalPrice);
        const paidAmount = getBookingPaidAmount(booking);
        const debtAmount = Math.max(finalPrice - paidAmount, 0);

        if (status === 'paid' || (finalPrice > 0 && debtAmount <= 0)) {
            return {
                status,
                finalPrice,
                paidAmount: finalPrice || paidAmount,
                debtAmount: 0,
                label: 'Đã hoàn tất',
                tone: 'paid'
            };
        }

        if (paidAmount > 0) {
            return {
                status,
                finalPrice,
                paidAmount,
                debtAmount,
                label: 'Thanh toán một phần',
                tone: 'partial'
            };
        }

        return {
            status,
            finalPrice,
            paidAmount,
            debtAmount: finalPrice,
            label: status === 'pending_approval' ? 'Chờ duyệt' : 'Chưa thanh toán',
            tone: 'pending'
        };
    };

    // Flatten participants and attach booking information
    const allParticipants = bookings.flatMap(booking => {
        const paymentInfo = getBookingPaymentInfo(booking);
        return (booking.participants || []).map(p => ({
            ...p,
            bookingCode: booking.bookingCode,
            bookingStatus: paymentInfo.status,
            bookingFinalPrice: paymentInfo.finalPrice,
            bookingPaidAmount: paymentInfo.paidAmount,
            debtAmount: paymentInfo.debtAmount,
            paymentLabel: paymentInfo.label,
            paymentTone: paymentInfo.tone,
            customerPhone: booking.customer?.phone || 'Theo bố mẹ',
            customerName: booking.customer?.fullName || p.fullName,
            customerId: booking.customerId
        }));
    });

    const filteredParticipants = allParticipants;

    // Calculate Checkin Stats
    const participantStats = assignment?.participantStats || {};
    const checkedInCount = participantStats.checkedInTotal ?? allParticipants.filter(p => p.checkinAt !== null).length;
    const totalCount = participantStats.total ?? allParticipants.length;

    const handleExport = async () => {
        try {
            // Export customer list for this specific assignment/schedule
            const blob = await exportCustomers(id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `danh_sach_khach_hang_${schedule.scheduleCode || id}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Failed to export report:', err);
            showModal('Không thể xuất file. Thử lại sau.', 'error');
        }
    };

    return (
        <>
            <AppModal />

            {/* CCCD Upload Modal */}
            {showCccdModal && cccdTargetParticipant && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-on-background/40 backdrop-blur-sm p-4">
                    <div className="app-modal-panel app-modal-panel-lg bg-surface-container-lowest rounded-2xl p-xl shadow-2xl relative">
                        <div className="flex justify-between items-center mb-md border-b border-outline-variant/30 pb-xs">
                            <h3 className="font-headline-sm text-primary flex items-center gap-xs">
                                <span className="material-symbols-outlined">badge</span>
                                Cập nhật CCCD - {cccdTargetParticipant.fullName}
                            </h3>
                            <button onClick={() => {
                                setShowCccdModal(false);
                                setSelectedFront(null);
                                setSelectedBack(null);
                            }}
                                    className="text-on-surface-variant hover:text-primary z-20">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <p className="text-body-sm text-on-surface-variant mb-md">Nhấn đúp (Double-click) vào từng ô bên dưới để chọn ảnh mặt trước và mặt sau.</p>

                        <div className="flex flex-col sm:flex-row gap-lg justify-center mb-xl">
                            {/* Front */}
                            <div
                                className="flex-1 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center p-md cursor-pointer hover:bg-surface-container-low transition-colors relative overflow-hidden"
                                style={{ minHeight: '160px' }}
                                onDoubleClick={() => frontInputRef.current?.click()}
                                title="Nhấn đúp để tải ảnh lên"
                            >
                                {selectedFront ? (
                                    <img src={URL.createObjectURL(selectedFront)} alt="Mặt trước" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                                ) : cccdTargetParticipant.cccdFrontUrl && cccdTargetParticipant.cccdFrontUrl !== 'uploaded' ? (
                                    <img src={cccdTargetParticipant.cccdFrontUrl} alt="Mặt trước" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-[40px] text-outline">credit_card</span>
                                        <p className="font-label-md text-outline mt-sm">Mặt trước</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={frontInputRef}
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files[0]) setSelectedFront(e.target.files[0]);
                                    }}
                                />
                            </div>

                            {/* Back */}
                            <div
                                className="flex-1 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center p-md cursor-pointer hover:bg-surface-container-low transition-colors relative overflow-hidden"
                                style={{ minHeight: '160px' }}
                                onDoubleClick={() => backInputRef.current?.click()}
                                title="Nhấn đúp để tải ảnh lên"
                            >
                                {selectedBack ? (
                                    <img src={URL.createObjectURL(selectedBack)} alt="Mặt sau" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                                ) : cccdTargetParticipant.cccdBackUrl && cccdTargetParticipant.cccdBackUrl !== 'uploaded' ? (
                                    <img src={cccdTargetParticipant.cccdBackUrl} alt="Mặt sau" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-[40px] text-outline">credit_card</span>
                                        <p className="font-label-md text-outline mt-sm">Mặt sau</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={backInputRef}
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files[0]) setSelectedBack(e.target.files[0]);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-sm">
                            <button
                                onClick={() => {
                                    setShowCccdModal(false);
                                    setSelectedFront(null);
                                    setSelectedBack(null);
                                }}
                                className="px-md py-sm rounded-lg font-bold text-on-surface hover:bg-surface-container transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUploadCccdSubmit}
                                disabled={!selectedFront && !selectedBack}
                                className="px-md py-sm rounded-lg font-bold bg-primary text-on-primary hover:bg-primary-container transition-colors disabled:opacity-50"
                            >
                                {uploadingParticipantId === cccdTargetParticipant.id ? 'Đang tải lên...' : 'Lưu ảnh'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CCCD View Modal */}
            {showViewCccdModal && viewCccdParticipant && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-on-background/60 backdrop-blur-sm p-4">
                    <div className="app-modal-panel app-modal-panel-xl bg-surface-container-lowest rounded-2xl p-xl shadow-2xl relative flex flex-col">
                        <div className="flex justify-between items-center mb-md border-b border-outline-variant/30 pb-xs flex-shrink-0">
                            <h3 className="font-headline-sm text-primary flex items-center gap-xs">
                                <span className="material-symbols-outlined">badge</span>
                                Ảnh CCCD - {viewCccdParticipant.fullName}
                            </h3>
                            <button onClick={() => setShowViewCccdModal(false)}
                                    className="text-on-surface-variant hover:text-primary z-20">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 py-sm">
                            <div className="flex flex-col sm:flex-row gap-lg justify-center h-full">
                                {/* Front */}
                                <div className="flex-1 flex flex-col items-center">
                                    <p className="font-label-md text-outline mb-sm">Mặt trước</p>
                                    <div className="w-full bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant flex items-center justify-center" style={{ minHeight: '200px' }}>
                                        {viewCccdParticipant.cccdFrontUrl && viewCccdParticipant.cccdFrontUrl !== 'uploaded' ? (
                                            <img src={viewCccdParticipant.cccdFrontUrl} alt="Mặt trước" className="max-w-full max-h-[400px] object-contain" />
                                        ) : (
                                            <span className="text-on-surface-variant italic font-body-sm">Chưa có ảnh</span>
                                        )}
                                    </div>
                                </div>

                                {/* Back */}
                                <div className="flex-1 flex flex-col items-center">
                                    <p className="font-label-md text-outline mb-sm">Mặt sau</p>
                                    <div className="w-full bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant flex items-center justify-center" style={{ minHeight: '200px' }}>
                                        {viewCccdParticipant.cccdBackUrl && viewCccdParticipant.cccdBackUrl !== 'uploaded' ? (
                                            <img src={viewCccdParticipant.cccdBackUrl} alt="Mặt sau" className="max-w-full max-h-[400px] object-contain" />
                                        ) : (
                                            <span className="text-on-surface-variant italic font-body-sm">Chưa có ảnh</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-md flex-shrink-0 border-t border-outline-variant/30 pt-md">
                            <button
                                onClick={() => setShowViewCccdModal(false)}
                                className="px-lg py-sm rounded-lg font-bold bg-primary text-on-primary hover:bg-primary-container transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-grow pb-xl">
                {/* Hero Banner Section */}
                <div className="px-margin-desktop py-xl bg-gradient-to-r from-primary to-tertiary-container text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-sm mb-sm opacity-90">
                            <span className="material-symbols-outlined text-[18px]">event</span>
                            <span className="font-label-md">
                {formatDate(schedule.departureDate)} - {formatDate(schedule.returnDate)}
              </span>
                            <span className="mx-xs">•</span>
                            <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                            <span className="font-label-md">Mã lịch trình: {schedule.scheduleCode}</span>
                        </div>
                        <h1 className="font-headline-lg text-headline-lg mb-xs">{tour.title}</h1>
                        <p className="font-body-lg opacity-90 max-w-2xl">{tour.description}</p>
                    </div>
                    <div className="absolute right-0 top-0 w-1/3 h-full opacity-20 pointer-events-none">
                        {tour.thumbnailUrl && (
                            <img
                                className="w-full h-full object-cover"
                                src={tour.thumbnailUrl}
                                alt={tour.title}
                            />
                        )}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-surface-container-lowest shadow-sm sticky top-0 z-40 border-b border-outline-variant/20">
                    <div className="px-margin-desktop flex gap-xl">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`py-md px-sm transition-all flex items-center gap-sm font-semibold font-body-md ${
                                activeTab === 'info'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-on-surface-variant hover:text-primary'
                            }`}
                        >
                            <span className="material-symbols-outlined">info</span>
                            Thông tin tour
                        </button>
                        <button
                            onClick={() => setActiveTab('customers')}
                            className={`py-md px-sm transition-all flex items-center gap-sm font-semibold font-body-md ${
                                activeTab === 'customers'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-on-surface-variant hover:text-primary'
                            }`}
                        >
                            <span className="material-symbols-outlined">group</span>
                            Danh sách ({totalCount})
                        </button>
                        <button
                            onClick={() => setActiveTab('checklist')}
                            className={`py-md px-sm transition-all flex items-center gap-sm font-semibold font-body-md ${
                                activeTab === 'checklist'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-on-surface-variant hover:text-primary'
                            }`}
                        >
                            <span className="material-symbols-outlined">checklist</span>
                            Hành trang & Nhắc nhở
                        </button>
                    </div>
                </div>

                {/* Tab Contents */}
                <div className="px-margin-desktop mt-xl">


                    {/* Tab 1: Tour Info */}
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-12 gap-gutter">
                            {/* Left Column */}
                            <div className="col-span-12 lg:col-span-8 space-y-lg">

                                {/* General Overview */}
                                <section className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/30">
                                    <h2 className="font-headline-sm mb-lg text-primary border-l-4 border-primary pl-md">
                                        Tổng quan hành trình
                                    </h2>
                                    <div className="space-y-md">
                                        <div className="flex items-start gap-md pb-md border-b border-outline-variant/20">
                                            <div className="p-sm bg-primary-fixed rounded-lg text-primary">
                                                <span className="material-symbols-outlined">map</span>
                                            </div>
                                            <div>
                                                <p className="font-label-md text-on-surface-variant uppercase tracking-wider">Điểm đến</p>
                                                <p className="font-body-md font-semibold">{tour.destination}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-md pb-md border-b border-outline-variant/20">
                                            <div className="p-sm bg-secondary-fixed rounded-lg text-secondary">
                                                <span className="material-symbols-outlined">directions_bus</span>
                                            </div>
                                            <div>
                                                <p className="font-label-md text-on-surface-variant uppercase tracking-wider">Khởi hành từ</p>
                                                <p className="font-body-md font-semibold">{tour.departureLocation}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-md">
                                            <div className="p-sm bg-tertiary-fixed rounded-lg text-tertiary">
                                                <span className="material-symbols-outlined">hotel</span>
                                            </div>
                                            <div>
                                                <p className="font-label-md text-on-surface-variant uppercase tracking-wider">Thời gian tour</p>
                                                <p className="font-body-md font-semibold">
                                                    {tour.durationDays} Ngày {tour.durationNights} Đêm
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Detailed Itinerary */}
                                <section className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/30">
                                    <h2 className="font-headline-sm mb-lg text-primary border-l-4 border-primary pl-md">
                                        Chi tiết lịch trình
                                    </h2>
                                    <div className="space-y-lg">
                                        {tour.itineraryDays && tour.itineraryDays.length > 0 ? (
                                            tour.itineraryDays.map((day, idx) => (
                                                <div key={day.id || idx} className="relative pl-sm border-l-2 border-primary-fixed ml-sm">
                                                    <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full ${idx === 0 ? 'bg-primary ring-4 ring-primary-fixed' : 'bg-primary-fixed'}`}></div>
                                                    <div className="mb-md">
                            <span className="inline-block px-sm py-xs bg-primary text-white rounded-lg text-label-md mb-xs">
                              Ngày {day.dayNumber}: {day.title}
                            </span>
                                                        <p className="font-body-md text-on-surface-variant leading-relaxed">
                                                            {day.description}
                                                        </p>
                                                        {day.meals && (
                                                            <p className="font-label-sm text-outline mt-sm flex items-center gap-xs">
                                                                <span className="material-symbols-outlined text-[16px]">restaurant</span>
                                                                Bữa ăn: {day.meals}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="font-body-md text-on-surface-variant italic">Chưa có lịch trình chi tiết.</p>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Right Column (Sidebar info) */}
                            <div className="col-span-12 lg:col-span-4 space-y-lg">
                                {/* Group Status */}
                                <div className="bg-primary text-white p-lg rounded-xl shadow-lg">
                                    <h3 className="font-headline-sm mb-md border-b border-white/20 pb-xs">Trạng thái đoàn</h3>
                                    <div className="space-y-sm">
                                        <div className="flex justify-between items-center py-xs border-b border-white/20">
                                            <span>Tổng số khách</span>
                                            <span className="font-bold">{schedule.registered} / {schedule.maxCapacity}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-xs border-b border-white/20">
                                            <span>Trạng thái lịch</span>
                                            <span className="bg-secondary-container text-white px-sm py-xs rounded text-label-sm font-bold uppercase">
                        {schedule.status}
                      </span>
                                        </div>
                                        <div className="flex justify-between items-center py-xs">
                                            <span>Hướng dẫn viên</span>
                                            <span className="font-bold">{guide.fullName || 'Chưa phân công'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Operations Checklist / Notes */}
                                <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/30">
                                    <h3 className="font-headline-sm mb-md text-primary">Ghi chú vận hành</h3>
                                    <ul className="text-on-surface-variant font-body-sm space-y-sm list-disc pl-md">
                                        <li>Nhắc nhở tài xế xe có mặt đón đoàn trước 15 phút.</li>
                                        <li>Kiểm tra khẩu phần ăn chay/đặc biệt của khách hàng trong bookings.</li>
                                        <li>Chuẩn bị cờ dẫn đoàn và thẻ thông tin cho từng thành viên.</li>
                                        <li>Liên hệ các điểm check-in khách sạn, nhà hàng để chuẩn bị thủ tục trước.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Customers Management */}
                    {activeTab === 'customers' && (
                        <div className="space-y-lg">

                            {/* Header Actions */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
                                <div>
                                    <h2 className="font-headline-md text-primary">Quản lý thành viên đoàn</h2>
                                    <p className="font-body-sm text-on-surface-variant">
                                        Check-in: <strong className="text-primary">{checkedInCount}</strong> / {totalCount} thành viên
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-sm">
                                    <button
                                        onClick={handleExport}
                                        className="bg-white border border-outline text-on-surface px-md py-sm rounded-xl font-label-md flex items-center gap-xs hover:bg-surface-container-low transition-all shadow-sm active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">download</span>
                                        Xuất file Excel
                                    </button>
                                    <button
                                        onClick={() => setShowQRModal(true)}
                                        className="bg-surface-container-high text-on-surface-variant px-md py-sm rounded-xl font-label-md flex items-center gap-xs hover:bg-surface-variant transition-all shadow-sm active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                                        Quét mã QR
                                    </button>
                                    <button
                                        onClick={() => setShowNotificationModal(true)}
                                        className="bg-primary text-on-primary px-md py-sm rounded-xl font-label-md flex items-center gap-xs hover:bg-primary-container transition-all shadow-sm active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">send</span>
                                        Gửi thông báo đoàn
                                    </button>
                                </div>
                            </div>

                            {/* View Switcher Sub-Tabs */}
                            <div className="flex border-b border-outline-variant/30 gap-md">
                                <button
                                    onClick={() => setCustomerViewMode('checkin')}
                                    className={`py-sm px-xs font-semibold text-body-sm transition-all flex items-center gap-xs ${
                                        customerViewMode === 'checkin'
                                            ? 'border-b-2 border-primary text-primary font-bold'
                                            : 'text-on-surface-variant hover:text-primary'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                                    Trạng thái điểm danh (Check-in)
                                </button>
                                <button
                                    onClick={() => setCustomerViewMode('payment')}
                                    className={`py-sm px-xs font-semibold text-body-sm transition-all flex items-center gap-xs ${
                                        customerViewMode === 'payment'
                                            ? 'border-b-2 border-primary text-primary font-bold'
                                            : 'text-on-surface-variant hover:text-primary'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">payments</span>
                                    Tình trạng thanh toán
                                </button>
                            </div>

                            {/* Filters & Search */}
                            <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col md:flex-row gap-md items-center justify-between">
                                <div className="relative w-full md:w-80">
                                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">search</span>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Tìm tên, mã code, sđt..."
                                        className="w-full pl-xl pr-md py-sm bg-surface-container-low border border-outline-variant/30 rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                {customerViewMode === 'checkin' && (
                                    <div className="flex gap-sm w-full md:w-auto">
                                        <select
                                            value={filterCheckin}
                                            onChange={(e) => setFilterCheckin(e.target.value)}
                                            className="w-full md:w-auto bg-transparent border-outline-variant rounded-lg font-body-sm text-body-sm px-md py-sm focus:ring-primary focus:border-primary"
                                        >
                                            <option value="all">Tất cả trạng thái check-in</option>
                                            <option value="checked">Đã check-in</option>
                                            <option value="unchecked">Chờ check-in</option>
                                        </select>
                                        <select
                                            value={filterLeader}
                                            onChange={(e) => setFilterLeader(e.target.value)}
                                            className="w-full md:w-auto bg-transparent border-outline-variant rounded-lg font-body-sm text-body-sm px-md py-sm focus:ring-primary focus:border-primary"
                                        >
                                            <option value="all">Tất cả (Trưởng nhóm + Thành viên)</option>
                                            <option value="lead">Chỉ Trưởng nhóm</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* BẢNG 1: Check-in View */}
                            {customerViewMode === 'checkin' && (
                                <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                            <tr className="bg-surface-container text-on-surface-variant font-label-md border-b border-outline-variant/30">
                                                <th className="px-lg py-md">Họ và Tên</th>
                                                <th className="px-lg py-md">Ngày sinh</th>
                                                <th className="px-lg py-md">Loại khách</th>
                                                <th className="px-lg py-md">Số điện thoại</th>
                                                <th className="px-lg py-md">Trạng thái</th>
                                                <th className="px-lg py-md text-right">Thao tác</th>
                                            </tr>
                                            </thead>
                                            <tbody className={`divide-y divide-outline-variant/20 transition-opacity duration-200 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                            {filteredParticipants.length > 0 ? (
                                                filteredParticipants.map((p) => (
                                                    <tr key={p.id} className="hover:bg-surface-bright transition-colors">
                                                        <td className="px-lg py-md font-body-md font-semibold text-on-surface">
                                                            <div>
                                                                {p.fullName}
                                                                <span className="text-label-sm text-outline block font-normal mt-0.5">
                                    Mã booking: {p.bookingCode} | Mã check-in: {p.checkinCode || 'Chưa có dữ liệu'}
                                  </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-lg py-md font-body-md text-on-surface">
                                                            {formatDate(p.dateOfBirth)}
                                                        </td>
                                                        <td className="px-lg py-md">
                                <span className={`px-sm py-xs rounded-lg text-label-sm font-semibold ${
                                    p.participantType?.toUpperCase() === 'ADULT'
                                        ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                                        : 'bg-surface-container-high text-on-surface-variant'
                                }`}>
                                  {p.participantType?.toUpperCase() === 'ADULT' ? 'Người lớn' : 'Trẻ em'}
                                </span>
                                                        </td>
                                                        <td className="px-lg py-md font-body-md text-on-surface">
                                                            {p.customerPhone}
                                                        </td>
                                                        <td className="px-lg py-md">
                                                            {p.checkinAt ? (
                                                                <span className="inline-flex items-center gap-xs px-sm py-xs bg-green-100 text-green-700 rounded-lg text-label-sm font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                    Đã check-in ({formatDate(p.checkinAt)})
                                  </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-xs px-sm py-xs bg-surface-container-high text-on-surface-variant rounded-lg text-label-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                                    Chờ check-in
                                  </span>
                                                            )}
                                                        </td>
                                                        <td className="px-lg py-md text-right">
                                                            <div className="flex gap-2 justify-end w-full">
                                                                <div className="w-8 flex justify-center">
                                                                    {p.participantType?.toUpperCase() === 'ADULT' && (
                                                                        uploadingParticipantId === p.id ? (
                                                                            <span className="p-sm text-primary animate-spin">
                                          <span className="material-symbols-outlined text-[18px]">sync</span>
                                        </span>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => openCccdModal(p)}
                                                                                className="p-sm text-primary hover:bg-primary-fixed rounded-lg transition-all"
                                                                                title="Tải lên CCCD"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                                                                            </button>
                                                                        )
                                                                    )}
                                                                </div>
                                                                <div className="w-8 flex justify-center">
                                                                    {p.participantType?.toUpperCase() === 'ADULT' && (p.cccdFrontUrl || p.cccdBackUrl) && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setViewCccdParticipant(p);
                                                                                setShowViewCccdModal(true);
                                                                            }}
                                                                            className="p-sm text-secondary hover:bg-secondary-fixed rounded-lg transition-all"
                                                                            title="Xem CCCD"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[18px]">photo</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="w-8 flex justify-center">
                                                                    {p.isLead && (
                                                                        <button
                                                                            onClick={() => openCustomerChatHistory(p)}
                                                                            className="p-sm text-primary hover:bg-primary-fixed rounded-lg transition-all"
                                                                            title="Nhắn tin trực tiếp"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[18px]">chat</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="w-8 flex justify-center">
                                                                    {p.isLead && (
                                                                        <button
                                                                            onClick={() => openPrivateEmailModal(p)}
                                                                            className="p-sm text-secondary hover:bg-secondary-fixed rounded-lg transition-all"
                                                                            title="Gửi Email"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[18px]">mail</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="px-lg py-xl text-center text-on-surface-variant italic">
                                                        Không tìm thấy khách hàng nào khớp bộ lọc.
                                                    </td>
                                                </tr>
                                            )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="p-lg bg-surface-container-low flex justify-between items-center border-t border-outline-variant/20">
                    <span className="text-label-md text-on-surface-variant italic">
                      Hiển thị {filteredParticipants.length} trong tổng số {totalCount} khách hàng
                    </span>
                                        <div className="flex gap-sm">
                                            <button className="p-xs bg-white border border-outline-variant rounded-lg hover:bg-surface-variant transition-all disabled:opacity-50" disabled>
                                                <span className="material-symbols-outlined">chevron_left</span>
                                            </button>
                                            <button className="p-xs bg-white border border-outline-variant rounded-lg hover:bg-surface-variant transition-all disabled:opacity-50" disabled>
                                                <span className="material-symbols-outlined">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* BẢNG 2: Payment View */}
                            {customerViewMode === 'payment' && (
                                <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                            <tr className="bg-surface-container text-on-surface-variant font-label-md border-b border-outline-variant/30">
                                                <th className="px-lg py-md">Họ và Tên</th>
                                                <th className="px-lg py-md">Số điện thoại</th>
                                                <th className="px-lg py-md">Loại khách</th>
                                                <th className="px-lg py-md">Tình trạng thanh toán</th>
                                                <th className="px-lg py-md text-right">Hành động</th>
                                            </tr>
                                            </thead>
                                            <tbody className={`divide-y divide-outline-variant/20 transition-opacity duration-200 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                            {filteredParticipants.length > 0 ? (
                                                filteredParticipants.map((p) => (
                                                    <tr key={p.id} className="hover:bg-surface-bright transition-colors">
                                                        <td className="px-lg py-md font-body-md font-semibold text-on-surface">
                                                            <div>
                                                                {p.fullName}
                                                                <span className="text-label-sm text-outline block font-normal mt-0.5">
                                    {p.passportNumber || 'Chưa có dữ liệu'} | Mã Booking: {p.bookingCode}
                                  </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-lg py-md font-body-md text-on-surface">
                                                            {p.customerPhone}
                                                        </td>
                                                        <td className="px-lg py-md">
                                <span className={`px-sm py-xs rounded-lg text-label-sm font-semibold ${
                                    p.participantType?.toUpperCase() === 'ADULT'
                                        ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                                        : 'bg-surface-container-high text-on-surface-variant'
                                }`}>
                                  {p.participantType?.toUpperCase() === 'ADULT' ? 'Người lớn' : 'Trẻ em'}
                                </span>
                                                        </td>
                                                        <td className="px-lg py-md">
                                                            {p.paymentTone === 'paid' ? (
                                                                <span className="inline-flex items-center gap-xs px-sm py-xs bg-green-100 text-green-700 rounded-lg text-label-sm font-semibold">
                                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    {p.paymentLabel}
                                  </span>
                                                            ) : p.paymentTone === 'partial' ? (
                                                                <span className="inline-flex items-center gap-xs px-sm py-xs bg-amber-100 text-amber-700 rounded-lg text-label-sm font-semibold">
                                    <span className="material-symbols-outlined text-[16px]">paid</span>
                                    Đã trả {p.bookingPaidAmount.toLocaleString('vi-VN')}đ, còn {p.debtAmount.toLocaleString('vi-VN')}đ
                                  </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-xs px-sm py-xs bg-secondary-fixed/50 text-secondary font-semibold rounded-lg text-label-sm">
                                    <span className="material-symbols-outlined text-[16px]">pending</span>
                                    {p.paymentLabel}: {p.debtAmount.toLocaleString('vi-VN')}đ
                                  </span>
                                                            )}
                                                        </td>
                                                        <td className="px-lg py-md text-right">
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-lg py-xl text-center text-on-surface-variant italic">
                                                        Không tìm thấy khách hàng nào khớp bộ lọc.
                                                    </td>
                                                </tr>
                                            )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="p-lg bg-surface-container-low flex justify-between items-center border-t border-outline-variant/20">
                    <span className="text-label-md text-on-surface-variant italic">
                      Hiển thị {filteredParticipants.length} trong tổng số {totalCount} khách hàng
                    </span>
                                        <div className="flex gap-sm">
                                            <button className="p-xs bg-white border border-outline-variant rounded-lg hover:bg-surface-variant transition-all disabled:opacity-50" disabled>
                                                <span className="material-symbols-outlined">chevron_left</span>
                                            </button>
                                            <button className="p-xs bg-white border border-outline-variant rounded-lg hover:bg-surface-variant transition-all disabled:opacity-50" disabled>
                                                <span className="material-symbols-outlined">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {/* Tab 3: Checklist / Notification */}
                    {activeTab === 'checklist' && (
                        <ChecklistTab assignmentId={id} />
                    )}

                </div>
            </main>

            {/* MODAL: Quét QR Check-in */}
            {showQRModal && (
                <QRScanner
                    assignmentId={id}
                    onClose={() => setShowQRModal(false)}
                    onCheckinSuccess={() => {
                        // Tải lại assignment detail để cập nhật trạng thái
                        getTourAssignmentDetail(id, {
                            search: searchTerm,
                            checkinStatus: filterCheckin
                        }).then(data => setAssignment(data)).catch(console.error);
                    }}
                />
            )}

            {/* MODAL: Gửi Email riêng */}
            {showPrivateEmailModal && privateEmailTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4">
                    <div className="app-modal-panel app-modal-panel-lg bg-surface-container-lowest rounded-xl p-xl shadow-xl">
                        <h4 className="font-headline-sm text-on-surface mb-md">Gửi Email cho {privateEmailTarget.fullName}</h4>
                        <div className="space-y-md">
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Tiêu đề <span className="text-error">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={privateEmailSubject}
                                    onChange={(e) => setPrivateEmailSubject(e.target.value)}
                                    placeholder="Nhập tiêu đề email..."
                                    className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-primary font-body-md"
                                />
                            </div>
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Nội dung <span className="text-error">*</span>
                                </label>
                                <textarea
                                    value={privateEmailContent}
                                    onChange={(e) => setPrivateEmailContent(e.target.value)}
                                    placeholder="Nhập nội dung email..."
                                    rows="6"
                                    className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-primary font-body-sm text-on-surface"
                                />
                            </div>
                            <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/30">
                                <button
                                    onClick={() => setShowPrivateEmailModal(false)}
                                    className="px-lg py-sm rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSendPrivateEmail}
                                    disabled={isSendingPrivateEmail}
                                    className="px-lg py-sm rounded-lg font-label-md bg-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    {isSendingPrivateEmail ? 'Đang gửi...' : 'Gửi Email'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Lịch sử tin nhắn customer */}
            {showChatHistoryModal && chatHistoryTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/40 backdrop-blur-sm p-4">
                    <div className="app-modal-panel bg-surface-container-lowest rounded-2xl p-xl shadow-2xl max-w-[560px] w-full">
                        <div className="flex justify-between items-center mb-md border-b border-outline-variant/30 pb-xs">
                            <h3 className="font-headline-sm text-primary flex items-center gap-xs">
                                <span className="material-symbols-outlined">chat</span>
                                Lịch sử tin nhắn
                            </h3>
                            <button
                                onClick={() => setShowChatHistoryModal(false)}
                                className="text-on-surface-variant hover:text-primary"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="mb-md">
                            <p className="font-body-md text-on-surface font-semibold">{chatHistoryTarget.customerName || chatHistoryTarget.fullName}</p>
                            <p className="font-body-sm text-on-surface-variant">Trưởng nhóm: {chatHistoryTarget.fullName}</p>
                        </div>

                        {isLoadingChatHistory ? (
                            <div className="py-xl text-center text-on-surface-variant">
                                <span className="material-symbols-outlined animate-spin block mx-auto mb-sm">sync</span>
                                Đang tải lịch sử tin nhắn...
                            </div>
                        ) : chatHistories.length > 0 ? (
                            <div className="space-y-sm max-h-[360px] overflow-y-auto pr-1">
                                {chatHistories.map((conversation) => (
                                    <div key={conversation.id} className="border border-outline-variant/40 rounded-xl p-md bg-surface-container">
                                        <div className="flex items-start justify-between gap-md">
                                            <div className="min-w-0">
                                                <p className="font-label-md text-on-surface">{formatDateTime(conversation.updatedAt)}</p>
                                                <p className="font-body-sm text-on-surface-variant mt-xs line-clamp-2">
                                                    {formatChatPreview(conversation.lastMessage)}
                                                </p>
                                                <p className="font-label-sm text-outline mt-xs">Trạng thái: {conversation.status}</p>
                                            </div>
                                            <button
                                                onClick={() => handleReopenCustomerChat(conversation.id)}
                                                disabled={isReopeningChat}
                                                className="shrink-0 px-md py-sm rounded-lg bg-primary text-on-primary font-label-sm hover:bg-primary-container disabled:opacity-50"
                                            >
                                                Mở lại
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-xl text-center text-on-surface-variant border border-dashed border-outline-variant rounded-xl">
                                <span className="material-symbols-outlined text-[32px] block mb-sm">forum</span>
                                Chưa có lịch sử tin nhắn với khách hàng này.
                            </div>
                        )}

                        <div className="flex gap-sm justify-end mt-lg pt-md border-t border-outline-variant/30">
                            <button
                                onClick={() => setShowChatHistoryModal(false)}
                                className="px-lg py-sm rounded-lg bg-surface-container-high text-on-surface-variant font-bold hover:bg-surface-variant"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={() => handleReopenCustomerChat(chatHistories[0]?.id || null)}
                                disabled={isReopeningChat}
                                className="px-lg py-sm rounded-lg bg-primary text-on-primary font-bold hover:bg-primary-container disabled:opacity-50"
                            >
                                {chatHistories.length > 0 ? 'Đưa vào chờ tiếp nhận' : 'Tạo cuộc trò chuyện'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL 2: Send Announcement Modal */}
            {showNotificationModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-on-background/40 backdrop-blur-sm p-4">
                    <div className="app-modal-panel bg-surface-container-lowest rounded-2xl p-xl shadow-2xl">
                        <div className="flex justify-between items-center mb-md border-b border-outline-variant/30 pb-xs">
                            <h3 className="font-headline-sm text-primary flex items-center gap-xs">
                                <span className="material-symbols-outlined">campaign</span>
                                Thông báo cho toàn đoàn
                            </h3>
                            <button
                                onClick={() => {
                                    setNotificationErrors({});
                                    setShowNotificationModal(false);
                                }}
                                className="text-on-surface-variant hover:text-primary"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-md">
                            <div>
                                <label className="block text-label-sm text-outline mb-xs">Loại thông báo</label>
                                <select
                                    value={notificationMsg.type || 'announcement'}
                                    onChange={(e) => {
                                        setNotificationMsg(prev => ({ ...prev, type: e.target.value }));
                                        setNotificationErrors({});
                                    }}
                                    className="w-full px-md py-sm bg-surface-container border border-outline-variant rounded-lg font-body-sm text-body-sm"
                                >
                                    <option value="confirm_trip">Xác định chuyến đi (Confirmation)</option>
                                    <option value="announcement">Thông báo chung (Announcement)</option>
                                </select>
                            </div>

                            {/* Confirmation template fields */}
                            { (notificationMsg.type || 'announcement') === 'confirm_trip' && (
                                <div className="space-y-md">
                                    <p className="font-body-sm text-on-surface-variant">Hệ thống sẽ gửi email xác nhận chuyến đi theo mẫu chuyên nghiệp cho từng khách hàng. Bạn có thể thêm <strong>ghi chú</strong> cho hướng dẫn viên/điều hành.</p>
                                    <div>
                                        <label className="block text-label-sm text-outline mb-xs">
                                            Link Group Zalo hỗ trợ <span className="text-error">*</span>
                                        </label>
                                        <input
                                            type="url"
                                            value={notificationMsg.zaloGroupLink || ''}
                                            onChange={(e) => {
                                                setNotificationMsg(prev => ({ ...prev, zaloGroupLink: e.target.value }));
                                                setNotificationErrors(prev => ({ ...prev, zaloGroupLink: '' }));
                                            }}
                                            placeholder="https://zalo.me/g/..."
                                            className={`w-full px-md py-sm bg-surface-container border rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary ${notificationErrors.zaloGroupLink ? 'border-error' : 'border-outline-variant'}`}
                                        />
                                        {notificationErrors.zaloGroupLink && (
                                            <p className="text-error text-label-sm mt-1">{notificationErrors.zaloGroupLink}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-label-sm text-outline mb-xs">Ghi chú cho hướng dẫn viên / Tổ chức (tuỳ chọn)</label>
                                        <textarea
                                            value={notificationMsg.notes || ''}
                                            onChange={(e) => setNotificationMsg(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="Ghi chú: điểm tập trung, yêu cầu đặc biệt, lưu ý về hành lý..."
                                            rows="4"
                                            className="w-full px-md py-sm bg-surface-container border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Announcement fields */}
                            { (notificationMsg.type || 'announcement') === 'announcement' && (
                                <div className="space-y-md">
                                    <div>
                                        <label className="block text-label-sm text-outline mb-xs">Tiêu đề</label>
                                        <input
                                            type="text"
                                            value={notificationMsg.subject || ''}
                                            onChange={(e) => {
                                                setNotificationMsg(prev => ({ ...prev, subject: e.target.value }));
                                                setNotificationErrors(prev => ({ ...prev, subject: '' }));
                                            }}
                                            placeholder="Tiêu đề thông báo"
                                            className={`w-full px-md py-sm bg-surface-container border rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary ${notificationErrors.subject ? 'border-error' : 'border-outline-variant'}`}
                                        />
                                        {notificationErrors.subject && (
                                            <p className="text-error text-label-sm mt-1">{notificationErrors.subject}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-label-sm text-outline mb-xs">Nội dung</label>
                                        <textarea
                                            value={notificationMsg.content || ''}
                                            onChange={(e) => {
                                                setNotificationMsg(prev => ({ ...prev, content: e.target.value }));
                                                setNotificationErrors(prev => ({ ...prev, content: '' }));
                                            }}
                                            placeholder="Nội dung thông báo gửi tới khách hàng"
                                            rows="6"
                                            className={`w-full px-md py-sm bg-surface-container border rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary ${notificationErrors.content ? 'border-error' : 'border-outline-variant'}`}
                                        />
                                        {notificationErrors.content && (
                                            <p className="text-error text-label-sm mt-1">{notificationErrors.content}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-sm">
                                <button
                                    onClick={() => {
                                        setNotificationErrors({});
                                        setShowNotificationModal(false);
                                    }}
                                    className="flex-1 bg-surface-container-high text-on-surface-variant py-md rounded-xl font-bold hover:bg-surface-variant transition-all"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={async () => {
                                        if (isSending) return;
                                        const notificationType = notificationMsg.type || 'announcement';
                                        if (notificationType === 'confirm_trip' && !String(notificationMsg.zaloGroupLink || '').trim()) {
                                            setNotificationErrors({
                                                zaloGroupLink: 'Vui lòng nhập link Group Zalo để hỗ trợ hành khách'
                                            });
                                            return;
                                        }
                                        if (notificationType === 'announcement') {
                                            const errors = {};
                                            if (!String(notificationMsg.subject || '').trim()) {
                                                errors.subject = 'Vui lòng nhập tiêu đề thông báo';
                                            }
                                            if (!String(notificationMsg.content || '').trim()) {
                                                errors.content = 'Vui lòng nhập nội dung thông báo';
                                            }
                                            if (Object.keys(errors).length > 0) {
                                                setNotificationErrors(errors);
                                                return;
                                            }
                                        }

                                        try {
                                            setIsSending(true);
                                            const payload = {
                                                type: notificationType,
                                                subject: notificationMsg.subject,
                                                content: notificationMsg.content,
                                                notes: notificationMsg.notes,
                                                zaloGroupLink: notificationMsg.zaloGroupLink
                                            };
                                            // Call backend to send group notification
                                            const response = await sendGroupNotification(id, payload);
                                            showModal(`Đã gửi thông báo thành công tới ${response.sentCount || 'các'} email thành viên đoàn.`, 'success');
                                            setNotificationMsg({});
                                            setNotificationErrors({});
                                            setShowNotificationModal(false);
                                        } catch (err) {
                                            console.error('Failed to send group notification:', err);
                                            if (err.response?.data?.errors) {
                                                setNotificationErrors(err.response.data.errors);
                                                return;
                                            }
                                            showModal(err.response?.data?.message || err.response?.data?.error || 'Không thể gửi thông báo. Vui lòng thử lại sau.', 'error');
                                        } finally {
                                            setIsSending(false);
                                        }
                                    }}
                                    disabled={isSending}
                                    className="flex-1 bg-primary text-on-primary py-md rounded-xl font-bold hover:bg-primary-container transition-all disabled:opacity-50"
                                >
                                    {isSending ? 'Đang gửi...' : 'Gửi ngay'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GuideTourDetailPage;

