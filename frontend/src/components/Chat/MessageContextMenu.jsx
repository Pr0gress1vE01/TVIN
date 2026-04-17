import React from 'react';
import { motion } from 'framer-motion';
import { FiCornerUpRight, FiCopy, FiShare2, FiEdit2, FiTrash2 } from 'react-icons/fi';
import './MessageContextMenu.scss';

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M14.8 8.5L19 12.7l-2.1 2.1-4.2-4.2-2.8 2.8 2.1 2.1-2.1 2.1L5 12.7l2.1-2.1 2.1 2.1 2.8-2.8-4.2-4.2 2.1-2.1 4.9 4.9z" />
  </svg>
);

const MessageContextMenu = ({ 
  position, message, user, onReply, onEdit, onPin, onDelete, onForward, onCopy, onClose 
}) => {
  const isOwn = message?.sender?._id === user?._id;

  const handleDelete = () => {
    if (window.confirm('Удалить сообщение?')) {
      onDelete();
    }
    onClose();
  };

  return (
    <motion.div
      className="message-context-menu"
      style={{ top: position.y, left: position.x }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={() => { onReply(); onClose(); }}>
        <FiCornerUpRight /> Ответить
      </button>
      <button onClick={() => { onCopy(); onClose(); }}>
        <FiCopy /> Копировать
      </button>
      <button onClick={() => { onForward(); onClose(); }}>
        <FiShare2 /> Переслать
      </button>
      <button onClick={() => { onPin(); onClose(); }}>
        <PinIcon /> Закрепить
      </button>
      {isOwn && (
        <>
          <div className="menu-divider" />
          <button onClick={() => { onEdit(); onClose(); }}>
            <FiEdit2 /> Редактировать
          </button>
          <button className="danger" onClick={handleDelete}>
            <FiTrash2 /> Удалить
          </button>
        </>
      )}
    </motion.div>
  );
};

export default MessageContextMenu;