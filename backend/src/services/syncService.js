const Message = require('../models/Message');
const Chat = require('../models/Chat');
const eventBus = require('./eventBus');
const messageCache = require('./messageCache');

class SyncService {
  constructor() {
    this.io = null;
  }

  setIO(io) {
    this.io = io;
  }

  // Отправка сообщения
  async sendMessage(data, userId) {
    const { chatId, content, type = 'text', replyTo, attachments = [] } = data;
    
    const message = new Message({
      chat: chatId,
      sender: userId,
      content: content || '',
      type: this.validateType(type),
      attachments: this.formatAttachments(attachments),
      replyTo: replyTo || null
    });

    await message.save();
    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id, updatedAt: new Date() });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar firstName lastName')
      .populate({ path: 'replyTo', populate: { path: 'sender', select: 'username' } });

    await messageCache.cacheMessage(populatedMessage);
    await messageCache.invalidateChatCache(chatId);

    // Отправляем через WebSocket
    if (this.io) {
      this.io.to(`chat:${chatId}`).emit('message:new', populatedMessage);
    }

    // Публикуем для других серверов
    await eventBus.publish(eventBus.CHANNELS.MESSAGE_NEW, { chatId, message: populatedMessage });

    // Обновляем список чатов
    await eventBus.publish(eventBus.CHANNELS.CHAT_UPDATE, { chatId, lastMessage: populatedMessage });

    return populatedMessage;
  }

  // Реакция на сообщение
  async handleReaction(messageId, chatId, emoji, userId) {
    const message = await Message.findById(messageId);
    if (!message) return null;

    if (!message.reactions) message.reactions = [];

    const existingIndex = message.reactions.findIndex(
      r => r.user.toString() === userId && r.emoji === emoji
    );

    if (existingIndex !== -1) {
      message.reactions.splice(existingIndex, 1);
    } else {
      message.reactions = message.reactions.filter(r => r.user.toString() !== userId);
      message.reactions.push({ user: userId, emoji, createdAt: new Date() });
    }

    await message.save();

    const groupedReactions = this.groupReactions(message.reactions);
    await messageCache.updateMessageReactions(messageId, groupedReactions);

    // Отправляем всем в чате
    if (this.io) {
      this.io.to(`chat:${chatId}`).emit('message:update', {
        messageId,
        reactions: groupedReactions
      });
    }

    await eventBus.publish(eventBus.CHANNELS.REACTION, { messageId, chatId, reactions: groupedReactions });

    return groupedReactions;
  }

  // Удаление сообщения
  async deleteMessage(messageId, userId) {
    const message = await Message.findOne({ _id: messageId, sender: userId });
    if (!message) return false;

    await Message.deleteOne({ _id: messageId });
    await messageCache.invalidateChatCache(message.chat);

    if (this.io) {
      this.io.to(`chat:${message.chat}`).emit('message:delete', { messageId });
    }

    await eventBus.publish(eventBus.CHANNELS.MESSAGE_DELETE, { messageId, chatId: message.chat });

    return true;
  }

  // Редактирование сообщения
  async editMessage(messageId, content, userId) {
    const message = await Message.findOne({ _id: messageId, sender: userId });
    if (!message) return null;

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    await messageCache.cacheMessage(message);

    if (this.io) {
      this.io.to(`chat:${message.chat}`).emit('message:update', { messageId, message });
    }

    await eventBus.publish(eventBus.CHANNELS.MESSAGE_UPDATE, { messageId, chatId: message.chat, message });

    return message;
  }

  // Закрепление сообщения
  async pinMessage(messageId, chatId, userId) {
    const chat = await Chat.findById(chatId);
    if (!chat) return false;

    if (!chat.settings) chat.settings = {};
    if (!chat.settings.pinnedMessages) chat.settings.pinnedMessages = [];
    
    if (!chat.settings.pinnedMessages.includes(messageId)) {
      chat.settings.pinnedMessages.push(messageId);
      await chat.save();
    }

    if (this.io) {
      this.io.to(`chat:${chatId}`).emit('message:pinned', { messageId, chatId });
    }

    return true;
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
      if (!grouped[r.emoji]) grouped[r.emoji] = { emoji: r.emoji, count: 0 };
      grouped[r.emoji].count++;
    });
    return Object.values(grouped);
  }
}

module.exports = new SyncService();