import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiUserPlus, FiUserCheck, FiMoreHorizontal, FiBell, FiBellOff, FiShare2, FiFlag } from 'react-icons/fi';
import './ProfileActions.scss';

const ProfileActions = ({ profile, isFriend, isSubscriber, onMessage, onFriendAction }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  return (
    <motion.div 
      className="profile-actions"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <div className="main-actions">
        <button className="btn-primary message-btn" onClick={onMessage}>
          <FiMessageCircle /> Сообщение
        </button>
        
        <button 
          className={`btn-secondary friend-btn ${isFriend ? 'active' : ''}`}
          onClick={onFriendAction}
        >
          {isFriend ? <FiUserCheck /> : <FiUserPlus />}
        </button>

        <div className="menu-container">
          <button 
            className="btn-secondary menu-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            <FiMoreHorizontal />
          </button>

          {showMenu && (
            <motion.div 
              className="dropdown-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <button onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
                {notificationsEnabled ? <FiBellOff /> : <FiBell />}
                {notificationsEnabled ? 'Отключить уведомления' : 'Включить уведомления'}
              </button>
              <button>
                <FiShare2 /> Поделиться профилем
              </button>
              <button className="danger">
                <FiFlag /> Пожаловаться
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {isSubscriber && !isFriend && (
        <div className="subscriber-notice">
          <span>Подписан на вас</span>
        </div>
      )}
    </motion.div>
  );
};

export default ProfileActions;