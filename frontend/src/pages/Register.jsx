import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { 
  FiCamera, FiMapPin, FiMoreHorizontal, FiUserPlus, 
  FiUserCheck, FiMessageCircle, FiEdit3, FiLink,
  FiChevronRight, FiCalendar, FiUsers, FiX
} from 'react-icons/fi';
import ProfilePosts from '../components/Profile/ProfilePosts';
import ProfileFriends from '../components/Profile/ProfileFriends';
import ProfileSubscribers from '../components/Profile/ProfileSubscribers';
import ProfileChannels from '../components/Profile/ProfileChannels';
import ProfileSkeleton from '../components/Profile/ProfileSkeleton';
import EditProfileModal from '../components/Profile/EditProfileModal';
import './Profile.scss';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const { onlineUsers } = useSocket();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [stats, setStats] = useState({ posts: 0, friends: 0, subscribers: 0, channels: 0 });

  const isOwnProfile = !userId || userId === currentUser?.username || userId === currentUser?._id;
  const targetIdentifier = userId || currentUser?.username;
  const isOnline = onlineUsers.has(profile?._id);
  const isFriend = profile?.contacts?.some(c => c._id === currentUser?._id);

  useEffect(() => {
    if (targetIdentifier) {
      fetchProfile();
    }
  }, [targetIdentifier]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/user/${targetIdentifier}`);
      setProfile(response.data);
      
      // Обновляем статистику
      const friendsCount = response.data.contacts?.length || 0;
      setStats({
        posts: response.data.postsCount || 0,
        friends: friendsCount,
        subscribers: response.data.subscribersCount || 0,
        channels: response.data.channelsCount || 0
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await axios.post('/api/user/avatar', formData);
      setProfile(prev => ({ ...prev, avatar: response.data.url }));
      if (isOwnProfile) updateUser({ ...currentUser, avatar: response.data.url });
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('banner', file);
    
    try {
      const response = await axios.post('/api/user/banner', formData);
      setProfile(prev => ({ ...prev, banner: response.data.url }));
    } catch (error) {
      console.error('Error uploading banner:', error);
    }
  };

  const handleStartChat = async () => {
    try {
      const response = await axios.post('/api/chat/direct', { userId: profile._id });
      navigate(`/chat/${response.data._id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleFriendAction = async () => {
    try {
      if (isFriend) {
        await axios.delete(`/api/contacts/${profile._id}`);
      } else {
        await axios.post(`/api/contacts/request/${profile._id}`);
      }
      fetchProfile();
    } catch (error) {
      console.error('Error with friend action:', error);
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(prev => ({ ...prev, ...updatedProfile }));
    if (isOwnProfile) updateUser({ ...currentUser, ...updatedProfile });
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="error-state">
          <h2>Профиль не найден</h2>
          <button onClick={() => navigate('/feed')}>Вернуться</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Баннер */}
      <div className="profile-banner">
        <div 
          className="banner-image"
          style={{ 
            backgroundImage: profile.banner 
              ? `url(${profile.banner})` 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
          }}
        >
          {isOwnProfile && (
            <label className="change-banner-btn">
              <FiCamera />
              <span>Обновить обложку</span>
              <input type="file" accept="image/*" onChange={handleBannerUpload} hidden />
            </label>
          )}
        </div>
      </div>

      <div className="profile-container">
        {/* Левая колонка */}
        <div className="profile-sidebar">
          {/* Карточка профиля */}
          <div className="profile-card">
            <div className="avatar-section">
              <div className="avatar-wrapper">
                <img src={profile.avatar || '/default-avatar.svg'} alt="" />
                {isOnline && <span className="online-indicator" />}
                {isOwnProfile && (
                  <label className="change-avatar">
                    <FiCamera />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
                  </label>
                )}
              </div>
              
              <div className="profile-name-status">
                <h2>{profile.firstName} {profile.lastName}</h2>
                <span className={`status-badge ${profile.status || 'online'}`}>
                  {profile.status === 'dnd' ? 'Не беспокоить' : 
                   profile.status === 'online' ? 'Онлайн' : 
                   profile.status === 'away' ? 'Отошел' : 'Не в сети'}
                </span>
              </div>
            </div>

            <div className="profile-actions">
              {isOwnProfile ? (
                <>
                  <button className="btn-secondary" onClick={() => setIsEditing(true)}>
                    <FiEdit3 /> Редактировать
                  </button>
                  <div className="dropdown">
                    <button className="btn-icon" onClick={() => setShowMenu(!showMenu)}>
                      <FiMoreHorizontal />
                    </button>
                    {showMenu && (
                      <div className="dropdown-menu">
                        <button onClick={() => navigate('/settings')}>Настройки</button>
                        <button>Архив постов</button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button className="btn-primary" onClick={handleStartChat}>
                    <FiMessageCircle /> Сообщение
                  </button>
                  <button 
                    className={`btn-secondary ${isFriend ? 'active' : ''}`}
                    onClick={handleFriendAction}
                  >
                    {isFriend ? <FiUserCheck /> : <FiUserPlus />}
                    {isFriend ? 'В друзьях' : 'Добавить'}
                  </button>
                  <button className="btn-icon">
                    <FiMoreHorizontal />
                  </button>
                </>
              )}
            </div>

            <div className="profile-info">
              {profile.location && (
                <div className="info-item">
                  <FiMapPin /> {profile.location}
                </div>
              )}
              {profile.website && (
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="info-item link"
                >
                  <FiLink /> {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {profile.website && (
                <div className="info-item">
                  <FiCalendar /> {new Date(profile.createdAt).toLocaleDateString('ru-RU', { 
                    day: 'numeric', month: 'long', year: 'numeric' 
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Подписчики */}
          <ProfileSubscribers 
            userId={profile._id} 
            count={stats.subscribers}
            isOwnProfile={isOwnProfile}
          />

          {/* Друзья */}
          <ProfileFriends 
            userId={profile._id} 
            count={stats.friends}
            isOwnProfile={isOwnProfile}
          />

          {/* Каналы */}
          <ProfileChannels 
            userId={profile._id} 
            count={stats.channels}
            isOwnProfile={isOwnProfile}
          />
        </div>

        {/* Правая колонка - Посты */}
        <div className="profile-main">
          <div className="posts-header">
            <h3>Мои посты</h3>
            <Link to={`/profile/${profile.username}/archive`} className="archive-link">
              Архив постов <FiChevronRight />
            </Link>
          </div>
          
          <ProfilePosts 
            userId={profile._id} 
            isOwnProfile={isOwnProfile}
          />
        </div>
      </div>

      {/* Модалка редактирования */}
      <EditProfileModal 
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        profile={profile}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default Profile;