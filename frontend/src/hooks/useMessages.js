// frontend/src/hooks/useMessages.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const useMessages = (chatId) => {
  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/chat/${chatId}/messages`);
      return data;
    },
    enabled: !!chatId,
    staleTime: Infinity, // Сообщения не устаревают
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ chatId, content, type, attachments }) => {
      // Оптимистичное обновление уже обрабатывается через WebSocket
      return { chatId, content, type, attachments };
    },
    onMutate: async (newMessage) => {
      // Оптимистично добавляем сообщение в кеш
      await queryClient.cancelQueries({ queryKey: ['messages', newMessage.chatId] });
      
      const previousMessages = queryClient.getQueryData(['messages', newMessage.chatId]);
      
      queryClient.setQueryData(['messages', newMessage.chatId], (old = []) => {
        return [...old, {
          ...newMessage,
          _id: `temp-${Date.now()}`,
          createdAt: new Date(),
          sender: { _id: 'temp' },
          pending: true
        }];
      });
      
      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      queryClient.setQueryData(['messages', newMessage.chatId], context.previousMessages);
    }
  });
};