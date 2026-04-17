import React, { useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import './UserStatus.scss';

const UserStatus = ({ userId, showText = true, className = '' }) => {
  const { getUserStatusText, requestUserStatus, connected } = useSocket();
  
  useEffect(() => {
    if (userId && connected) {
      requestUserStatus(userId);
    }
  }, [userId, connected, requestUserStatus]);

  const statusText = getUserStatusText(userId);

  return (
    <span className={`user-status ${className}`}>
      {showText && <span className="status-text">{statusText}</span>}
    </span>
  );
};

export default UserStatus;