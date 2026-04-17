import React from 'react';
import { motion } from 'framer-motion';
import './ReactionPanel.scss';

const QUICK_REACTIONS = ['👍', '❤️', '😊', '😢', '😮', '👏'];

const ReactionPanel = ({ position, onSelect }) => {
  return (
    <motion.div
      className="reactions-panel"
      style={{ top: position.y, left: position.x }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      {QUICK_REACTIONS.map(emoji => (
        <button key={emoji} className="reaction-panel-btn" onClick={() => onSelect(emoji)}>
          {emoji}
        </button>
      ))}
    </motion.div>
  );
};

export default ReactionPanel;