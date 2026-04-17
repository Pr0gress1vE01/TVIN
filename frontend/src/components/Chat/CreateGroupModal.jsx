import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiSearch, 
  FiX, 
  FiUsers, 
  FiCamera,
  FiCheck,
  FiChevronLeft
} from 'react-icons/fi';
import './CreateGroupModal.scss';

const CreateGroupModal = ({ isOpen, onClose, onCreate }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [groupAvatarFile, setGroupAvatarFile] = useState(null);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      setSearchingUsers(true);
      const response = await axios.get(`/api/user/search/${searchQuery}`);
      // Фильтруем уже выбранных пользователей и себя
      const filtered = response.data.filter(
        u => u._id !== user._id && !selectedUsers.find(s => s._id === u._id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleSelectUser = (selectedUser) => {
    setSelectedUsers([...selectedUsers, selectedUser]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGroupAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setGroupAvatar(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('name', groupName);
      formData.append('description', groupDescription);
      formData.append('participants', JSON.stringify(selectedUsers.map(u => u._id)));
      
      if (groupAvatarFile) {
        formData.append('avatar', groupAvatarFile);
      }

      const response = await axios.post('/api/chat/group', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onCreate(response.data);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      alert(error.response?.data?.message || 'Ошибка при создании группы');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setGroupName('');
    setGroupDescription('');
    setSearchQuery('');
    setSelectedUsers([]);
    setGroupAvatar(null);
    setGroupAvatarFile(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const canProceed = groupName.trim().length >= 3;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div 
          className="create-group-modal"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            {step === 2 && (
              <button 
                className="icon-button back-btn"
                onClick={() => setStep(1)}
              >
                <FiChevronLeft />
              </button>
            )}
            <h2>
              {step === 1 ? 'Создать группу' : 'Добавить участников'}
            </h2>
            <button className="icon-button" onClick={handleClose}>
              <FiX />
            </button>
          </div>

          {step === 1 ? (
            <div className="modal-body">
              <div className="avatar-upload">
                <div className="avatar-preview">
                  {groupAvatar ? (
                    <img src={groupAvatar} alt="Group avatar" />
                  ) : (
                    <FiUsers />
                  )}
                </div>
                <label className="upload-btn">
                  <FiCamera />
                  <span>Загрузить фото</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleAvatarChange}
                    hidden
                  />
                </label>
              </div>

              <div className="form-group">
                <label>Название группы <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Введите название группы"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={50}
                  autoFocus
                />
                <span className="char-count">{groupName.length}/50</span>
              </div>

              <div className="form-group">
                <label>Описание</label>
                <textarea
                  placeholder="О чём эта группа? (необязательно)"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
                <span className="char-count">{groupDescription.length}/200</span>
              </div>

              <button 
                className="btn-primary next-btn"
                onClick={() => setStep(2)}
                disabled={!canProceed}
              >
                Далее
              </button>
            </div>
          ) : (
            <div className="modal-body">
              <div className="search-section">
                <div className="search-input-wrapper">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Поиск пользователей..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <button 
                      className="clear-search"
                      onClick={() => setSearchQuery('')}
                    >
                      <FiX />
                    </button>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(user => (
                      <div 
                        key={user._id} 
                        className="user-item"
                        onClick={() => handleSelectUser(user)}
                      >
                        <img src={user.avatar || '/default-avatar.svg'} alt="" />
                        <div className="user-info">
                          <span className="user-name">{user.username}</span>
                          <span className="user-fullname">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                        <button className="add-btn">
                          <FiCheck />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {searchingUsers && (
                  <div className="search-loading">
                    <div className="spinner-small" />
                    <span>Поиск...</span>
                  </div>
                )}
              </div>

              <div className="selected-users">
                <div className="selected-header">
                  <h4>Участники</h4>
                  <span className="count">{selectedUsers.length} выбрано</span>
                </div>
                
                {selectedUsers.length > 0 ? (
                  <div className="users-list">
                    {selectedUsers.map(user => (
                      <div key={user._id} className="selected-user">
                        <img src={user.avatar || '/default-avatar.svg'} alt="" />
                        <div className="user-info">
                          <span className="name">{user.username}</span>
                          <span className="fullname">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                        <button 
                          className="remove-btn"
                          onClick={() => handleRemoveUser(user._id)}
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-users">
                    Добавьте хотя бы одного участника
                  </p>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setStep(1)}
                >
                  Назад
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleCreateGroup}
                  disabled={selectedUsers.length === 0 || loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small" />
                      Создание...
                    </>
                  ) : (
                    'Создать группу'
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateGroupModal;