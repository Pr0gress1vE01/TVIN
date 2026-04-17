import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import PinnedMessage from './PinnedMessage';
import axios from 'axios';
import './ChatWindow.scss';

const Background3DEffects = React.memo(({ settings }) => {
  if (!settings?.background3D?.enabled || settings?.background3D?.effect === 'none') return null;
  const effectColor = settings.background3D.color || '#8B5CF6';
  const intensity = (settings.background3D.intensity || 50) / 100;

  switch (settings.background3D.effect) {
    case 'particles':
      return (
        <div className="bg-effect-particles" style={{ opacity: intensity }}>
          {[...Array(30)].map((_, i) => (
            <div key={i} className="particle" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, 
              animationDelay: `${Math.random() * 10}s`, background: effectColor, boxShadow: `0 0 ${10 + Math.random() * 20}px ${effectColor}` }} />
          ))}
        </div>
      );
    case 'stars':
      return (
        <div className="bg-effect-stars" style={{ opacity: intensity }}>
          {[...Array(50)].map((_, i) => (
            <div key={i} className="star" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, 
              animationDelay: `${Math.random() * 5}s`, boxShadow: `0 0 ${5 + Math.random() * 15}px ${effectColor}` }} />
          ))}
        </div>
      );
    case 'waves':
      return <div className="bg-effect-waves" style={{ opacity: intensity * 0.3, background: `repeating-linear-gradient(transparent 0px, ${effectColor}20 2px, transparent 4px)` }} />;
    case 'neon':
      return <div className="bg-effect-neon" style={{ opacity: intensity }}><div className="neon-glow" style={{ boxShadow: `0 0 100px ${effectColor}`, background: `radial-gradient(circle at 50% 50%, ${effectColor}30 0%, transparent 70%)` }} /></div>;
    default:
      return null;
  }
});
Background3DEffects.displayName = 'Background3DEffects';

const ChatWindow = ({ chat, messages = [], onSendMessage, onLoadMore, hasMore, loading, settings = {}, onProfileClick }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [currentPinned, setCurrentPinned] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messageListRef = useRef(null);

  const backgroundStyle = useMemo(() => {
    const style = {};
    if (settings.background?.type === 'image' && settings.background?.image) {
      style.backgroundImage = `url(${settings.background.image})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    } else if (settings.background?.value) {
      style.background = settings.background.value;
    } else {
      style.background = 'radial-gradient(circle at 30% 50%, #1a0a2e 0%, #0a0a1a 50%, #000000 100%)';
    }
    return style;
  }, [settings.background]);

  useEffect(() => { if (chat) fetchPinnedMessages(); }, [chat]);

  // Подписка на закрепление/открепление
useEffect(() => {
  const handleMessagePinned = (event) => {
    const { chatId: pinnedChatId } = event.detail;
    if (pinnedChatId === chat?._id) {
      fetchPinnedMessages();
    }
  };
  
  const handleMessageUnpinned = (event) => {
    const { chatId: unpinnedChatId } = event.detail;
    if (unpinnedChatId === chat?._id) {
      fetchPinnedMessages();
    }
  };
  
  window.addEventListener('message:pinned', handleMessagePinned);
  window.addEventListener('message:unpinned', handleMessageUnpinned);
  
  return () => {
    window.removeEventListener('message:pinned', handleMessagePinned);
    window.removeEventListener('message:unpinned', handleMessageUnpinned);
  };
}, [chat]);

  const fetchPinnedMessages = async () => {
    if (!chat?._id) return;
    try {
      const response = await axios.get(`/api/chat/${chat._id}/pinned`);
      const validPinned = response.data.filter(msg => msg && !msg.deleted);
      setPinnedMessages(validPinned);
      if (validPinned.length > 0) setCurrentPinned(validPinned[0]);
    } catch (error) { console.error('Error fetching pinned messages:', error); }
  };

  const handleTyping = useCallback(() => {
    if (!isTyping) { setIsTyping(true); socket?.emit('typing:start', { chatId: chat._id }); }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { setIsTyping(false); socket?.emit('typing:stop', { chatId: chat._id }); }, 1000);
  }, [isTyping, socket, chat]);

  const handleReply = useCallback((message) => { setReplyingTo(message); setEditingMessage(null); }, []);
  const handleEdit = useCallback((message) => { setEditingMessage(message); setReplyingTo(null); }, []);
  const handleUnpin = useCallback(async (messageId) => {
    try { await axios.delete(`/api/messages/${messageId}/pin`); socket?.emit('message:unpin', { messageId, chatId: chat._id }); fetchPinnedMessages(); } 
    catch (error) { console.error('Error unpinning message:', error); }
  }, [socket, chat]);
  const handleJumpToPinned = useCallback((message) => {
    const element = document.getElementById(`message-${message._id}`);
    if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); element.classList.add('highlighted'); setTimeout(() => element.classList.remove('highlighted'), 2000); }
  }, []);
  const handleSendMessage = useCallback((content, type, attachments, replyToId) => {
    const messageData = { chatId: chat._id, content, type, attachments };
    if (replyToId) messageData.replyTo = replyToId;
    if (editingMessage) { socket?.emit('message:edit', { messageId: editingMessage._id, content }); setEditingMessage(null); } 
    else { socket?.emit('message:send', messageData); }
    setReplyingTo(null);
  }, [chat, socket, editingMessage]);

  return (
    <div className="chat-window" style={backgroundStyle}>
      <Background3DEffects settings={settings} />
      <ChatHeader chat={chat} onProfileClick={onProfileClick} />
      {currentPinned && (
        <PinnedMessage
          message={currentPinned}
          onUnpin={() => handleUnpin(currentPinned._id)}
          onClick={() => handleJumpToPinned(currentPinned)}
        />
      )}
      <div className="chat-window__messages">
        {/* ВАЖНО: key заставляет компонент полностью пересоздаться при смене чата */}
        <MessageList
          key={chat?._id}
          ref={messageListRef}
          messages={messages}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          chatId={chat?._id}
          settings={settings}
          onReply={handleReply}
          onEdit={handleEdit}
          onPin={fetchPinnedMessages}
        />
        {loading && (
          <div className="chat-window__loading">
            <div className="spinner" />
          </div>
        )}
      </div>
      <MessageInput
        key={`input-${chat?._id}`}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        chatId={chat?._id}
        replyTo={replyingTo}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
};

export default React.memo(ChatWindow);