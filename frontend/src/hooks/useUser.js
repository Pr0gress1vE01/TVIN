import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const useUser = (userId) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/user/${userId}`);
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000
  });
};

export const useUserPosts = (userId, page = 1) => {
  return useQuery({
    queryKey: ['user-posts', userId, page],
    queryFn: async () => {
      const { data } = await axios.get(`/api/user/${userId}/posts`, {
        params: { page, limit: 12 }
      });
      return data;
    },
    enabled: !!userId,
    keepPreviousData: true
  });
};

export const useUserFriends = (userId) => {
  return useQuery({
    queryKey: ['user-friends', userId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/user/${userId}/friends`);
      return data;
    },
    enabled: !!userId
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileData) => {
      const { data } = await axios.patch('/api/user/profile', profileData);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.setQueryData(['user', data._id], data);
    }
  });
};

export const useOnlineStatus = (userId) => {
  const { socket } = useSocket();
  
  return useQuery({
    queryKey: ['online-status', userId],
    queryFn: () => {
      return new Promise((resolve) => {
        if (!socket) {
          resolve({ online: false });
          return;
        }
        
        socket.emit('user:getStatus', { targetUserId: userId });
        
        const handler = (status) => {
          if (status.userId === userId) {
            resolve(status);
            socket.off('user:status', handler);
          }
        };
        
        socket.on('user:status', handler);
        
        setTimeout(() => {
          socket.off('user:status', handler);
          resolve({ online: false });
        }, 5000);
      });
    },
    enabled: !!userId && !!socket,
    refetchInterval: 30000 // Проверяем каждые 30 секунд
  });
};