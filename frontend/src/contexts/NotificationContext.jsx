import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket) return;
    
    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Показываем браузерное уведомление
      if (Notification.permission === 'granted' && document.hidden) {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/tvin-logo.svg',
          badge: '/tvin-logo.svg'
        });
      }
    };
    
    const handleNotificationsRead = ({ notificationIds }) => {
      setNotifications(prev => prev.map(n => 
        notificationIds.includes(n._id) ? { ...n, read: true } : n
      ));
      setUnreadCount(0);
    };
    
    socket.on('notification:new', handleNotification);
    socket.on('notifications:read', handleNotificationsRead);
    
    // Запрашиваем разрешение на уведомления
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    return () => {
      socket.off('notification:new', handleNotification);
      socket.off('notifications:read', handleNotificationsRead);
    };
  }, [socket]);

  const markAsRead = (notificationIds) => {
    if (!socket) return;
    socket.emit('notifications:markRead', { notificationIds });
  };

  const markAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};