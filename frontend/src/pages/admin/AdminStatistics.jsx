import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  FiUsers, 
  FiMessageCircle, 
  FiFileText,
  FiTrendingUp
} from 'react-icons/fi';

const AdminStatistics = () => {
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
    <div className="admin-statistics">
      <h2>Статистика системы</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FiUsers />
          </div>
          <div className="stat-info">
            <span className="stat-value">{statistics?.overview?.totalUsers || 0}</span>
            <span className="stat-label">Пользователей</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <FiTrendingUp />
          </div>
          <div className="stat-info">
            <span className="stat-value">{statistics?.overview?.onlineUsers || 0}</span>
            <span className="stat-label">Онлайн</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FiMessageCircle />
          </div>
          <div className="stat-info">
            <span className="stat-value">{statistics?.overview?.totalMessages || 0}</span>
            <span className="stat-label">Сообщений</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FiFileText />
          </div>
          <div className="stat-info">
            <span className="stat-value">{statistics?.overview?.totalPosts || 0}</span>
            <span className="stat-label">Постов</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;