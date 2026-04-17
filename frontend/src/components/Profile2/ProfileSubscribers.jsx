import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiUserPlus } from 'react-icons/fi';
import './ProfileSubscribers.scss';

const ProfileSubscribers = ({ userId, count, isOwnProfile }) => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscribers();
  }, [userId]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/user/${userId}/subscribers`);
      setSubscribers(response.data || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
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
        <span className="count">{count}</span>
      </div>
      
      <div className="subscribers-grid">
        {subscribers.slice(0, 4).map(sub => (
          <Link to={`/profile/${sub.username}`} key={sub._id} className="subscriber-item">
            <img src={sub.avatar || '/default-avatar.svg'} alt="" />
            <span>{sub.firstName || sub.username}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProfileSubscribers;