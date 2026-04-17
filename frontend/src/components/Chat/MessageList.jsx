import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import MessageItem from './MessageItem';
import MessageContextMenu from './MessageContextMenu';
import ReactionPanel from './ReactionPanel';
import ForwardModal from './ForwardModal';
import './MessageList.scss';

const QUICK_REACTIONS = ['👍', '❤️', '😊', '😢', '😮', '👏'];

const MessageList = forwardRef(({ 
  messages = [], onLoadMore, hasMore, chatId, settings = {}, onReply, onEdit, onPin,
  onVisibleRangeChange, isGroup = false
}, ref) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [contextMenu, setContextMenu] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const virtuosoRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevMessagesLength = useRef(messages.length);
  const lastMessageIdRef = useRef(null);
  const currentChatIdRef = useRef(chatId);

  useImperativeHandle(ref, () => ({
    scrollToIndex: (index) => virtuosoRef.current?.scrollToIndex({ index, align: 'center', behavior: 'smooth' }),
    scrollToBottom: () => virtuosoRef.current?.scrollToIndex({ index: localMessages.length - 1, align: 'end', behavior: 'auto' })
  }));

  useEffect(() => {
    if (chatId !== currentChatIdRef.current) {
      setLocalMessages([]);
      currentChatIdRef.current = chatId;
    }
  }, [chatId]);

  useEffect(() => {
    if (!Array.isArray(messages)) return;
    
    setLocalMessages(prev => {
      const messageMap = new Map();
      prev.forEach(msg => { if (msg) messageMap.set(msg._id, msg); });
      messages.forEach(msg => { if (msg) messageMap.set(msg._id, msg); });
      return Array.from(messageMap.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
  }, [messages]);

  // Автоскролл при новом сообщении
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      const lastMessage = messages[messages.length - 1];
      const isNewMessage = lastMessage?._id !== lastMessageIdRef.current;
      const isOwnMessage = lastMessage?.sender?._id === user?._id;
      
      if (isNewMessage) {
        lastMessageIdRef.current = lastMessage?._id;
        
        // Скроллим если своё сообщение или мы внизу
        if (isOwnMessage || isAtBottom) {
          setTimeout(() => {
            virtuosoRef.current?.scrollToIndex({
              index: messages.length - 1,
              align: 'end',
              behavior: 'smooth'
            });
          }, 50);
        }
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length, isAtBottom, user]);

  const chatSettings = useMemo(() => ({ 
    showAvatar: true, showTime: true, bubbleRadius: 16, fontSize: '15px', 
    compactMode: false, animations: true, ...settings 
  }), [settings]);

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.5 });

  useEffect(() => {
    if (inView && hasMore) onLoadMore();
  }, [inView, hasMore, onLoadMore]);

  // Закрытие меню при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.message-context-menu') && !e.target.closest('.reactions-panel')) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Подписка на события сокета
  useEffect(() => {
    if (!socket) return;

    const handleMessageDeleted = (event) => {
      const { messageId } = event.detail;
      setLocalMessages(prev => prev.filter(m => m._id !== messageId));
    };

    const handleMessageUpdated = (event) => {
      const { messageId, reactions, message } = event.detail;
      setLocalMessages(prev => prev.map(m => {
        if (m._id === messageId) {
          if (reactions) return { ...m, reactions };
          if (message) return { ...m, ...message };
        }
        return m;
      }));
    };

    window.addEventListener('message:deleted', handleMessageDeleted);
    window.addEventListener('message:updated', handleMessageUpdated);

    return () => {
      window.removeEventListener('message:deleted', handleMessageDeleted);
      window.removeEventListener('message:updated', handleMessageUpdated);
    };
  }, [socket]);

  const handleContextMenu = useCallback((e, message) => {
    e.preventDefault(); 
    e.stopPropagation();
    setContextMenu({ 
      x: Math.min(e.clientX, window.innerWidth - 250), 
      y: Math.min(e.clientY, window.innerHeight - 350), 
      message 
    });
  }, []);

  const handleAddReaction = useCallback((messageId, emoji) => {
    socket.emit('message:react', { messageId, emoji });
  }, [socket]);

  const handleDelete = useCallback((messageId) => {
    socket.emit('message:delete', { messageId });
    setLocalMessages(prev => prev.filter(m => m._id !== messageId));
    setContextMenu(null);
  }, [socket]);

  const handleQuickReaction = useCallback((emoji) => {
    if (contextMenu) {
      handleAddReaction(contextMenu.message._id, emoji);
      setContextMenu(null);
    }
  }, [contextMenu, handleAddReaction]);

  const renderMessage = useCallback((index, message) => {
    if (!message) return null;
    
    const isOwn = message.sender?._id === user?._id;
    const prev = localMessages[index - 1], next = localMessages[index + 1];
    const showAvatar = isGroup && chatSettings.showAvatar && !isOwn && (!next || next.sender?._id !== message.sender?._id);
    const showName = isGroup && !isOwn && (!prev || prev.sender?._id !== message.sender?._id);

    return (
      <React.Fragment key={message._id}>
        <MessageItem 
          message={message} 
          isOwn={isOwn} 
          showAvatar={showAvatar} 
          showName={showName} 
          chatSettings={chatSettings} 
          onContextMenu={handleContextMenu} 
          onAddReaction={handleAddReaction} 
          user={user} 
          isGroup={isGroup} 
        />
        <div ref={index === localMessages.length - 1 ? loadMoreRef : null} className="message-observer" />
      </React.Fragment>
    );
  }, [localMessages, chatSettings, user, handleContextMenu, handleAddReaction, isGroup]);

  if (!localMessages?.length) {
    return <div className="message-list"><div className="messages-start"><span>Нет сообщений</span></div></div>;
  }

  return (
    <>
      <div className="message-list">
        <Virtuoso 
          ref={virtuosoRef} 
          data={localMessages} 
          itemContent={renderMessage}
          atBottomStateChange={(atBottom) => setIsAtBottom(atBottom)}
          followOutput="auto" 
          alignToBottom 
          initialTopMostItemIndex={localMessages.length - 1}
          increaseViewportBy={{ top: 200, bottom: 200 }}
          computeItemKey={(index) => localMessages[index]?._id || index}
          components={{ 
            Header: () => !hasMore ? <div className="messages-start"><span>Начало переписки</span></div> : null, 
            Footer: () => <div className="messages-footer" /> 
          }} 
        />
        
        <AnimatePresence>
          {contextMenu && (
            <>
              <ReactionPanel 
                position={{ x: contextMenu.x, y: contextMenu.y - 60 }} 
                onSelect={(emoji) => { handleAddReaction(contextMenu.message._id, emoji); setContextMenu(null); }} 
              />
              <MessageContextMenu 
                position={{ x: contextMenu.x, y: contextMenu.y }} 
                message={contextMenu.message} 
                user={user}
                onReply={() => { onReply?.(contextMenu.message); setContextMenu(null); }}
                onEdit={() => { onEdit?.(contextMenu.message); setContextMenu(null); }}
                onPin={() => { 
                  socket.emit('message:pin', { messageId: contextMenu.message._id, chatId }); 
                  onPin?.(); 
                  setContextMenu(null); 
                }}
                onDelete={() => handleDelete(contextMenu.message._id)}
                onForward={() => { setForwardMessage(contextMenu.message); setShowForwardModal(true); setContextMenu(null); }}
                onCopy={() => { 
                  if (contextMenu.message.type === 'text') navigator.clipboard?.writeText(contextMenu.message.content); 
                  setContextMenu(null); 
                }}
                onClose={() => setContextMenu(null)} 
              />
            </>
          )}
        </AnimatePresence>
      </div>
      <ForwardModal 
        isOpen={showForwardModal} 
        onClose={() => { setShowForwardModal(false); setForwardMessage(null); }} 
        message={forwardMessage} 
      />
    </>
  );
});

MessageList.displayName = 'MessageList';
export default MessageList;