import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { FiMessageCircle } from 'react-icons/fi';
import ChatListItem from './ChatListItem';
import ChatListHeader from './ChatListHeader';
import ChatListSearch from './ChatListSearch';
import ChatListFolders from './ChatListFolders';
import ChatContextMenu from './ChatContextMenu';
import NewChatModal from './NewChatModal';
import CreateGroupModal from './CreateGroupModal';
import ChatListSkeleton from './ChatListSkeleton';
import './ChatList.scss';

const ChatList = ({ chats = [], onSelectChat, loading, onProfileClick }) => {
  const { user } = useAuth();
  const { socket, connected, requestContactsStatus } = useSocket();
  const navigate = useNavigate();
  const { chatId: currentChatId } = useParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFolder, setActiveFolder] = useState('all');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [pinnedChats, setPinnedChats] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [reactionNotifications, setReactionNotifications] = useState({});
  const [typingChats, setTypingChats] = useState(new Set());
  const [mutedChats, setMutedChats] = useState(new Set());
  const [localChats, setLocalChats] = useState([]);
  
  const processedMessages = useRef(new Set());
  const typingTimeouts = useRef(new Map());

  useEffect(() => {
    try {
      const savedPinned = localStorage.getItem('pinnedChats');
      if (savedPinned) setPinnedChats(new Set(JSON.parse(savedPinned)));
      const savedMuted = localStorage.getItem('mutedChats');
      if (savedMuted) setMutedChats(new Set(JSON.parse(savedMuted)));
    } catch (error) {}
  }, []);

  useEffect(() => { 
    if (connected) requestContactsStatus(); 
  }, [connected, requestContactsStatus]);
  
  useEffect(() => { 
    if (Array.isArray(chats)) setLocalChats(chats); 
  }, [chats]);

  // Подписка на события
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (event) => {
      const message = event.detail;
      const msgChatId = message.chat?._id || message.chat;
      
      if (msgChatId !== currentChatId) {
        setUnreadCounts(prev => ({
          ...prev,
          [msgChatId]: (prev[msgChatId] || 0) + 1
        }));
      }
      
      setLocalChats(prev => prev.map(chat => 
        chat._id === msgChatId ? { ...chat, lastMessage: message } : chat
      ));
    };

    const handleChatUpdate = (event) => {
      const { chatId: updatedChatId, lastMessage } = event.detail;
      setLocalChats(prev => prev.map(chat => 
        chat._id === updatedChatId ? { ...chat, lastMessage } : chat
      ));
    };

    const handleMessagesRead = (event) => {
      const { chatId: readChatId } = event.detail;
      setUnreadCounts(prev => ({ ...prev, [readChatId]: 0 }));
    };

    const handleChatReaction = (event) => {
      const { chatId: reactionChatId } = event.detail;
      if (reactionChatId !== currentChatId) {
        setReactionNotifications(prev => ({ ...prev, [reactionChatId]: true }));
      }
    };

    const handleUserTyping = (event) => {
      const { userId: typingUserId, chatId, isTyping } = event.detail;
      
      if (typingUserId === user?._id) return;
      
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

    window.addEventListener('message:new', handleNewMessage);
    window.addEventListener('chat:update', handleChatUpdate);
    window.addEventListener('messages:read', handleMessagesRead);
    window.addEventListener('chat:reaction', handleChatReaction);
    window.addEventListener('user:typing', handleUserTyping);

    return () => {
      window.removeEventListener('message:new', handleNewMessage);
      window.removeEventListener('chat:update', handleChatUpdate);
      window.removeEventListener('messages:read', handleMessagesRead);
      window.removeEventListener('chat:reaction', handleChatReaction);
      window.removeEventListener('user:typing', handleUserTyping);
      
      typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
      typingTimeouts.current.clear();
    };
  }, [socket, currentChatId, user]);

  const sortChats = useCallback((chatsToSort) => {
    if (!Array.isArray(chatsToSort)) return [];
    return [...chatsToSort].sort((a, b) => {
      if (pinnedChats.has(a._id) && !pinnedChats.has(b._id)) return -1;
      if (!pinnedChats.has(a._id) && pinnedChats.has(b._id)) return 1;
      return new Date(b.lastMessage?.createdAt || b.updatedAt || 0) - 
             new Date(a.lastMessage?.createdAt || a.updatedAt || 0);
    });
  }, [pinnedChats]);

  const getChatName = useCallback((chat) => {
    if (!chat) return '';
    if (chat.type === 'direct') { 
      const other = chat.participants?.find(p => p.user?._id !== user?._id)?.user; 
      return `${other?.firstName || ''} ${other?.lastName || ''}`.trim() || other?.username || ''; 
    }
    return chat.name || '';
  }, [user]);

  const filteredChats = useMemo(() => {
    if (!Array.isArray(localChats)) return [];
    let filtered = [...localChats];
    if (searchTerm) filtered = filtered.filter(chat => getChatName(chat).toLowerCase().includes(searchTerm.toLowerCase()));
    if (activeFolder === 'unread') filtered = filtered.filter(chat => (unreadCounts[chat._id] || 0) > 0);
    return sortChats(filtered);
  }, [localChats, searchTerm, activeFolder, unreadCounts, sortChats, getChatName]);

  const handleSelectChat = useCallback((chat) => {
    onSelectChat(chat);
    setUnreadCounts(prev => ({ ...prev, [chat._id]: 0 }));
    setReactionNotifications(prev => ({ ...prev, [chat._id]: false }));
  }, [onSelectChat]);

  const handleContextMenu = useCallback((e, chat) => { 
    e.preventDefault(); 
    setContextMenu({ x: e.clientX, y: e.clientY, chat }); 
  }, []);
  
  const handlePinChat = useCallback((chatId) => { 
    setPinnedChats(prev => { 
      const newSet = new Set(prev); 
      newSet.has(chatId) ? newSet.delete(chatId) : newSet.add(chatId); 
      localStorage.setItem('pinnedChats', JSON.stringify([...newSet])); 
      return newSet; 
    }); 
  }, []);
  
  const handleMuteChat = useCallback((chatId) => { 
    setMutedChats(prev => { 
      const newSet = new Set(prev); 
      newSet.has(chatId) ? newSet.delete(chatId) : newSet.add(chatId); 
      localStorage.setItem('mutedChats', JSON.stringify([...newSet])); 
      return newSet; 
    }); 
  }, []);
  
  const handleDeleteChat = useCallback(async (chatId) => { 
    if (!window.confirm('Удалить чат?')) return; 
    try { 
      await axios.delete(`/api/chat/${chatId}`); 
      setLocalChats(prev => prev.filter(c => c._id !== chatId)); 
    } catch (error) { 
      console.error('Error deleting chat:', error); 
    } 
  }, []);
  
  const handleMarkAsRead = useCallback((chatId) => { 
    setUnreadCounts(prev => ({ ...prev, [chatId]: 0 })); 
  }, []);

  const totalUnread = useMemo(() => Object.values(unreadCounts).reduce((a, b) => a + b, 0), [unreadCounts]);

  return (
    <div className="chat-list" onClick={() => setContextMenu(null)}>
      <ChatListHeader 
        totalUnread={totalUnread} 
        onNewChat={() => setShowNewChatModal(true)} 
        onNewGroup={() => setShowGroupModal(true)} 
        onAddContact={() => navigate('/contacts')} 
      />
      <ChatListSearch value={searchTerm} onChange={setSearchTerm} />
      <ChatListFolders activeFolder={activeFolder} onSelectFolder={setActiveFolder} unreadCount={totalUnread} />
      
      <div className="chat-list__items">
        <AnimatePresence>
          {loading ? <ChatListSkeleton /> : filteredChats.length === 0 ? (
            <div className="chat-list__empty">
              <FiMessageCircle size={48} />
              <p>Нет чатов</p>
              <button className="btn-primary" onClick={() => setShowNewChatModal(true)}>Начать общение</button>
            </div>
          ) : (
            filteredChats.map(chat => (
              <ChatListItem
                key={chat._id}
                chat={chat}
                user={user}
                isActive={currentChatId === chat._id}
                unreadCount={unreadCounts[chat._id] || 0}
                hasReaction={reactionNotifications[chat._id] || false}
                isTyping={typingChats.has(chat._id)}
                isPinned={pinnedChats.has(chat._id)}
                isMuted={mutedChats.has(chat._id)}
                onSelect={handleSelectChat}
                onContextMenu={handleContextMenu}
                onProfileClick={onProfileClick}
              />
            ))
          )}
        </AnimatePresence>
      </div>
      
      <ChatContextMenu 
        contextMenu={contextMenu} 
        onClose={() => setContextMenu(null)} 
        onPin={handlePinChat} 
        onMute={handleMuteChat} 
        onMarkRead={handleMarkAsRead} 
        onDelete={handleDeleteChat} 
        pinnedChats={pinnedChats} 
        mutedChats={mutedChats} 
      />
      <NewChatModal 
        isOpen={showNewChatModal} 
        onClose={() => setShowNewChatModal(false)} 
        onSelectUser={async (userId) => { 
          try { 
            const response = await axios.post('/api/chat/direct', { userId }); 
            onSelectChat(response.data); 
            setShowNewChatModal(false); 
          } catch (error) { 
            console.error('Error creating chat:', error); 
          } 
        }} 
      />
      <CreateGroupModal 
        isOpen={showGroupModal} 
        onClose={() => setShowGroupModal(false)} 
        onCreate={(groupChat) => { 
          onSelectChat(groupChat); 
          setShowGroupModal(false); 
        }} 
      />
    </div>
  );
};

export default React.memo(ChatList);