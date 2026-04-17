import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FiUserPlus, FiCheck } from 'react-icons/fi';
import './SuggestionsSidebar.scss';

const SuggestionsSidebar = ({ suggestions = [], onFollow }) => {
  const [loading, setLoading] = useState({});
  const [followed, setFollowed] = useState({});

  const handleFollow = async (userId) => {
    try {
      setLoading(prev => ({ ...prev, [userId]: true }));
      await axios.post(`/api/contacts/request/${userId}`);
      setFollowed(prev => ({ ...prev, [userId]: true }));
      setTimeout(() => {
        onFollow(userId);
      }, 1500);
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="suggestions-sidebar">
      <div className="sidebar-header">
        <h3>Рекомендации</h3>
      </div>

      <div className="suggestions-list">
        <AnimatePresence>
          {suggestions.slice(0, 5).map(user => (
            <motion.div 
              key={user._id}
              className="suggestion-item"
              initial={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link to={`/profile/${user._id}`} className="user-info">
                <img src={user.avatar || '/default-avatar.svg'} alt="" />
                <div>
                  <span className="username">{user.username}</span>
                  <span className="fullname">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
              </Link>

              <button
                className={`follow-btn ${followed[user._id] ? 'followed' : ''}`}
                onClick={() => handleFollow(user._id)}
                disabled={loading[user._id] || followed[user._id]}
              >
                {loading[user._id] ? (
                  <span className="spinner-small" />
                ) : followed[user._id] ? (
                  <>
                    <FiCheck /> Заявка отправлена
                  </>
                ) : (
                  <>
                    <FiUserPlus /> Добавить
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {suggestions.length > 5 && (
        <button className="show-more-btn">
          Показать больше
        </button>
      )}
    </div>
  );
};

export default SuggestionsSidebar;