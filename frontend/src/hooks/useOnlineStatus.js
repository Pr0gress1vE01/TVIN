import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSocket } from './useSocket';

export const useOnlineStatus = (userId) => {
  const { socket, connected } = useSocket();
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['online-status', userId],
    queryFn: () => {
      return new Promise((resolve) => {
        if (!socket || !connected) {
          resolve({ online: false, lastSeen: null });
          return;
        }

        socket.emit('user:getStatus', { targetUserId: userId });

        const timeout = setTimeout(() => {
          socket.off('user:status');
          resolve({ online: false, lastSeen: null });
        }, 3000);

        const handler = (data) => {
          if (data.userId === userId) {
            clearTimeout(timeout);
            socket.off('user:status', handler);
            resolve(data);
          }
        };

        socket.on('user:status', handler);
      });
    },
    enabled: !!userId && !!socket && connected,
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    if (!socket || !userId) return;

    const handleOnline = (data) => {
      if (data.userId === userId) {
        queryClient.setQueryData(['online-status', userId], {
          online: true,
          lastSeen: data.lastSeen
        });
      }
    };

    const handleOffline = (data) => {
      if (data.userId === userId) {
        queryClient.setQueryData(['online-status', userId], {
          online: false,
          lastSeen: data.lastSeen
        });
      }
    };

    socket.on('user:online', handleOnline);
    socket.on('user:offline', handleOffline);

    return () => {
      socket.off('user:online', handleOnline);
      socket.off('user:offline', handleOffline);
    };
  }, [socket, userId, queryClient]);

  return {
    isOnline: status?.online || false,
    lastSeen: status?.lastSeen,
    isLoading
  };
};