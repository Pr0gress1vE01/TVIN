import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FiCamera, FiMapPin, FiLink, FiCalendar } from 'react-icons/fi';
import axios from 'axios';
import './ProfileInfo.scss';

const ProfileInfo = ({ profile, isOnline, isOwnProfile, onAvatarChange }) => {
  const fileInputRef = useRef(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.post('/api/user/avatar', formData);
      onAvatarChange(response.data.avatar);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  return (
    <motion.div 
      className="profile-info-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="avatar-section">
        <div className="avatar-wrapper">
          <img 
            src={profile.avatar || '/default-avatar.svg'} 
            alt={profile.username}
            className="avatar"
          />
          {isOnline && <span className="online-indicator" />}
          {isOwnProfile && (
            <>
              <button 
                className="change-avatar-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <FiCamera />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                hidden
              />
            </>
          )}
        </div>
      </div>

      <div className="info-section">
        <h2 className="name">
          {profile.firstName} {profile.lastName}
          {profile.verified && (
            <span className="verified-badge" title="Подтвержденный аккаунт">✓</span>
          )}
        </h2>
        <span className="username">@{profile.username}</span>
        
        <p className="bio">{profile.bio || 'Нет описания'}</p>
        
        <div className="details">
          {profile.location && (
            <span className="detail-item">
              <FiMapPin /> {profile.location}
            </span>
          )}
          {profile.website && (
            <a 
              href={profile.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="detail-item link"
            >
              <FiLink /> {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          <span className="detail-item">
            <FiCalendar /> {new Date(profile.createdAt).toLocaleDateString('ru-RU', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileInfo;