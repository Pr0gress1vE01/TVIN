import { useEffect } from 'react';
import axios from 'axios';

// Предзагрузка чатов в фоне
export const usePreloadChats = () => {
  useEffect(() => {
    const preload = async () => {
      try {
        // Предзагружаем список чатов
        const chatsResponse = await axios.get('/api/chat');
        
        // Предзагружаем последние сообщения для первых 3 чатов
        const chats = chatsResponse.data.slice(0, 3);
        await Promise.all(chats.map(chat => 
          axios.get(`/api/chat/${chat._id}/messages`, { params: { limit: 30 } })
        ));
      } catch (error) {
        // Тихо игнорируем ошибки предзагрузки
      }
    };
    
    // Запускаем через 1 секунду после загрузки страницы
    const timer = setTimeout(preload, 1000);
    return () => clearTimeout(timer);
  }, []);
};