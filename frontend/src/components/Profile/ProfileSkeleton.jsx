import React from 'react';
import './ProfileSkeleton.scss';

const ProfileSkeleton = () => (
  <div className="profile-panel-content">
    <div className="profile-header">
      <div className="avatar-section">
        <div className="skeleton-avatar" />
        <div className="header-stats">
          <div className="skeleton-stat" />
          <div className="skeleton-stat" />
          <div className="skeleton-stat" />
        </div>
      </div>
      <div className="skeleton-line" style={{ width: '60%', height: 24, marginTop: 16 }} />
      <div className="skeleton-line" style={{ width: '40%', height: 16, marginTop: 8 }} />
      <div className="skeleton-line" style={{ height: 44, marginTop: 16 }} />
      <div className="skeleton-line" style={{ height: 80, marginTop: 16 }} />
    </div>
    
    <div className="profile-tabs">
      <div className="skeleton-tab" />
      <div className="skeleton-tab" />
      <div className="skeleton-tab" />
      <div className="skeleton-tab" />
    </div>
    
    <div className="posts-grid-loading" style={{ padding: 2 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="skeleton-post" />
      ))}
    </div>
  </div>
);

export default ProfileSkeleton;