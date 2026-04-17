import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FiCamera } from 'react-icons/fi';
import axios from 'axios';
import './ProfileBanner.scss';

const ProfileBanner = ({ bannerUrl, isOwnProfile, onBannerChange }) => {
  const fileInputRef = useRef(null);

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('banner', file);

    try {
      const response = await axios.post('/api/user/banner', formData);
      onBannerChange(response.data.banner);
    } catch (error) {
      console.error('Error uploading banner:', error);
    }
  };

  return (
    <motion.div 
      className="profile-banner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div 
        className="banner-image"
        style={{ 
          backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'linear-gradient(135deg, #0088cc, #006699)'
        }}
      >
        <div className="banner-overlay" />
      </div>

      {isOwnProfile && (
        <>
          <button 
            className="change-banner-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiCamera /> Изменить обложку
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            hidden
          />
        </>
      )}
    </motion.div>
  );
};

export default ProfileBanner;