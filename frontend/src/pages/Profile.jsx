import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { 
  FiCamera, FiMapPin, FiMoreHorizontal, FiUserPlus, 
  FiUserCheck, FiMessageCircle, FiMusic, FiImage, 
  FiVideo, FiFolder, FiPlayCircle, FiChevronRight,
  FiEdit3, FiSettings, FiShare2, FiUsers
} from 'react-icons/fi';
import './Profile.scss';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const { onlineUsers } = useSocket();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('music');
  const [stats, setStats] = useState({ posts: 0, friends: 0, subscribers: 0 });
  const [friends, setFriends] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const isOwnProfile = !userId || userId === currentUser?.username || userId === currentUser?._id;
  const targetIdentifier = userId || currentUser?.username;
  const isOnline = onlineUsers.has(profile?._id);
  const isFriend = friends.some(f => f._id === currentUser?._id);

  // Демо-данные для музыки
  const musicTracks = [
    { id: 1, title: 'Плакала', artist: 'KAZKA', duration: '3:45', cover: null },
    { id: 2, title: 'Piece Of Heaven', artist: 'Tame Impala', duration: '4:45', cover: null },
    { id: 3, title: 'остров (slowed/reverb)', artist: 'мь', duration: '2:39', cover: null },
    { id: 4, title: '#ЛЯШКИВКУСН...', artist: 'ЯКОРЬ, НАВЕРНОЕ...', duration: '1:39', cover: null },
  ];

  useEffect(() => {
    if (targetIdentifier) {
      fetchProfile();
      fetchFriends();
      fetchSubscribers();
    }
  }, [targetIdentifier]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/user/${targetIdentifier}`);
      setProfile(response.data);
      setEditForm({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        bio: response.data.bio || '',
        location: response.data.location || '',
        status: response.data.status || ''
      });
      setStats(prev => ({ 
        ...prev, 
        posts: response.data.postsCount || 0,
        friends: response.data.contacts?.length || 0
      }));
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`/api/user/${targetIdentifier}/friends`);
      setFriends(response.data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchSubscribers = async () => {
    // Заглушка для подписчиков
    setSubscribers([
      { id: 1, name: 'Артём', avatar: null },
      { id: 2, name: 'Dmitriy', avatar: null },
      { id: 3, name: 'Александр', avatar: null },
      { id: 4, name: 'Олег', avatar: null },
    ]);
    setStats(prev => ({ ...prev, subscribers: 232 }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const response = await axios.post('/api/user/avatar', formData);
      setProfile(prev => ({ ...prev, avatar: response.data.url }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await axios.patch('/api/user/profile', editForm);
      setProfile(prev => ({ ...prev, ...response.data }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
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
      fetchFriends();
    } catch (error) {
      console.error('Error with friend action:', error);
    }
  };

  const tabs = [
    { id: 'music', icon: FiMusic, label: 'Музыка' },
    { id: 'photos', icon: FiImage, label: 'Фото' },
    { id: 'videos', icon: FiVideo, label: 'Видео' },
    { id: 'albums', icon: FiFolder, label: 'Альбомы' },
    { id: 'clips', icon: FiPlayCircle, label: 'Клипы' },
  ];

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
      <div className="profile-container">
        {/* Левая колонка */}
        <div className="profile-sidebar">
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
              <div className="profile-status">
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
                  <button className="btn-icon" onClick={() => setShowMenu(!showMenu)}>
                    <FiMoreHorizontal />
                  </button>
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
                  </button>
                  <button className="btn-icon" onClick={() => setShowMenu(!showMenu)}>
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
                  🔗 {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <button className="info-item link">Подробнее</button>
            </div>
          </div>

          {/* Подписчики */}
          <div className="section-card">
            <div className="section-header">
              <h3>Подписчики <span>{stats.subscribers}</span></h3>
            </div>
            <div className="users-grid">
              {subscribers.slice(0, 4).map(user => (
                <div key={user.id} className="user-item">
                  <img src={user.avatar || '/default-avatar.svg'} alt="" />
                  <span>{user.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Друзья */}
          <div className="section-card">
            <div className="section-header">
              <h3>Друзья <span>{friends.length}</span></h3>
            </div>
            <div className="users-grid">
              {friends.slice(0, 4).map(friend => (
                <Link to={`/profile/${friend.username}`} key={friend._id} className="user-item">
                  <img src={friend.avatar || '/default-avatar.svg'} alt="" />
                  <span>{friend.firstName || friend.username}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Каналы */}
          <div className="section-card">
            <div className="section-header">
              <h3>Каналы <span>318</span></h3>
            </div>
            <div className="channels-list">
              {['Рифмы и Панчи', 'Инцидент Тверь', 'Загуглено', 'Осторожно: Тверь'].map((name, i) => (
                <div key={i} className="channel-item">
                  <span>📢 {name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Правая колонка - основной контент */}
        <div className="profile-main">
          {/* Табы */}
          <div className="profile-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon /> {tab.label}
              </button>
            ))}
          </div>

          {/* Контент табов */}
          <div className="profile-content">
            {activeTab === 'music' && (
              <div className="music-section">
                <div className="playlist-header">
                  <div className="playlist-info">
                    <div className="playlist-cover">🎵</div>
                    <div>
                      <h3>Вернёмся в 2К17. 2К18(немного...)</h3>
                      <p>Плейлист, драки, лей-так я... ремикс ремикс ремикс ремикс...</p>
                    </div>
                  </div>
                </div>
                
                <div className="tracks-list">
                  {musicTracks.map((track, index) => (
                    <div key={track.id} className="track-item">
                      <span className="track-index">{index + 1}</span>
                      <div className="track-cover">🎵</div>
                      <div className="track-info">
                        <span className="track-title">{track.title}</span>
                        <span className="track-artist">{track.artist}</span>
                      </div>
                      <span className="track-duration">{track.duration}</span>
                      <button className="track-play">▶</button>
                    </div>
                  ))}
                </div>

                <button className="show-all-btn">
                  Показать всё <FiChevronRight />
                </button>
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="empty-tab">
                <FiImage size={48} />
                <h3>Фотографии</h3>
                <p>Здесь будут фотографии</p>
              </div>
            )}

            {activeTab === 'videos' && (
              <div className="empty-tab">
                <FiVideo size={48} />
                <h3>Видео</h3>
                <p>Здесь будут видео</p>
              </div>
            )}

            {activeTab === 'albums' && (
              <div className="empty-tab">
                <FiFolder size={48} />
                <h3>Альбомы</h3>
                <p>Здесь будут альбомы</p>
              </div>
            )}

            {activeTab === 'clips' && (
              <div className="empty-tab">
                <FiPlayCircle size={48} />
                <h3>Клипы</h3>
                <p>Здесь будут клипы</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модалка редактирования */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEditing(false)}
          >
            <motion.div 
              className="edit-modal"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <h2>Редактировать профиль</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Имя</label>
                  <input value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Фамилия</label>
                  <input value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} />
                </div>
              </div>
              
              <div className="form-group">
                <label>Статус</label>
                <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                  <option value="online">Онлайн</option>
                  <option value="dnd">Не беспокоить</option>
                  <option value="away">Отошел</option>
                  <option value="offline">Не в сети</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>О себе</label>
                <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} rows={3} />
              </div>
              
              <div className="form-group">
                <label>Местоположение</label>
                <input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} />
              </div>
              
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setIsEditing(false)}>Отмена</button>
                <button className="btn-primary" onClick={handleSaveProfile}>Сохранить</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProfileSkeleton = () => (
  <div className="profile-page">
    <div className="profile-container">
      <div className="profile-sidebar">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
      <div className="profile-main">
        <div className="skeleton-tabs" />
        <div className="skeleton-content" />
      </div>
    </div>
  </div>
);

export default Profile;