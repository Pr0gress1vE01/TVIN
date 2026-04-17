import React from 'react';
import { motion } from 'framer-motion';
import './QuickReactions.scss';

const QuickReactions = ({ onSelect, position }) => {
  const reactions = ['👍', '❤️', '😊', '😢', '😮', '👏', '🎉', '🔥', '💯', '🔥', '💯'];

  return (
    <motion.div 
      className="quick-reactions-panel"
      style={{ top: position.y, left: position.x }}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
    >
      {reactions.map(emoji => (
        <button
          key={emoji}
          className="reaction-btn"
          onClick={() => onSelect(emoji)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          {emoji}
        </button>
      ))}
    </motion.div>
  );
};

export default QuickReactions;