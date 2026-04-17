import React from 'react';
import { motion } from 'framer-motion';
import './ProfileStats.scss';

const ProfileStats = ({ stats }) => {
  const statItems = [
    { label: 'Постов', value: stats.posts, icon: '📷' },
    { label: 'Друзей', value: stats.friends, icon: '👥' },
    { label: 'Подписчиков', value: stats.subscribers, icon: '👤' }
  ];

  return (
    <motion.div 
      className="profile-stats"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {statItems.map((item, index) => (
        <motion.div 
          key={index}
          className="stat-item"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="stat-icon">{item.icon}</span>
          <div className="stat-info">
            <span className="stat-value">{item.value}</span>
            <span className="stat-label">{item.label}</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ProfileStats;