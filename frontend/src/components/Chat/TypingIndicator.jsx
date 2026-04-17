import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './TypingIndicator.scss';

const TypingIndicator = ({ users = [] }) => {
  if (users.length === 0) return null;

  const getText = () => {
    if (users.length === 1) {
      return `${users[0]} печатает`;
    } else if (users.length === 2) {
      return `${users[0]} и ${users[1]} печатают`;
    } else {
      return `${users.length} человека печатают`;
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="typing-indicator"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
      >
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span className="typing-text">{getText()}</span>
      </motion.div>
    </AnimatePresence>
  );
};

export default TypingIndicator;