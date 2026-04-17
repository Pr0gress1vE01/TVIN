import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useSocket } from '../../hooks/useSocket';
import { 
  FiActivity, FiUsers, FiServer, FiBarChart2, FiFileText,
  FiShield, FiSettings, FiChevronRight, FiChevronLeft, FiHome,
  FiRefreshCw, FiSearch, FiTrash2, FiCheckCircle, FiClock,
  FiCpu, FiHardDrive, FiWifi, FiDatabase, FiTrendingUp,
  FiUserPlus, FiSave, FiZap, FiPlay, FiMessageCircle, FiAlertCircle,
  FiXCircle
} from 'react-icons/fi';
import './AdminPanel.scss';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (user?.role !== 'admin') {
    return <Navigate to="/feed" replace />;
  }

  const menuItems = [
    { id: 'overview', icon: FiHome, label: 'Обзор' },
    { id: 'users', icon: FiUsers, label: 'Пользователи' },
    { id: 'diagnostics', icon: FiActivity, label: 'Диагностика' },
    { id: 'statistics', icon: FiBarChart2, label: 'Статистика' },
    { id: 'logs', icon: FiFileText, label: 'Логи' },
    { id: 'settings', icon: FiSettings, label: 'Настройки' }
  ];

  const currentTab = menuItems.find(item => item.id === activeTab);

  return (
    <div className="admin-panel">
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <FiShield />
            {!sidebarCollapsed && <span>TVIN Admin</span>}
          </div>
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        <nav className="admin-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              title={sidebarCollapsed ? item.label : ''}
            >
              <item.icon />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <a href="/feed" className="back-to-app">
            <FiHome />
            {!sidebarCollapsed && <span>Вернуться</span>}
          </a>
          <div className="admin-user">
            <img src={user?.avatar || '/default-avatar.svg'} alt="" />
            {!sidebarCollapsed && (
              <div className="user-info">
                <span className="name">{user?.firstName} {user?.lastName}</span>
                <span className="role">Администратор</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>{currentTab?.label || 'Админ-панель'}</h1>
          <div className="admin-header-actions">
            <span className="admin-badge"><FiShield /> Администратор</span>
          </div>
        </header>

        <div className="admin-content">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'diagnostics' && <DiagnosticsTab />}
          {activeTab === 'statistics' && <StatisticsTab />}
          {activeTab === 'logs' && <LogsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </main>
    </div>
  );
};

// Обзор
const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/statistics')
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading"><div className="spinner" /></div>;

  return (
    <div className="tab-content">
      <div className="stats-grid">
        <motion.div className="stat-card primary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stat-icon"><FiUsers /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.overview?.totalUsers || 0}</span>
            <span className="stat-label">Пользователей</span>
          </div>
        </motion.div>
        <motion.div className="stat-card success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-icon"><FiActivity /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.overview?.onlineUsers || 0}</span>
            <span className="stat-label">Онлайн</span>
          </div>
        </motion.div>
        <motion.div className="stat-card warning" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-icon"><FiMessageCircle /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.overview?.totalMessages || 0}</span>
            <span className="stat-label">Сообщений</span>
          </div>
        </motion.div>
        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="stat-icon"><FiFileText /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.overview?.totalPosts || 0}</span>
            <span className="stat-label">Постов</span>
          </div>
        </motion.div>
      </div>

      <div className="overview-grid">
        <div className="admin-card">
          <div className="admin-card-header"><h3><FiUserPlus /> Новые пользователи</h3></div>
          <div className="admin-card-body">
            {stats?.recentUsers?.map(user => (
              <div key={user._id} className="recent-user">
                <img src={user.avatar || '/default-avatar.svg'} alt="" />
                <div className="user-info">
                  <span className="name">{user.firstName} {user.lastName}</span>
                  <span className="username">@{user.username}</span>
                  <span className="date">{format(new Date(user.createdAt), 'dd MMM', { locale: ru })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header"><h3><FiTrendingUp /> Активность (7 дней)</h3></div>
          <div className="admin-card-body">
            <div className="mini-chart">
              {stats?.messagesByDay?.map(day => (
                <div key={day._id} className="chart-bar">
                  <div className="bar-fill" style={{ height: `${Math.min(day.count, 100)}px` }} />
                  <span className="bar-label">{day._id.slice(5)}</span>
                  <span className="bar-value">{day.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Пользователи
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users', { params: { search, role: roleFilter } });
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(`/api/admin/users/${userId}`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert('Ошибка при изменении роли');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  const getStatusBadge = (status) => {
    return status === 'online' 
      ? <span className="badge online"><FiCheckCircle /> Онлайн</span>
      : <span className="badge offline"><FiClock /> Офлайн</span>;
  };

  return (
    <div className="tab-content">
      <div className="tab-filters">
        <div className="search-wrapper">
          <FiSearch />
          <input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">Все роли</option>
          <option value="admin">Админы</option>
          <option value="moderator">Модераторы</option>
          <option value="user">Пользователи</option>
        </select>
        <button className="btn-icon" onClick={fetchUsers}><FiRefreshCw /></button>
      </div>

      {loading ? <div className="admin-loading"><div className="spinner" /></div> : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr><th>Пользователь</th><th>Email</th><th>Роль</th><th>Статус</th><th>Дата</th><th></th></tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-cell">
                      <img src={user.avatar || '/default-avatar.svg'} alt="" />
                      <div>
                        <div className="user-name">{user.firstName} {user.lastName}</div>
                        <div className="user-username">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <select value={user.role} onChange={e => handleRoleChange(user._id, e.target.value)} className="role-select">
                      <option value="user">Пользователь</option>
                      <option value="moderator">Модератор</option>
                      <option value="admin">Админ</option>
                    </select>
                  </td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>{format(new Date(user.createdAt), 'dd.MM.yyyy')}</td>
                  <td><button className="btn-icon danger" onClick={() => handleDelete(user._id)}><FiTrash2 /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="empty-state">Пользователи не найдены</div>}
        </div>
      )}
    </div>
  );
};

// Компонент вкладки Диагностика
const DiagnosticsTab = () => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketLatency, setSocketLatency] = useState(null);
  const { connected, ping } = useSocket();
  
  const fetchDataRef = useRef(false);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (fetchDataRef.current) return;
    fetchDataRef.current = true;
    
    try {
      setError(null);
      
      const [diagRes, perfRes] = await Promise.all([
        axios.get('/api/admin/diagnostics', { timeout: 5000 }).catch(err => {
          console.warn('Diagnostics API error:', err.message);
          return { data: null };
        }),
        axios.get('/api/admin/performance', { timeout: 5000 }).catch(err => {
          console.warn('Performance API error:', err.message);
          return { data: null };
        })
      ]);
      
      if (diagRes.data) setDiagnostics(diagRes.data);
      if (perfRes.data) setPerformance(perfRes.data);
      
      // Измеряем задержку сокета
      if (connected && ping) {
        try {
          const result = await ping();
          setSocketLatency(result?.latency);
        } catch (err) {
          setSocketLatency(null);
        }
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
      fetchDataRef.current = false;
    }
  }, [connected, ping]);

  useEffect(() => {
    fetchData();
    
    // Очищаем старый интервал
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Устанавливаем новый интервал если автообновление включено
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, Math.max(refreshInterval, 3000));
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchData]);

  const formatBytes = (b) => {
    if (!b) return '0 B';
    const k = 1024;
    const s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return (b / Math.pow(k, i)).toFixed(2) + ' ' + s[i];
  };

  const formatUptime = (s) => {
    if (!s) return '0с';
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}д ${h}ч`;
    if (h > 0) return `${h}ч ${m}м`;
    return `${m}м`;
  };

  const getLatencyClass = (l) => {
    if (l < 50) return 'excellent';
    if (l < 150) return 'good';
    if (l < 300) return 'warning';
    return 'bad';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <FiCheckCircle className="status-icon success" />;
      case 'disconnected':
      case 'error':
        return <FiXCircle className="status-icon error" />;
      default:
        return <FiAlertCircle className="status-icon warning" />;
    }
  };

  if (loading && !diagnostics) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <p>Загрузка диагностики...</p>
      </div>
    );
  }

  return (
    <div className="tab-content diagnostics-tab">
      <div className="tab-controls">
        <label className="checkbox-label">
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
            <option value={3000}>3 сек</option>
            <option value={5000}>5 сек</option>
            <option value={10000}>10 сек</option>
            <option value={30000}>30 сек</option>
          </select>
        )}
        <button 
          className="btn-icon" 
          onClick={fetchData}
          disabled={fetchDataRef.current}
        >
          <FiRefreshCw className={fetchDataRef.current ? 'spinning' : ''} />
        </button>
      </div>

      {error && (
        <div className="error-message">
          <FiAlertCircle /> {error}
        </div>
      )}

      <div className="diagnostics-grid">
        <div className="diag-card">
          <div className="diag-header">
            <FiServer /> <span>Система</span>
            {autoRefresh && <FiPlay className="auto-icon" />}
          </div>
          <div className="diag-body">
            <div className="diag-row">
              <span>Статус</span>
              <span className={`status ${diagnostics?.status || 'unknown'}`}>
                {diagnostics?.status === 'healthy' ? 'Стабильно' : 
                 diagnostics?.status === 'degraded' ? 'Пониженная' : 'Н/Д'}
              </span>
            </div>
            <div className="diag-row">
              <span>Аптайм</span>
              <span>{formatUptime(diagnostics?.uptime)}</span>
            </div>
            <div className="diag-row">
              <span>WebSocket</span>
              <span className={connected ? 'online' : 'offline'}>
                {connected ? 'Подключен' : 'Отключен'}
              </span>
            </div>
            {socketLatency && (
              <div className="diag-row">
                <span>Задержка WS</span>
                <span className={`latency ${getLatencyClass(socketLatency)}`}>
                  {socketLatency}ms
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="diag-card">
          <div className="diag-header"><FiDatabase /> <span>База данных</span></div>
          <div className="diag-body">
            <div className="diag-row">
              <span>Статус</span>
              <span>{diagnostics?.database?.status || 'Н/Д'}</span>
            </div>
            <div className="diag-row">
              <span>Задержка</span>
              <span>{diagnostics?.database?.latency || 0}ms</span>
            </div>
            <div className="diag-row">
              <span>Коллекций</span>
              <span>{diagnostics?.database?.collections || 0}</span>
            </div>
            <div className="diag-row">
              <span>Документов</span>
              <span>{diagnostics?.database?.documents || 0}</span>
            </div>
          </div>
        </div>

        <div className="diag-card">
          <div className="diag-header"><FiHardDrive /> <span>Память процесса</span></div>
          <div className="diag-body">
            <div className="diag-row">
              <span>Heap Used</span>
              <span>{formatBytes(diagnostics?.memory?.heapUsed)}</span>
            </div>
            <div className="diag-row">
              <span>Heap Total</span>
              <span>{formatBytes(diagnostics?.memory?.heapTotal)}</span>
            </div>
            <div className="memory-bar">
              <div 
                className={`memory-fill ${diagnostics?.memory?.usagePercent > 80 ? 'warning' : ''}`}
                style={{ width: `${diagnostics?.memory?.usagePercent || 0}%` }}
              />
            </div>
            <div className="diag-row">
              <span>RSS</span>
              <span>{formatBytes(diagnostics?.memory?.rss)}</span>
            </div>
          </div>
        </div>

        <div className="diag-card">
          <div className="diag-header"><FiWifi /> <span>WebSocket</span></div>
          <div className="diag-body">
            <div className="diag-row">
              <span>Пользователей</span>
              <span className="highlight">{diagnostics?.websocket?.connectedUsers || 0}</span>
            </div>
            <div className="diag-row">
              <span>Статус</span>
              <span className={connected ? 'online' : 'offline'}>
                {connected ? 'Активен' : 'Отключен'}
              </span>
            </div>
            <div className="diag-row">
              <span>Комнат</span>
              <span>{diagnostics?.websocket?.rooms || 'active'}</span>
            </div>
          </div>
        </div>

        {performance && (
          <div className="diag-card">
            <div className="diag-header"><FiCpu /> <span>Процессор</span></div>
            <div className="diag-body">
              <div className="diag-row">
                <span>Ядер</span>
                <span>{performance.cpu?.cores || 'Н/Д'}</span>
              </div>
              <div className="diag-row">
                <span>Загрузка 1м</span>
                <span>{performance.cpu?.loadavg?.[0]?.toFixed(2) || 'Н/Д'}</span>
              </div>
              <div className="diag-row">
                <span>Загрузка 5м</span>
                <span>{performance.cpu?.loadavg?.[1]?.toFixed(2) || 'Н/Д'}</span>
              </div>
            </div>
          </div>
        )}

        {performance && (
          <div className="diag-card">
            <div className="diag-header"><FiHardDrive /> <span>Системная память</span></div>
            <div className="diag-body">
              <div className="diag-row">
                <span>Использовано</span>
                <span>{formatBytes(performance.memory?.used)}</span>
              </div>
              <div className="diag-row">
                <span>Свободно</span>
                <span>{formatBytes(performance.memory?.free)}</span>
              </div>
              <div className="memory-bar">
                <div 
                  className={`memory-fill ${performance.memory?.usagePercent > 80 ? 'warning' : ''}`}
                  style={{ width: `${performance.memory?.usagePercent || 0}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Статистика
const StatisticsTab = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get('/api/admin/statistics').then(res => setStats(res.data));
  }, []);

  if (!stats) return <div className="admin-loading"><div className="spinner" /></div>;

  const total = stats.overview?.totalUsers || 1;

  return (
    <div className="tab-content">
      <div className="stats-large-grid">
        <div className="stat-large-card">
          <h3>Распределение ролей</h3>
          <div className="role-bars">
            <div className="role-bar">
              <span>Админы</span>
              <div className="bar"><div className="fill admin" style={{ width: `${(stats.usersByRole?.admin / total) * 100}%` }} /></div>
              <span>{stats.usersByRole?.admin || 0}</span>
            </div>
            <div className="role-bar">
              <span>Модераторы</span>
              <div className="bar"><div className="fill moderator" style={{ width: `${(stats.usersByRole?.moderator / total) * 100}%` }} /></div>
              <span>{stats.usersByRole?.moderator || 0}</span>
            </div>
            <div className="role-bar">
              <span>Пользователи</span>
              <div className="bar"><div className="fill user" style={{ width: `${(stats.usersByRole?.user / total) * 100}%` }} /></div>
              <span>{stats.usersByRole?.user || 0}</span>
            </div>
          </div>
        </div>

        <div className="stat-large-card">
          <h3>Общая статистика</h3>
          <div className="stats-mini-grid">
            <div className="mini-stat"><span className="value">{stats.overview?.totalChats || 0}</span><span className="label">Чатов</span></div>
            <div className="mini-stat"><span className="value">{stats.overview?.totalMessages || 0}</span><span className="label">Сообщений</span></div>
            <div className="mini-stat"><span className="value">{stats.overview?.totalPosts || 0}</span><span className="label">Постов</span></div>
            <div className="mini-stat"><span className="value">{stats.overview?.onlineUsers || 0}</span><span className="label">Онлайн</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Логи
const LogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="tab-content">
      <div className="tab-controls">
        <button className="btn-icon" onClick={fetchLogs}><FiRefreshCw /> Обновить</button>
      </div>
      <div className="logs-container">
        {loading ? <div className="admin-loading"><div className="spinner" /></div> : (
          logs.map((log, i) => (
            <div key={i} className={`log-entry ${log.level}`}>
              <span className="log-time">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
              <span className="log-level">{log.level}</span>
              <span className="log-msg">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Настройки
const SettingsTab = () => {
  const [settings, setSettings] = useState({
    registrationEnabled: true,
    maintenanceMode: false,
    maxFileSize: 50,
    siteName: 'TVIN Messenger',
    allowGuestAccess: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/api/admin/settings')
      .then(res => setSettings(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('/api/admin/settings', settings);
      alert('Настройки сохранены');
    } catch (err) {
      alert('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner" /></div>;

  return (
    <div className="tab-content">
      <div className="settings-form">
        <h3>Основные настройки</h3>
        
        <label className="checkbox-label">
          <input type="checkbox" checked={settings.registrationEnabled} onChange={e => setSettings({...settings, registrationEnabled: e.target.checked})} />
          <span>Разрешить регистрацию новых пользователей</span>
        </label>

        <label className="checkbox-label">
          <input type="checkbox" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} />
          <span>Режим обслуживания</span>
        </label>

        <label className="checkbox-label">
          <input type="checkbox" checked={settings.allowGuestAccess} onChange={e => setSettings({...settings, allowGuestAccess: e.target.checked})} />
          <span>Разрешить гостевой доступ</span>
        </label>

        <div className="form-group">
          <label>Максимальный размер файла (MB)</label>
          <input type="number" value={settings.maxFileSize} onChange={e => setSettings({...settings, maxFileSize: parseInt(e.target.value) || 50})} min="1" max="500" />
        </div>

        <div className="form-group">
          <label>Название сайта</label>
          <input type="text" value={settings.siteName} onChange={e => setSettings({...settings, siteName: e.target.value})} />
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <FiSave /> {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;