import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useSocket } from '../../hooks/useSocket';
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
  FiPause,
  FiPlay
} from 'react-icons/fi';

const AdminDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketLatency, setSocketLatency] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const { connected, ping, socket } = useSocket();

  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchDiagnostics(),
      fetchPerformance(),
      measureSocketLatency()
    ]);
  }, []);

  useEffect(() => {
    fetchAllData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchAllData, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, fetchAllData]);

  const fetchDiagnostics = async () => {
    try {
      const response = await axios.get('/api/admin/diagnostics');
      setDiagnostics(response.data);
    } catch (error) {
      console.error('Error fetching diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await axios.get('/api/admin/performance');
      setPerformance(response.data);
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  };

  const measureSocketLatency = async () => {
    if (!socket || !connected) {
      setSocketLatency(null);
      return;
    }

    try {
      const startTime = Date.now();
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
        socket.emit('ping', (response) => {
          clearTimeout(timeout);
          resolve(response);
        });
      });
      setSocketLatency(Date.now() - startTime);
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
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-diagnostics">
      <div className="admin-card-header">
        <h2>Диагностика системы</h2>
        <div className="header-controls">
          <div className="refresh-controls">
            <label className="auto-refresh">
              <input 
                type="checkbox" 
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span>Автообновление</span>
            </label>
            {autoRefresh && (
              <select 
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="interval-select"
              >
                <option value={2000}>2 сек</option>
                <option value={5000}>5 сек</option>
                <option value={10000}>10 сек</option>
                <option value={30000}>30 сек</option>
              </select>
            )}
          </div>
          <button 
            className="icon-button"
            onClick={fetchAllData}
            title="Обновить сейчас"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      <div className="diagnostics-grid">
        {/* Статус системы */}
        <div className="diagnostic-card">
          <div className="card-header">
            <FiServer />
            <h3>Статус системы</h3>
            {autoRefresh && (
              <span className="auto-refresh-indicator">
                <FiPlay /> Обновление
              </span>
            )}
          </div>
          <div className="card-content">
            <div className="status-item">
              <span>Общий статус</span>
              <div className="status-value">
                {getStatusIcon(diagnostics?.status)}
                <span className={`status-text ${diagnostics?.status}`}>
                  {diagnostics?.status === 'healthy' ? 'Стабильно' : 
                   diagnostics?.status === 'degraded' ? 'Пониженная' : 
                   'Проблемы'}
                </span>
              </div>
            </div>
            <div className="status-item">
              <span>Аптайм системы</span>
              <div className="status-value">
                <FiClock />
                <span>{formatUptime(diagnostics?.system?.uptime)}</span>
              </div>
            </div>
            <div className="status-item">
              <span>Аптайм процесса</span>
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
                <span>Задержка WS</span>
                <div className="status-value">
                  <span className={`latency ${getLatencyClass(socketLatency)}`}>
                    {socketLatency}ms
                  </span>
                </div>
              </div>
            )}
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
                <span>{diagnostics?.database?.status || 'Неизвестно'}</span>
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
            <h3>Память процесса</h3>
          </div>
          <div className="card-content">
            <div className="status-item">
              <span>Heap Used</span>
              <div className="status-value">
                <span>{formatBytes(diagnostics?.memory?.heapUsed)}</span>
              </div>
            </div>
            <div className="status-item">
              <span>Heap Total</span>
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
                  <span className="truncate">{performance.cpu.model}</span>
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

        {/* WebSocket */}
        <div className="diagnostic-card">
          <div className="card-header">
            <FiWifi />
            <h3>WebSocket</h3>
          </div>
          <div className="card-content">
            <div className="status-item">
              <span>Статус</span>
              <div className="status-value">
                {getStatusIcon(connected ? 'connected' : 'disconnected')}
                <span>{connected ? 'Подключен' : 'Отключен'}</span>
              </div>
            </div>
            <div className="status-item">
              <span>Пользователей</span>
              <div className="status-value highlight">
                <FiUsers />
                <span>{diagnostics?.websocket?.connectedUsers || 0}</span>
              </div>
            </div>
            <div className="status-item">
              <span>Задержка</span>
              <div className="status-value">
                <span className={`latency ${getLatencyClass(socketLatency)}`}>
                  {socketLatency ? `${socketLatency}ms` : 'Н/Д'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card-footer">
        <span className="last-update">
          Последнее обновление: {new Date().toLocaleTimeString('ru-RU')}
        </span>
      </div>
    </div>
  );
};

export default AdminDiagnostics;