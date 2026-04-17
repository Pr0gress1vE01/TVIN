import React from 'react';
import { motion } from 'framer-motion';
import { FiGrid, FiBookmark, FiHeart, FiUsers } from 'react-icons/fi';
import './ProfileTabs.scss';

const ProfileTabs = ({ activeTab, onTabChange, isOwnProfile, counts }) => {
  const tabs = [
    { id: 'posts', icon: FiGrid, label: 'Посты', count: counts.posts, always: true },
    { id: 'saved', icon: FiBookmark, label: 'Сохраненное', count: counts.saved, private: true },
    { id: 'liked', icon: FiHeart, label: 'Лайки', count: counts.liked, private: true },
    { id: 'friends', icon: FiUsers, label: 'Друзья', count: counts.friends, always: true }
  ];

  const visibleTabs = tabs.filter(tab => tab.always || (tab.private && isOwnProfile));

  return (
    <motion.div 
      className="profile-tabs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {visibleTabs.map(tab => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <tab.icon />
          <span>{tab.label}</span>
          {tab.count > 0 && <span className="count">{tab.count}</span>}
        </button>
      ))}
    </motion.div>
  );
};

export default ProfileTabs;