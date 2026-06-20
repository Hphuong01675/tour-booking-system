import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import GuideFooter from '../../components/guide/GuideFooter';
import chatApi from '../../api/chatApi';
import { io } from 'socket.io-client';

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

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversationId, conversations]);

  // Khởi tạo Socket và Fetch danh sách hội thoại
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Fetch conversations
    chatApi.getConversations().then(res => {
      setConversations(res.data);
    }).catch(err => console.error("Error fetching conversations:", err));

    newSocket.on('receive_message', (message) => {
      setConversations(prev => prev.map(conv => {
        if (conv.id === message.conversationId) {
          // Check if message already exists
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

    return () => newSocket.close();
  }, []);

  // Fetch messages khi chọn 1 conversation
  useEffect(() => {
    if (activeConversationId) {
      if (socket) {
        socket.emit('join_room', activeConversationId);
      }
      chatApi.getMessages(activeConversationId).then(res => {
        setConversations(prev => prev.map(conv => {
          if (conv.id === activeConversationId) {
            return { ...conv, messages: res.data };
          }
          return conv;
        }));
      }).catch(err => console.error("Error fetching messages:", err));
    }
  }, [activeConversationId, socket]);

  const visibleConversations = conversations.filter(conv => {
    const customerName = conv.customer ? conv.customer.fullName : conv.guestName;
    const matchesSearch = customerName && customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearchText = matchesSearch || (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()));

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

    if (currentGuideActiveCount >= 3) {
      alert("Ban chi duoc tiep nhan toi da cung luc 3 khach hang.");
      return;
    }

    try {
      const res = await chatApi.acceptConversation(convId);
      const acceptedConversation = res.data;

      setConversations(prev => prev.map(conv => (
        conv.id === convId
          ? { ...conv, ...acceptedConversation, messages: conv.messages }
          : conv
      )));
      setActiveQueueTab('active');
      setActiveConversationId(convId);
    } catch (err) {
      alert(err.message || "Khong the tiep nhan cuoc hoi thoai.");
    }
  };

  const handleCloseConversation = async (convId) => {
    if (window.confirm("Ban co chac chan muon ket thuc cuoc ho tro tu van nay?")) {
      try {
        const res = await chatApi.closeConversation(convId);
        const closedConversation = res.data;

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
        alert(err.message || "Khong the ket thuc cuoc hoi thoai.");
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

  const handleNotesChange = (e) => {
    if (!activeConversationId) return;
    setGuideNotes({
      ...guideNotes,
      [activeConversationId]: e.target.value
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <main className="flex-1 min-h-0 flex flex-row overflow-hidden h-full">
        <aside className="w-full max-w-[400px] min-h-0 border-r border-outline-variant bg-surface flex flex-col">
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
                Đang tiếp nhận ({currentGuideActiveCount}/3)
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
                      {conv.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <span className="inline-flex items-center gap-xs text-label-sm text-outline">
                        {conv.status === 'waiting' ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 
                            Đang chờ
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

        <section className="flex-1 min-h-0 bg-surface-container-lowest flex flex-col relative overflow-hidden">
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

              <div className="flex-1 min-h-0 overflow-y-auto p-lg space-y-lg chat-scrollbar bg-surface-container-lowest">
                {activeConv.messages && activeConv.messages.map((msg, index) => {
                  const isGuide = msg.senderType === 'guide';
                  const isGuestSender = msg.senderType === 'guest';
                  const senderName = isGuide 
                    ? (currentUser?.fullName || 'Guide')
                    : (isGuestSender ? activeConv.guestName : activeConv.customer?.fullName);

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex gap-md max-w-[80%] ${isGuide ? 'ml-auto flex-row-reverse' : ''}`}
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

                      <div className={`space-y-xs ${isGuide ? 'items-end flex flex-col' : ''}`}>
                        <div className={`p-md rounded-2xl text-body-md ${
                          isGuide 
                            ? 'bg-primary text-on-primary rounded-tr-none' 
                            : 'bg-surface-container-high text-on-surface rounded-tl-none'
                        }`}>
                          <p className="font-semibold text-[11px] opacity-75 mb-1">
                            {senderName}
                          </p>
                          {msg.content}
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
                    
                    <div className="flex items-center justify-between mt-sm px-sm">
                      <div className="flex gap-xs">
                        <button type="button" className="p-2 rounded-xl hover:bg-surface-container-high text-outline hover:text-primary transition-all">
                          <span className="material-symbols-outlined">add_circle</span>
                        </button>
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
            <div className="flex-1 flex flex-col items-center justify-center p-xl text-center">
              <span className="material-symbols-outlined text-[64px] text-outline mb-md animate-pulse">forum</span>
              <h3 className="font-headline-sm text-on-surface mb-xs">Chào mừng đến với Trực Tổng Đài Tư Vấn</h3>
              <p className="font-body-md text-on-surface-variant max-w-sm">
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
                  <span className="text-body-sm text-outline">Họ tên</span>
                  <span className="text-body-sm font-semibold text-on-surface">
                    {activeConv.customer ? activeConv.customer.fullName : activeConv.guestName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body-sm text-outline">Số ĐT</span>
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
      <GuideFooter />
    </div>
  );
};

export default GuideChatPage;
