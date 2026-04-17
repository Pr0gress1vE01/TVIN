import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUserPlus, FiUserCheck } from 'react-icons/fi';
import axios from 'axios';
import './SubscribersModal.scss';

const SubscribersModal = ({ isOpen, onClose, userId, type = 'subscribers' }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const endpoint = type === 'subscribers' 
        ? `/api/user/${userId}/subscribers-list`
        : `/api/user/${userId}/subscriptions-list`;
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
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="subscribers-modal"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="drag-indicator" />
            <h3>{type === 'subscribers' ? 'Подписчики' : 'Подписки'}</h3>
            <button className="close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>

          <div className="modal-search">
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="modal-body">
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div key={user._id} className="user-item">
                  <img src={user.avatar || '/default-avatar.svg'} alt="" />
                  <div className="user-info">
                    <span className="name">{user.firstName} {user.lastName}</span>
                    <span className="username">@{user.username}</span>
                  </div>
                  <button className="action-btn">
                    {type === 'subscribers' ? <FiUserPlus /> : <FiUserCheck />}
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">Пользователи не найдены</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubscribersModal;