import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiFolder, FiBell, FiBellOff, FiTrash2 } from 'react-icons/fi';
import './ChatContextMenu.scss';

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"></line>
    <path d="M14.8 8.5L19 12.7l-2.1 2.1-4.2-4.2-2.8 2.8 2.1 2.1-2.1 2.1L5 12.7l2.1-2.1 2.1 2.1 2.8-2.8-4.2-4.2 2.1-2.1 4.9 4.9z"></path>
  </svg>
);

const ChatContextMenu = ({ contextMenu, onClose, onPin, onMute, onMarkRead, onDelete, pinnedChats, mutedChats }) => {
  if (!contextMenu) return null;

  const { chat, x, y } = contextMenu;
  const isPinned = pinnedChats.has(chat._id);
  const isMuted = mutedChats.has(chat._id);

  const handleAction = (action) => {
    action(chat._id);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="chat-context-menu"
        style={{ top: y, left: x }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => handleAction(onPin)}>
          <PinIcon /> {isPinned ? 'Открепить' : 'Закрепить'}
        </button>
        <button onClick={() => handleAction(onMarkRead)}>
          <FiCheck /> Отметить прочитанным
        </button>
        <button>
          <FiFolder /> Поместить в папку
        </button>
        <button onClick={() => handleAction(onMute)}>
          {isMuted ? <FiBell /> : <FiBellOff />}
          {isMuted ? 'Включить уведомления' : 'Отключить уведомления'}
        </button>
        <button className="danger" onClick={() => handleAction(onDelete)}>
          <FiTrash2 /> Удалить чат
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatContextMenu;