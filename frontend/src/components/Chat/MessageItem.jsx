import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FiCheck, FiCheckCircle, FiCornerUpRight } from 'react-icons/fi';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import VideoMessagePlayer from './VideoMessagePlayer';
import './MessageItem.scss';

const MessageItem = memo(({ 
  message, isOwn, showAvatar, showName, chatSettings, 
  onContextMenu, onAddReaction, user, isGroup 
}) => {
  const messageDate = useMemo(() => new Date(message.createdAt), [message.createdAt]);
  const isToday = useMemo(() => new Date().toDateString() === messageDate.toDateString(), [messageDate]);
  const attachments = useMemo(() => message.attachments || [], [message.attachments]);

  const formatTime = (date) => format(date, isToday ? 'HH:mm' : 'dd.MM HH:mm');

  const isRead = message.readBy?.some(r => {
    const rUserId = typeof r.user === 'object' ? r.user._id : r.user;
    return rUserId !== user?._id;
  });

  const hasUserReacted = (emoji) => {
    return message.reactions?.some(r => {
      const rUserId = typeof r.user === 'object' ? r.user._id : r.user;
      return rUserId === user?._id && r.emoji === emoji;
    });
  };

  const renderReactions = () => {
    if (!message.reactions?.length) return null;
    
    const grouped = {};
    message.reactions.forEach(r => {
      if (!grouped[r.emoji]) grouped[r.emoji] = { emoji: r.emoji, count: 0 };
      grouped[r.emoji].count++;
    });
    
    return (
      <div className="message-reactions">
        {Object.values(grouped).map((r, i) => {
          const isActive = hasUserReacted(r.emoji);
          return (
            <button 
              key={i} 
              className={`reaction-badge ${isActive ? 'active' : ''}`}
              onClick={(e) => { 
                e.stopPropagation(); 
                onAddReaction(message._id, r.emoji); 
              }}
            >
              {r.emoji} <span>{r.count}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    const att = attachments[0];

    // Текстовое сообщение
    if (message.type === 'text' || (!attachments.length && message.type !== 'voice' && message.type !== 'video_message')) {
      return (
        <div className="message__bubble">
          <div className="message__text">
            {message.content || ''}
            {message.edited && <span className="message__edited" />}
          </div>
          <div className="message__meta">
            {chatSettings.showTime && <span className="message__time">{formatTime(messageDate)}</span>}
            {isOwn && (
              <span className="message__status">
                {message.pending ? <FiCheck className="pending" /> : 
                 isRead ? <FiCheckCircle className="read" /> : <FiCheck className="delivered" />}
              </span>
            )}
          </div>
          {renderReactions()}
        </div>
      );
    }

    // Голосовое сообщение
    if (message.type === 'voice' && att) {
      return (
        <div className="media-message-wrapper">
          <VoiceMessagePlayer audioUrl={att.url} duration={att.duration} isOwn={isOwn} />
          <div className="media-meta">
            {chatSettings.showTime && <span className="message__time">{formatTime(messageDate)}</span>}
            {isOwn && (
              <span className="message__status">
                {message.pending ? <FiCheck className="pending" /> : 
                 isRead ? <FiCheckCircle className="read" /> : <FiCheck className="delivered" />}
              </span>
            )}
            {renderReactions()}
          </div>
        </div>
      );
    }

    // Видео-кружок
    if (message.type === 'video_message' && att) {
      return (
        <div className="media-message-wrapper">
          <VideoMessagePlayer videoUrl={att.url} isOwn={isOwn} duration={att.duration} />
          <div className="media-meta">
            {chatSettings.showTime && <span className="message__time">{formatTime(messageDate)}</span>}
            {renderReactions()}
          </div>
        </div>
      );
    }

    // Стикер
    if (message.type === 'sticker' && att) {
      return (
        <div className="media-message-wrapper">
          <img src={att.url} alt="Sticker" style={{ width: '128px', height: '128px', objectFit: 'contain' }} />
          <div className="media-meta">
            {chatSettings.showTime && <span className="message__time">{formatTime(messageDate)}</span>}
            {renderReactions()}
          </div>
        </div>
      );
    }

    // Одиночное изображение
    if (message.type === 'image' && attachments.length === 1 && att) {
      return (
        <div className="media-message-wrapper">
          <div className="media-container">
            <img 
              src={att.url} 
              alt="" 
              onClick={() => window.open(att.url, '_blank')} 
              style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '16px', cursor: 'pointer' }} 
            />
          </div>
          <div className="media-meta">
            {chatSettings.showTime && <span className="message__time">{formatTime(messageDate)}</span>}
            {isOwn && (
              <span className="message__status">
                {message.pending ? <FiCheck className="pending" /> : 
                 isRead ? <FiCheckCircle className="read" /> : <FiCheck className="delivered" />}
              </span>
            )}
            {renderReactions()}
          </div>
        </div>
      );
    }

    // Множественные изображения
    if (message.type === 'image' && attachments.length > 1) {
      return (
        <div className="media-message-wrapper">
          <div className={`media-grid media-grid--${Math.min(attachments.length, 4)}`}>
            {attachments.slice(0, 4).map((a, i) => (
              <div key={i} className="media-grid-item" onClick={() => window.open(a.url, '_blank')}>
                <img src={a.url} alt="" />
                {i === 3 && attachments.length > 4 && (
                  <div className="more-overlay"><span>+{attachments.length - 4}</span></div>
                )}
              </div>
            ))}
          </div>
          <div className="media-meta">
            {chatSettings.showTime && <span className="message__time">{formatTime(messageDate)}</span>}
            {isOwn && (
              <span className="message__status">
                {message.pending ? <FiCheck className="pending" /> : 
                 isRead ? <FiCheckCircle className="read" /> : <FiCheck className="delivered" />}
              </span>
            )}
            {renderReactions()}
          </div>
        </div>
      );
    }

    // Одиночное видео
    if (message.type === 'video' && attachments.length === 1 && att) {
      return (
        <div className="media-message-wrapper">
          <div className="media-container">
            <video 
              src={att.url} 
              controls 
              style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '16px' }} 
            />
          </div>
          <div className="media-meta">
            {chatSettings.showTime && <span className="message__time">{formatTime(messageDate)}</span>}
            {renderReactions()}
          </div>
        </div>
      );
    }

    // Файл
    if (message.type === 'file' && att) {
      return (
        <div className="message__bubble message__bubble--file">
          <a href={att.url} target="_blank" rel="noopener noreferrer">
            📎 {att.filename || 'Файл'}
            {att.size && <span className="file-size">({Math.round(att.size / 1024)} KB)</span>}
          </a>
          <div className="message__meta">
            {chatSettings.showTime && <span className="message__time">{formatTime(messageDate)}</span>}
          </div>
          {renderReactions()}
        </div>
      );
    }

    // Fallback
    return (
      <div className="message__bubble">
        <div className="message__text">{message.content || 'Сообщение'}</div>
        <div className="message__meta">
          {chatSettings.showTime && <span className="message__time">{formatTime(messageDate)}</span>}
        </div>
        {renderReactions()}
      </div>
    );
  };

  return (
    <motion.div
      className={`message ${isOwn ? 'message--own' : ''} ${chatSettings.compactMode ? 'message--compact' : ''} ${isGroup ? 'message--group' : ''}`}
      initial={chatSettings.animations ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.1 }}
      onContextMenu={(e) => onContextMenu(e, message)}
      id={`message-${message._id}`}
    >
      {showAvatar && isGroup && (
        <img src={message.sender?.avatar || '/default-avatar.svg'} alt="" className="message__avatar" />
      )}
      <div className="message__content">
        {showName && isGroup && <div className="message__name">{message.sender?.username}</div>}
        {message.replyTo && (
          <div className="message__reply" onClick={() => document.getElementById(`message-${message.replyTo._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            <FiCornerUpRight />
            <span>{message.replyTo.sender?.username}: {message.replyTo.content?.substring(0, 50)}</span>
          </div>
        )}
        {renderContent()}
      </div>
    </motion.div>
  );
});

MessageItem.displayName = 'MessageItem';
export default MessageItem;