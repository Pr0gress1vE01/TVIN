import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { 
  FiSearch, 
  FiUserPlus, 
  FiUserCheck, 
  FiUserX,
  FiMessageCircle,
  FiMoreVertical,
  FiClock,
  FiCheck,
  FiX
} from 'react-icons/fi';
import './Contacts.scss';

const Contacts = () => {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const [activeTab, setActiveTab] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchContacts();
    fetchRequests();
    fetchSuggestions();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get('/api/contacts');
      setContacts(response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/contacts/requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get('/api/contacts/suggestions');
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`/api/user/search/${query}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await axios.post(`/api/contacts/request/${userId}`);
      setSuggestions(prev => prev.filter(s => s._id !== userId));
      setSearchResults(prev => prev.map(u => 
        u._id === userId ? { ...u, requestSent: true } : u
      ));
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await axios.post(`/api/contacts/accept/${userId}`);
      setRequests(prev => prev.filter(r => r.from._id !== userId));
      fetchContacts();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleDeclineRequest = async (userId) => {
    try {
      await axios.post(`/api/contacts/decline/${userId}`);
      setRequests(prev => prev.filter(r => r.from._id !== userId));
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const handleRemoveContact = async (userId) => {
    if (!window.confirm('Удалить контакт?')) return;
    
    try {
      await axios.delete(`/api/contacts/${userId}`);
      setContacts(prev => prev.filter(c => c._id !== userId));
    } catch (error) {
      console.error('Error removing contact:', error);
    }
  };

  const startChat = async (userId) => {
    try {
      const response = await axios.post('/api/chat/direct', { userId });
      window.location.href = `/chat/${response.data._id}`;
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  return (
    <motion.div 
      className="contacts-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="contacts-container">
        <div className="contacts-header">
          <h1>Контакты</h1>
          <button 
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <FiUserPlus /> Добавить контакт
          </button>
        </div>

        <div className="contacts-tabs">
          <button 
            className={`tab ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            Мои контакты ({contacts.length})
          </button>
          <button 
            className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Заявки {requests.length > 0 && <span className="badge">{requests.length}</span>}
          </button>
          <button 
            className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            Рекомендации
          </button>
        </div>

        <div className="contacts-content">
          {activeTab === 'contacts' && (
            <div className="contacts-list">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner" />
                </div>
              ) : contacts.length === 0 ? (
                <div className="empty-state">
                  <FiUserPlus size={48} />
                  <h3>Нет контактов</h3>
                  <p>Добавьте друзей, чтобы начать общение</p>
                  <button 
                    className="btn-primary"
                    onClick={() => setShowAddModal(true)}
                  >
                    Найти друзей
                  </button>
                </div>
              ) : (
                contacts.map(contact => {
                  const isOnline = onlineUsers.has(contact._id);
                  
                  return (
                    <motion.div 
                      key={contact._id}
                      className="contact-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                    >
                      <Link to={`/profile/${contact._id}`} className="contact-avatar">
                        <img src={contact.avatar || '/default-avatar.svg'} alt="" />
                        {isOnline && <span className="online-indicator" />}
                      </Link>

                      <div className="contact-info">
                        <Link to={`/profile/${contact._id}`} className="contact-name">
                          {contact.firstName} {contact.lastName}
                        </Link>
                        <span className="contact-username">@{contact.username}</span>
                        {contact.status && (
                          <span className="contact-status">{contact.status}</span>
                        )}
                      </div>

                      <div className="contact-actions">
                        <button 
                          className="icon-button"
                          onClick={() => startChat(contact._id)}
                          title="Написать"
                        >
                          <FiMessageCircle />
                        </button>
                        <div className="dropdown">
                          <button className="icon-button">
                            <FiMoreVertical />
                          </button>
                          <div className="dropdown-menu">
                            <button onClick={() => window.location.href = `/profile/${contact._id}`}>
                              Профиль
                            </button>
                            <button className="danger" onClick={() => handleRemoveContact(contact._id)}>
                              Удалить
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="requests-list">
              {requests.length === 0 ? (
                <div className="empty-state">
                  <FiClock size={48} />
                  <h3>Нет заявок</h3>
                  <p>Здесь появятся входящие заявки в друзья</p>
                </div>
              ) : (
                requests.map(request => (
                  <motion.div 
                    key={request._id}
                    className="request-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Link to={`/profile/${request.from._id}`} className="request-avatar">
                      <img src={request.from.avatar || '/default-avatar.svg'} alt="" />
                    </Link>

                    <div className="request-info">
                      <Link to={`/profile/${request.from._id}`} className="request-name">
                        {request.from.firstName} {request.from.lastName}
                      </Link>
                      <span className="request-username">@{request.from.username}</span>
                      <span className="request-time">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="request-actions">
                      <button 
                        className="btn-success"
                        onClick={() => handleAcceptRequest(request.from._id)}
                      >
                        <FiCheck /> Принять
                      </button>
                      <button 
                        className="btn-danger"
                        onClick={() => handleDeclineRequest(request.from._id)}
                      >
                        <FiX /> Отклонить
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="suggestions-list">
              {suggestions.map(suggestion => (
                <motion.div 
                  key={suggestion._id}
                  className="suggestion-card"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ y: -2 }}
                >
                  <Link to={`/profile/${suggestion._id}`} className="suggestion-avatar">
                    <img src={suggestion.avatar || '/default-avatar.svg'} alt="" />
                  </Link>

                  <div className="suggestion-info">
                    <Link to={`/profile/${suggestion._id}`} className="suggestion-name">
                      {suggestion.firstName} {suggestion.lastName}
                    </Link>
                    <span className="suggestion-username">@{suggestion.username}</span>
                  </div>

                  <button 
                    className="btn-primary"
                    onClick={() => handleSendRequest(suggestion._id)}
                  >
                    <FiUserPlus /> Добавить
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно поиска */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div 
              className="add-contact-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Найти друзей</h2>
                <button 
                  className="icon-button"
                  onClick={() => setShowAddModal(false)}
                >
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <div className="search-box">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Поиск по имени или username..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="search-results">
                  {searchResults.length > 0 ? (
                    searchResults.map(result => (
                      <div key={result._id} className="search-result-item">
                        <Link to={`/profile/${result._id}`} className="user-info">
                          <img src={result.avatar || '/default-avatar.svg'} alt="" />
                          <div>
                            <span className="name">{result.firstName} {result.lastName}</span>
                            <span className="username">@{result.username}</span>
                          </div>
                        </Link>

                        {result.requestSent ? (
                          <button className="btn-secondary" disabled>
                            <FiUserCheck /> Заявка отправлена
                          </button>
                        ) : (
                          <button 
                            className="btn-primary"
                            onClick={() => handleSendRequest(result._id)}
                          >
                            <FiUserPlus /> Добавить
                          </button>
                        )}
                      </div>
                    ))
                  ) : searchQuery.length >= 2 ? (
                    <p className="no-results">Пользователи не найдены</p>
                  ) : (
                    <p className="search-hint">Введите имя или username для поиска</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Contacts;