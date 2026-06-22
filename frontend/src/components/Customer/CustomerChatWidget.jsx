import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { initGuestChat, resolveChatSession, uploadChatMedia } from '../../api/chatApi';
import axiosInstance from '../../api/axiosInstance';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const QUICK_EMOJIS = ['👍', '😊', '🙏', '❤️', '🎉', '✅'];
const QUICK_REPLIES_CUSTOMER = [
  'Cảm ơn bạn 🙏',
  'Tôi vẫn chưa rõ 🤔',
  'Có thể liên hệ được không? 📞',
  'Cần hỗ trợ thêm 😊',
  'OK, hiểu rồi ✅',
  'Tối nay gọi lại được không? ⏰'
];

const parseChatContent = (content) => {
  if (typeof content !== 'string') return { type: 'text', text: '' };
  try {
    const parsed = JSON.parse(content);
    if (parsed?.type === 'image' || parsed?.type === 'video' || parsed?.type === 'cccd_review') return parsed;
  } catch {
    // Plain text message.
  }
  return { type: 'text', text: content };
};

const ChatMessageContent = ({ content, onPreviewImage }) => {
  const parsed = parseChatContent(content);
  if (parsed.type === 'image') {
    return (
      <button type="button" onClick={() => onPreviewImage?.(parsed)} className="block text-left">
        <img src={parsed.url} alt={parsed.name || 'Ảnh đã gửi'} className="max-h-48 rounded-xl object-contain bg-black/5 cursor-zoom-in" />
      </button>
    );
  }
  if (parsed.type === 'video') {
    return <video src={parsed.url} controls className="max-h-48 rounded-xl bg-black" />;
  }
  if (parsed.type === 'cccd_review') {
    const images = [
      { label: 'Mặt trước', url: parsed.frontUrl },
      { label: 'Mặt sau', url: parsed.backUrl },
    ].filter((item) => item.url);

    return (
      <div className="w-64 max-w-full space-y-2">
        <div>
          <p className="font-bold text-sm">Gửi CCCD để HDV kiểm tra</p>
          <p className="text-xs opacity-80 mt-1">{parsed.participantName}</p>
          <p className="text-[11px] opacity-70">{parsed.tourTitle}</p>
          {parsed.departureDate && (
            <p className="text-[11px] opacity-70">
              Khởi hành: {new Date(parsed.departureDate).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {images.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onPreviewImage?.({ url: item.url, name: `CCCD ${item.label} - ${parsed.participantName}` })}
              className="text-left"
            >
              <img src={item.url} alt={`CCCD ${item.label}`} className="w-full h-20 object-cover rounded-lg bg-black/5 cursor-zoom-in" />
              <span className="block mt-1 text-[10px] opacity-75">{item.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] opacity-75">HDV sẽ kiểm tra và cập nhật CCCD trong danh sách hành khách.</p>
      </div>
    );
  }
  return <span>{parsed.text}</span>;
};

const CustomerChatWidget = () => {
  const { user: currentUser, isAuthenticated } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState(null);
  const [pendingClaim, setPendingClaim] = useState(null);
  const [isResolvingChat, setIsResolvingChat] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showCccdModal, setShowCccdModal] = useState(false);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [cccdFrontFile, setCccdFrontFile] = useState(null);
  const [cccdBackFile, setCccdBackFile] = useState(null);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isUploadingCccd, setIsUploadingCccd] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const messagesEndRef = useRef(null);
  const mediaInputRef = useRef(null);

  // Initialize guest session and load chat history
  useEffect(() => {
    let key = localStorage.getItem('chat_session_key');
    if (!key) {
      key = 'session_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('chat_session_key', key);
    }
    setSessionKey(key);
  }, []);

  // Connect to Socket.io when conversation is initialized
  useEffect(() => {
    if (!conversation) return;

    const socketConn = io(BACKEND_URL);
    setSocket(socketConn);

    socketConn.on('connect', () => {
      console.log('[Socket] Connected to backend');
      socketConn.emit('join_room', conversation.id);
    });

    socketConn.on('receive_message', (message) => {
      setMessages((prev) => {
        // Avoid duplicates just in case
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socketConn.on('conversation_updated', (data) => {
      if (data.conversationId === conversation.id) {
        setConversation(data.conversation);
      }
    });

    return () => {
      socketConn.emit('leave_room', conversation.id);
      socketConn.disconnect();
    };
  }, [conversation?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    setConversation(null);
    setMessages([]);
    setPendingClaim(null);
  }, [currentUser?.id, isAuthenticated]);

  const applyResolvedChat = (data) => {
    setPendingClaim(null);
    setConversation(data.conversation);
    setMessages(data.messages || []);
  };

  const selectedBooking = customerBookings.find((booking) => booking.id === selectedBookingId);
  const selectedParticipant = selectedBooking?.participants?.find((participant) => participant.id === selectedParticipantId);

  const loadChatSession = async (options = {}) => {
    if (!sessionKey) return;

    try {
      setIsResolvingChat(true);
      const isCustomer = isAuthenticated && currentUser?.role === 'customer';
      const data = isCustomer
        ? await resolveChatSession({ sessionKey, ...options })
        : await initGuestChat(sessionKey);

      if (data.needsClaimDecision) {
        setPendingClaim(data);
        setConversation(null);
        setMessages(data.messages || []);
        return;
      }

      applyResolvedChat(data);
    } catch (err) {
      console.error('Failed to initialize chat:', err);
    } finally {
      setIsResolvingChat(false);
    }
  };

  const handleOpenChat = async () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen && !conversation && !pendingClaim) {
      await loadChatSession();
    }
  };

  const handleClaimGuestConversation = () => {
    loadChatSession({ claimGuest: true });
  };

  const handleStartNewCustomerConversation = () => {
    loadChatSession({ startNew: true });
  };

  useEffect(() => {
    if (isOpen && sessionKey && !conversation && !pendingClaim) {
      loadChatSession();
    }
  }, [isOpen, sessionKey, currentUser?.id, isAuthenticated]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket || !conversation) return;

    const messageData = {
      conversationId: conversation.id,
      senderType: conversation.customerId ? 'user' : 'guest',
      senderId: conversation.customerId ? currentUser?.id : undefined,
      content: inputValue.trim(),
    };

    socket.emit('send_message', messageData);
    setInputValue('');
  };

  const handleSendMedia = async (file) => {
    if (!file || !socket || !conversation || isUploadingMedia) return;

    try {
      setIsUploadingMedia(true);
      const formData = new FormData();
      formData.append('media', file);
      const result = await uploadChatMedia(formData);

      socket.emit('send_message', {
        conversationId: conversation.id,
        senderType: conversation.customerId ? 'user' : 'guest',
        senderId: conversation.customerId ? currentUser?.id : undefined,
        content: result.content,
      });
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Không thể gửi tệp. Vui lòng thử lại.');
    } finally {
      setIsUploadingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
    }
  };

  const appendEmoji = (emoji) => {
    setInputValue(prev => `${prev}${emoji}`);
  };

  const openCccdUploadModal = async () => {
    if (!isAuthenticated || currentUser?.role !== 'customer') {
      alert('Vui lòng đăng nhập tài khoản khách hàng để tải CCCD.');
      return;
    }

    setShowCccdModal(true);
    setIsLoadingBookings(true);
    setCccdFrontFile(null);
    setCccdBackFile(null);

    try {
      const response = await axiosInstance.get('/api/customer/bookings');
      const bookings = response.data?.bookings || [];
      setCustomerBookings(bookings);

      const firstBooking = bookings[0];
      setSelectedBookingId(firstBooking?.id || '');
      const firstAdult = firstBooking?.participants?.find(p => p.participantType === 'adult');
      setSelectedParticipantId(firstAdult?.id || firstBooking?.participants?.[0]?.id || '');
    } catch (err) {
      alert(err.response?.data?.error || 'Không thể tải danh sách tour đang tham gia.');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleBookingChange = (bookingId) => {
    const booking = customerBookings.find((item) => item.id === bookingId);
    setSelectedBookingId(bookingId);
    const firstAdult = booking?.participants?.find(p => p.participantType === 'adult');
    setSelectedParticipantId(firstAdult?.id || booking?.participants?.[0]?.id || '');
    setCccdFrontFile(null);
    setCccdBackFile(null);
  };

  const uploadCccdImage = async (file) => {
    if (!file) return null;
    if (!file.type.startsWith('image/')) {
      throw new Error('Chỉ được tải lên file ảnh CCCD.');
    }

    const formData = new FormData();
    formData.append('media', file);
    const result = await uploadChatMedia(formData);
    if (result.media?.type !== 'image') {
      throw new Error('Chỉ được tải lên file ảnh CCCD.');
    }
    return result.media.url;
  };

  const handleUploadParticipantCccd = async () => {
    if (!selectedBooking || !selectedParticipant) {
      alert('Vui lòng chọn tour và hành khách cần tải CCCD.');
      return;
    }

    if (!cccdFrontFile && !cccdBackFile) {
      alert('Vui lòng chọn ít nhất một ảnh CCCD mặt trước hoặc mặt sau.');
      return;
    }

    try {
      setIsUploadingCccd(true);
      const [frontUrl, backUrl] = await Promise.all([
        uploadCccdImage(cccdFrontFile),
        uploadCccdImage(cccdBackFile)
      ]);

      if (!socket || !conversation) {
        throw new Error('Cuộc trò chuyện chưa sẵn sàng. Vui lòng thử lại.');
      }

      socket.emit('send_message', {
        conversationId: conversation.id,
        senderType: conversation.customerId ? 'user' : 'guest',
        senderId: conversation.customerId ? currentUser?.id : undefined,
        content: JSON.stringify({
          type: 'cccd_review',
          bookingId: selectedBooking.id,
          participantId: selectedParticipant.id,
          participantName: selectedParticipant.fullName,
          dateOfBirth: selectedParticipant.dateOfBirth || null,
          tourTitle: selectedBooking.schedule?.tour?.title || 'Tour',
          departureDate: selectedBooking.schedule?.departureDate || null,
          frontUrl,
          backUrl,
        }),
      });

      setCccdFrontFile(null);
      setCccdBackFile(null);
      setShowCccdModal(false);
      // No alert - just close modal and message is sent
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Không thể gửi CCCD cho HDV. Vui lòng thử lại.');
    } finally {
      setIsUploadingCccd(false);
    }
  };

  const cccdModal = showCccdModal ? (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-4 py-6 font-sans" onClick={() => setShowCccdModal(false)}>
      <div
        className="relative w-[min(92vw,520px)] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-primary text-white flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h4 className="font-bold text-base leading-6">Gửi CCCD cho HDV kiểm tra</h4>
            <p className="text-xs text-white/80 mt-0.5 leading-5">Chọn tour, chọn hành khách rồi gửi ảnh mặt trước/mặt sau qua tin nhắn.</p>
          </div>
          <button type="button" onClick={() => setShowCccdModal(false)} className="shrink-0 text-white/80 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {isLoadingBookings ? (
            <div className="py-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin block mx-auto mb-2">sync</span>
              Đang tải danh sách tour...
            </div>
          ) : customerBookings.length === 0 ? (
            <div className="py-8 px-4 text-center text-on-surface-variant border border-dashed border-outline-variant rounded-xl">
              Bạn chưa có tour nào đang tham gia.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Tour đang tham gia</label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => handleBookingChange(e.target.value)}
                  className="w-full min-w-0 px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface-container-low text-sm outline-none focus:border-primary"
                >
                  {customerBookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.schedule?.tour?.title || 'Tour'} - {booking.schedule?.departureDate ? new Date(booking.schedule.departureDate).toLocaleDateString('vi-VN') : 'Chưa có ngày'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Hành khách trong nhóm</label>
                <select
                  value={selectedParticipantId}
                  onChange={(e) => setSelectedParticipantId(e.target.value)}
                  className="w-full min-w-0 px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface-container-low text-sm outline-none focus:border-primary"
                >
                  {(selectedBooking?.participants || []).filter(p => p.participantType === 'adult').map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.fullName} {participant.isLead ? '(Trưởng nhóm)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedParticipant && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-outline-variant/40 p-3 min-w-0">
                    <p className="font-bold text-on-surface mb-2">Mặt trước</p>
                    {selectedParticipant.cccdFrontUrl && !cccdFrontFile && (
                      <img src={selectedParticipant.cccdFrontUrl} alt="CCCD mặt trước" className="w-full h-24 object-cover rounded-lg mb-2" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCccdFrontFile(e.target.files?.[0] || null)}
                      className="block w-full text-[11px]"
                    />
                    {cccdFrontFile && <p className="mt-1 text-primary truncate">{cccdFrontFile.name}</p>}
                  </div>

                  <div className="rounded-xl border border-outline-variant/40 p-3 min-w-0">
                    <p className="font-bold text-on-surface mb-2">Mặt sau</p>
                    {selectedParticipant.cccdBackUrl && !cccdBackFile && (
                      <img src={selectedParticipant.cccdBackUrl} alt="CCCD mặt sau" className="w-full h-24 object-cover rounded-lg mb-2" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCccdBackFile(e.target.files?.[0] || null)}
                      className="block w-full text-[11px]"
                    />
                    {cccdBackFile && <p className="mt-1 text-primary truncate">{cccdBackFile.name}</p>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-4 bg-surface-container-low flex justify-end gap-2 border-t border-outline-variant/30">
          <button
            type="button"
            onClick={() => setShowCccdModal(false)}
            className="px-4 py-2 rounded-xl bg-white text-on-surface font-bold text-xs hover:bg-surface-container"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleUploadParticipantCccd}
            disabled={isLoadingBookings || isUploadingCccd || customerBookings.length === 0}
            className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-container disabled:opacity-50"
          >
            {isUploadingCccd ? 'Đang gửi...' : 'Gửi cho HDV'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
    <div className="fixed bottom-6 right-6 z-55 font-sans">
      {/* Floating Chat Button */}
      <button
        onClick={handleOpenChat}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
          isOpen ? 'bg-rose-500 rotate-90' : 'bg-primary hover:bg-primary-container'
        }`}
      >
        <span className="material-symbols-outlined text-[28px]">
          {isOpen ? 'close' : 'chat'}
        </span>
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 sm:w-96 h-[500px] bg-white border border-outline-variant/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              {conversation?.supportUser ? (
                <img
                  src={conversation.supportUser.avatarUrl || 'https://via.placeholder.com/150?text=Guide'}
                  alt={conversation.supportUser.fullName}
                  className="w-10 h-10 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">support_agent</span>
                </div>
              )}
              <div>
                <h4 className="font-semibold text-sm">
                  {conversation?.supportUser ? conversation.supportUser.fullName : 'Tư vấn viên trực tuyến'}
                </h4>
                <p className="text-[11px] text-white/85 flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${conversation?.status === 'active' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}></span>
                  {conversation?.status === 'active' ? 'Đang kết nối' : 'Đang đợi hỗ trợ...'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Message Area */}
          <div className="flex-grow p-4 overflow-y-auto bg-surface-container-lowest flex flex-col gap-3">
            {isResolvingChat ? (
              <div className="my-auto text-center px-4">
                <span className="material-symbols-outlined text-4xl text-outline-variant animate-spin">sync</span>
                <p className="text-xs text-on-surface-variant/80 mt-2">Đang tải cuộc trò chuyện...</p>
              </div>
            ) : pendingClaim ? (
              <div className="my-auto text-center px-4">
                <span className="material-symbols-outlined text-4xl text-primary">forum</span>
                <h5 className="font-semibold text-on-surface mt-2 text-sm">Tiếp tục cuộc trò chuyện trước?</h5>
                <p className="text-xs text-on-surface-variant/80 mt-1 leading-relaxed">
                  Trình duyệt này đang có một đoạn chat khách. Bạn muốn chuyển đoạn chat đó sang tài khoản {currentUser?.fullName || 'hiện tại'} không?
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={handleClaimGuestConversation}
                    className="w-full bg-primary text-white rounded-xl py-2 text-xs font-bold hover:bg-primary-container transition-colors"
                  >
                    Tiếp tục chat cũ
                  </button>
                  <button
                    type="button"
                    onClick={handleStartNewCustomerConversation}
                    className="w-full bg-surface-container text-on-surface rounded-xl py-2 text-xs font-bold hover:bg-surface-container-high transition-colors"
                  >
                    Tạo cuộc trò chuyện mới
                  </button>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="my-auto text-center px-4">
                <span className="material-symbols-outlined text-4xl text-outline-variant">forum</span>
                <h5 className="font-semibold text-on-surface mt-2 text-sm">Xin chào quý khách!</h5>
                <p className="text-xs text-on-surface-variant/80 mt-1">
                  Cảm ơn bạn đã quan tâm đến Chip3Chip. Vui lòng gửi tin nhắn, tư vấn viên sẽ phản hồi bạn ngay lập tức!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderType === 'guest' || (msg.senderType === 'user' && msg.senderId === currentUser?.id);
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMine
                          ? 'bg-primary text-white rounded-br-none'
                          : 'bg-surface-container text-on-surface rounded-bl-none'
                      }`}
                    >
                      <ChatMessageContent content={msg.content} onPreviewImage={setPreviewImage} />
                    </div>
                    <span className="text-[10px] text-on-surface-variant/50 mt-1 px-1">
                      {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-outline-variant/30 bg-white space-y-2">
            <div className="flex items-center gap-1">
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleSendMedia(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                disabled={!conversation || Boolean(pendingClaim) || isResolvingChat || isUploadingMedia}
                className="w-8 h-8 rounded-xl hover:bg-surface-container text-outline hover:text-primary disabled:opacity-50"
                title="Gửi ảnh hoặc video"
              >
                <span className="material-symbols-outlined text-[18px]">{isUploadingMedia ? 'sync' : 'attach_file'}</span>
              </button>
              <button
                type="button"
                onClick={openCccdUploadModal}
                disabled={!isAuthenticated || currentUser?.role !== 'customer' || isResolvingChat}
                className="w-8 h-8 rounded-xl hover:bg-surface-container text-outline hover:text-primary disabled:opacity-50"
                title="Gửi CCCD cho HDV"
              >
                <span className="material-symbols-outlined text-[18px]">badge</span>
              </button>
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => appendEmoji(emoji)}
                  disabled={Boolean(pendingClaim) || isResolvingChat}
                  className="w-8 h-8 rounded-xl hover:bg-surface-container text-sm disabled:opacity-50"
                  title={`Chèn ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {/* Quick Replies */}
            {conversation && (
              <div className="overflow-x-auto">
                <div className="flex gap-1">
                  {QUICK_REPLIES_CUSTOMER.map((reply, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setInputValue(reply)}
                      className="px-2 py-1 whitespace-nowrap text-[11px] bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors flex-shrink-0 font-medium"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={Boolean(pendingClaim) || isResolvingChat}
                className="flex-grow px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary/50 text-on-surface"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || !conversation || Boolean(pendingClaim) || isResolvingChat}
                className="w-9 h-9 rounded-full bg-primary hover:bg-primary-container disabled:bg-neutral-200 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </form>
        </div>
      )}


      {previewImage && (
        <div className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white"
              title="Đóng"
            >
              <span className="material-symbols-outlined text-[32px]">close</span>
            </button>
            <img src={previewImage.url} alt={previewImage.name || 'Ảnh đã gửi'} className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
    {cccdModal ? createPortal(cccdModal, document.body) : null}
    </>
  );
};

export default CustomerChatWidget;



