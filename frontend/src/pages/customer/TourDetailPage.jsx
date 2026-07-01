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
    const [reviews, setReviews] = useState([]);
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

    // Sandbox payment flow states
    const [sandboxStep, setSandboxStep] = useState("card_info"); // 'card_info', 'otp', 'momo_qr', 'momo_login'
    const [cardNumber, setCardNumber] = useState("9704198526191432119");
    const [cardHolder, setCardHolder] = useState("NGUYEN VAN A");
    const [cardDate, setCardDate] = useState("07/15");
    const [otpCode, setOtpCode] = useState("123456");
    const [momoPhone, setMomoPhone] = useState("0901234567");
    const [momoOtp, setMomoOtp] = useState("123456");

    // New states for Vouchers and Multiple Participants
    const [vouchers, setVouchers] = useState([]);
    const [selectedVoucherId, setSelectedVoucherId] = useState("");
    const [discountAmount, setDiscountAmount] = useState(0);
    const [participantsList, setParticipantsList] = useState([
        { fullName: "", participantType: "adult", dateOfBirth: "1995-01-01", address: "", phone: "", cccdFrontUrl: "", cccdBackUrl: "", isLead: true }
    ]);
    const [currentBooking, setCurrentBooking] = useState(null);
    const [serverIp, setServerIp] = useState("localhost");

    // Chat Bubble States
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { id: 1, sender: "bot", text: "Xin chào! Cảm ơn bạn đã ghé thăm Chip3Chip. Mình có thể giúp gì cho bạn hôm nay?", time: "Vừa xong" }
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
                setReviews(response.data.reviews || []);
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

    // Tự động kiểm tra trạng thái đơn hàng MoMo từ điện thoại
    useEffect(() => {
        let intervalId;
        if (showPaymentSimulator === 'momo' && currentBooking) {
            intervalId = setInterval(async () => {
                try {
                    const response = await axiosInstance.get("/api/customer/bookings");
                    if (response.data.success) {
                        const booking = response.data.bookings.find(b => b.id === currentBooking.id);
                        if (booking && booking.status === "paid") {
                            clearInterval(intervalId);
                            setShowPaymentSimulator(null);
                            setBookingSuccessModal({
                                tourTitle: booking.schedule?.tour?.title || tour.title,
                                bookingCode: booking.bookingCode
                            });
                        }
                    }
                } catch (err) {
                    console.error("Lỗi polling trạng thái đơn hàng:", err);
                }
            }, 1500);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [showPaymentSimulator, currentBooking]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/");
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
    };

    const getBaseTotalPrice = () => {
        if (!tour) return 0;
        const base = parseFloat(tour.basePrice);
        return participantsList.reduce((sum, p) => {
            const type = tour.difficulty === "hard" ? "adult" : p.participantType;
            if (type === "adult") return sum + base;
            if (type === "child") return sum + base * 0.7;
            if (type === "infant") return sum + 0;
            return sum + base;
        }, 0);
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
            showToast("Vui lòng đăng nhập để lưu tour vào Kho hàng của bạn.", "info");
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
                    showToast("Đã lưu tour vào yêu thích thành công!", "success");
                }
            } catch (err) {
                console.error("Lỗi khi thêm wishlist:", err);
                showToast("Không thể lưu tour. Vui lòng thử lại.", "error");
            }
        }, 3000);
    };

    const fetchAvailableVouchers = async (scheduleId) => {
        try {
            const response = await axiosInstance.get(`/api/customer/vouchers/available?scheduleId=${scheduleId}`);
            if (response.data.success) {
                setVouchers(response.data.vouchers);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách Voucher:", err);
        }
    };

    const handleAddParticipant = () => {
        setParticipantsList([
            ...participantsList,
            { fullName: "", participantType: "adult", dateOfBirth: "1995-01-01", address: "", phone: "", cccdFrontUrl: "", cccdBackUrl: "", isLead: false }
        ]);
    };

    const handleRemoveParticipant = (index) => {
        const list = [...participantsList];
        list.splice(index, 1);
        setParticipantsList(list);
    };

    const handleParticipantChange = (index, field, value) => {
        const list = [...participantsList];
        list[index] = { ...list[index], [field]: value };
        setParticipantsList(list);
    };

    const handleCccdUpload = async (index, side, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        try {
            const response = await axiosInstance.post("/api/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            if (response.data.success) {
                const list = [...participantsList];
                const baseUrl = axiosInstance.defaults.baseURL || "http://localhost:8080";
                list[index][side === 'front' ? 'cccdFrontUrl' : 'cccdBackUrl'] = `${baseUrl}${response.data.url}`;
                setParticipantsList(list);
            } else {
                showToast("Không thể tải lên file: " + (response.data.error || "Lỗi không xác định", "error"));
            }
        } catch (err) {
            console.error("Lỗi upload file:", err);
            showToast("Lỗi kết nối khi tải lên file.", "error");
        }
    };

    const handleBookTour = () => {
        if (!selectedScheduleId) {
            showToast("Hiện tại chưa có lịch khởi hành mở đăng ký cho tour này.", "error");
            return;
        }

        const selectedSchedule = tour?.schedules?.find(sch => String(sch.id) === String(selectedScheduleId));
        const isSoldOut = selectedSchedule ? (selectedSchedule.maxCapacity - selectedSchedule.registered <= 0) : false;
        if (isSoldOut) {
            showToast("Lịch khởi hành này đã hết chỗ.", "info");
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
                showToast("Đã xảy ra lỗi. Vui lòng thử lại.", "error");
            });
        } else {
            if (user.role !== "customer") {
                showToast("Vui lòng đăng nhập tài khoản Khách hàng để đặt tour.", "info");
                return;
            }

            setBookingConfigTour(tour);
            setParticipantsList([
                {
                    fullName: user.fullName || "",
                    participantType: "adult",
                    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "1995-01-01",
                    address: user.address || "",
                    phone: user.phone || "",
                    cccdFrontUrl: "",
                    cccdBackUrl: "",
                    isLead: true
                }
            ]);
            setTravelerInfo({
                fullName: user.fullName || "",
                phone: user.phone || "",
                idNumber: ""
            });
            setSelectedVoucherId("");
            setDiscountAmount(0);
            setPaymentMethod("vnpay");
            fetchAvailableVouchers(selectedScheduleId);
        }
    };

    const handleConfirmBooking = (event) => {
        event.preventDefault();

        // Kiểm tra tính hợp lệ của tất cả hành khách
        for (let i = 0; i < participantsList.length; i++) {
            const p = participantsList[i];
            if (!p.fullName || !p.fullName.trim()) {
                showToast(`Vui lòng nhập họ tên cho hành khách thứ ${i + 1}.`, "info");
                return;
            }
            if (!p.dateOfBirth) {
                showToast(`Vui lòng nhập ngày sinh cho hành khách thứ ${i + 1}.`, "info");
                return;
            }
            if (!p.address || !p.address.trim()) {
                showToast(`Vui lòng nhập địa chỉ cho hành khách thứ ${i + 1}.`, "info");
                return;
            }

            // Tính tuổi hành khách
            const birthDate = new Date(p.dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            // Xác định loại hành khách thực tế (ép về adult nếu là tour hard)
            const type = tour.difficulty === "hard" ? "adult" : p.participantType;

            if (tour.difficulty === "hard") {
                if (type !== "adult") {
                    showToast(`Tour thám hiểm (Hard, "info") chỉ dành cho người lớn. Vui lòng kiểm tra lại loại hành khách của hành khách thứ ${i + 1}.`);
                    return;
                }
                if (age < 18) {
                    showToast(`Hành khách ${p.fullName} tham gia tour thám hiểm (Hard, "info") phải từ 18 tuổi trở lên (Tính đến nay là ${age} tuổi).`);
                    return;
                }
                if (!p.phone || !p.phone.trim()) {
                    showToast(`Vui lòng nhập số điện thoại cho hành khách ${p.fullName} (bắt buộc đối với Tour Hard, "info").`);
                    return;
                }
                if (!p.cccdFrontUrl || !p.cccdBackUrl) {
                    showToast(`Hành khách ${p.fullName} chưa tải lên đầy đủ ảnh mặt trước và mặt sau CCCD (bắt buộc đối với Tour Hard, "error").`);
                    return;
                }
            } else {
                // Tour Normal
                if (type === "adult") {
                    if (age < 18) {
                        showToast(`Hành khách ${p.fullName} được chọn là Người lớn nhưng chưa đủ 18 tuổi (Tính đến nay là ${age} tuổi, "error"). Vui lòng kiểm tra lại ngày sinh.`);
                        return;
                    }
                } else if (type === "child") {
                    if (age >= 18 || age < 2) {
                        showToast(`Hành khách ${p.fullName} được chọn là Trẻ em nhưng độ tuổi hiện tại (${age} tuổi, "info") không phù hợp (phải từ 2 đến dưới 18 tuổi).`);
                        return;
                    }
                } else if (type === "infant") {
                    if (age >= 2) {
                        showToast(`Hành khách ${p.fullName} được chọn là Em bé nhưng độ tuổi hiện tại (${age} tuổi, "info") không phù hợp (phải dưới 2 tuổi).`);
                        return;
                    }
                }
            }
        }

        // Tính toán lại tiền giảm giá phía Client để hiển thị simulator chính xác
        const totalPrice = getBaseTotalPrice();
        let discount = 0;

        if (selectedVoucherId) {
            const v = vouchers.find(x => x.id === selectedVoucherId);
            if (v) {
                if (v.discountType === "percent") {
                    discount = totalPrice * (parseFloat(v.discountValue) / 100);
                    if (v.maxDiscountAmount && discount > parseFloat(v.maxDiscountAmount)) {
                        discount = parseFloat(v.maxDiscountAmount);
                    }
                } else if (v.discountType === "fixed") {
                    discount = parseFloat(v.discountValue);
                }
                if (discount > totalPrice) discount = totalPrice;
            }
        }
        setDiscountAmount(discount);

        // Pre-create the booking with status pending_payment (backend overrides to pending_approval for Hard tour)
        axiosInstance.post("/api/customer/bookings", {
            scheduleId: selectedScheduleId,
            status: "pending_payment",
            voucherId: selectedVoucherId || undefined,
            participants: participantsList.map(p => ({
                ...p,
                participantType: tour.difficulty === "hard" ? "adult" : p.participantType
            }))
        }).then(async (response) => {
            if (response.data.success) {
                const createdBooking = response.data.booking;
                setCurrentBooking(createdBooking);

                // Fetch server local IP
                try {
                    const ipRes = await axiosInstance.get("/api/server-ip");
                    if (ipRes.data.ip) {
                        setServerIp(ipRes.data.ip);
                    }
                } catch (ipErr) {
                    console.error("Lỗi lấy IP máy chủ:", ipErr);
                }

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

                if (tour.difficulty === "hard") {
                    setTimeout(() => {
                        setMascotAnimation(null);
                        setBookingConfigTour(null);
                        setBookingSuccessModal({
                            tourTitle: createdBooking.schedule?.tour?.title || tour.title,
                            bookingCode: createdBooking.bookingCode,
                            isPendingApproval: true
                        });
                    }, 3000);
                } else {
                    setTimeout(() => {
                        setMascotAnimation(null);
                        setBookingConfigTour(null);
                        setSandboxStep(paymentMethod === "vnpay" ? "card_info" : "momo_qr");
                        setShowPaymentSimulator(paymentMethod);
                    }, 3000);
                }
            }
        }).catch((err) => {
            console.error("Lỗi tạo đơn đặt tour:", err);
            showToast(err.response?.data?.error || "Không thể thực hiện đặt tour.", "error");
        });
    };

    const handleSimulatorPaymentSuccess = async () => {
        if (!currentBooking) return;
        try {
            const response = await axiosInstance.put(`/api/customer/bookings/${currentBooking.id}/pay`);
            if (response.data.success) {
                setShowPaymentSimulator(null);
                setBookingSuccessModal({
                    tourTitle: response.data.booking.schedule?.tour?.title || tour.title,
                    bookingCode: response.data.booking.bookingCode
                });
            }
        } catch (err) {
            console.error("Lỗi thanh toán:", err);
            showToast(err.response?.data?.error || "Không thể hoàn tất giao dịch.", "error");
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
            let replyText = "Cảm ơn thông tin của bạn. Hỗ trợ viên Chip3Chip sẽ phản hồi ngay lập tức hoặc bạn có thể liên hệ hotline 1900.6789 nhé!";
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

    const selectedSchedule = tour?.schedules?.find(sch => String(sch.id) === String(selectedScheduleId));
    const isSoldOut = selectedSchedule ? (selectedSchedule.maxCapacity - selectedSchedule.registered <= 0) : false;

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

                        {/* Reviews/Testimonials Section */}
                        <section className="space-y-6 pt-6 border-t border-neutral-200">
                            <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-rose-500">rate_review</span>
                                Đánh giá từ khách hàng ({reviews.length})
                            </h2>

                            {reviews && reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviews.map((rev) => (
                                        <div key={rev.id} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={rev.booking?.customer?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAyYDTaLlcjUSexakPA_46fM-8-WdqU_dtNwTlsfsT1iO7aFkPUpj_wsFjnQgBJPN8P74-7Ut_swk6zZ73sWAb-kToL8HPg3XRLzfbr5X-jd78naVcp8O6-fq5doWfJ854C-s4vlxxEfZY2IfH4pmVbdsyPtxjrv35xaA2CN9Yhjl6d_U-jNDPR3VyOeGEQ0ksQjr5OjYGcQlyw-ggX0QFoUwqKCfYGlje8fyylJoMH8zreDud10K5znyU_ZTF17UqQnwF0iPrQCnpK"}
                                                        alt={rev.booking?.customer?.fullName || "Khách hàng"}
                                                        className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                                                    />
                                                    <div>
                                                        <h4 className="text-xs font-black text-neutral-800">
                                                            {rev.booking?.customer?.fullName || "Ẩn danh"}
                                                        </h4>
                                                        <p className="text-[9px] text-neutral-400 font-bold">
                                                            Đã đi: {rev.booking?.schedule?.departureDate ? formatDate(rev.booking.schedule.departureDate) : "Gần đây"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex text-amber-500">
                                                    {Array.from({ length: rev.overallRating || 5 }).map((_, idx) => (
                                                        <span key={idx} className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                                                    ))}
                                                    {Array.from({ length: 5 - (rev.overallRating || 5) }).map((_, idx) => (
                                                        <span key={idx} className="material-symbols-outlined text-[15px]">star_border</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs font-semibold text-neutral-600 leading-relaxed pl-13">
                                                "{rev.generalComment || "Chuyến đi tuyệt vời!"}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white p-8 rounded-2xl border border-neutral-200 text-center shadow-sm">
                                    <span className="material-symbols-outlined text-4xl text-neutral-300 mb-2">sentiment_satisfied</span>
                                    <p className="text-neutral-500 text-sm font-bold">Chưa có đánh giá nào cho tour này.</p>
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
                                disabled={!tour.schedules || tour.schedules.length === 0 || isSoldOut}
                                className={`w-full py-4 text-sm font-black text-white rounded-2xl shadow-md transform active:scale-95 flex items-center justify-center gap-2 ${
                                    (!tour.schedules || tour.schedules.length === 0 || isSoldOut)
                                        ? "bg-neutral-300 text-neutral-400 cursor-not-allowed"
                                        : "fiery-button cursor-pointer"
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    {isSoldOut ? "block" : "shopping_cart"}
                                </span>
                                {isSoldOut ? "Đã hết chỗ" : "Đặt Tour Ngay"}
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
                                    <span className="font-bold">Email: support@chip3chip.vn</span>
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
                            <span className="text-xl font-black text-white tracking-tight">Chip3Chip</span>
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
                    © 2026 Chip3Chip Travel Ecosystem. All rights reserved.
                </div>
            </footer>

            {/* Interactive Booking Config Modal */}
            {bookingConfigTour && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-[32px] max-w-2xl w-full p-8 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200 my-8 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h3 className="text-2xl font-black text-neutral-900">Thông Tin Đặt Tour</h3>
                            <button
                                onClick={() => setBookingConfigTour(null)}
                                className="text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="bg-orange-50/60 border border-orange-100 p-4 rounded-2xl mb-4 flex items-start gap-4 text-neutral-800 shrink-0">
                            <img
                                src={bookingConfigTour.thumbnailUrl || "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=120&h=80&fit=crop"}
                                alt=""
                                className="w-20 h-16 object-cover rounded-xl border border-orange-200/50"
                            />
                            <div>
                                <h4 className="font-black text-neutral-900 text-sm leading-snug">{bookingConfigTour.title}</h4>
                                <p className="text-rose-600 text-xs font-bold mt-1">Đơn giá: {formatPrice(bookingConfigTour.basePrice)} / khách</p>
                                <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">Độ khó: <strong className="capitalize text-rose-500">{bookingConfigTour.difficulty || "normal"}</strong></span>
                            </div>
                        </div>

                        <form onSubmit={handleConfirmBooking} className="space-y-5 text-neutral-800 overflow-y-auto flex-grow pr-2">
                            {/* Danh sách hành khách */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                                    <h4 className="text-sm font-black text-neutral-900 uppercase tracking-wide flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-rose-500">groups</span>
                                        Danh sách hành khách tham gia
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={handleAddParticipant}
                                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                                    >
                                        <span className="material-symbols-outlined text-xs">add</span>Thêm hành khách
                                    </button>
                                </div>

                                {participantsList.map((p, idx) => (
                                    <div key={idx} className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/60 relative space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-rose-500 uppercase tracking-wider">Hành khách #{idx + 1} {p.isLead && "(Trưởng đoàn)"}</span>
                                            {participantsList.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveParticipant(idx)}
                                                    className="text-neutral-400 hover:text-red-500 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">Họ và tên *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 outline-none focus:border-rose-500 transition-all"
                                                    value={p.fullName}
                                                    onChange={(e) => handleParticipantChange(idx, "fullName", e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">Loại hành khách *</label>
                                                <select
                                                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-700 outline-none focus:border-rose-500 transition-all disabled:bg-neutral-100 disabled:text-neutral-900 disabled:font-black disabled:opacity-100"
                                                    value={bookingConfigTour.difficulty === 'hard' ? 'adult' : p.participantType}
                                                    onChange={(e) => handleParticipantChange(idx, "participantType", e.target.value)}
                                                    disabled={bookingConfigTour.difficulty === 'hard'}
                                                >
                                                    <option value="adult">Người lớn</option>
                                                    {bookingConfigTour.difficulty !== 'hard' && (
                                                        <>
                                                            <option value="child">Trẻ em</option>
                                                            <option value="infant">Em bé</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">Ngày sinh *</label>
                                                <input
                                                    type="date"
                                                    required
                                                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 outline-none focus:border-rose-500 transition-all"
                                                    value={p.dateOfBirth}
                                                    onChange={(e) => handleParticipantChange(idx, "dateOfBirth", e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">Địa chỉ *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 outline-none focus:border-rose-500 transition-all"
                                                    value={p.address}
                                                    onChange={(e) => handleParticipantChange(idx, "address", e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">
                                                    Số điện thoại {bookingConfigTour.difficulty === 'hard' ? '*' : ''}
                                                </label>
                                                <input
                                                    type="tel"
                                                    required={bookingConfigTour.difficulty === 'hard'}
                                                    placeholder="Ví dụ: 0912345678"
                                                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 outline-none focus:border-rose-500 transition-all"
                                                    value={p.phone || ""}
                                                    onChange={(e) => handleParticipantChange(idx, "phone", e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Phần chụp ảnh CCCD */}
                                        {(p.participantType === 'adult' || bookingConfigTour.difficulty === 'hard') && (
                                            <div className="border-t border-dashed border-neutral-200 pt-3">
                                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-2">
                                                    Ảnh CCCD xác minh {bookingConfigTour.difficulty === 'hard' ? '(Yêu cầu bắt buộc cho Tour Hard)' : '(Tùy chọn cho Tour Normal - có thể bổ sung sau)'}
                                                </span>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <label
                                                            className={`w-full py-2 px-3 border rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${p.cccdFrontUrl ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'}`}
                                                        >
                                                            <span className="material-symbols-outlined text-xs">add_a_photo</span>
                                                            {p.cccdFrontUrl ? "Đã chọn mặt trước" : "Chọn CCCD mặt trước"}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleCccdUpload(idx, "front", e.target.files[0])}
                                                            />
                                                        </label>
                                                        {p.cccdFrontUrl && (
                                                            <img src={p.cccdFrontUrl} alt="Front CCCD" className="w-20 h-12 object-cover rounded-md border" />
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <label
                                                            className={`w-full py-2 px-3 border rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${p.cccdBackUrl ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'}`}
                                                        >
                                                            <span className="material-symbols-outlined text-xs">add_a_photo</span>
                                                            {p.cccdBackUrl ? "Đã chọn mặt sau" : "Chọn CCCD mặt sau"}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleCccdUpload(idx, "back", e.target.files[0])}
                                                            />
                                                        </label>
                                                        {p.cccdBackUrl && (
                                                            <img src={p.cccdBackUrl} alt="Back CCCD" className="w-20 h-12 object-cover rounded-md border" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Chọn Voucher khả dụng */}
                            <div className="space-y-2 border-t border-neutral-100 pt-4">
                                <label className="text-xs font-black text-neutral-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-rose-500 text-sm">confirmation_number</span>
                                    Mã giảm giá khả dụng của tour:
                                </label>
                                {vouchers.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {vouchers.map((v) => (
                                            <label
                                                key={v.id}
                                                className={`border rounded-xl p-3 flex justify-between items-center cursor-pointer transition ${selectedVoucherId === v.id ? 'border-rose-500 bg-rose-50/20 text-rose-900 font-bold' : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'}`}
                                            >
                                                <div className="flex items-start gap-2.5">
                                                    <input
                                                        type="radio"
                                                        name="voucherSelection"
                                                        className="mt-1"
                                                        checked={selectedVoucherId === v.id}
                                                        onChange={() => setSelectedVoucherId(v.id)}
                                                    />
                                                    <div>
                                                        <span className="text-xs font-black uppercase text-rose-600">{v.code}</span>
                                                        <p className="text-[10px] text-neutral-400 leading-normal">{v.description}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-xs font-black text-rose-500">
                                                        {v.discountType === 'percent' ? `-${v.discountValue}%` : `-${formatPrice(v.discountValue)}`}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-neutral-400 italic">Không tìm thấy mã giảm giá khả dụng cho bạn tại chuyến đi này.</p>
                                )}
                                {selectedVoucherId && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedVoucherId("")}
                                        className="text-[10px] font-bold text-neutral-500 hover:text-rose-500 flex items-center gap-0.5 mt-1"
                                    >
                                        <span className="material-symbols-outlined text-xs">close</span> Hủy áp dụng Voucher
                                    </button>
                                )}
                            </div>

                            {/* Bảng giá phân rã */}
                            <div className="border-t border-neutral-100 pt-4 space-y-2">
                                <label className="text-xs font-black text-neutral-700 uppercase tracking-wider block">Chi tiết thanh toán:</label>
                                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/60 text-xs font-semibold text-neutral-600 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Tổng giá vé gốc ({participantsList.length} khách):</span>
                                        <span>{formatPrice(getBaseTotalPrice())}</span>
                                    </div>
                                    {selectedVoucherId && (
                                        <div className="flex justify-between text-rose-600 font-bold">
                                            <span>Mã giảm giá đã áp dụng:</span>
                                            <span>-{formatPrice(
                                                (() => {
                                                    const total = getBaseTotalPrice();
                                                    const v = vouchers.find(x => x.id === selectedVoucherId);
                                                    if (!v) return 0;
                                                    let discount = 0;
                                                    if (v.discountType === "percent") {
                                                        discount = total * (parseFloat(v.discountValue) / 100);
                                                        if (v.maxDiscountAmount && discount > parseFloat(v.maxDiscountAmount)) {
                                                            discount = parseFloat(v.maxDiscountAmount);
                                                        }
                                                    } else if (v.discountType === "fixed") {
                                                        discount = parseFloat(v.discountValue);
                                                    }
                                                    return discount > total ? total : discount;
                                                })()
                                            )}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm font-black text-neutral-900 border-t border-dashed border-neutral-200 pt-2">
                                        <span>Tổng tiền cần thanh toán:</span>
                                        <span className="text-rose-600">
                                            {formatPrice(
                                                (() => {
                                                    const total = getBaseTotalPrice();
                                                    const v = vouchers.find(x => x.id === selectedVoucherId);
                                                    if (!v) return total;
                                                    let discount = 0;
                                                    if (v.discountType === "percent") {
                                                        discount = total * (parseFloat(v.discountValue) / 100);
                                                        if (v.maxDiscountAmount && discount > parseFloat(v.maxDiscountAmount)) {
                                                            discount = parseFloat(v.maxDiscountAmount);
                                                        }
                                                    } else if (v.discountType === "fixed") {
                                                        discount = parseFloat(v.discountValue);
                                                    }
                                                    return total - (discount > total ? total : discount);
                                                })()
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Phương thức thanh toán */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-neutral-700 uppercase tracking-wider block mb-2">Phương thức thanh toán mô phỏng</label>
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
                                className="w-full fiery-button text-white font-black py-4 rounded-2xl shadow-lg mt-4 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                            >
                                <span className="material-symbols-outlined">shopping_cart_checkout</span>
                                Đi tới thanh toán
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
                        <div className="bg-[#005ba1] text-white p-6 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-3xl">account_balance</span>
                                <div>
                                    <h3 className="font-extrabold text-md tracking-tight uppercase">CỔNG THANH TOÁN VNPAY SANDBOX</h3>
                                    <p className="text-[10px] text-blue-200 font-medium uppercase tracking-wider">Đơn hàng: {tour.title.substring(0, 30)}...</p>
                                </div>
                            </div>
                            <span className="bg-[#e06f14] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">SANDBOX</span>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Merchant/Amount Summary */}
                            <div className="bg-neutral-50 p-4.5 rounded-xl border border-neutral-200/60 space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-500 font-semibold">Đơn vị thụ hưởng:</span>
                                    <span className="font-black text-neutral-850">CHIP3CHIP CO.</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-500 font-bold">Số tiền thanh toán:</span>
                                    <span className="text-sm font-black text-blue-600">{formatPrice(getBaseTotalPrice() - discountAmount)}</span>
                                </div>
                            </div>

                            {sandboxStep === "card_info" ? (
                                <div className="space-y-4">
                                    <div className="border border-blue-100 bg-blue-50/55 p-4 rounded-xl text-xs space-y-1">
                                        <p className="font-bold text-blue-800">Thông tin thẻ test ngân hàng NCB Sandbox:</p>
                                        <p className="text-blue-700 font-semibold">• Số thẻ: <strong className="font-bold text-neutral-900 select-all">9704198526191432119</strong></p>
                                        <p className="text-blue-700 font-semibold">• Tên chủ thẻ: <strong className="font-bold text-neutral-900">NGUYEN VAN A</strong></p>
                                        <p className="text-blue-700 font-semibold">• Ngày phát hành: <strong className="font-bold text-neutral-900">07/15</strong></p>
                                        <p className="text-blue-700 font-semibold">• Mã OTP mặc định: <strong className="font-bold text-neutral-900">123456</strong></p>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">Số thẻ ATM *</label>
                                            <input
                                                type="text"
                                                className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 transition-all"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">Tên chủ thẻ *</label>
                                            <input
                                                type="text"
                                                className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 transition-all uppercase"
                                                value={cardHolder}
                                                onChange={(e) => setCardHolder(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">Ngày phát hành (MM/YY) *</label>
                                            <input
                                                type="text"
                                                className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 transition-all"
                                                value={cardDate}
                                                onChange={(e) => setCardDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
                                        <button
                                            onClick={() => {
                                                if (cardNumber !== "9704198526191432119") {
                                                    showToast("Vui lòng nhập đúng số thẻ ATM test NCB (9704198526191432119)", "info");
                                                    return;
                                                }
                                                setSandboxStep("otp");
                                            }}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer text-xs uppercase"
                                        >
                                            Tiếp tục thanh toán
                                        </button>
                                        <button
                                            onClick={() => setShowPaymentSimulator(null)}
                                            className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3.5 rounded-xl transition-all text-xs"
                                        >
                                            Hủy giao dịch
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-center py-2">
                                        <p className="text-sm font-black text-neutral-850">XÁC THỰC MÃ OTP</p>
                                        <p className="text-[11px] text-neutral-500 mt-1">Một mã OTP đã được gửi về số điện thoại đăng ký tài khoản ngân hàng của bạn.</p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1 text-center">Nhập mã OTP (Test: 123456)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-3 text-center text-sm font-black tracking-widest outline-none focus:border-blue-500 transition-all max-w-[180px] mx-auto block"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
                                        <button
                                            onClick={() => {
                                                if (otpCode !== "123456") {
                                                    showToast("Mã OTP không chính xác. Vui lòng nhập mã OTP test 123456.", "info");
                                                    return;
                                                }
                                                handleSimulatorPaymentSuccess();
                                            }}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer text-xs uppercase"
                                        >
                                            Xác nhận thanh toán
                                        </button>
                                        <button
                                            onClick={() => setSandboxStep("card_info")}
                                            className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3.5 rounded-xl transition-all text-xs"
                                        >
                                            Quay lại
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showPaymentSimulator === 'momo' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-pink-200 animate-in fade-in zoom-in-95 duration-200 text-neutral-800">
                        <div className="bg-[#a50064] text-white p-6 text-center relative flex flex-col items-center">
                            <span className="material-symbols-outlined text-4xl animate-pulse">qr_code_2</span>
                            <h3 className="font-extrabold text-lg tracking-tight mt-1">MOMO SANDBOX</h3>
                            <p className="text-pink-200 text-[10px] uppercase font-bold tracking-wider">Mã đặt tour: {tour.tourCode}</p>
                        </div>

                        <div className="p-6 flex flex-col items-center space-y-4">
                            {sandboxStep === "momo_qr" ? (
                                <>
                                    <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center cursor-pointer hover:border-pink-300 transition-all"
                                        onClick={() => handleSimulatorPaymentSuccess()}
                                        title="Click vào QR Code để thanh toán nhanh"
                                    >
                                        <div className="w-36 h-36 border-4 border-[#a50064] flex items-center justify-center relative p-1">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                                    serverIp.startsWith("http")
                                                        ? `${serverIp}/mock-momo-pay/${currentBooking?.id}`
                                                        : `http://${serverIp}:8080/mock-momo-pay/${currentBooking?.id}`
                                                )}`}
                                                alt="Momo QR Code"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <span className="text-[10px] text-pink-600 font-bold mt-2 uppercase tracking-wide">Ấn vào QR để giả lập quét app</span>
                                    </div>

                                    <div className="text-center w-full bg-neutral-50 py-3 px-4 rounded-xl border border-neutral-200/50">
                                        <span className="text-xs text-neutral-400 font-bold block uppercase tracking-wider">Số tiền cần thanh toán</span>
                                        <span className="text-xl font-black text-pink-650">{formatPrice(getBaseTotalPrice() - discountAmount)}</span>
                                    </div>

                                    <div className="w-full grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setSandboxStep("momo_login")}
                                            className="w-full bg-[#a50064] hover:bg-[#850050] text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md text-xs uppercase cursor-pointer"
                                        >
                                            Đăng nhập MoMo
                                        </button>
                                        <button
                                            onClick={() => setShowPaymentSimulator(null)}
                                            className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3.5 rounded-xl transition-all text-xs"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </>
                            ) : sandboxStep === "momo_login" ? (
                                <div className="w-full space-y-4">
                                    <div className="text-center">
                                        <p className="text-sm font-black text-neutral-850">ĐĂNG NHẬP VÍ MOMO TEST</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">Số điện thoại test *</label>
                                            <input
                                                type="text"
                                                className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-pink-500 transition-all"
                                                value={momoPhone}
                                                onChange={(e) => setMomoPhone(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block mb-1">Mật khẩu MoMo (6 chữ số) *</label>
                                            <input
                                                type="password"
                                                className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-pink-500 transition-all"
                                                defaultValue="123456"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-3">
                                        <button
                                            onClick={() => setSandboxStep("otp")}
                                            className="w-full bg-[#a50064] hover:bg-[#850050] text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md text-xs uppercase cursor-pointer"
                                        >
                                            Tiếp tục
                                        </button>
                                        <button
                                            onClick={() => setSandboxStep("momo_qr")}
                                            className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3.5 rounded-xl transition-all text-xs"
                                        >
                                            Quay lại
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full space-y-4">
                                    <div className="text-center">
                                        <p className="text-sm font-black text-neutral-850">NHẬP MÃ XÁC THỰC OTP</p>
                                        <p className="text-[10px] text-neutral-500 mt-1">Sử dụng mã OTP mặc định: 123456</p>
                                    </div>

                                    <div>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-3 text-center text-sm font-black tracking-widest outline-none focus:border-pink-500 transition-all max-w-[150px] mx-auto block"
                                            value={momoOtp}
                                            onChange={(e) => setMomoOtp(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-3">
                                        <button
                                            onClick={() => {
                                                if (momoOtp !== "123456") {
                                                    showToast("Mã OTP không chính xác. Vui lòng nhập OTP test 123456.", "info");
                                                    return;
                                                }
                                                handleSimulatorPaymentSuccess();
                                            }}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md text-xs uppercase cursor-pointer"
                                        >
                                            Xác nhận OTP
                                        </button>
                                        <button
                                            onClick={() => setSandboxStep(momoPhone ? "momo_login" : "momo_qr")}
                                            className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3.5 rounded-xl transition-all text-xs"
                                        >
                                            Quay lại
                                        </button>
                                    </div>
                                </div>
                            )}
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
                        <h3 className="text-2xl font-black text-neutral-900 tracking-tight">
                            {bookingSuccessModal.isPendingApproval ? "Đã Gửi Yêu Cầu Đặt Tour!" : "Đặt Tour Thành Công!"}
                        </h3>
                        <p className="text-neutral-500 text-xs mt-2 px-4 leading-relaxed">
                            Mã đặt chỗ: <strong className="text-teal-600 font-black">{bookingSuccessModal.bookingCode}</strong>.<br />
                            {bookingSuccessModal.isPendingApproval 
                                ? "Yêu cầu đã được gửi đến Operator để duyệt hồ sơ du khách. Vui lòng thanh toán sau khi duyệt thành công." 
                                : "Thanh toán giả lập thành công! Hồ sơ đã được lưu trữ trong danh sách chuyến đi của bạn."}
                        </p>

                        <div className="bg-neutral-50 rounded-2xl p-4.5 border border-neutral-200/60 text-left space-y-2 mt-6 mb-8 text-xs font-semibold text-neutral-700">
                            <p>🗺️ <strong>Tour:</strong> {bookingSuccessModal.tourTitle}</p>
                            <p>👤 <strong>Trưởng đoàn:</strong> {participantsList[0]?.fullName || travelerInfo.fullName}</p>
                            <p>📞 <strong>SĐT:</strong> {participantsList[0]?.phone || travelerInfo.phone}</p>
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
                                    <div className={`px-4 py-2.5 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${msg.sender === 'user'
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
            {toast && (
                <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3.5 px-4.5 py-4 rounded-[20px] bg-white border border-neutral-100 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 min-w-[320px] max-w-[420px]">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                        toast.type === 'success' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : toast.type === 'error' 
                                ? 'bg-rose-50 text-rose-600' 
                                : 'bg-blue-50 text-blue-600'
                    }`}>
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
                        </span>
                    </div>
                    <div className="flex-grow flex flex-col text-left">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider leading-none">
                            {toast.type === 'success' ? 'Thành công' : toast.type === 'error' ? 'Thất bại' : 'Thông báo'}
                        </span>
                        <span className="text-[13px] font-semibold mt-1 text-neutral-750 leading-snug">{toast.message}</span>
                    </div>
                    <button 
                        onClick={() => setToast(null)} 
                        className="text-neutral-400 hover:text-neutral-600 shrink-0 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default TourDetailPage;