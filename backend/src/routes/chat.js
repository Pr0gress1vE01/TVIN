const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const messageCache = require('../services/messageCache');
const { streamMessages, createCompressedStream } = require('../services/streamService');

// Получение чатов - мгновенно через кеш
router.get('/', auth, async (req, res) => {
  try {
    const cacheKey = `chats:${req.userId}`;
    
    // Пробуем получить из Redis
    const cached = await messageCache.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const chats = await Chat.find({ 'participants.user': req.userId })
      .populate('participants.user', 'username avatar status lastSeen')
      .populate('lastMessage')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username avatar' } })
      .sort({ updatedAt: -1 })
      .lean(); // lean() для быстрых объектов

    // Кешируем на 30 секунд
    await messageCache.set(cacheKey, JSON.stringify(chats), 30);
    
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить закрепленные сообщения чата
router.get('/:chatId/pinned', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId)
      .populate({
        path: 'settings.pinnedMessages',
        populate: {
          path: 'sender',
          select: 'username avatar firstName lastName'
        }
      });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    const pinnedMessages = chat.settings?.pinnedMessages || [];
    
    // Фильтруем удаленные сообщения
    const validPinned = pinnedMessages.filter(msg => msg && !msg.deleted);
    
    res.json(validPinned);
  } catch (error) {
    console.error('Error getting pinned messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Закрепить сообщение (уже есть в message.js, но можно добавить и сюда)
router.post('/:chatId/pin/:messageId', auth, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (!chat.settings) chat.settings = {};
    if (!chat.settings.pinnedMessages) chat.settings.pinnedMessages = [];
    
    if (!chat.settings.pinnedMessages.includes(messageId)) {
      chat.settings.pinnedMessages.push(messageId);
      await chat.save();
    }
    
    res.json({ message: 'Message pinned', pinnedMessages: chat.settings.pinnedMessages });
  } catch (error) {
    console.error('Error pinning message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Потоковая загрузка сообщений (для больших историй)
router.get('/:chatId/messages/stream', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Проверяем доступ к чату
    const chat = await Chat.findOne({
      _id: chatId,
      'participants.user': req.userId
    });
    
    if (!chat) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    streamMessages(chatId, res);
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Открепить сообщение
router.delete('/:chatId/pin/:messageId', auth, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    if (chat.settings?.pinnedMessages) {
      chat.settings.pinnedMessages = chat.settings.pinnedMessages.filter(
        id => id.toString() !== messageId
      );
      await chat.save();
    }
    
    res.json({ message: 'Message unpinned' });
  } catch (error) {
    console.error('Error unpinning message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// Обычная загрузка с кешированием
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { before, limit = 50 } = req.query;
    
    // Проверяем доступ
    const chat = await Chat.findOne({
      _id: chatId,
      'participants.user': req.userId
    });
    
    if (!chat) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const cacheKey = `messages:${chatId}:${before || 'latest'}:${limit}`;
    
    // Пробуем кеш
    const cached = await messageCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }
    
    res.setHeader('X-Cache', 'MISS');
    
    const query = { chat: chatId };
    if (before) query.createdAt = { $lt: new Date(before) };
    
    const messages = await Message.find(query)
      .populate('sender', 'username avatar firstName lastName')
      .populate({ path: 'replyTo', populate: { path: 'sender', select: 'username' } })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    const result = messages.reverse();
    
    // Кешируем на 10 секунд
    await messageCache.set(cacheKey, JSON.stringify(result), 10);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;