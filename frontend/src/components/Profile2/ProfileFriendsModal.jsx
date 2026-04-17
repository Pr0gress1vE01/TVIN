import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiMessageCircle, FiUserCheck, FiUserPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfileFriendsModal.scss';

const ProfileFriendsModal = ({ isOpen, onClose, userId, type = 'friends' }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const endpoint = type === 'friends' 
        ? `/api/user/${userId}/friends`
        : `/api/user/${userId}/subscribers`;
      const response = await axios.get(endpoint);
      setUsers(response.data);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserClick = (user) => {
    navigate(`/profile/${user.username}`);
    onClose();
  };

  const handleMessage = async (user, e) => {
    e.stopPropagation();
    try {
      const response = await axios.post('/api/chat/direct', { userId: user._id });
      navigate(`/chat/${response.data._id}`);
      onClose();
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="friends-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="friends-modal"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>{type === 'friends' ? 'Друзья' : 'Подписчики'}</h2>
            <button className="close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>

          <div className="modal-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="modal-body">
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <span>Загрузка...</span>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="users-list">
                {filteredUsers.map(user => (
                  <motion.div 
                    key={user._id}
                    className="user-item"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ backgroundColor: 'var(--bg-tertiary)' }}
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="user-avatar">
                      <img src={user.avatar || '/default-avatar.svg'} alt="" />
                      {user.isOnline && <span className="online-dot" />}
                    </div>
                    
                    <div className="user-info">
                      <span className="user-name">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="user-username">@{user.username}</span>
                    </div>

                    <button 
                      className="message-btn"
                      onClick={(e) => handleMessage(user, e)}
                      title="Написать сообщение"
                    >
                      <FiMessageCircle />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Пользователи не найдены</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileFriendsModal;