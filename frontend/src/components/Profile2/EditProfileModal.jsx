import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import axios from 'axios';
import './EditProfileModal.scss';

const EditProfileModal = ({ isOpen, onClose, profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    website: profile?.website || '',
    status: profile?.status || 'online'
  });
  const [saving, setSaving] = useState(false);

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
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="edit-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="edit-modal"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Редактировать профиль</h2>
            <button onClick={onClose}><FiX /></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Имя</label>
                <input name="firstName" value={formData.firstName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Фамилия</label>
                <input name="lastName" value={formData.lastName} onChange={handleChange} />
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
              <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} maxLength={150} />
            </div>
            
            <div className="form-group">
              <label>Местоположение</label>
              <input name="location" value={formData.location} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label>Веб-сайт</label>
              <input name="website" value={formData.website} onChange={handleChange} placeholder="https://" />
            </div>
            
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Отмена</button>
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