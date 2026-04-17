import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import './PinnedMessage.scss';

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
  </svg>
);

const PinnedMessage = ({ message, onUnpin, onClick }) => {
  if (!message) return null;

  const getPreview = () => {
    if (!message) return '';
    if (message.type === 'image') return '📷 Фото';
    if (message.type === 'video') return '🎥 Видео';
    if (message.type === 'voice') return '🎤 Голосовое';
    if (message.type === 'video_message') return '📹 Видеосообщение';
    if (message.type === 'sticker') return '🎯 Стикер';
    if (message.type === 'file') return '📎 Файл';
    return message.content || '';
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="pinned-bar"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <div className="pinned-bar__content" onClick={onClick}>
          <span className="pin-icon"><PinIcon /></span>
          <span className="pinned-author">{message.sender?.username || 'Пользователь'}</span>
          <span className="pinned-preview">{getPreview()}</span>
        </div>

        <button className="unpin-btn" onClick={(e) => { e.stopPropagation(); onUnpin(); }}>
          <FiX />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default PinnedMessage;