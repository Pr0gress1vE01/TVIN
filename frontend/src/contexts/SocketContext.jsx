import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [typingUsers, setTypingUsers] = useState(new Map());
  
  const socketRef = useRef(null);
  const typingTimeouts = useRef(new Map());

  const emit = useCallback((event, data) => {
    if (socketRef.current && connected) {
      console.log(`📤 Emitting ${event}:`, data);
      socketRef.current.emit(event, data);
      return true;
    }
    console.warn(`⚠️ Cannot emit ${event}: socket not connected`);
    return false;
  }, [connected]);

  const requestUserStatus = useCallback((targetUserId) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('user:getStatus', { targetUserId });
    }
  }, [connected]);

  const requestContactsStatus = useCallback(() => {
    if (socketRef.current && connected) {
      socketRef.current.emit('contacts:getStatus');
    }
  }, [connected]);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setConnected(false);
      setConnecting(false);
      setOnlineUsers(new Map());
      setTypingUsers(new Map());
      return;
    }

    if (socketRef.current?.connected) {
      console.log('Socket already connected');
      return;
    }

    setConnecting(true);
    console.log('🔄 Connecting to socket server...');
    
    const newSocket = io('http://localhost:5000', {
      auth: { userId: user._id },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Socket connected!');
      setConnected(true);
      setConnecting(false);
      newSocket.emit('contacts:getStatus');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setConnecting(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setConnected(true);
      setConnecting(false);
      newSocket.emit('contacts:getStatus');
    });

    newSocket.on('contacts:status', (contactsStatus) => {
  if (!Array.isArray(contactsStatus)) return;
  
  setOnlineUsers(prev => {
    const newMap = new Map(prev);
    contactsStatus.forEach(({ userId, status, lastSeen }) => {
      newMap.set(userId, { status, lastSeen: lastSeen ? new Date(lastSeen) : null });
    });
    return newMap;
  });
});

    newSocket.on('user:online', ({ userId }) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, { status: 'online', lastSeen: new Date() });
        return newMap;
      });
    });

    newSocket.on('user:offline', ({ userId }) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, { status: 'offline', lastSeen: new Date() });
        return newMap;
      });
    });

    newSocket.on('user:status', ({ userId, status, lastSeen }) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, { status, lastSeen: lastSeen ? new Date(lastSeen) : null });
        return newMap;
      });
    });

    newSocket.on('user:typing', ({ userId, chatId, isTyping }) => {
      const key = `${chatId}:${userId}`;
      
      if (typingTimeouts.current.has(key)) {
        clearTimeout(typingTimeouts.current.get(key));
        typingTimeouts.current.delete(key);
      }

      if (isTyping) {
        setTypingUsers(prev => new Map(prev).set(key, Date.now()));
        
        const timeout = setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(key);
            return newMap;
          });
        }, 3000);
        
        typingTimeouts.current.set(key, timeout);
      } else {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
      }
    });

    newSocket.on('message:new', (message) => {
      console.log('📨 Received message:new', message._id);
      window.dispatchEvent(new CustomEvent('message:new', { detail: message }));
    });

    newSocket.on('message:updated', (data) => {
      console.log('🔄 Received message:updated', data.messageId);
      window.dispatchEvent(new CustomEvent('message:updated', { detail: data }));
    });

    newSocket.on('message:deleted', (data) => {
      console.log('🗑️ Received message:deleted', data.messageId);
      window.dispatchEvent(new CustomEvent('message:deleted', { detail: data }));
    });

    newSocket.on('messages:read', (data) => {
      window.dispatchEvent(new CustomEvent('messages:read', { detail: data }));
    });

    window.socket = newSocket;

    return () => {
      typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
      typingTimeouts.current.clear();
      
      newSocket.off('connect');
      newSocket.off('connect_error');
      newSocket.off('disconnect');
      newSocket.off('reconnect');
      newSocket.off('contacts:status');
      newSocket.off('user:online');
      newSocket.off('user:offline');
      newSocket.off('user:status');
      newSocket.off('user:typing');
      newSocket.off('message:new');
      newSocket.off('message:updated');
      newSocket.off('message:deleted');
      newSocket.off('messages:read');
      
      newSocket.disconnect();
      socketRef.current = null;
      window.socket = null;
    };
  }, [user]);

  const isUserOnline = useCallback((userId) => {
    return onlineUsers.get(userId)?.status === 'online';
  }, [onlineUsers]);

  const getUserStatus = useCallback((userId) => {
    return onlineUsers.get(userId) || { status: 'offline', lastSeen: null };
  }, [onlineUsers]);

  const getUserStatusText = useCallback((userId) => {
    const status = onlineUsers.get(userId);
    if (!status) return 'не в сети';
    if (status.status === 'online') return 'онлайн';
    
    const lastSeen = status.lastSeen;
    if (!lastSeen) return 'не в сети';
    
    const diff = Math.floor((Date.now() - new Date(lastSeen)) / 1000);
    if (diff < 60) return 'был(а) только что';
    if (diff < 3600) return `был(а) ${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `был(а) ${Math.floor(diff / 3600)} ч назад`;
    return new Date(lastSeen).toLocaleDateString('ru-RU');
  }, [onlineUsers]);

  const isUserTyping = useCallback((chatId, userId) => {
    const timestamp = typingUsers.get(`${chatId}:${userId}`);
    return timestamp && Date.now() - timestamp < 3000;
  }, [typingUsers]);

  const value = {
    socket,
    connected,
    connecting,
    onlineUsers,
    typingUsers,
    emit,
    isUserOnline,
    getUserStatus,
    getUserStatusText,
    isUserTyping,
    requestUserStatus,
    requestContactsStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;