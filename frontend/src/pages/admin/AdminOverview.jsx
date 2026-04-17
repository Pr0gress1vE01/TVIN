import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  FiUsers, 
  FiMessageCircle, 
  FiFileText, 
  FiActivity,
  FiTrendingUp,
  FiTrendingDown,
  FiUserPlus,
  FiClock
} from 'react-icons/fi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const AdminOverview = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/api/admin/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-overview">
      <h1>Панель управления</h1>
      <p className="welcome-text">
        Добро пожаловать в админ-панель TVIN Messenger
      </p>

      <div className="stats-grid">
        <motion.div 
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-icon">
            <FiUsers />
          </div>
          <div className="stat-info">
            <span className="stat-value">{statistics?.overview?.totalUsers || 0}</span>
            <span className="stat-label">Всего пользователей</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card success"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="stat-icon">
            <FiActivity />
          </div>
          <div className="stat-info">
            <span className="stat-value">{statistics?.overview?.onlineUsers || 0}</span>
            <span className="stat-label">Онлайн</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="stat-icon">
            <FiMessageCircle />
          </div>
          <div className="stat-info">
            <span className="stat-value">{statistics?.overview?.totalChats || 0}</span>
            <span className="stat-label">Чатов</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="stat-icon">
            <FiFileText />
          </div>
          <div className="stat-info">
            <span className="stat-value">{statistics?.overview?.totalPosts || 0}</span>
            <span className="stat-label">Постов</span>
          </div>
        </motion.div>
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Новые пользователи</h3>
            <Link to="/admin/users" className="view-all">Все</Link>
          </div>
          <div className="recent-users">
            {statistics?.recentUsers?.map(user => (
              <div key={user._id} className="recent-user-item">
                <img src={user.avatar || '/default-avatar.svg'} alt="" />
                <div className="user-info">
                  <span className="name">{user.username}</span>
                  <span className="date">
                    {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: ru })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Статистика сообщений</h3>
          </div>
          <div className="messages-chart">
            {statistics?.messagesByDay?.map(day => (
              <div key={day._id} className="chart-bar">
                <div 
                  className="bar-fill"
                  style={{ 
                    height: `${Math.min((day.count / 100) * 100, 100)}%` 
                  }}
                />
                <span className="bar-label">
                  {format(new Date(day._id), 'dd.MM')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Распределение по ролям</h3>
        </div>
        <div className="roles-distribution">
          <div className="role-item">
            <span className="role-label">Администраторы</span>
            <span className="role-value">{statistics?.usersByRole?.admin || 0}</span>
          </div>
          <div className="role-item">
            <span className="role-label">Модераторы</span>
            <span className="role-value">{statistics?.usersByRole?.moderator || 0}</span>
          </div>
          <div className="role-item">
            <span className="role-label">Пользователи</span>
            <span className="role-value">{statistics?.usersByRole?.user || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;