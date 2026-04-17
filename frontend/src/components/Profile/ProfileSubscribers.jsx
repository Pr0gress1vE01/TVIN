import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiUserPlus } from 'react-icons/fi';
import './ProfileSubscribers.scss';

const ProfileSubscribers = ({ userId, count, isOwnProfile }) => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchSubscribers();
    }
  }, [userId]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/user/${userId}/subscribers`);
      setSubscribers(response.data || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-subscribers-card skeleton">
        <div className="card-header">
          <FiUserPlus />
          <span>Подписчики</span>
        </div>
      </div>
    );
  }

  if (subscribers.length === 0 && !isOwnProfile) return null;

  return (
    <div className="profile-subscribers-card">
      <div className="card-header">
        <FiUserPlus />
        <span>Подписчики</span>
        <span className="count">{count || subscribers.length}</span>
      </div>
      
      <div className="subscribers-grid">
        {subscribers.slice(0, 4).map(subscriber => (
          <Link to={`/profile/${subscriber.username}`} key={subscriber._id} className="subscriber-item">
            <img src={subscriber.avatar || '/default-avatar.svg'} alt="" />
            <span>{subscriber.firstName || subscriber.username}</span>
          </Link>
        ))}
      </div>
      
      {subscribers.length === 0 && isOwnProfile && (
        <div className="empty-subscribers">
          <p>У вас пока нет подписчиков</p>
        </div>
      )}
    </div>
  );
};

export default ProfileSubscribers;