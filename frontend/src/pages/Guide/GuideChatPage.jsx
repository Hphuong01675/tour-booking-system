import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import GuideHeader from '../../components/Guide/GuideHeader';
import GuideFooter from '../../components/Guide/GuideFooter';
import { getGuideProfile } from '../../api/guideApi';
import {
  getConversations,
  getMessages,
  acceptConversation,
  closeConversation,
} from '../../api/chatApi';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const GuideChatPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('waiting'); // 'waiting', 'active', 'closed'
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Load guide profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getGuideProfile();
        setCurrentUser(profile);
      } catch (err) {
        console.error('Failed to load guide profile:', err);
      }
    };
    loadProfile();
  }, []);

  // Fetch initial conversations
  const fetchConversationsList = async () => {
    try {
      setIsLoading(true);
      const list = await getConversations();
      setConversations(list || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversationsList();
  }, []);

  // Initialize socket.io client and listen for conversation updates globally
  useEffect(() => {
    const socketConn = io(BACKEND_URL);
    setSocket(socketConn);

    socketConn.on('connect', () => {
      console.log('[Socket] Guide connected to server');
    });

    socketConn.on('conversation_updated', (data) => {
      // Refresh conversation list in real-time when updates occur
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === data.conversationId);
        if (index === -1) {
          // If conversation isn't in list yet, append it
          return [data.conversation, ...prev];
        }
        const updated = [...prev];
        updated[index] = data.conversation;
        // Sort conversations by updatedAt descending
        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });

      // Update selected chat details if open
      setSelectedChat((prev) => {
        if (prev?.id === data.conversationId) {
          return data.conversation;
        }
        return prev;
      });
    });

    return () => {
      socketConn.disconnect();
    };
  }, []);

  // Handle selected chat changed
  useEffect(() => {
    if (!selectedChat) return;

    // Fetch messages for selected conversation
    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const history = await getMessages(selectedChat.id);
        setMessages(history || []);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    loadMessages();

    // Join room for the selected conversation
    if (socket) {
      socket.emit('join_room', selectedChat.id);

      const handleReceiveMessage = (message) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      };

      socket.on('receive_message', handleReceiveMessage);

      return () => {
        socket.emit('leave_room', selectedChat.id);
        socket.off('receive_message', handleReceiveMessage);
      };
    }
  }, [selectedChat?.id, socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter conversations according to selected tab
  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'waiting') return c.status === 'waiting';
    if (activeTab === 'active') return c.status === 'active';
    return c.status === 'closed';
  });

  const handleAcceptChat = async (conversationId) => {
    try {
      const updated = await acceptConversation(conversationId);
      // Update local state
      setConversations((prev) => prev.map((c) => (c.id === conversationId ? updated : c)));
      setSelectedChat(updated);
    } catch (err) {
      alert('Không thể nhận cuộc hội thoại: ' + err.message);
    }
  };

  const handleCloseChat = async (conversationId) => {
    if (!window.confirm('Bạn có chắc chắn muốn đóng cuộc trò chuyện này?')) return;
    try {
      const updated = await closeConversation(conversationId);
      // Update local state
      setConversations((prev) => prev.map((c) => (c.id === conversationId ? updated : c)));
      setSelectedChat(null);
    } catch (err) {
      alert('Không thể đóng cuộc hội thoại: ' + err.message);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket || !selectedChat || !currentUser) return;

    const messageData = {
      conversationId: selectedChat.id,
      senderType: 'guide',
      senderId: currentUser.id,
      content: inputValue.trim(),
    };

    socket.emit('send_message', messageData);
    setInputValue('');
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans">
      <GuideHeader currentUser={currentUser} />

      <main className="flex-grow pt-24 pb-6 px-s-margin-mobile md:px-s-margin-desktop max-w-[1440px] mx-auto w-full flex flex-col h-[calc(100vh-6rem)]">
        {/* Page Title */}
        <div className="mb-4">
          <h2 className="font-headline-lg text-2xl text-on-surface">Tư vấn khách hàng</h2>
          <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
            Giải đáp thắc mắc và hỗ trợ khách hàng đặt tour trực tuyến.
          </p>
        </div>

        {/* Dashboard Split Container */}
        <div className="flex-grow bg-white border border-outline-variant/30 rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row h-0 min-h-[450px]">
          
          {/* Left Panel: Conversation List */}
          <div className="w-full md:w-80 border-r border-outline-variant/30 flex flex-col bg-surface-container-lowest">
            {/* Tabs */}
            <div className="grid grid-cols-3 border-b border-outline-variant/30 text-xs font-semibold text-center">
              <button
                onClick={() => {
                  setActiveTab('waiting');
                  setSelectedChat(null);
                }}
                className={`py-3 transition-colors border-b-2 cursor-pointer ${
                  activeTab === 'waiting'
                    ? 'text-primary border-primary font-bold'
                    : 'text-on-surface-variant/75 border-transparent hover:bg-surface-container-low'
                }`}
              >
                Chờ hỗ trợ ({conversations.filter((c) => c.status === 'waiting').length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('active');
                  setSelectedChat(null);
                }}
                className={`py-3 transition-colors border-b-2 cursor-pointer ${
                  activeTab === 'active'
                    ? 'text-primary border-primary font-bold'
                    : 'text-on-surface-variant/75 border-transparent hover:bg-surface-container-low'
                }`}
              >
                Đang hỗ trợ ({conversations.filter((c) => c.status === 'active').length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('closed');
                  setSelectedChat(null);
                }}
                className={`py-3 transition-colors border-b-2 cursor-pointer ${
                  activeTab === 'closed'
                    ? 'text-primary border-primary font-bold'
                    : 'text-on-surface-variant/75 border-transparent hover:bg-surface-container-low'
                }`}
              >
                Đã đóng
              </button>
            </div>

            {/* Conversation list area */}
            <div className="flex-grow overflow-y-auto divide-y divide-outline-variant/20">
              {isLoading ? (
                <div className="p-8 text-center text-sm text-on-surface-variant/50">
                  <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                  <p className="mt-2">Đang tải danh sách...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-on-surface-variant/60">
                  Chưa có cuộc trò chuyện nào trong danh sách.
                </div>
              ) : (
                filteredConversations.map((chat) => {
                  const isSelected = selectedChat?.id === chat.id;
                  const chatName = chat.customer?.fullName || chat.guestName || 'Khách vãng lai';
                  return (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`w-full text-left p-3.5 flex flex-col gap-1 transition-colors cursor-pointer hover:bg-surface-container-low/50 ${
                        isSelected ? 'bg-primary-fixed/50 hover:bg-primary-fixed/50 border-l-4 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-on-surface truncate">{chatName}</span>
                        <span className="text-[10px] text-on-surface-variant/50">
                          {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant/80 truncate w-full">
                        {chat.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Chat Room Details */}
          <div className="flex-grow flex flex-col bg-white">
            {selectedChat ? (
              <>
                {/* Active Chat Header */}
                <div className="px-6 py-3 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
                  <div>
                    <h4 className="font-semibold text-sm text-on-surface">
                      {selectedChat.customer?.fullName || selectedChat.guestName || 'Khách vãng lai'}
                    </h4>
                    <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
                      ID: {selectedChat.id.substring(0, 8)}... | Trạng thái:{' '}
                      <span className="font-semibold text-primary">{selectedChat.status.toUpperCase()}</span>
                    </p>
                  </div>
                  {selectedChat.status === 'active' && (
                    <button
                      onClick={() => handleCloseChat(selectedChat.id)}
                      className="px-3 py-1.5 border border-error/30 text-error hover:bg-error-container/10 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close_fullscreen</span>
                      Đóng Chat
                    </button>
                  )}
                </div>

                {/* Messages Body */}
                <div className="flex-grow p-6 overflow-y-auto bg-surface-container-low/30 flex flex-col gap-4">
                  {isLoadingMessages ? (
                    <div className="my-auto text-center text-sm text-on-surface-variant/50">
                      <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                      <p className="mt-2">Đang tải lịch sử tin nhắn...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="my-auto text-center text-xs text-on-surface-variant/50">
                      Chưa có tin nhắn nào. Bắt đầu hỗ trợ ngay.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderType === 'guide' || msg.senderType === 'user';
                      const senderName = msg.sender?.fullName || (isMe ? 'Bạn' : 'Khách');
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[9px] text-on-surface-variant/40 mb-1 px-1">{senderName}</span>
                          <div
                            className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                              isMe
                                ? 'bg-primary text-white rounded-br-none'
                                : 'bg-white text-on-surface border border-outline-variant/30 rounded-bl-none'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-on-surface-variant/40 mt-1 px-1">
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Input or Accept Screen */}
                {selectedChat.status === 'waiting' ? (
                  <div className="p-6 text-center border-t border-outline-variant/30 bg-white">
                    <h5 className="font-semibold text-sm text-on-surface">Cuộc hội thoại chưa được tiếp nhận</h5>
                    <p className="text-xs text-on-surface-variant/80 mt-1 mb-4">
                      Vui lòng nhấp nhận hỗ trợ khách hàng để bắt đầu nhắn tin tư vấn trực tiếp.
                    </p>
                    <button
                      onClick={() => handleAcceptChat(selectedChat.id)}
                      className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-bold rounded-lg text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Nhận hỗ trợ khách hàng
                    </button>
                  </div>
                ) : selectedChat.status === 'closed' ? (
                  <div className="p-4 text-center border-t border-outline-variant/30 bg-surface-container text-xs text-on-surface-variant">
                    Cuộc trò chuyện này đã được đóng lại.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-outline-variant/30 bg-white flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Gõ nội dung tin nhắn..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="flex-grow px-4 py-2.5 bg-surface border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary/50 text-on-surface"
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim()}
                      className="px-4 py-2.5 bg-primary hover:bg-primary-container disabled:bg-neutral-200 text-white font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Gửi</span>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="my-auto text-center px-8">
                <span className="material-symbols-outlined text-4xl text-outline-variant">chat_bubble</span>
                <h5 className="font-semibold text-on-surface mt-2 text-sm">Chưa có hội thoại nào được chọn</h5>
                <p className="text-xs text-on-surface-variant/80 mt-1">
                  Chọn một cuộc trò chuyện ở danh sách bên trái để bắt đầu hoặc quản lý hỗ trợ khách hàng.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      <GuideFooter />
    </div>
  );
};

export default GuideChatPage;
