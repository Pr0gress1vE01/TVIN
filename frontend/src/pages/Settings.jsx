import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  FiBell, FiLock, FiEye, FiMoon, FiSun, FiUser,
  FiGlobe, FiSmartphone, FiShield, FiMessageCircle,
  FiImage, FiLayers, FiZap, FiUpload, FiCheck, FiSave,
  FiDroplet, FiGrid, FiType, FiMaximize, FiMinimize
} from 'react-icons/fi';
import './Settings.scss';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme, availableThemes, themes } = useTheme();
  const [settings, setSettings] = useState({
    notifications: true,
    privacy: { lastSeen: true, profilePhoto: 'everyone' },
    security: { twoFactorAuth: false },
    chat: {
      background: { 
        type: 'gradient', 
        value: 'linear-gradient(135deg, #0a0f1a 0%, #1a2333 100%)', 
        image: null 
      },
      background3D: { 
        enabled: true, 
        effect: 'particles', 
        color: '#8B5CF6', 
        intensity: 50 
      },
      messageStyle: 'modern',
      bubbleRadius: 16,
      showAvatar: false,
      showTime: true,
      animations: true,
      fontSize: 'medium',
      compactMode: false
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [uploadingBg, setUploadingBg] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (user?.settings) {
      setSettings(prev => ({
        ...prev,
        notifications: user.settings.notifications ?? prev.notifications,
        privacy: { ...prev.privacy, ...user.settings.privacy },
        security: { ...prev.security, ...user.settings.security },
        chat: { ...prev.chat, ...user.settings.chat }
      }));
    }
  }, [user]);

  // Загрузка настроек при открытии
const fetchSettings = async () => {
  try {
    console.log('📥 Fetching settings...');
    const response = await axios.get('/api/user/settings');
    console.log('📥 Settings received:', response.data);
    
    if (response.data) {
      setSettings(prev => ({
        ...prev,
        ...response.data,
        chat: { 
          ...prev.chat, 
          ...(response.data.chat || {}) 
        }
      }));
    }
  } catch (error) {
    console.error('❌ Error fetching settings:', error);
  }
};


// Сохранение настроек чата
const handleSaveChatSettings = async () => {
  try {
    setLoading(true);
    console.log('📤 Saving chat settings:', settings.chat);
    
    const response = await axios.patch('/api/user/settings/chat', { 
      chat: settings.chat 
    });
    
    console.log('✅ Chat settings saved, response:', response.data);
    
    // Обновляем пользователя в контексте
    updateUser(response.data);
    
    setSaveMessage('✓ Настройки сохранены!');
    setTimeout(() => setSaveMessage(''), 3000);
  } catch (error) {
    console.error('❌ Error saving chat settings:', error);
    setSaveMessage('✗ Ошибка при сохранении');
    setTimeout(() => setSaveMessage(''), 3000);
  } finally {
    setLoading(false);
  }
};

  const handleSaveSettings = async (section = 'all') => {
    try {
      setLoading(true);
      setSaveMessage('');
      
      let response;
      
      if (section === 'chat') {
        response = await axios.patch('/api/user/settings/chat', { 
          chat: settings.chat 
        });
      } else {
        const dataToSave = {
          notifications: settings.notifications,
          privacy: settings.privacy,
          security: settings.security
        };
        response = await axios.patch('/api/user/settings', dataToSave);
      }
      
      updateUser(response.data);
      setSaveMessage('✓ Настройки сохранены!');
      
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('✗ Ошибка при сохранении');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('background', file);

    try {
      setUploadingBg(true);
      const response = await axios.post('/api/user/settings/chat/background', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSettings(prev => ({
        ...prev,
        chat: {
          ...prev.chat,
          background: {
            type: 'image',
            image: response.data.background,
            value: null
          }
        }
      }));
      
      updateUser(response.data.user);
    } catch (error) {
      console.error('Error uploading background:', error);
      alert('Ошибка при загрузке фона');
    } finally {
      setUploadingBg(false);
    }
  };

  // Расширенные фоны чата
  const chatBackgrounds = [
    { 
      id: 'galaxy', 
      name: 'Галактика', 
      type: 'gradient',
      value: 'radial-gradient(circle at 30% 50%, #1a0a2e 0%, #0a0a1a 50%, #000000 100%)',
      preview: 'radial-gradient(circle at 30% 50%, #1a0a2e, #0a0a1a, #000000)'
    },
    { 
      id: 'sunset', 
      name: 'Закат', 
      type: 'gradient',
      value: 'linear-gradient(180deg, #2d1b4e 0%, #1a0a2e 50%, #0a0a1a 100%)',
      preview: 'linear-gradient(180deg, #2d1b4e, #1a0a2e, #0a0a1a)'
    },
    { 
      id: 'ocean', 
      name: 'Океан', 
      type: 'gradient',
      value: 'linear-gradient(135deg, #0a1929 0%, #1a2a4e 50%, #0d1b2a 100%)',
      preview: 'linear-gradient(135deg, #0a1929, #1a2a4e, #0d1b2a)'
    },
    { 
      id: 'forest', 
      name: 'Лес', 
      type: 'gradient',
      value: 'linear-gradient(135deg, #0a1a0a 0%, #1a2e1a 50%, #0d1a0d 100%)',
      preview: 'linear-gradient(135deg, #0a1a0a, #1a2e1a, #0d1a0d)'
    },
    { 
      id: 'midnight', 
      name: 'Полночь', 
      type: 'gradient',
      value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a1a 100%)',
      preview: 'linear-gradient(135deg, #0a0a0a, #1a1a2e, #0a0a1a)'
    },
    { 
      id: 'amethyst', 
      name: 'Аметист', 
      type: 'gradient',
      value: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #4a2a6a 100%)',
      preview: 'linear-gradient(135deg, #1a0a2e, #2d1b4e, #4a2a6a)'
    },
    { 
      id: 'dark', 
      name: 'Угольный', 
      type: 'solid',
      value: '#0B0B0F',
      preview: '#0B0B0F'
    },
    { 
      id: 'purple-dark', 
      name: 'Фиолетовый', 
      type: 'solid',
      value: '#13111C',
      preview: '#13111C'
    }
  ];

  // 3D эффекты с описанием
  const backgroundEffects = [
    { 
      id: 'none', 
      name: 'Без эффекта', 
      icon: '⬜', 
      description: 'Статичный фон'
    },
    { 
      id: 'particles', 
      name: 'Партиклы', 
      icon: '✨', 
      description: 'Плавающие частицы'
    },
    { 
      id: 'waves', 
      name: 'Волны', 
      icon: '🌊', 
      description: 'Плавные волны'
    },
    { 
      id: 'stars', 
      name: 'Звёзды', 
      icon: '⭐', 
      description: 'Мерцающие звёзды'
    },
    { 
      id: 'matrix', 
      name: 'Матрица', 
      icon: '💻', 
      description: 'Падающий код'
    },
    { 
      id: 'neon', 
      name: 'Неон', 
      icon: '💫', 
      description: 'Неоновое свечение'
    },
    { 
      id: 'aurora', 
      name: 'Аврора', 
      icon: '🌈', 
      description: 'Северное сияние'
    }
  ];

  // Стили сообщений
  const messageStyles = [
    { 
      id: 'modern', 
      name: 'Современный', 
      description: 'Чистые линии, скругленные углы',
      preview: '💬'
    },
    { 
      id: 'classic', 
      name: 'Классический', 
      description: 'Как в классических мессенджерах',
      preview: '📱'
    },
    { 
      id: 'minimal', 
      name: 'Минимализм', 
      description: 'Минимум декора',
      preview: '◻️'
    },
    { 
      id: 'bubble', 
      name: 'Пузырьки', 
      description: 'Объемные сообщения',
      preview: '🫧'
    },
    { 
      id: 'glass', 
      name: 'Стекло', 
      description: 'Полупрозрачные с размытием',
      preview: '🔮'
    }
  ];

  // Размеры шрифта
  const fontSizes = [
    { id: 'small', name: 'Маленький', size: '13px' },
    { id: 'medium', name: 'Средний', size: '15px' },
    { id: 'large', name: 'Большой', size: '17px' }
  ];

  return (
    <motion.div className="settings-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="settings-container">
        <h1>Настройки</h1>

        {saveMessage && (
          <div className={`save-message ${saveMessage.includes('✓') ? 'success' : 'error'}`}>
            {saveMessage}
          </div>
        )}

        <div className="settings-tabs">
          <button className={`tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
            <FiUser /> Основные
          </button>
          <button className={`tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <FiMessageCircle /> Оформление чата
          </button>
          <button className={`tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <FiBell /> Уведомления
          </button>
          <button className={`tab ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
            <FiLock /> Приватность
          </button>
          <button className={`tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            <FiShield /> Безопасность
          </button>
        </div>

        <div className="settings-content">
          {/* Основные настройки */}
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2>Основные настройки</h2>
              
              <div className="setting-item">
                <div className="setting-info">
                  <FiDroplet />
                  <div>
                    <h3>Тема оформления</h3>
                    <p>Выберите цветовую схему</p>
                  </div>
                </div>
                <div className="theme-selector-group">
                  {availableThemes.map(t => (
                    <button
                      key={t}
                      className={`theme-option ${theme === t ? 'active' : ''}`}
                      onClick={() => setTheme(t)}
                    >
                      <span className="theme-preview" style={{ 
                        background: themes[t].bgPrimary,
                        borderColor: themes[t].primary
                      }} />
                      <span>{themes[t].name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <FiGlobe />
                  <div>
                    <h3>Язык</h3>
                    <p>Выберите язык интерфейса</p>
                  </div>
                </div>
                <select className="select-input" defaultValue="ru">
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="settings-actions">
                <button className="btn-primary" onClick={() => handleSaveSettings('general')} disabled={loading}>
                  <FiSave /> {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          )}

          {/* Настройки чата */}
          {activeTab === 'chat' && (
            <div className="settings-section chat-settings">
              <div className="settings-header">
                <h2>Оформление чата</h2>
                <button className="btn-secondary" onClick={() => setPreviewMode(!previewMode)}>
                  <FiEye /> {previewMode ? 'Скрыть превью' : 'Показать превью'}
                </button>
              </div>

              {/* Превью чата */}
              {previewMode && (
                <div className="chat-preview-container">
                  <div 
                    className="chat-preview" 
                    style={{ 
                      background: settings.chat.background.type === 'image' 
                        ? `url(${settings.chat.background.image}) center/cover` 
                        : settings.chat.background.value 
                    }}
                  >
                    {/* 3D эффект */}
                    {settings.chat.background3D.enabled && settings.chat.background3D.effect !== 'none' && (
                      <div className={`bg-3d-effect ${settings.chat.background3D.effect}`}>
                        {settings.chat.background3D.effect === 'particles' && (
                          <div className="particles-container">
                            {[...Array(20)].map((_, i) => (
                              <div key={i} className="particle" style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                background: settings.chat.background3D.color
                              }} />
                            ))}
                          </div>
                        )}
                        {settings.chat.background3D.effect === 'stars' && (
                          <div className="stars-container">
                            {[...Array(30)].map((_, i) => (
                              <div key={i} className="star" style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                boxShadow: `0 0 ${5 + Math.random() * 10}px ${settings.chat.background3D.color}`
                              }} />
                            ))}
                          </div>
                        )}
                        {settings.chat.background3D.effect === 'matrix' && (
                          <div className="matrix-container">
                            {[...Array(10)].map((_, i) => (
                              <div key={i} className="matrix-column" style={{
                                left: `${i * 10}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                color: settings.chat.background3D.color
                              }}>
                                {[...Array(20)].map((_, j) => (
                                  <span key={j}>{String.fromCharCode(0x30A0 + Math.random() * 96)}</span>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                        {settings.chat.background3D.effect === 'neon' && (
                          <div className="neon-container" style={{
                            background: `radial-gradient(circle at 50% 50%, ${settings.chat.background3D.color}20 0%, transparent 70%)`
                          }}>
                            <div className="neon-glow" style={{
                              boxShadow: `0 0 50px ${settings.chat.background3D.color}`
                            }} />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="preview-messages">
                      <div className="preview-message other">
                        {settings.chat.showAvatar && <div className="avatar" />}
                        <div 
                          className={`bubble ${settings.chat.messageStyle}`}
                          style={{ 
                            borderRadius: `${settings.chat.bubbleRadius}px`,
                            fontSize: fontSizes.find(f => f.id === settings.chat.fontSize)?.size
                          }}
                        >
                          Привет! Как дела?
                          {settings.chat.showTime && <span className="time">10:30</span>}
                        </div>
                      </div>
                      <div className="preview-message own">
                        <div 
                          className={`bubble ${settings.chat.messageStyle}`}
                          style={{ 
                            borderRadius: `${settings.chat.bubbleRadius}px`,
                            fontSize: fontSizes.find(f => f.id === settings.chat.fontSize)?.size
                          }}
                        >
                          Отлично! А у тебя?
                          {settings.chat.showTime && <span className="time">10:31</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Фон чата */}
              <div className="settings-group">
                <h3><FiImage /> Фон чата</h3>
                
                <div className="background-grid">
                  {chatBackgrounds.map(bg => (
                    <div
                      key={bg.id}
                      className={`bg-option ${settings.chat.background.value === bg.value ? 'active' : ''}`}
                      onClick={() => setSettings({
                        ...settings,
                        chat: {
                          ...settings.chat,
                          background: { type: bg.type, value: bg.value, image: null }
                        }
                      })}
                    >
                      <div className="bg-preview" style={{ background: bg.preview }} />
                      <span>{bg.name}</span>
                      {settings.chat.background.value === bg.value && (
                        <FiCheck className="check-icon" />
                      )}
                    </div>
                  ))}
                  
                  <label className="bg-option upload">
                    <div className="bg-preview">
                      {uploadingBg ? (
                        <div className="spinner-small" />
                      ) : settings.chat.background.type === 'image' && settings.chat.background.image ? (
                        <img src={settings.chat.background.image} alt="Custom" />
                      ) : (
                        <FiUpload />
                      )}
                    </div>
                    <span>Загрузить</span>
                    <input type="file" accept="image/*" onChange={handleBackgroundUpload} hidden />
                  </label>
                </div>
              </div>

              {/* 3D эффекты */}
              <div className="settings-group">
                <h3><FiLayers /> 3D эффекты фона</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <FiZap />
                    <div>
                      <h3>Включить 3D эффекты</h3>
                      <p>Добавляет динамический фон в чат</p>
                    </div>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox"
                      checked={settings.chat.background3D.enabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        chat: {
                          ...settings.chat,
                          background3D: { ...settings.chat.background3D, enabled: e.target.checked }
                        }
                      })}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                {settings.chat.background3D.enabled && (
                  <>
                    <div className="setting-item">
                      <label>Тип эффекта</label>
                      <div className="effects-grid">
                        {backgroundEffects.map(effect => (
                          <button
                            key={effect.id}
                            className={`effect-btn ${settings.chat.background3D.effect === effect.id ? 'active' : ''}`}
                            onClick={() => setSettings({
                              ...settings,
                              chat: {
                                ...settings.chat,
                                background3D: { ...settings.chat.background3D, effect: effect.id }
                              }
                            })}
                          >
                            <span className="effect-icon">{effect.icon}</span>
                            <span className="effect-name">{effect.name}</span>
                            <span className="effect-desc">{effect.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="setting-row">
                      <div className="setting-item">
                        <label>Цвет эффекта</label>
                        <input 
                          type="color"
                          value={settings.chat.background3D.color}
                          onChange={(e) => setSettings({
                            ...settings,
                            chat: {
                              ...settings.chat,
                              background3D: { ...settings.chat.background3D, color: e.target.value }
                            }
                          })}
                          className="color-input"
                        />
                      </div>

                      <div className="setting-item">
                        <label>Интенсивность: {settings.chat.background3D.intensity}%</label>
                        <input 
                          type="range"
                          min="10"
                          max="100"
                          value={settings.chat.background3D.intensity}
                          onChange={(e) => setSettings({
                            ...settings,
                            chat: {
                              ...settings.chat,
                              background3D: { ...settings.chat.background3D, intensity: parseInt(e.target.value) }
                            }
                          })}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Стиль сообщений */}
              <div className="settings-group">
                <h3><FiMessageCircle /> Стиль сообщений</h3>
                
                <div className="message-styles-grid">
                  {messageStyles.map(style => (
                    <button
                      key={style.id}
                      className={`style-btn ${settings.chat.messageStyle === style.id ? 'active' : ''}`}
                      onClick={() => setSettings({
                        ...settings,
                        chat: { ...settings.chat, messageStyle: style.id }
                      })}
                    >
                      <span className="style-preview">{style.preview}</span>
                      <div className="style-info">
                        <h4>{style.name}</h4>
                        <p>{style.description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <FiMaximize />
                    <div>
                      <h3>Радиус скругления</h3>
                      <p>{settings.chat.bubbleRadius}px</p>
                    </div>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="24"
                    value={settings.chat.bubbleRadius}
                    onChange={(e) => setSettings({
                      ...settings,
                      chat: { ...settings.chat, bubbleRadius: parseInt(e.target.value) }
                    })}
                    className="range-slider"
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <FiType />
                    <div>
                      <h3>Размер шрифта</h3>
                      <p>{fontSizes.find(f => f.id === settings.chat.fontSize)?.name}</p>
                    </div>
                  </div>
                  <div className="font-size-selector">
                    {fontSizes.map(size => (
                      <button
                        key={size.id}
                        className={`font-size-btn ${settings.chat.fontSize === size.id ? 'active' : ''}`}
                        onClick={() => setSettings({
                          ...settings,
                          chat: { ...settings.chat, fontSize: size.id }
                        })}
                      >
                        <span style={{ fontSize: size.size }}>A</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div>
                      <h3>Показывать аватары</h3>
                      <p>Отображать аватары рядом с сообщениями</p>
                    </div>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox"
                      checked={settings.chat.showAvatar}
                      onChange={(e) => setSettings({
                        ...settings,
                        chat: { ...settings.chat, showAvatar: e.target.checked }
                      })}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div>
                      <h3>Показывать время</h3>
                      <p>Отображать время отправки</p>
                    </div>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox"
                      checked={settings.chat.showTime}
                      onChange={(e) => setSettings({
                        ...settings,
                        chat: { ...settings.chat, showTime: e.target.checked }
                      })}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div>
                      <h3>Анимации</h3>
                      <p>Плавные анимации сообщений</p>
                    </div>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox"
                      checked={settings.chat.animations}
                      onChange={(e) => setSettings({
                        ...settings,
                        chat: { ...settings.chat, animations: e.target.checked }
                      })}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div>
                      <h3>Компактный режим</h3>
                      <p>Уменьшенные отступы</p>
                    </div>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox"
                      checked={settings.chat.compactMode}
                      onChange={(e) => setSettings({
                        ...settings,
                        chat: { ...settings.chat, compactMode: e.target.checked }
                      })}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="settings-actions">
                <button className="btn-primary save-chat-btn" onClick={() => handleSaveSettings('chat')} disabled={loading}>
                  <FiSave /> {loading ? 'Сохранение...' : 'Сохранить настройки чата'}
                </button>
              </div>
            </div>
          )}

          {/* Остальные вкладки... */}
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;