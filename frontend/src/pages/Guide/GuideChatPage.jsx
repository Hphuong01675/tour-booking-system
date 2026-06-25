/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import * as chatApi from '../../api/chatApi';
import * as guideApi from '../../api/guideApi';
import { io } from 'socket.io-client';

const QUICK_EMOJIS = ['👍', '😊', '🙏', '❤️', '🎉', '✅'];
const QUICK_REPLIES_GUIDE = [
  'Cảm ơn bạn 🙏',
  'Sẽ xem xét sớm ⏰',
  'Đã ghi nhận 📝',
  'Sẽ liên hệ lại 📞',
  'Rất vui được hỗ trợ 😊',
  'OK, hiểu rồi ✅'
];

const MAX_ACTIVE_CONVERSATIONS = 5;

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

const getMessagePreview = (content) => {
  const parsed = parseChatContent(content);
  if (parsed.type === 'image') return '[Ảnh]';
  if (parsed.type === 'video') return '[Video]';
  if (parsed.type === 'cccd_review') return `Khách đã gửi CCCD để kiểm tra${parsed.participantName ? `: ${parsed.participantName}` : ''}`;
  return parsed.text || 'Bắt đầu cuộc trò chuyện';
};

const ChatMessageContent = ({ content, isGuide, onPreviewImage, onCCCDApproval }) => {
  const parsed = parseChatContent(content);
  if (parsed.type === 'image') {
    return (
      <button type="button" onClick={() => onPreviewImage?.(parsed)} className="block text-left">
        <img src={parsed.url} alt={parsed.name || 'Ảnh đã gửi'} className="max-h-64 rounded-xl object-contain bg-black/5 cursor-zoom-in" />
      </button>
    );
  }
  if (parsed.type === 'video') {
    return <video src={parsed.url} controls className="max-h-64 rounded-xl bg-black" />;
  }
  if (parsed.type === 'cccd_review') {
    const images = [
      { label: 'Mặt trước', url: parsed.frontUrl },
      { label: 'Mặt sau', url: parsed.backUrl },
    ].filter((item) => item.url);

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onCCCDApproval?.()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCCCDApproval?.();
          }
        }}
        className={`w-72 max-w-full space-y-3 p-3 rounded-xl border cursor-pointer hover:bg-surface-container-highest transition-colors ${isGuide ? 'border-primary-container bg-primary-container text-on-primary-container' : 'border-outline-variant bg-surface-container-low text-on-surface'}`}
      >
        <div>
          <p className="font-bold text-sm">Khách gửi CCCD cần kiểm tra</p>
          <p className="text-xs opacity-80 mt-1">Hành khách: {parsed.participantName || 'Chưa rõ'}</p>
          {parsed.dateOfBirth && (
            <p className="text-[11px] opacity-70">Ngày sinh: {new Date(parsed.dateOfBirth).toLocaleDateString('vi-VN')}</p>
          )}
          <p className="text-[11px] opacity-70">Tour: {parsed.tourTitle || 'Chưa rõ'}</p>
          {parsed.departureDate && (
            <p className="text-[11px] opacity-70">
              Khởi hành: {new Date(parsed.departureDate).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 pointer-events-none">
          {images.map((item) => (
            <div key={item.label} className="text-left">
              <img src={item.url} alt={`CCCD ${item.label}`} className="w-full h-24 object-cover rounded-lg bg-black/5" />
              <span className="block mt-1 text-[10px] opacity-75">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] opacity-75 border-t border-outline-variant/30 pt-2 mt-2">
          Sau khi kiểm tra, HDV cập nhật ảnh chính thức tại danh sách hành khách của tour.
        </p>
        <div className="text-center pt-1">
          <span className="text-xs font-semibold text-primary">Nhấn để Xem & Duyệt</span>
        </div>
      </div>
    );
  }
  return <span className={isGuide ? 'text-on-primary' : 'text-on-surface'}>{parsed.text}</span>;
};

const GuideChatPage = () => {
  const { currentUser } = useOutletContext() || {};
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch {
      return null;
    }
  })();
  const currentGuideId = currentUser?.id || storedUser?.id;
  const [conversations, setConversations] = useState([]);
  const [activeQueueTab, setActiveQueueTab] = useState('waiting');
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chatInputText, setChatInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [guideNotes, setGuideNotes] = useState({});
  const [socket, setSocket] = useState(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // CCCD approval modal state
  const [showCCCDModal, setShowCCCDModal] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [selectedCCCDMessage, setSelectedCCCDMessage] = useState(null);
  const [isUploadingCCCD, setIsUploadingCCCD] = useState(false);

  const messagesEndRef = useRef(null);
  const mediaInputRef = useRef(null);

  const asArray = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    return [];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = useCallback(() => {
    chatApi.getConversations()
      .then(res => {
        setConversations(asArray(res));
      })
      .catch(err => console.error("Error fetching conversations:", err));
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversationId, conversations]);

  // Khởi tạo Socket và Fetch danh sách hội thoại
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:8080');
    setSocket(newSocket);

    fetchConversations();
    const refreshTimer = setInterval(fetchConversations, 60 * 1000);

    newSocket.on('receive_message', (message) => {
      setConversations(prev => prev.map(conv => {
        if (conv.id === message.conversationId) {
          const exists = (conv.messages || []).find(m => m.id === message.id);
          if (exists) return conv;

          return {
            ...conv,
            lastMessage: message.content,
            updatedAt: message.sentAt || new Date().toISOString(),
            messages: [...(conv.messages || []), message]
          };
        }
        return conv;
      }));
    });

    newSocket.on('conversation_updated', (data) => {
      setConversations(prev => {
        if (data.conversation) {
          const exists = prev.some(conv => conv.id === data.conversationId);
          if (!exists) {
            return [data.conversation, ...prev];
          }

          return prev.map(conv => (
              conv.id === data.conversationId
                  ? { ...conv, ...data.conversation, messages: conv.messages }
                  : conv
          ));
        }

        return prev.map(conv => {
          if (conv.id === data.conversationId) {
            return {
              ...conv,
              lastMessage: data.lastMessage,
              updatedAt: data.updatedAt
            };
          }
          return conv;
        });
      });
    });

    return () => {
      clearInterval(refreshTimer);
      newSocket.close();
    };
  }, [fetchConversations]);

  // Fetch messages khi chọn 1 conversation
  useEffect(() => {
    if (activeConversationId) {
      if (socket) {
        socket.emit('join_room', activeConversationId);
      }
      chatApi.getMessages(activeConversationId).then(res => {
        const messages = asArray(res);
        setConversations(prev => prev.map(conv => {
          if (conv.id === activeConversationId) {
            return { ...conv, messages };
          }
          return conv;
        }));
      }).catch(err => console.error("Error fetching messages:", err));
    }
  }, [activeConversationId, socket]);

  const visibleConversations = conversations.filter(conv => {
    const customerName = conv.customer ? conv.customer.fullName : conv.guestName;
    const matchesSearch = customerName && customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const previewText = getMessagePreview(conv.lastMessage || '').toLowerCase();
    const matchesSearchText = matchesSearch || previewText.includes(searchTerm.toLowerCase());

    if (activeQueueTab === 'waiting') {
      return conv.status === 'waiting' && matchesSearchText;
    } else {
      return conv.status === 'active' && conv.supportUserId === currentGuideId && matchesSearchText;
    }
  });

  const activeConv = conversations.find(c => c.id === activeConversationId);

  const currentGuideActiveCount = conversations.filter(
      conv => conv.status === 'active' && conv.supportUserId === currentGuideId
  ).length;

  const handleAcceptConversation = async (convId, e) => {
    e?.stopPropagation();

    try {
      const res = await chatApi.acceptConversation(convId);
      const acceptedConversation = res?.data || res;

      setConversations(prev => prev.map(conv => (
          conv.id === convId
              ? { ...conv, ...acceptedConversation, messages: conv.messages }
              : conv
      )));
      setActiveQueueTab('active');
      setActiveConversationId(convId);
    } catch (err) {
      setAlertModal({ isOpen: true, title: 'Lỗi', message: err.response?.data?.error || err.message || "Không thể tiếp nhận cuộc hội thoại.", type: 'error' });
    }
  };

  const handleCloseConversation = async (convId) => {
    if (window.confirm("Bạn có chắc chắn muốn kết thúc cuộc hỗ trợ tư vấn này?")) {
      try {
        const res = await chatApi.closeConversation(convId);
        const closedConversation = res?.data || res;

        setConversations(prev => prev.map(conv => (
            conv.id === convId
                ? { ...conv, ...closedConversation, messages: conv.messages }
                : conv
        )));

        const remainingActive = conversations.filter(
            c => c.id !== convId && c.status === 'active' && c.supportUserId === currentGuideId
        );
        if (remainingActive.length > 0) {
          setActiveConversationId(remainingActive[0].id);
        } else {
          setActiveConversationId(null);
        }
      } catch (err) {
        setAlertModal({ isOpen: true, title: 'Lỗi', message: err.message || 'Không thể kết thúc cuộc hội thoại.', type: 'error' });
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeConversationId || !socket) return;

    socket.emit('send_message', {
      conversationId: activeConversationId,
      senderType: 'guide',
      senderId: currentGuideId,
      content: chatInputText.trim()
    });

    setChatInputText('');
  };

  const handleSendMedia = async (file) => {
    if (!file || !activeConversationId || !socket || isUploadingMedia) return;

    try {
      setIsUploadingMedia(true);
      const formData = new FormData();
      formData.append('media', file);
      const result = await chatApi.uploadChatMedia(formData);

      socket.emit('send_message', {
        conversationId: activeConversationId,
        senderType: 'guide',
        senderId: currentGuideId,
        content: result.content
      });
    } catch (err) {
      setAlertModal({ isOpen: true, title: 'Lỗi', message: err.response?.data?.message || err.response?.data?.error || 'Không thể gửi tệp. Vui lòng thử lại.', type: 'error' });
    } finally {
      setIsUploadingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
    }
  };

  const appendEmoji = (emoji) => {
    setChatInputText(prev => `${prev}${emoji}`);
  };

  const handleNotesChange = (e) => {
    if (!activeConversationId) return;
    setGuideNotes({
      ...guideNotes,
      [activeConversationId]: e.target.value
    });
  };

  const handleCCCDApproval = async (cccdMessage) => {
    if (!cccdMessage || !activeConv) return;

    const parsed = parseChatContent(cccdMessage.content);
    if (parsed.type !== 'cccd_review') return;

    setSelectedCCCDMessage({
      ...cccdMessage,
      parsed,
      participantName: parsed.participantName,
      dateOfBirth: parsed.dateOfBirth,
      tourTitle: parsed.tourTitle,
      frontUrl: parsed.frontUrl,
      backUrl: parsed.backUrl,
      participantId: parsed.participantId,
      bookingId: parsed.bookingId,
      assignmentId: parsed.assignmentId
    });
    setShowCCCDModal(true);
  };

  const handleUploadCCCD = async () => {
    if (!selectedCCCDMessage || !activeConv) {
      setAlertModal({ isOpen: true, title: 'Lỗi', message: 'Không thể lấy thông tin CCCD. Vui lòng thử lại.', type: 'error' });
      return;
    }

    if (isUploadingCCCD) return;

    setIsUploadingCCCD(true);
    try {
      const assignmentId = selectedCCCDMessage.assignmentId
        || activeConv.schedule?.assignments?.[0]?.id
        || activeConv.assignmentId
        || activeConv.scheduleId
        || selectedCCCDMessage.bookingId;
      const participantId = selectedCCCDMessage.participantId;

      if (!assignmentId || !participantId) {
        setAlertModal({ isOpen: true, title: 'Lỗi', message: 'Không có thông tin assignment hoặc participant. Vui lòng thử lại.', type: 'error' });
        setIsUploadingCCCD(false);
        return;
      }

      const dataUrlToBlob = (dataUrl) => {
        const parts = dataUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        const n = bstr.length;
        const u8arr = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
          u8arr[i] = bstr.charCodeAt(i);
        }
        return new Blob([u8arr], { type: mime });
      };

      const urlToBlob = async (url) => {
        if (url.startsWith('data:')) {
          return dataUrlToBlob(url);
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
        const blob = await response.blob();
        if (blob.size === 0) throw new Error('Image blob is empty');
        return blob;
      };

      const formData = new FormData();
      let hasFiles = false;
      
      if (selectedCCCDMessage.frontUrl) {
        try {
          const frontBlob = await urlToBlob(selectedCCCDMessage.frontUrl);
          formData.append('front', frontBlob, 'cccd_front.jpg');
          hasFiles = true;
        } catch (err) {
          console.error('Error processing front image:', err);
          setAlertModal({ isOpen: true, title: 'Lỗi', message: 'Lỗi tải ảnh mặt trước: ' + err.message, type: 'error' });
          setIsUploadingCCCD(false);
          return;
        }
      }
      
      if (selectedCCCDMessage.backUrl) {
        try {
          const backBlob = await urlToBlob(selectedCCCDMessage.backUrl);
          formData.append('back', backBlob, 'cccd_back.jpg');
          hasFiles = true;
        } catch (err) {
          console.error('Error processing back image:', err);
          setAlertModal({ isOpen: true, title: 'Lỗi', message: 'Lỗi tải ảnh mặt sau: ' + err.message, type: 'error' });
          setIsUploadingCCCD(false);
          return;
        }
      }

      if (!hasFiles) {
        setAlertModal({ isOpen: true, title: 'Lỗi', message: 'Không có ảnh CCCD để upload. Vui lòng thử lại.', type: 'error' });
        setIsUploadingCCCD(false);
        return;
      }

      await guideApi.uploadParticipantCccd(assignmentId, participantId, formData);

      setAlertModal({ isOpen: true, title: 'Thành công', message: 'Đã duyệt và upload CCCD thành công!', type: 'info' });
      setShowCCCDModal(false);
      setSelectedCCCDMessage(null);

      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-scrollbar');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error('Upload CCCD error:', err);
      setAlertModal({ isOpen: true, title: 'Lỗi', message: 'Lỗi upload CCCD: ' + (err.response?.data?.error || err.message), type: 'error' });
    } finally {
      setIsUploadingCCCD(false);
    }
  };

  return (
      <>
        <main className="flex-grow flex overflow-hidden h-[calc(100vh-160px)] w-full min-w-0 font-sans">
          <aside className="w-full max-w-[400px] min-h-0 shrink-0 border-r border-outline-variant bg-surface flex flex-col">
            <div className="p-lg space-y-md border-b border-outline-variant">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Tư vấn khách hàng</h2>
                <span className="bg-primary-container text-on-primary-fixed text-label-md px-sm py-xs rounded-full font-bold">
                {conversations.filter(c => c.status === 'waiting').length} mới
              </span>
              </div>

              <div className="flex bg-surface-container rounded-xl p-xs">
                <button
                    onClick={() => setActiveQueueTab('waiting')}
                    className={`flex-1 py-sm rounded-lg text-label-md font-bold text-center transition-all ${
                        activeQueueTab === 'waiting'
                            ? 'bg-surface-container-lowest text-primary shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  Chờ tiếp nhận ({conversations.filter(c => c.status === 'waiting').length})
                </button>
                <button
                    onClick={() => setActiveQueueTab('active')}
                    className={`flex-1 py-sm rounded-lg text-label-md font-bold text-center transition-all ${
                        activeQueueTab === 'active'
                            ? 'bg-surface-container-lowest text-primary shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  Đang tiếp nhận ({currentGuideActiveCount}/{MAX_ACTIVE_CONVERSATIONS})
                </button>
              </div>

              <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-md bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary text-body-md"
                    placeholder="Tìm kiếm khách hàng..."
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                person_search
              </span>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar p-md space-y-sm">
              {visibleConversations.length > 0 ? (
                  visibleConversations.map((conv) => {
                    const isActiveItem = conv.id === activeConversationId;
                    const isGuest = !conv.customer;
                    const displayName = isGuest ? conv.guestName : conv.customer.fullName;

                    return (
                        <div
                            key={conv.id}
                            onClick={() => setActiveConversationId(conv.id)}
                            className={`p-md rounded-xl border-l-4 cursor-pointer transition-all ${
                                isActiveItem
                                    ? 'bg-surface-container-high border-primary'
                                    : 'hover:bg-surface-container-low border-transparent'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-xs">
                            <span className={`font-label-md text-label-md ${isActiveItem ? 'text-primary' : 'text-on-surface'}`}>
                              {displayName || 'Khách Vô Danh'}
                            </span>
                            <span className="text-label-sm text-outline">
                              {new Date(conv.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-body-sm text-on-surface-variant truncate mb-sm">
                            {getMessagePreview(conv.lastMessage)}
                          </p>

                          <div className="flex justify-between items-center">
                            <span className="inline-flex items-center gap-xs text-label-sm text-outline">
                              {conv.status === 'waiting' ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    Đang chờ tiếp nhận
                                  </>
                              ) : (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                    Đang tư vấn
                                  </>
                              )}
                            </span>

                            {conv.status === 'waiting' && (
                                <button
                                    onClick={(e) => handleAcceptConversation(conv.id, e)}
                                    className="bg-primary text-on-primary px-md py-xs rounded-lg text-label-sm font-semibold hover:bg-primary-container transition-colors shadow-sm"
                                >
                                  Tiếp nhận
                                </button>
                            )}
                          </div>
                        </div>
                    );
                  })
              ) : (
                  <div className="p-xl text-center text-outline italic">
                    Không có cuộc hội thoại nào.
                  </div>
              )}
            </div>
          </aside>

          <section className="flex-1 min-w-0 min-h-0 bg-surface-container-lowest flex flex-col relative overflow-hidden">
            {activeConv ? (
                <>
                  <header className="h-[72px] px-lg flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-md z-10 border-b border-outline-variant">
                    <div className="flex items-center gap-md">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary-container flex items-center justify-center bg-primary-container text-primary font-bold">
                          {activeConv.customer ? (
                              activeConv.customer.avatarUrl ? (
                                  <img className="w-full h-full object-cover" src={activeConv.customer.avatarUrl} alt={activeConv.customer.fullName} />
                              ) : (
                                  activeConv.customer.fullName?.substring(0, 2).toUpperCase()
                              )
                          ) : (
                              <span className="material-symbols-outlined text-[24px]">person</span>
                          )}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface-container-lowest rounded-full"></span>
                      </div>
                      <div>
                        <h3 className="font-label-md text-on-surface leading-none mb-1">
                          {activeConv.customer ? activeConv.customer.fullName : activeConv.guestName}
                        </h3>
                        <p className="text-label-sm text-primary">Đang trực tuyến</p>
                      </div>
                    </div>

                    <div className="flex gap-sm">
                      {activeConv.status === 'active' && (
                          <button
                              onClick={() => handleCloseConversation(activeConv.id)}
                              className="bg-error-container text-on-error-container px-md py-xs rounded-xl text-label-sm font-bold hover:bg-red-200 transition-colors"
                          >
                            Kết thúc
                          </button>
                      )}
                    </div>
                  </header>

                  <div className="flex-grow min-h-0 overflow-y-auto p-lg space-y-lg chat-scrollbar bg-surface-container-lowest">
                    {activeConv.messages && activeConv.messages.map((msg, index) => {
                      const isGuide = msg.senderType === 'guide';
                      const isGuestSender = msg.senderType === 'guest';
                      const senderName = isGuide
                          ? (currentUser?.fullName || 'Guide')
                          : (isGuestSender ? activeConv.guestName : activeConv.customer?.fullName);

                      return (
                          <div
                              key={msg.id || index}
                              className={`flex gap-md max-w-[80%] min-w-0 ${isGuide ? 'ml-auto flex-row-reverse' : ''}`}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-2 flex items-center justify-center bg-surface-container-high">
                              {isGuide ? (
                                  <span className="material-symbols-outlined text-primary text-[18px]">support_agent</span>
                              ) : activeConv.customer && activeConv.customer.avatarUrl ? (
                                  <img className="w-full h-full object-cover" src={activeConv.customer.avatarUrl} alt={senderName} />
                              ) : (
                                  <span className="material-symbols-outlined text-outline text-[18px]">person</span>
                              )}
                            </div>

                            <div className={`space-y-xs min-w-0 ${isGuide ? 'items-end flex flex-col' : ''}`}>
                              <div className={`p-md rounded-2xl text-body-md ${
                                  isGuide
                                      ? 'bg-primary text-on-primary rounded-tr-none'
                                      : 'bg-surface-container-high text-on-surface rounded-tl-none'
                              }`}>
                                <p className="font-semibold text-[11px] opacity-75 mb-1">
                                  {senderName}
                                </p>
                                <ChatMessageContent 
                                    content={msg.content}
                                    isGuide={isGuide} 
                                    onPreviewImage={setPreviewImage} 
                                    onCCCDApproval={() => {
                                      const assignedGuideId = activeConv.supportUserId || activeConv.guideId;
                                      if (activeConv.status !== 'active' || String(assignedGuideId) !== String(currentGuideId)) {
                                        setAlertModal({ isOpen: true, title: 'Không thể thao tác', message: 'Vui lòng Tiếp nhận cuộc hỗ trợ này trước khi thao tác duyệt CCCD.', type: 'error' });
                                        return;
                                      }
                                      handleCCCDApproval(msg);
                                    }} 
                                />
                              </div>
                              <span className="text-label-sm text-outline ml-1">
                                {new Date(msg.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <footer className="p-lg bg-surface-container-lowest border-t border-outline-variant">
                    {activeConv.status === 'active' ? (
                        <form onSubmit={handleSendMessage} className="bg-surface-container-low rounded-2xl p-sm shadow-sm border border-outline-variant focus-within:border-primary transition-all">
                          <textarea
                              value={chatInputText}
                              onChange={(e) => setChatInputText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage(e);
                                }
                              }}
                              className="w-full bg-transparent border-none focus:ring-0 text-body-md resize-none h-[60px] p-md chat-scrollbar outline-none"
                              placeholder="Nhập tin nhắn hỗ trợ..."
                          ></textarea>

                          {/* Quick Replies */}
                          <div className="px-md pb-xs overflow-x-auto chat-scrollbar">
                            <div className="flex gap-xs">
                              {QUICK_REPLIES_GUIDE.map((reply, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => setChatInputText(reply)}
                                  className="px-md py-xs whitespace-nowrap text-body-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors flex-shrink-0 font-medium"
                                >
                                  {reply}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-sm px-sm">
                            <div className="flex gap-xs items-center">
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
                                  disabled={isUploadingMedia}
                                  className="p-2 rounded-xl hover:bg-surface-container-high text-outline hover:text-primary transition-all disabled:opacity-50"
                                  title="Gửi ảnh hoặc video"
                              >
                                <span className="material-symbols-outlined">{isUploadingMedia ? 'sync' : 'attach_file'}</span>
                              </button>
                              {QUICK_EMOJIS.map((emoji) => (
                                  <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => appendEmoji(emoji)}
                                      className="w-8 h-8 rounded-xl hover:bg-surface-container-high text-body-md transition-all"
                                      title={`Gửi biểu tượng ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                              ))}
                            </div>
                            <button
                                type="submit"
                                className="bg-secondary-container hover:bg-secondary text-white px-xl py-md rounded-xl font-bold flex items-center gap-sm transition-all transform active:scale-95 shadow-sm"
                            >
                              Gửi
                              <span className="material-symbols-outlined">send</span>
                            </button>
                          </div>
                        </form>
                    ) : (
                        <div className="p-lg bg-surface-container rounded-2xl border border-dashed border-outline-variant flex flex-col items-center justify-center">
                          <span className="material-symbols-outlined text-[36px] text-outline mb-sm">lock</span>
                          <p className="font-label-md text-on-surface-variant text-center">
                            Bạn phải Tiếp nhận cuộc hội thoại này trước khi gửi tin nhắn tư vấn.
                          </p>
                          <button
                              onClick={(e) => handleAcceptConversation(activeConv.id, e)}
                              className="mt-md bg-primary text-on-primary px-xl py-md rounded-xl font-bold hover:bg-primary-container transition-colors shadow-sm"
                          >
                            Tiếp nhận hỗ trợ ngay
                          </button>
                        </div>
                    )}
                  </footer>
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-xl text-center">
                  <span className="material-symbols-outlined text-[64px] text-outline mb-md animate-pulse">forum</span>
                  <h3 className="font-headline-sm text-on-surface mb-xs">Chào mừng đến với Trực Tổng Đài Tư Vấn</h3>
                  <p
                    className="font-body-md text-on-surface-variant mx-auto"
                    style={{ display: 'block', width: 'clamp(320px, 42vw, 420px)', maxWidth: 'calc(100vw - 480px)', whiteSpace: 'normal', wordBreak: 'keep-all', overflowWrap: 'normal', lineHeight: '1.5rem' }}
                  >
                    Hãy chọn một cuộc hội thoại để bắt đầu hỗ trợ.
                  </p>
                </div>
            )}
          </section>

          {activeConv && (
              <aside className="hidden xl:flex w-[320px] bg-surface flex-col border-l border-outline-variant">
                <div className="p-lg border-b border-outline-variant">
                  <h4 className="font-label-md text-outline uppercase tracking-wider mb-md">Thông tin khách hàng</h4>
                  <div className="space-y-md">
                    <div className="flex justify-between items-center">
                      <span className="text-body-sm text-outline">Hành khách</span>
                      <span className="text-body-sm font-semibold text-on-surface">
                        {activeConv.customer ? activeConv.customer.fullName : activeConv.guestName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-body-sm text-outline">Số điện thoại</span>
                      <span className="text-body-sm font-semibold text-on-surface">
                        {activeConv.customer?.phone || 'Chưa cập nhật'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-lg flex-1 overflow-y-auto chat-scrollbar">
                  <h4 className="font-label-md text-outline uppercase tracking-wider mb-md">Ghi chú hỗ trợ</h4>
                  <textarea
                      value={guideNotes[activeConversationId] || ''}
                      onChange={handleNotesChange}
                      className="w-full p-md bg-surface-container-low border-none rounded-xl text-body-sm h-32 focus:ring-1 focus:ring-primary outline-none resize-none"
                      placeholder="Nhập ghi chú nhanh về khách hàng này..."
                  />
                </div>
              </aside>
          )}
        </main>
        {previewImage && (
            <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
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

        {/* CCCD Approval Modal */}
        {showCCCDModal && selectedCCCDMessage && createPortal((
            <div
              className="fixed inset-0 z-[220] bg-black/50 flex items-center justify-center px-4 py-6"
              onClick={() => {
                if (!isUploadingCCCD) {
                  setShowCCCDModal(false);
                  setSelectedCCCDMessage(null);
                }
              }}
            >
              <div
                className="bg-white rounded-xl shadow-2xl animate-fadeIn flex flex-col overflow-hidden"
                style={{ width: 'min(92vw, 560px)', maxHeight: '90vh', minWidth: '320px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-outline-variant/20 shrink-0">
                  <h3 className="font-bold text-lg text-on-surface">Duyệt & Upload CCCD</h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Xác nhận duyệt CCCD và upload lên danh sách hành khách
                  </p>
                </div>

                <div className="p-6 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant mb-2 block">Hành khách</label>
                      <p className="text-sm font-semibold text-on-surface">{selectedCCCDMessage.participantName}</p>
                    </div>

                    {selectedCCCDMessage.dateOfBirth && (
                      <div>
                        <label className="text-xs font-semibold text-on-surface-variant mb-2 block">Ngày sinh</label>
                        <p className="text-sm font-semibold text-on-surface">{new Date(selectedCCCDMessage.dateOfBirth).toLocaleDateString('vi-VN')}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant mb-2 block">Tour</label>
                      <p className="text-sm font-semibold text-on-surface">{selectedCCCDMessage.tourTitle}</p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant mb-2 block">Ảnh CCCD</label>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedCCCDMessage.frontUrl && (
                          <div className="relative rounded-lg overflow-hidden border border-outline-variant/30 aspect-video">
                            <img src={selectedCCCDMessage.frontUrl} alt="CCCD Mặt trước" className="w-full h-full object-cover" />
                            <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 text-center">Mặt trước</p>
                          </div>
                        )}
                        {selectedCCCDMessage.backUrl && (
                          <div className="relative rounded-lg overflow-hidden border border-outline-variant/30 aspect-video">
                            <img src={selectedCCCDMessage.backUrl} alt="CCCD Mặt sau" className="w-full h-full object-cover" />
                            <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 text-center">Mặt sau</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        <strong>Lưu ý:</strong> CCCD sẽ được upload vào danh sách hành khách chính thức của tour. Operator sẽ tiến hành xác thực thêm.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-surface-container-low flex justify-end gap-3 shrink-0 rounded-b-xl border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCCCDModal(false);
                      setSelectedCCCDMessage(null);
                    }}
                    className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadCCCD}
                    disabled={isUploadingCCCD}
                    className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {isUploadingCCCD ? 'Đang xử lý...' : 'Duyệt & Upload'}
                  </button>
                </div>
              </div>
            </div>
        ), document.body)}

        {/* Alert Modal */}
        {alertModal.isOpen && createPortal((
          <div className="fixed inset-0 z-[230] bg-black/50 flex items-center justify-center px-4 py-6">
            <div className="bg-white rounded-xl shadow-2xl animate-fadeIn flex flex-col overflow-hidden" style={{ width: 'min(92vw, 420px)' }}>
              <div className="p-6 border-b border-outline-variant/20">
                <div className="flex items-center gap-3">
                  {alertModal.type === 'error' && (
                    <span className="material-symbols-outlined text-error text-[28px]">error</span>
                  )}
                  {alertModal.type === 'info' && (
                    <span className="material-symbols-outlined text-primary text-[28px]">info</span>
                  )}
                  {alertModal.type === 'success' && (
                    <span className="material-symbols-outlined text-success text-[28px]">check_circle</span>
                  )}
                  <h3 className="font-bold text-lg text-on-surface">{alertModal.title}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-on-surface-variant text-sm leading-relaxed">{alertModal.message}</p>
              </div>
              <div className="p-6 bg-surface-container-low flex justify-end border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setAlertModal({ isOpen: false, title: '', message: '', type: 'info' })}
                  className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        ), document.body)}
      </>
  );
};

export default GuideChatPage;
