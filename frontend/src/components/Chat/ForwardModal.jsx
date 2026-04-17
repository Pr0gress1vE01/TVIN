import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiSend, FiCheck } from 'react-icons/fi';
import axios from 'axios';
import './ForwardModal.scss';

const ForwardModal = ({ isOpen, onClose, message, onForward }) => {
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChats, setSelectedChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchChats();
    }
  }, [isOpen]);

  const fetchChats = async () => {
    try {
      const response = await axios.get('/api/chat');
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const filteredChats = chats.filter(chat => {
    const chatName = chat.type === 'direct' 
      ? chat.participants?.find(p => p.user?._id !== message?.sender?._id)?.user?.username 
      : chat.name;
    return chatName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleChatSelection = (chatId) => {
    setSelectedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = async () => {
    if (selectedChats.length === 0) return;
    
    setLoading(true);
    
    try {
      await Promise.all(selectedChats.map(chatId => 
        axios.post(`/api/chat/${chatId}/forward`, {
          messageId: message._id,
          comment: comment || undefined
        })
      ));
      
      onForward?.(selectedChats);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error forwarding message:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedChats([]);
    setSearchQuery('');
    setComment('');
  };

  const getMessagePreview = () => {
    if (!message) return '';
    if (message.type === 'image') return '📷 Фото';
    if (message.type === 'video') return '🎥 Видео';
    if (message.type === 'voice') return '🎤 Голосовое';
    if (message.type === 'video_message') return '📹 Видеосообщение';
    if (message.type === 'sticker') return '🎯 Стикер';
    if (message.type === 'file') return '📎 Файл';
    return message.content?.substring(0, 100);
  };

  const getChatName = (chat) => {
    if (chat.type === 'direct') {
      const otherUser = chat.participants?.find(p => p.user?._id !== message?.sender?._id)?.user;
      return otherUser?.username || 'Чат';
    }
    return chat.name || 'Группа';
  };

  const getChatAvatar = (chat) => {
    if (chat.type === 'direct') {
      const otherUser = chat.participants?.find(p => p.user?._id !== message?.sender?._id)?.user;
      return otherUser?.avatar || '/default-avatar.svg';
    }
    return chat.avatar || '/default-avatar.svg';
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
          className="forward-modal"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>Переслать сообщение</h3>
            <button className="icon-button" onClick={onClose}>
              <FiX />
            </button>
          </div>

          <div className="modal-body">
            <div className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Поиск чатов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="message-preview">
              <div className="preview-label">Сообщение:</div>
              <div className="preview-content">
                <span className="preview-author">{message?.sender?.username}:</span>
                <span className="preview-text">{getMessagePreview()}</span>
              </div>
            </div>

            <div className="comment-input">
              <input
                type="text"
                placeholder="Добавить комментарий (необязательно)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="chats-list">
              {filteredChats.length > 0 ? (
                filteredChats.map(chat => {
                  const isSelected = selectedChats.includes(chat._id);
                  
                  return (
                    <div 
                      key={chat._id}
                      className={`chat-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleChatSelection(chat._id)}
                    >
                      <img src={getChatAvatar(chat)} alt="" />
                      <div className="chat-info">
                        <span className="chat-name">{getChatName(chat)}</span>
                        {chat.type === 'group' && (
                          <span className="chat-meta">
                            {chat.participants?.length || 0} участников
                          </span>
                        )}
                      </div>
                      {isSelected && <FiCheck className="check-icon" />}
                    </div>
                  );
                })
              ) : (
                <div className="no-chats">
                  <p>Чаты не найдены</p>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button 
              className="btn-primary"
              onClick={handleForward}
              disabled={selectedChats.length === 0 || loading}
            >
              <FiSend />
              {loading ? 'Отправка...' : `Переслать (${selectedChats.length})`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ForwardModal;