import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { initGuestChat } from '../../api/chatApi';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const CustomerChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

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

  const handleOpenChat = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && sessionKey && !conversation) {
      try {
        const data = await initGuestChat(sessionKey);
        setConversation(data.conversation);
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Failed to initialize guest chat:', err);
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket || !conversation) return;

    const messageData = {
      conversationId: conversation.id,
      senderType: 'guest',
      content: inputValue.trim(),
    };

    socket.emit('send_message', messageData);
    setInputValue('');
  };

  return (
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
            {messages.length === 0 ? (
              <div className="my-auto text-center px-4">
                <span className="material-symbols-outlined text-4xl text-outline-variant">forum</span>
                <h5 className="font-semibold text-on-surface mt-2 text-sm">Xin chào quý khách!</h5>
                <p className="text-xs text-on-surface-variant/80 mt-1">
                  Cảm ơn bạn đã quan tâm đến Chip3Chip. Vui lòng gửi tin nhắn, tư vấn viên sẽ phản hồi bạn ngay lập tức!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isGuest = msg.senderType === 'guest';
                return (
                  <div key={msg.id} className={`flex flex-col ${isGuest ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isGuest
                          ? 'bg-primary text-white rounded-br-none'
                          : 'bg-surface-container text-on-surface rounded-bl-none'
                      }`}
                    >
                      {msg.content}
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
          <form onSubmit={handleSendMessage} className="p-3 border-t border-outline-variant/30 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-grow px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary/50 text-on-surface"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || !conversation}
              className="w-9 h-9 rounded-full bg-primary hover:bg-primary-container disabled:bg-neutral-200 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
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
  );
};

export default CustomerChatWidget;
