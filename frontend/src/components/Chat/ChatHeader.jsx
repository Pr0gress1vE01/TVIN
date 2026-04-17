import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import MessageSearch from './MessageSearch';
import { 
  FiSearch, FiPhone, FiVideo, FiMoreVertical,
  FiUser, FiBell, FiTrash2, FiLogOut, FiX
} from 'react-icons/fi';
import './ChatHeader.scss';

const ChatHeader = ({ chat, onJumpToMessage, onProfileClick }) => {
  const { user } = useAuth();
  const { socket, connected, isUserOnline, getUserStatus, requestUserStatus } = useSocket();
  const navigate = useNavigate();
  
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const otherUser = useMemo(() => {
    if (chat?.type === 'direct') {
      return chat.participants?.find(p => p.user?._id !== user?._id)?.user;
    }
    return null;
  }, [chat, user]);

  // Получение печати от других
  useEffect(() => {
    if (!socket) return;
    
    const handleTyping = ({ userId, isTyping: typing }) => {
      if (userId === otherUser?._id) {
        setIsTyping(typing);
      }
    };
    
    socket.on('user:typing', handleTyping);
    return () => socket.off('user:typing', handleTyping);
  }, [socket, otherUser]);

  // Обновление статуса
  useEffect(() => {
    if (!otherUser || !connected) {
      if (chat?.type === 'group') {
        setStatusText(`${chat.participants?.length || 0} участников`);
      }
      return;
    }

    const updateStatus = () => {
      requestUserStatus(otherUser._id);
      
      const online = isUserOnline(otherUser._id);
      
      if (online) {
        setStatusText('онлайн');
      } else {
        const status = getUserStatus(otherUser._id);
        if (status?.lastSeen) {
          const diff = Math.floor((Date.now() - new Date(status.lastSeen)) / 1000);
          if (diff < 60) setStatusText('был(а) только что');
          else if (diff < 3600) setStatusText(`был(а) ${Math.floor(diff / 60)} мин назад`);
          else if (diff < 86400) setStatusText(`был(а) ${Math.floor(diff / 3600)} ч назад`);
          else setStatusText(new Date(status.lastSeen).toLocaleDateString('ru-RU'));
        } else {
          setStatusText('не в сети');
        }
      }
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 3000);
    
    return () => clearInterval(interval);
  }, [otherUser, connected, requestUserStatus, isUserOnline, getUserStatus, chat]);

  const online = otherUser ? isUserOnline(otherUser._id) : false;

  const chatInfo = useMemo(() => {
    if (chat?.type === 'direct' && otherUser) {
      return {
        name: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.username,
        avatar: otherUser.avatar || '/default-avatar.svg',
        isGroup: false,
        otherUserId: otherUser._id
      };
    }
    return {
      name: chat?.name || 'Группа',
      avatar: chat?.avatar || '/default-avatar.svg',
      isGroup: true,
      membersCount: chat?.participants?.length || 0
    };
  }, [chat, otherUser]);

  const handleProfileClick = useCallback(() => {
    if (chat?.type === 'direct' && otherUser && onProfileClick) {
      onProfileClick(otherUser);
    }
  }, [chat, otherUser, onProfileClick]);

  const handleClearHistory = useCallback(async () => {
    if (!window.confirm('Очистить историю сообщений?')) return;
    try {
      setShowMenu(false);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, []);

  const handleLeaveGroup = useCallback(async () => {
    if (!window.confirm('Покинуть группу?')) return;
    try {
      setShowMenu(false);
      navigate('/chat');
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  }, [navigate]);

  // Отправка печати
  const handleTyping = () => {
  if (!socket || !chatId) return;
  
  socket.emit('typing:start', { chatId });
  
  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  typingTimeoutRef.current = setTimeout(() => {
    socket.emit('typing:stop', { chatId });
  }, 3000);
};

  const displayStatus = isTyping ? 'печатает...' : statusText;

  return (
    <>
      <div className="chat-header">
        <div className="chat-header__info" onClick={handleProfileClick}>
          <div className="chat-header__avatar">
            <img src={chatInfo.avatar} alt={chatInfo.name} />
            {online && !isTyping && <span className="online-indicator" />}
            {isTyping && <span className="typing-indicator-dot" />}
          </div>
          
          <div className="chat-header__details">
            <h3 className="chat-header__name">{chatInfo.name}</h3>
            <p className={`chat-header__status ${isTyping ? 'typing' : ''}`}>
              {displayStatus || (chatInfo.isGroup ? `${chatInfo.membersCount} участников` : '')}
            </p>
          </div>
        </div>

        <div className="chat-header__actions">
          <button className="icon-button" title="Поиск" onClick={() => setShowSearch(!showSearch)}>
            {showSearch ? <FiX /> : <FiSearch />}
          </button>
          <button className="icon-button" title="Звонок"><FiPhone /></button>
          <button className="icon-button" title="Видеозвонок"><FiVideo /></button>
          
          <div className="menu-container">
            <button className="icon-button" onClick={() => setShowMenu(!showMenu)}>
              <FiMoreVertical />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  className="chat-menu"
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  onClick={() => setShowMenu(false)}
                >
                  {!chatInfo.isGroup && (
                    <button onClick={handleProfileClick}><FiUser /> Профиль</button>
                  )}
                  <button><FiBell /> Уведомления</button>
                  <button onClick={() => { setShowSearch(true); setShowMenu(false); }}>
                    <FiSearch /> Поиск
                  </button>
                  <button className="danger" onClick={handleClearHistory}>
                    <FiTrash2 /> Очистить историю
                  </button>
                  {chatInfo.isGroup && (
                    <button className="danger" onClick={handleLeaveGroup}>
                      <FiLogOut /> Покинуть группу
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSearch && (
          <MessageSearch
            chatId={chat?._id}
            onClose={() => setShowSearch(false)}
            onJumpToMessage={onJumpToMessage}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(ChatHeader);