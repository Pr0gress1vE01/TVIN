import React from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiSettings, FiMoreHorizontal, FiShare2 } from 'react-icons/fi';
import './ProfileHeader.scss';

const ProfileHeader = ({ profile, isOwnProfile, onBack, onSettings }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.firstName} ${profile.lastName} (@${profile.username})`,
          text: profile.bio || 'Профиль в TVIN',
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Ссылка скопирована!');
    }
  };

  return (
    <motion.header 
      className="profile-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button className="back-btn" onClick={onBack}>
        <FiChevronLeft />
      </button>

      <div className="header-title">
        <h1>{profile.username}</h1>
        {profile.verified && <span className="verified">✓</span>}
      </div>

      <div className="header-actions">
        <button className="action-btn" onClick={handleShare}>
          <FiShare2 />
        </button>
        
        {isOwnProfile ? (
          <button className="action-btn" onClick={onSettings}>
            <FiSettings />
          </button>
        ) : (
          <button className="action-btn">
            <FiMoreHorizontal />
          </button>
        )}
      </div>
    </motion.header>
  );
};

export default ProfileHeader;