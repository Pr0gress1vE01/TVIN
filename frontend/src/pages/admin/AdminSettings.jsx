import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FiSave, FiShield } from 'react-icons/fi';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    registrationEnabled: true,
    maintenanceMode: false,
    maxFileSize: 50,
    defaultUserRole: 'user'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.post('/api/admin/settings', settings);
      alert('Настройки сохранены');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-settings">
      <h2>Настройки системы</h2>

      <motion.div 
        className="admin-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="admin-card-header">
          <h3><FiShield /> Основные настройки</h3>
        </div>

        <div className="settings-form">
          <div className="form-group">
            <label>
              <input 
                type="checkbox"
                checked={settings.registrationEnabled}
                onChange={(e) => setSettings({...settings, registrationEnabled: e.target.checked})}
              />
              <span>Разрешить регистрацию новых пользователей</span>
            </label>
          </div>

          <div className="form-group">
            <label>
              <input 
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
              />
              <span>Режим обслуживания</span>
            </label>
          </div>

          <div className="form-group">
            <label>Максимальный размер файла (MB)</label>
            <input 
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => setSettings({...settings, maxFileSize: e.target.value})}
              min="1"
              max="100"
            />
          </div>

          <div className="form-group">
            <label>Роль по умолчанию для новых пользователей</label>
            <select 
              value={settings.defaultUserRole}
              onChange={(e) => setSettings({...settings, defaultUserRole: e.target.value})}
            >
              <option value="user">Пользователь</option>
              <option value="moderator">Модератор</option>
            </select>
          </div>

          <button 
            className="btn-primary save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            <FiSave /> {saving ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSettings;