import React, { useMemo, useEffect, useState, useRef } from 'react'; // ✅ Добавлен useRef
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FiUsers, FiCheck, FiCheckCircle, FiHeart } from 'react-icons/fi';
import './ChatListItem.scss';

const PinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
  </svg>
);

const ChatListItem = ({ 
  chat, 
  user, 
  isActive, 
  unreadCount, 
  hasReaction, 
  isTyping: externalIsTyping,
  isPinned, 
  isMuted, 
  onSelect, 
  onContextMenu, 
  onProfileClick 
}) => {
  const [localUnread, setLocalUnread] = useState(unreadCount);
  const [localTyping, setLocalTyping] = useState(externalIsTyping);
  const [localHasReaction, setLocalHasReaction] = useState(hasReaction);
  const [localLastMessage, setLocalLastMessage] = useState(chat.lastMessage);
  const [onlineStatus, setOnlineStatus] = useState(false);
  const [typingChats, setTypingChats] = useState(new Set());
  const typingTimeouts = useRef(new Map());

  const { name, avatar, otherUserId, isGroup } = useMemo(() => {
    if (chat.type === 'direct') {
      const other = chat.participants?.find(p => p.user?._id !== user?._id)?.user;
      return {
        name: `${other?.firstName || ''} ${other?.lastName || ''}`.trim() || other?.username,
        avatar: other?.avatar || '/default-avatar.svg',
        otherUserId: other?._id,
        isGroup: false
      };
    }
    return {
      name: chat.name,
      avatar: chat.avatar || '/default-avatar.svg',
      otherUserId: null,
      isGroup: true
    };
  }, [chat, user]);

  // Мгновенное обновление при изменении пропсов
  useEffect(() => {
    setLocalUnread(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    setLocalTyping(externalIsTyping);
  }, [externalIsTyping]);

  useEffect(() => {
    setLocalHasReaction(hasReaction);
  }, [hasReaction]);

  useEffect(() => {
    setLocalLastMessage(chat.lastMessage);
  }, [chat.lastMessage]);

  // Подписка на события статусов
  useEffect(() => {
    if (!otherUserId) return;

    const handleUserOnline = (event) => {
      const { userId: onlineUserId } = event.detail;
      if (onlineUserId === otherUserId) {
        setOnlineStatus(true);
      }
    };
    
    const handleUserOffline = (event) => {
      const { userId: offlineUserId } = event.detail;
      if (offlineUserId === otherUserId) {
        setOnlineStatus(false);
      }
    };

    const handleMessageRead = (event) => {
      const { chatId: readChatId, messageIds } = event.detail;
      if (readChatId === chat._id && localLastMessage && messageIds.includes(localLastMessage._id)) {
        setLocalLastMessage(prev => ({
          ...prev,
          readBy: [...(prev.readBy || []), { user: event.detail.userId }]
        }));
      }
      if (readChatId === chat._id) {
        setLocalUnread(0);
      }
    };

    const handleChatUpdate = (event) => {
      const { chatId: updatedChatId, lastMessage } = event.detail;
      if (updatedChatId === chat._id && lastMessage) {
        setLocalLastMessage(lastMessage);
      }
    };

    const handleReactionEvent = (event) => {
      const { chatId: reactionChatId } = event.detail;
      if (reactionChatId === chat._id) {
        setLocalHasReaction(true);
      }
    };

    const handleNewMessage = (event) => {
      const message = event.detail;
      const msgChatId = message.chat?._id || message.chat;
      if (msgChatId === chat._id) {
        setLocalLastMessage(message);
        if (!isActive) {
          setLocalUnread(prev => prev + 1);
        }
      }
    };

        const handleUserTyping = (event) => {
      const { userId: typingUserId, chatId, isTyping } = event.detail;
      
      if (typingUserId === user?._id) return; // Игнорируем свою печать
      
      const key = `${chatId}:${typingUserId}`;
      
      if (typingTimeouts.current.has(key)) {
        clearTimeout(typingTimeouts.current.get(key));
        typingTimeouts.current.delete(key);
      }
      
      if (isTyping) {
        setTypingChats(prev => new Set(prev).add(chatId));
        
        const timeout = setTimeout(() => {
          setTypingChats(prev => {
            const newSet = new Set(prev);
            newSet.delete(chatId);
            return newSet;
          });
        }, 3000);
        
        typingTimeouts.current.set(key, timeout);
      } else {
        setTypingChats(prev => {
          const newSet = new Set(prev);
          newSet.delete(chatId);
          return newSet;
        });
      }
    };

    window.addEventListener('user:online', handleUserOnline);
    window.addEventListener('user:offline', handleUserOffline);
    window.addEventListener('user:typing', handleUserTyping);
    window.addEventListener('messages:read', handleMessageRead);
    window.addEventListener('chat:update', handleChatUpdate);
    window.addEventListener('chat:reaction', handleReactionEvent);
    window.addEventListener('message:new', handleNewMessage);

    return () => {
      window.removeEventListener('user:online', handleUserOnline);
      window.removeEventListener('user:offline', handleUserOffline);
      window.removeEventListener('user:typing', handleUserTyping);
      window.removeEventListener('messages:read', handleMessageRead);
      window.removeEventListener('chat:update', handleChatUpdate);
      window.removeEventListener('chat:reaction', handleReactionEvent);
      window.removeEventListener('message:new', handleNewMessage);
    };
  }, [otherUserId, chat._id, isActive, localLastMessage]);

  const lastMessagePreview = useMemo(() => {
    const msg = localLastMessage;
    if (!msg) return '';
    
    const prefix = msg.sender?._id === user?._id ? 'Вы: ' : '';
    
    switch (msg.type) {
      case 'image': return `${prefix}📷 Фото`;
      case 'video': return `${prefix}🎥 Видео`;
      case 'voice': return `${prefix}🎤 Голосовое`;
      case 'video_message': return `${prefix}📹 Видеосообщение`;
      case 'sticker': return `${prefix}🎯 Стикер`;
      case 'file': return `${prefix}📎 Файл`;
      default: return `${prefix}${msg.content || ''}`;
    }
  }, [localLastMessage, user]);

  const messageStatus = useMemo(() => {
    const msg = localLastMessage;
    if (!msg || msg.sender?._id !== user?._id) return null;
    
    const isRead = msg.readBy?.some(r => {
      const rUserId = typeof r.user === 'object' ? r.user._id : r.user;
      return rUserId !== user?._id;
    });
    
    return isRead ? <FiCheckCircle className="read" /> : <FiCheck className="sent" />;
  }, [localLastMessage, user]);

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    if (!isGroup && otherUserId) {
      onProfileClick?.({ _id: otherUserId, username: name, avatar });
    }
  };

  const handleClick = () => {
    setLocalUnread(0);
    setLocalHasReaction(false);
    onSelect(chat);
  };

  return (
    <motion.div
      className={`chat-item ${isActive ? 'active' : ''} ${isPinned ? 'pinned' : ''} ${localUnread > 0 ? 'unread' : ''}`}
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu(e, chat)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="chat-item__avatar" onClick={handleAvatarClick}>
        <img src={avatar} alt={name} />
        {isGroup && <span className="group-badge"><FiUsers /></span>}
        {onlineStatus && !localTyping && <span className="online-indicator" />}
        {localTyping && <span className="typing-indicator" />}
        {isPinned && <span className="pinned-indicator"><PinIcon /></span>}
      </div>
      
      <div className="chat-item__content">
        <div className="chat-item__header">
          <span className="chat-item__name">{name}</span>
          {localLastMessage && (
            <span className="chat-item__time">
              {format(new Date(localLastMessage.createdAt), 'HH:mm')}
            </span>
          )}
        </div>
        
        <div className="chat-item__preview">
          {localTyping ? (
            <span className="typing-text">Печатает...</span>
          ) : (
            <>
              <span className="last-message">{lastMessagePreview}</span>
              <span className="preview-indicators">
                {localHasReaction && <FiHeart className="reaction-indicator" />}
                {!isMuted && localUnread > 0 && (
                  <span className="unread-badge">{localUnread > 99 ? '99+' : localUnread}</span>
                )}
                {messageStatus && (
                  <span className="message-status">{messageStatus}</span>
                )}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(ChatListItem);