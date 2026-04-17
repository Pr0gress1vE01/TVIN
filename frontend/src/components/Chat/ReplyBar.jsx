import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCornerUpRight } from 'react-icons/fi';
import './ReplyBar.scss';

const ReplyBar = ({ replyTo, onCancel }) => {
  if (!replyTo) return null;

  const getPreview = () => {
    if (replyTo.type === 'image') return '📷 Фото';
    if (replyTo.type === 'video') return '🎥 Видео';
    if (replyTo.type === 'voice') return '🎤 Голосовое';
    return replyTo.content;
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="reply-bar"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
      >
        <FiCornerUpRight className="reply-icon" />
        
        <div className="reply-content">
          <span className="reply-author">{replyTo.sender.username}</span>
          <span className="reply-text">{getPreview()}</span>
        </div>
        
        {replyTo.type === 'image' && replyTo.attachments?.[0] && (
          <img 
            src={replyTo.attachments[0].url} 
            alt="" 
            className="reply-thumbnail"
          />
        )}
        
        <button className="cancel-reply" onClick={onCancel}>
          <FiX />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReplyBar;