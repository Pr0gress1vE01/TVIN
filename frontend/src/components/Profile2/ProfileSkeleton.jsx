import React from 'react';
import './ProfileSkeleton.scss';

const ProfileSkeleton = () => (
  <div className="profile-page">
    <div className="profile-banner">
      <div className="banner-image skeleton" />
    </div>
    
    <div className="profile-container">
      <div className="profile-sidebar">
        <div className="profile-card skeleton">
          <div className="skeleton-avatar" />
          <div className="skeleton-line" style={{ width: '60%', height: 20, marginTop: 12 }} />
          <div className="skeleton-line" style={{ width: '40%', height: 16, marginTop: 8 }} />
          <div className="skeleton-line" style={{ height: 40, marginTop: 20 }} />
        </div>
        
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
      
      <div className="profile-main">
        <div className="skeleton-header" />
        <div className="skeleton-posts">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-post" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default ProfileSkeleton;