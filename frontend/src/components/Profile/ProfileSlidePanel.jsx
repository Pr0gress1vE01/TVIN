import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import axios from 'axios';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import ProfilePosts from './ProfilePosts';
import ProfileMusic from './ProfileMusic';
import ProfileFiles from './ProfileFiles';
import ProfileSkeleton from './ProfileSkeleton';
import { FiX } from 'react-icons/fi';
import './ProfileSlidePanel.scss';

const ProfileSlidePanel = () => {
  const { isOpen, profileUser, closeProfile, loading, setLoading } = useProfile();
  const { user: currentUser } = useAuth();
  const { onlineUsers } = useSocket();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [scrollProgress, setScrollProgress] = useState(0);
  const panelRef = useRef(null);
  const contentRef = useRef(null);

  const isOwnProfile = profileUser?._id === currentUser?._id || 
                       profileUser?.username === currentUser?.username;

  useEffect(() => {
    if (profileUser && isOpen) {
      fetchProfile();
    }
  }, [profileUser, isOpen]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const identifier = profileUser._id || profileUser.username;
      const response = await axios.get(`/api/user/${identifier}`);
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const scrollHeight = e.target.scrollHeight - e.target.clientHeight;
    const progress = (scrollTop / scrollHeight) * 100;
    setScrollProgress(Math.min(progress, 100));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleProfileUpdate = (updatedData) => {
    setProfile(prev => ({ ...prev, ...updatedData }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="profile-slide-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeProfile}
      >
        <motion.div 
          ref={panelRef}
          className="profile-slide-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="close-panel-btn" onClick={closeProfile}>
            <FiX />
          </button>

          {loading || !profile ? (
            <ProfileSkeleton />
          ) : (
            <div 
              ref={contentRef}
              className="profile-panel-content"
              onScroll={handleScroll}
            >
              <div 
                className="scroll-progress" 
                style={{ transform: `scaleX(${scrollProgress / 100})` }}
              />

              <ProfileHeader 
                profile={profile}
                isOwnProfile={isOwnProfile}
                isOnline={onlineUsers.has(profile._id)}
                onUpdate={handleProfileUpdate}
                onClose={closeProfile}
              />

              <ProfileTabs 
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />

              <div className="tab-content-wrapper">
                {activeTab === 'posts' && (
                  <ProfilePosts userId={profile._id} isOwnProfile={isOwnProfile} />
                )}
                {activeTab === 'reels' && (
                  <ProfilePosts userId={profile._id} type="reels" />
                )}
                {activeTab === 'music' && (
                  <ProfileMusic userId={profile._id} />
                )}
                {activeTab === 'files' && (
                  <ProfileFiles userId={profile._id} />
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileSlidePanel;