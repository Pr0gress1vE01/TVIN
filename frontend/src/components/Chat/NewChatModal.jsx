import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX } from 'react-icons/fi';
import axios from 'axios';
import './NewChatModal.scss';

const NewChatModal = ({ isOpen, onClose, onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/user/search/${searchQuery}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

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
          className="new-chat-modal"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>Новый чат</h3>
            <button className="close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>

          <div className="modal-body">
            <div className="search-wrapper">
              <FiSearch />
              <input
                type="text"
                placeholder="Поиск пользователей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="search-results">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div 
                    key={user._id}
                    className="user-item"
                    onClick={() => onSelectUser(user._id)}
                  >
                    <img src={user.avatar || '/default-avatar.svg'} alt="" />
                    <div className="user-info">
                      <span className="username">{user.username}</span>
                      <span className="fullname">{user.firstName} {user.lastName}</span>
                    </div>
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                <p className="no-results">Пользователи не найдены</p>
              ) : (
                <p className="search-hint">Введите имя пользователя</p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewChatModal;