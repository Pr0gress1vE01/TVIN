import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';
import { 
  FiServer, 
  FiDatabase, 
  FiWifi, 
  FiCpu,
  FiHardDrive,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiUsers,
  FiActivity,
  FiZap,
  FiGlobe,
  FiEye,
  FiMessageSquare,
  FiUserCheck
} from 'react-icons/fi';
import './Diagnostics.scss';

const Diagnostics = () => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketLatency, setSocketLatency] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { connected, ping, socket } = useSocket();

  useEffect(() => {
    fetchAllData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchAllData, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchAllData = () => {
    fetchDiagnostics();
    fetchPerformance();
    fetchActiveUsers();
    fetchSystemLogs();
    measureSocketLatency();
  };

  const fetchDiagnostics = async () => {
    try {
      const response = await axios.get('/api/diagnostics');
      setDiagnostics(response.data);
    } catch (error) {
      console.error('Error fetching diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await axios.get('/api/diagnostics/performance');
      setPerformance(response.data);
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const response = await axios.get('/api/diagnostics/users');
      setActiveUsers(response.data);
    } catch (error) {
      console.error('Error fetching active users:', error);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const response = await axios.get('/api/diagnostics/logs');
      setSystemLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const measureSocketLatency = async () => {
    try {
      const result = await ping();
      setSocketLatency(result.latency);
    } catch (error) {
      setSocketLatency(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'active':
      case 'online':
        return <FiCheckCircle className="status-icon success" />;
      case 'disconnected':
      case 'error':
      case 'offline':
        return <FiXCircle className="status-icon error" />;
      default:
        return <FiAlertCircle className="status-icon warning" />;
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '0с';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) return `${days}д ${hours}ч ${minutes}м`;
    if (hours > 0) return `${hours}ч ${minutes}м ${secs}с`;
    if (minutes > 0) return `${minutes}м ${secs}с`;
    return `${secs}с`;
  };

  const getLatencyClass = (latency) => {
    if (latency < 50) return 'excellent';
    if (latency < 100) return 'good';
    if (latency < 300) return 'warning';
    return 'bad';
  };

  if (loading) {
    return (
      <div className="diagnostics-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Загрузка диагностики...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="diagnostics-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="diagnostics-header">
        <h1>Диагностика системы</h1>
        <div className="header-controls">
          <label className="auto-refresh">
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Автообновление</span>
          </label>
          <button 
            className="icon-button"
            onClick={fetchAllData}
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      <div className="diagnostics-grid">
        {/* Общий статус */}
        <div className="diagnostic-card">
          <div className="card-header">
            <FiServer />
            <h3>Статус системы</h3>
          </div>
          <div className="card-content">
            <div className="status-item">
              <span>Общий статус</span>
              <div className="status-value">
                {getStatusIcon(diagnostics?.status)}
                <span className={`status-text ${diagnostics?.status}`}>
                  {diagnostics?.status === 'healthy' ? 'Стабильно' : 
                   diagnostics?.status === 'degraded' ? 'Пониженная производительность' : 
                   'Проблемы'}
                </span>
              </div>
            </div>
            <div className="status-item">
              <span>Время работы</span>
              <div className="status-value">
                <FiClock />
                <span>{formatUptime(diagnostics?.uptime)}</span>
              </div>
            </div>
            <div className="status-item">
              <span>WebSocket</span>
              <div className="status-value">
                {getStatusIcon(connected ? 'connected' : 'disconnected')}
                <span>{connected ? 'Подключен' : 'Отключен'}</span>
              </div>
            </div>
            {socketLatency && (
              <div className="status-item">
                <span>Задержка WebSocket</span>
                <div className="status-value">
                  <span className={`latency ${getLatencyClass(socketLatency)}`}>
                    {socketLatency}ms
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Активные пользователи */}
        <div className="diagnostic-card">
          <div className="card-header">
            <FiUsers />
            <h3>Активные пользователи</h3>
          </div>
          <div className="card-content">
            <div className="status-item">
              <span>Всего онлайн</span>
              <div className="status-value highlight">
                <span>{activeUsers.length}</span>
              </div>
            </div>
            <div className="active-users-list">
              {activeUsers.slice(0, 5).map(user => (
                <div key={user._id} className="active-user">
                  <img src={user.avatar || '/default-avatar.svg'} alt="" />
                  <div className="user-info">
                    <span className="username">{user.username}</span>
                    <span className="status">{user.status}</span>
                  </div>
                  <span className={`connection-status ${user.connectionQuality}`}>
                    {user.connectionQuality === 'excellent' && <FiZap />}
                  </span>
                </div>
              ))}
              {activeUsers.length > 5 && (
                <button className="show-more">
                  +{activeUsers.length - 5} ещё
                </button>
              )}
            </div>
          </div>
        </div>

        {/* База данных */}
        <div className="diagnostic-card">
          <div className="card-header">
            <FiDatabase />
            <h3>База данных</h3>
          </div>
          <div className="card-content">
            <div className="status-item">
              <span>Статус</span>
              <div className="status-value">
                {getStatusIcon(diagnostics?.database?.status)}
                <span>{diagnostics?.database?.status}</span>
              </div>
            </div>
            <div className="status-item">
              <span>Задержка</span>
              <div className="status-value">
                <span className={`latency ${getLatencyClass(diagnostics?.database?.latency)}`}>
                  {diagnostics?.database?.latency}ms
                </span>
              </div>
            </div>
            <div className="status-item">
              <span>Коллекций</span>
              <div className="status-value">
                <span>{diagnostics?.database?.collections || 0}</span>
              </div>
            </div>
            <div className="status-item">
              <span>Документов</span>
              <div className="status-value">
                <span>{diagnostics?.database?.documents || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Память */}
        <div className="diagnostic-card">
          <div className="card-header">
            <FiHardDrive />
            <h3>Использование памяти</h3>
          </div>
          <div className="card-content">
            <div className="status-item">
              <span>Heap использовано</span>
              <div className="status-value">
                <span>{formatBytes(diagnostics?.memory?.heapUsed)}</span>
              </div>
            </div>
            <div className="status-item">
              <span>Heap всего</span>
              <div className="status-value">
                <span>{formatBytes(diagnostics?.memory?.heapTotal)}</span>
              </div>
            </div>
            <div className="memory-bar">
              <div 
                className={`memory-usage ${diagnostics?.memory?.usagePercent > 80 ? 'warning' : ''}`}
                style={{ width: `${diagnostics?.memory?.usagePercent || 0}%` }}
              />
            </div>
            <div className="status-item">
              <span>RSS</span>
              <div className="status-value">
                <span>{formatBytes(diagnostics?.memory?.rss)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CPU */}
        {performance && (
          <div className="diagnostic-card">
            <div className="card-header">
              <FiCpu />
              <h3>Процессор</h3>
            </div>
            <div className="card-content">
              <div className="status-item">
                <span>Модель</span>
                <div className="status-value">
                  <span>{performance.cpu.model.split('@')[0]}</span>
                </div>
              </div>
              <div className="status-item">
                <span>Ядер</span>
                <div className="status-value">
                  <span>{performance.cpu.cores}</span>
                </div>
              </div>
              <div className="status-item">
                <span>Загрузка</span>
                <div className="status-value">
                  <div className="load-avg">
                    <span>1м: {performance.cpu.loadavg[0].toFixed(2)}</span>
                    <span>5м: {performance.cpu.loadavg[1].toFixed(2)}</span>
                    <span>15м: {performance.cpu.loadavg[2].toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Системная память */}
        {performance && (
          <div className="diagnostic-card">
            <div className="card-header">
              <FiHardDrive />
              <h3>Системная память</h3>
            </div>
            <div className="card-content">
              <div className="status-item">
                <span>Использовано</span>
                <div className="status-value">
                  <span>{formatBytes(performance.memory.used)}</span>
                </div>
              </div>
              <div className="status-item">
                <span>Свободно</span>
                <div className="status-value">
                  <span>{formatBytes(performance.memory.free)}</span>
                </div>
              </div>
              <div className="status-item">
                <span>Всего</span>
                <div className="status-value">
                  <span>{formatBytes(performance.memory.total)}</span>
                </div>
              </div>
              <div className="memory-bar">
                <div 
                  className={`memory-usage ${performance.memory.usagePercent > 80 ? 'warning' : ''}`}
                  style={{ width: `${performance.memory.usagePercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Сетевые интерфейсы */}
        {performance && (
          <div className="diagnostic-card wide">
            <div className="card-header">
              <FiGlobe />
              <h3>Сетевые интерфейсы</h3>
            </div>
            <div className="card-content">
              {Object.entries(performance.network).map(([name, interfaces]) => (
                interfaces.filter(i => i.family === 'IPv4').map((iface, idx) => (
                  <div key={`${name}-${idx}`} className="status-item">
                    <span>{name}</span>
                    <div className="status-value">
                      <span>{iface.address}</span>
                    </div>
                  </div>
                ))
              ))}
            </div>
          </div>
        )}

        {/* Системные логи */}
        <div className="diagnostic-card wide">
          <div className="card-header">
            <FiActivity />
            <h3>Системные события</h3>
          </div>
          <div className="card-content">
            <div className="logs-list">
              {systemLogs.slice(0, 10).map((log, index) => (
                <div key={index} className={`log-item ${log.level}`}>
                  <span className="log-time">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`log-level ${log.level}`}>{log.level}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="diagnostics-footer">
        <p>Последнее обновление: {new Date(diagnostics?.lastUpdate).toLocaleString('ru-RU')}</p>
        <p className="version">TVIN Messenger v1.0.0</p>
      </div>
    </motion.div>
  );
};

export default Diagnostics;