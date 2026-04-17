import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  FiCheckCircle, FiHeadphones, FiMessageCircle, 
  FiPhone, FiUserPlus, FiUserCheck, FiMoreHorizontal,
  FiMapPin, FiBriefcase, FiLink, FiCamera
} from 'react-icons/fi';
import './ProfileHeader.scss';

const ProfileHeader = ({ profile, isOwnProfile, isOnline, onUpdate, onClose }) => {
  const [showMusicStatus, setShowMusicStatus] = useState(true);
  const [musicTrack, setMusicTrack] = useState(null);
  const headerRef = useRef(null);

  useEffect(() => {
    fetchCurrentMusic();
  }, [profile._id]);

  const fetchCurrentMusic = async () => {
    try {
      const response = await axios.get(`/api/user/${profile._id}/current-music`);
      if (response.data) {
        setMusicTrack(response.data);
      }
    } catch (error) {
      // Нет активного трека
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await axios.post('/api/user/avatar', formData);
      onUpdate({ avatar: response.data.url });
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  const handleMessage = () => {
    onClose();
    // Переход к чату
  };

  const handleSubscribe = async () => {
    try {
      await axios.post(`/api/user/${profile._id}/subscribe`);
      onUpdate({ isSubscribed: true });
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  };

  const headerVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 }
  };

  return (
    <motion.div 
      ref={headerRef}
      className="profile-header"
      variants={headerVariants}
      initial="initial"
      animate="animate"
    >
      <div className="avatar-section">
        <div className="avatar-wrapper">
          {profile.hasStory && <div className="story-ring" />}
          <img 
            src={profile.avatar || '/default-avatar.svg'} 
            alt="" 
            className="avatar"
          />
          {isOwnProfile && (
            <label className="change-avatar-btn">
              <FiCamera />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
            </label>
          )}
        </div>

        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-value">{profile.postsCount || 0}</span>
            <span className="stat-label">постов</span>
          </div>
          <div className="stat-item clickable">
            <span className="stat-value">{profile.subscribersCount || 0}</span>
            <span className="stat-label">подписчиков</span>
          </div>
          <div className="stat-item clickable">
            <span className="stat-value">{profile.subscriptionsCount || 0}</span>
            <span className="stat-label">подписок</span>
          </div>
        </div>
      </div>

      <div className="name-section">
        <div className="display-name">
          {profile.firstName} {profile.lastName}
          {profile.verified && <FiCheckCircle className="verified-icon" />}
        </div>
        <div className="username">@{profile.username}</div>
      </div>

      {musicTrack && showMusicStatus && (
        <div className="music-status" onClick={() => {}}>
          <FiHeadphones />
          <span>Слушает: {musicTrack.artist} — {musicTrack.title}</span>
        </div>
      )}

      <div className="action-buttons">
        {!isOwnProfile && (
          <>
            <button className="btn-primary" onClick={handleMessage}>
              <FiMessageCircle /> Написать
            </button>
            <button className="btn-secondary">
              <FiPhone /> Позвонить
            </button>
            <button className="btn-secondary" onClick={handleSubscribe}>
              <FiUserPlus /> Подписаться
            </button>
          </>
        )}
        {isOwnProfile && (
          <>
            <button className="btn-secondary">Редактировать</button>
            <button className="btn-secondary">Поделиться</button>
          </>
        )}
      </div>

      <div className="bio-section">
        {profile.occupation && (
          <div className="bio-item">
            <FiBriefcase /> {profile.occupation}
          </div>
        )}
        {profile.location && (
          <div className="bio-item">
            <FiMapPin /> {profile.location}
          </div>
        )}
        {profile.bio && (
          <div className="bio-text">{profile.bio}</div>
        )}
        {profile.website && (
          <a 
            href={profile.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bio-link"
          >
            <FiLink /> {profile.website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>

      {profile.featuredLink && (
        <div className="featured-link">
          {profile.featuredLink.title}
        </div>
      )}

      <div className="live-activity">
        <span className={`online-dot ${isOnline ? 'online' : ''}`} />
        <span className="activity-text">
          {isOnline ? 'Онлайн' : 'Был(а) недавно'}
        </span>
        {isOnline && profile.activity && (
          <span className="activity-detail">{profile.activity}</span>
        )}
      </div>
    </motion.div>
  );
};

export default ProfileHeader;