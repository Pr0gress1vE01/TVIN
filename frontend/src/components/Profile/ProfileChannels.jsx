import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiRadio, FiChevronRight } from 'react-icons/fi';
import './ProfileChannels.scss';

const ProfileChannels = ({ userId, count, isOwnProfile }) => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchChannels();
    }
  }, [userId]);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/user/${userId}/channels`);
      setChannels(response.data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-channels-card skeleton">
        <div className="card-header">
          <FiRadio />
          <span>Каналы</span>
        </div>
      </div>
    );
  }

  if (channels.length === 0 && !isOwnProfile) return null;

  return (
    <div className="profile-channels-card">
      <div className="card-header">
        <FiRadio />
        <span>Каналы</span>
        <span className="count">{count || channels.length}</span>
      </div>
      
      <div className="channels-list">
        {channels.slice(0, 5).map(channel => (
          <Link to={`/channel/${channel._id}`} key={channel._id} className="channel-item">
            <img src={channel.avatar || '/default-channel.svg'} alt="" />
            <div className="channel-info">
              <span className="channel-name">{channel.name}</span>
              <span className="channel-subscribers">{channel.subscribersCount} подписчиков</span>
            </div>
          </Link>
        ))}
      </div>
      
      {channels.length > 5 && (
        <Link to={`/profile/${userId}/channels`} className="view-all">
          Показать все <FiChevronRight />
        </Link>
      )}
      
      {channels.length === 0 && isOwnProfile && (
        <div className="empty-channels">
          <p>У вас пока нет каналов</p>
          <button>Создать канал</button>
        </div>
      )}
    </div>
  );
};

export default ProfileChannels;