import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import axios from 'axios';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import './MessageSearch.scss';

const MessageSearch = ({ chatId, onClose, onJumpToMessage }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (query.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchMessages();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  }, [query]);

  const searchMessages = async () => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/chat/${chatId}/search`, {
        params: { q: query }
      });
      setResults(response.data);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error searching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJumpToMessage = (message) => {
    onJumpToMessage(message);
    onClose();
  };

  const handleNext = () => {
    if (currentIndex < results.length - 1) {
      setCurrentIndex(currentIndex + 1);
      onJumpToMessage(results[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      onJumpToMessage(results[currentIndex - 1]);
    }
  };

  const getMessagePreview = (message) => {
    if (message.type === 'image') return '📷 Изображение';
    if (message.type === 'video') return '🎥 Видео';
    if (message.type === 'voice') return '🎤 Голосовое';
    if (message.type === 'video_message') return '📹 Видеосообщение';
    return message.content;
  };

  const highlightText = (text) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i}>{part}</mark> 
        : part
    );
  };

  return (
    <motion.div 
      className="message-search"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="search-header">
        <div className="search-input-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Поиск сообщений..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')}>
              <FiX />
            </button>
          )}
        </div>
        
        <button className="close-btn" onClick={onClose}>
          <FiX />
        </button>
      </div>

      {results.length > 0 && (
        <div className="search-navigation">
          <span className="counter">
            {currentIndex + 1} из {results.length}
          </span>
          <button onClick={handlePrev} disabled={currentIndex === 0}>
            <FiChevronUp />
          </button>
          <button onClick={handleNext} disabled={currentIndex === results.length - 1}>
            <FiChevronDown />
          </button>
        </div>
      )}

      <div className="search-results">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Поиск...</span>
          </div>
        ) : results.length > 0 ? (
          results.map((message, index) => (
            <motion.div
              key={message._id}
              className={`search-result ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handleJumpToMessage(message)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="result-header">
                <span className="result-author">{message.sender?.username}</span>
                <span className="result-time">
                  {format(new Date(message.createdAt), 'dd MMM HH:mm', { locale: ru })}
                </span>
              </div>
              <div className="result-content">
                {highlightText(getMessagePreview(message))}
              </div>
            </motion.div>
          ))
        ) : query.length >= 2 ? (
          <div className="no-results">
            <p>Сообщения не найдены</p>
          </div>
        ) : (
          <div className="search-hint">
            <p>Введите текст для поиска</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageSearch;