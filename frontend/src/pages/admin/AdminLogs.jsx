import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiRefreshCw } from 'react-icons/fi';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/logs');
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-logs">
      <div className="admin-card-header">
        <h2>Системные логи</h2>
        <button className="icon-button" onClick={fetchLogs}>
          <FiRefreshCw />
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : (
        <div className="logs-list">
          {logs.map((log, index) => (
            <div key={index} className={`log-item ${log.level}`}>
              <span className="log-time">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`log-level ${log.level}`}>{log.level}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLogs;