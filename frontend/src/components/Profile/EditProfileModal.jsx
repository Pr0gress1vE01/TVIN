import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCamera, FiLink } from 'react-icons/fi';
import axios from 'axios';
import './EditProfileModal.scss';

const EditProfileModal = ({ isOpen, onClose, profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    website: '',
    occupation: '',
    status: 'online'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        occupation: profile.occupation || '',
        status: profile.status || 'online'
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await axios.patch('/api/user/profile', formData);
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Ошибка при сохранении профиля');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="edit-profile-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="edit-profile-modal"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Редактировать профиль</h2>
            <button className="close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-row">
              <div className="form-group">
                <label>Имя</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Ваше имя"
                />
              </div>
              <div className="form-group">
                <label>Фамилия</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Ваша фамилия"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Статус</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="online">Онлайн</option>
                <option value="dnd">Не беспокоить</option>
                <option value="away">Отошел</option>
                <option value="offline">Не в сети</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>О себе</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Расскажите о себе..."
                maxLength={150}
                rows={3}
              />
              <span className="char-count">{formData.bio?.length || 0}/150</span>
            </div>
            
            <div className="form-group">
              <label>Род деятельности</label>
              <input
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                placeholder="Например: Product Designer в VK"
              />
            </div>
            
            <div className="form-group">
              <label>Местоположение</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Город, страна"
              />
            </div>
            
            <div className="form-group">
              <label>
                <FiLink /> Веб-сайт
              </label>
              <input
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
            
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditProfileModal;