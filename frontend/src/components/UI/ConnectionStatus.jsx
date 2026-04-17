import React from 'react';
import { useSocket } from '../../hooks/useSocket';
import { FiWifi, FiWifiOff, FiLoader } from 'react-icons/fi';
import './ConnectionStatus.scss';

const ConnectionStatus = () => {
  const { connected, connecting } = useSocket();

  if (connected) return null;

  return (
    <div className={`connection-status ${connecting ? 'connecting' : 'disconnected'}`}>
      {connecting ? (
        <>
          <FiLoader className="spinning" />
          <span>Подключение...</span>
        </>
      ) : (
        <>
          <FiWifiOff />
          <span>Нет соединения. Переподключение...</span>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;