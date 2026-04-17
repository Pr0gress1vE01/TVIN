const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const eventBus = require('./eventBus');
const messageCache = require('./messageCache');

class RealtimeService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  setIO(io) {
    this.io = io;
  }

  // Отправить сообщение
  async sendMessage(data, userId) {
    const { chatId, content, type = 'text', replyTo, attachments = [] } = data;
    
    // Создаем сообщение в БД
    const message = new Message({
      chat: chatId,
      sender: userId,
      content: content || '',
      type: this.validateType(type),
      attachments: this.formatAttachments(attachments),
      replyTo: replyTo || null
    });

    await message.save();
    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

    // Популируем данные
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar firstName lastName')
      .populate({ 
        path: 'replyTo', 
        populate: { path: 'sender', select: 'username' } 
      });

    // Кешируем
    await messageCache.cacheMessage(populatedMessage);
    await messageCache.invalidateChatCache(chatId);

    // ВАЖНО: Отправляем ВСЕМ в чате через WebSocket
    if (this.io) {
      console.log('📤 Emitting message:new to chat:', chatId);
      this.io.to(`chat:${chatId}`).emit('message:new', populatedMessage);
    }

    // Публикуем событие для других серверов
    await eventBus.publish(eventBus.CHANNELS.MESSAGE, {
      chatId,
      message: populatedMessage,
      senderId: userId
    });

    return populatedMessage;
  }

  // Обработать реакцию
  async handleReaction(messageId, chatId, emoji, userId) {
    const message = await Message.findById(messageId);
    if (!message) return null;

    if (!message.reactions) message.reactions = [];

    // Проверяем существующую реакцию
    const existingIndex = message.reactions.findIndex(
      r => r.user.toString() === userId && r.emoji === emoji
    );

    if (existingIndex !== -1) {
      // Удаляем
      message.reactions.splice(existingIndex, 1);
    } else {
      // Удаляем другие реакции этого пользователя и добавляем новую
      message.reactions = message.reactions.filter(r => r.user.toString() !== userId);
      message.reactions.push({ user: userId, emoji, createdAt: new Date() });
    }

    await message.save();

    const groupedReactions = this.groupReactions(message.reactions);
    
    // Обновляем кеш
    await messageCache.updateMessageReactions(messageId, groupedReactions);

    // ВАЖНО: Отправляем ВСЕМ в чате
    if (this.io) {
      console.log('📤 Emitting message:updated to chat:', chatId);
      this.io.to(`chat:${chatId}`).emit('message:updated', {
        messageId,
        reactions: groupedReactions
      });
    }

    // Публикуем событие для других серверов
    await eventBus.publish(eventBus.CHANNELS.REACTION, {
      messageId,
      chatId,
      reactions: groupedReactions,
      userId
    });

    return groupedReactions;
  }

  validateType(type) {
    const validTypes = ['text', 'image', 'video', 'audio', 'file', 'sticker', 'voice', 'video_message'];
    return validTypes.includes(type) ? type : 'text';
  }

  formatAttachments(attachments) {
    if (!attachments) return [];
    return attachments.map(att => ({
      url: att.url || '',
      type: att.type || 'file',
      name: att.name || att.filename || '',
      filename: att.filename || '',
      size: att.size || 0,
      duration: att.duration || 0,
      emoji: att.emoji || ''
    }));
  }

  groupReactions(reactions) {
    if (!reactions?.length) return [];
    const grouped = {};
    reactions.forEach(r => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { emoji: r.emoji, count: 0 };
      }
      grouped[r.emoji].count++;
    });
    return Object.values(grouped);
  }
}

module.exports = new RealtimeService();