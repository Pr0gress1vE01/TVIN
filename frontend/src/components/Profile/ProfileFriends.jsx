import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiUsers, FiChevronRight } from 'react-icons/fi';
import './ProfileFriends.scss';

const ProfileFriends = ({ userId, count, isOwnProfile }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchFriends();
    }
  }, [userId]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/user/${userId}/friends`);
      setFriends(response.data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-friends-card skeleton">
        <div className="card-header">
          <FiUsers />
          <span>Друзья</span>
        </div>
        <div className="friends-grid-skeleton">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-friend" />
          ))}
        </div>
      </div>
    );
  }

  if (friends.length === 0 && !isOwnProfile) return null;

  return (
    <div className="profile-friends-card">
      <div className="card-header">
        <FiUsers />
        <span>Друзья</span>
        <span className="count">{count || friends.length}</span>
      </div>
      
      <div className="friends-grid">
        {friends.slice(0, 4).map(friend => (
          <Link to={`/profile/${friend.username}`} key={friend._id} className="friend-item">
            <img src={friend.avatar || '/default-avatar.svg'} alt="" />
            <span>{friend.firstName || friend.username}</span>
          </Link>
        ))}
      </div>
      
      {friends.length > 4 && (
        <Link to={`/profile/${userId}/friends`} className="view-all">
          Показать всех <FiChevronRight />
        </Link>
      )}
      
      {friends.length === 0 && isOwnProfile && (
        <div className="empty-friends">
          <p>У вас пока нет друзей</p>
          <button>Найти друзей</button>
        </div>
      )}
    </div>
  );
};

export default ProfileFriends;