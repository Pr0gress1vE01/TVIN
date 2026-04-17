import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import ChatList from '../components/Chat/ChatList';
import ChatWindow from '../components/Chat/ChatWindow';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import './Chat.scss';

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const { openProfile } = useProfile();
  
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const processedMessages = useRef(new Set());
  const currentChatIdRef = useRef(null);
  const isMounted = useRef(true);

  const chatSettings = useMemo(() => {
    const settings = user?.settings?.chat;
    const defaults = {
      background: { 
        type: 'gradient', 
        value: 'radial-gradient(circle at 30% 50%, #1a0a2e 0%, #0a0a1a 50%, #000000 100%)', 
        image: null 
      },
      background3D: { enabled: true, effect: 'particles', color: '#8B5CF6', intensity: 50 },
      bubbleRadius: 16,
      showAvatar: false,
      showTime: true,
      animations: true,
      fontSize: '15px',
      compactMode: false
    };
    return settings ? { ...defaults, ...settings } : defaults;
  }, [user]);

  useEffect(() => { 
    isMounted.current = true; 
    return () => { isMounted.current = false; }; 
  }, []);

  // Смена чата - очистка
  useEffect(() => {
    if (chatId && chatId !== currentChatIdRef.current) {
      if (currentChatIdRef.current && socket) {
        socket.emit('chat:leave', currentChatIdRef.current);
      }
      
      setMessages([]);
      processedMessages.current.clear();
      setHasMore(true);
      currentChatIdRef.current = chatId;
      setCurrentChat(null);
    }
  }, [chatId, socket]);

  useEffect(() => {
    if (chatId && window.innerWidth <= 768) setShowSidebar(false);
  }, [chatId]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setShowSidebar(true);
      else if (!chatId) setShowSidebar(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chatId]);

  useEffect(() => { fetchChats(); }, []);

  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c._id === chatId);
      if (chat) {
        setCurrentChat(chat);
        fetchMessages(chatId);
        if (socket) {
          socket.emit('chat:join', chatId);
        }
      }
    }
  }, [chatId, chats, socket]);

  // Подписка на события
  useEffect(() => {
    const handleNewMessage = (event) => {
      const message = event.detail;
      const msgChatId = message.chat?._id || message.chat;
      
      if (msgChatId === currentChatIdRef.current) {
        if (processedMessages.current.has(message._id)) return;
        processedMessages.current.add(message._id);
        
        setMessages(prev => {
          if (prev.find(m => m._id === message._id)) return prev;
          return [...prev, message].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      }
      
      setChats(prev => prev.map(chat => 
        chat._id === msgChatId ? { ...chat, lastMessage: message } : chat
      ));
    };

    const handleMessageUpdate = (event) => {
      const { messageId, reactions, message } = event.detail;
      if (currentChatIdRef.current) {
        setMessages(prev => prev.map(m => {
          if (m._id === messageId) {
            if (reactions) return { ...m, reactions };
            if (message) return { ...m, ...message };
          }
          return m;
        }));
      }
    };

    const handleMessageDelete = (event) => {
      const { messageId } = event.detail;
      processedMessages.current.delete(messageId);
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };

    const handleMessagesRead = (event) => {
      const { chatId: readChatId, userId: readerId, messageIds } = event.detail;
      if (readChatId === currentChatIdRef.current) {
        setMessages(prev => prev.map(m => {
          if (messageIds.includes(m._id)) {
            const readBy = m.readBy || [];
            if (!readBy.some(r => (r.user?._id || r.user) === readerId)) {
              return { ...m, readBy: [...readBy, { user: readerId, readAt: new Date() }] };
            }
          }
          return m;
        }));
      }
    };

    window.addEventListener('message:new', handleNewMessage);
    window.addEventListener('message:updated', handleMessageUpdate);
    window.addEventListener('message:deleted', handleMessageDelete);
    window.addEventListener('messages:read', handleMessagesRead);

    return () => {
      window.removeEventListener('message:new', handleNewMessage);
      window.removeEventListener('message:updated', handleMessageUpdate);
      window.removeEventListener('message:deleted', handleMessageDelete);
      window.removeEventListener('messages:read', handleMessagesRead);
    };
  }, []);

  // Отметка о прочтении при входе в чат
  useEffect(() => {
    if (!socket || !currentChat || messages.length === 0) return;
    
    const unreadMessages = messages.filter(m => 
      m.sender?._id !== user?._id && 
      !m.readBy?.some(r => (r.user?._id || r.user) === user?._id) &&
      !m._id?.startsWith('temp-')
    );
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(m => m._id);
      socket.emit('messages:read', { chatId: currentChat._id, messageIds });
    }
  }, [socket, currentChat, messages, user]);

  const fetchChats = async () => {
    if (!isMounted.current) return;
    try {
      setLoading(true);
      const response = await axios.get('/api/chat');
      if (isMounted.current) setChats(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching chats:', error);
      if (isMounted.current) setChats([]);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const fetchMessages = async (chatIdParam, before) => {
    if (chatIdParam !== currentChatIdRef.current) return;
    
    try {
      setMessagesLoading(true);
      const response = await axios.get(`/api/chat/${chatIdParam}/messages`);
      
      if (chatIdParam !== currentChatIdRef.current) return;
      
      const newMessages = Array.isArray(response.data) ? response.data : [];
      newMessages.forEach(msg => processedMessages.current.add(msg._id));
      
      setMessages(newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      setHasMore(newMessages.length === 50);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (chatIdParam === currentChatIdRef.current) setMessages([]);
    } finally {
      if (chatIdParam === currentChatIdRef.current) setMessagesLoading(false);
    }
  };

  const loadMoreMessages = useCallback(() => {
    if (messages.length > 0 && hasMore && !messagesLoading && currentChat) {
      const oldestMessage = messages[0];
      fetchMessages(currentChat._id, oldestMessage.createdAt);
    }
  }, [messages, hasMore, messagesLoading, currentChat]);

  const handleSelectChat = useCallback((chat) => {
    navigate(`/chat/${chat._id}`);
    if (window.innerWidth <= 768) setShowSidebar(false);
  }, [navigate]);

  const handleBackToList = () => {
    setShowSidebar(true);
    navigate('/chat');
  };

  const handleSendMessage = useCallback((content, type = 'text', attachments = [], replyToId = null) => {
    if (!currentChat || !socket || !connected) return;
    
    socket.emit('message:send', { 
      chatId: currentChat._id, 
      content, 
      type, 
      attachments, 
      replyTo: replyToId 
    });
  }, [currentChat, socket, connected]);

  const handleOpenProfile = (profileUser) => {
    if (profileUser) openProfile(profileUser);
  };

  const chatBackgroundStyle = useMemo(() => {
    const style = {};
    if (chatSettings.background?.type === 'image' && chatSettings.background?.image) {
      style.backgroundImage = `url(${chatSettings.background.image})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    } else if (chatSettings.background?.value) {
      style.background = chatSettings.background.value;
    }
    return style;
  }, [chatSettings]);

  return (
    <motion.div className="chat-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className={`chat-page__sidebar ${!showSidebar ? 'hidden' : ''}`}>
        <ChatList 
          chats={chats} 
          onSelectChat={handleSelectChat} 
          loading={loading} 
          onProfileClick={handleOpenProfile} 
        />
      </div>
      <div className="chat-page__main" style={chatBackgroundStyle}>
        {currentChat ? (
          <>
            {window.innerWidth <= 768 && !showSidebar && (
              <button className="mobile-back-btn" onClick={handleBackToList}>← Назад</button>
            )}
            <ChatWindow
              key={currentChat._id}
              chat={currentChat}
              messages={messages}
              onSendMessage={handleSendMessage}
              onLoadMore={loadMoreMessages}
              hasMore={hasMore}
              loading={messagesLoading}
              settings={chatSettings}
              onProfileClick={handleOpenProfile}
            />
          </>
        ) : (
          <div className="chat-page__empty">
            <div className="empty-state">
              <img src="/empty-chat.svg" alt="Выберите чат" />
              <h3>Выберите чат</h3>
              <p>Начните общение с друзьями</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Chat;