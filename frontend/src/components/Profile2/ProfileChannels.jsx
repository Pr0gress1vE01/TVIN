import React from 'react';
import { FiRadio } from 'react-icons/fi';
import './ProfileChannels.scss';

const ProfileChannels = ({ userId, count, isOwnProfile }) => {
  // Пока заглушка, позже подключим API
  const channels = [];

  if (count === 0 && !isOwnProfile) return null;

  return (
    <div className="profile-channels-card">
      <div className="card-header">
        <FiRadio />
        <span>Каналы</span>
        <span className="count">{count}</span>
      </div>
    </div>
  );
};

export default ProfileChannels;