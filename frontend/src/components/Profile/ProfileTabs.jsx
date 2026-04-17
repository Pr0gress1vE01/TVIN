import React from 'react';
import { FiGrid, FiFilm, FiMusic, FiFile } from 'react-icons/fi';
import './ProfileTabs.scss';

const ProfileTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'posts', icon: FiGrid, label: 'Посты' },
    { id: 'reels', icon: FiFilm, label: 'Reels' },
    { id: 'music', icon: FiMusic, label: 'Музыка' },
    { id: 'files', icon: FiFile, label: 'Файлы' }
  ];

  return (
    <div className="profile-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <tab.icon />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ProfileTabs;