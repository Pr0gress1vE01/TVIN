import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiFile, FiDownload, FiEye } from 'react-icons/fi';
import './ProfileFiles.scss';

const ProfileFiles = ({ userId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, [userId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/user/${userId}/files`);
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('image')) return '🖼️';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('zip') || type?.includes('archive')) return '📦';
    return '📎';
  };

  if (loading) {
    return (
      <div className="files-loading">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-file" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="empty-files">
        <p>Нет файлов</p>
      </div>
    );
  }

  return (
    <div className="profile-files">
      <div className="files-list">
        {files.map(file => (
          <div key={file.id} className="file-item">
            <div className="file-info">
              <span className="file-icon">{getFileIcon(file.type)}</span>
              <div className="file-details">
                <span className="file-name">{file.name}</span>
                <span className="file-meta">
                  {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="file-actions">
              <button className="file-btn" onClick={() => window.open(file.url, '_blank')}>
                <FiEye />
              </button>
              <button className="file-btn">
                <FiDownload />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileFiles;