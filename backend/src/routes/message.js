const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');

// Добавить реакцию на сообщение
router.post('/:messageId/reactions', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    const messageId = req.params.messageId;
    
    console.log('📥 Reaction request:', { messageId, emoji, userId: req.userId });
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (!message.reactions) {
      message.reactions = [];
    }
    
    // Проверяем, есть ли уже реакция от этого пользователя с таким же эмодзи
    const existingReactionIndex = message.reactions.findIndex(
      r => r.user.toString() === req.userId && r.emoji === emoji
    );
    
    if (existingReactionIndex !== -1) {
      // Удаляем реакцию (toggle)
      message.reactions.splice(existingReactionIndex, 1);
      console.log('🔄 Reaction removed');
    } else {
      // Удаляем другие реакции этого пользователя (можно только одну)
      message.reactions = message.reactions.filter(
        r => r.user.toString() !== req.userId
      );
      
      // Добавляем новую реакцию
      message.reactions.push({
        user: req.userId,
        emoji,
        createdAt: new Date()
      });
      console.log('➕ Reaction added');
    }
    
    await message.save();
    
    // Группируем реакции для ответа
    const groupedReactions = groupReactions(message.reactions);
    
    console.log('📤 Sending grouped reactions:', groupedReactions);
    
    res.json({ 
      reactions: groupedReactions,
      messageId: message._id
    });
  } catch (error) {
    console.error('❌ Error adding reaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Вспомогательная функция для группировки реакций
function groupReactions(reactions) {
  if (!reactions || reactions.length === 0) return [];
  
  const grouped = {};
  
  reactions.forEach(reaction => {
    const emoji = reaction.emoji;
    if (!grouped[emoji]) {
      grouped[emoji] = {
        emoji: emoji,
        count: 0
      };
    }
    grouped[emoji].count++;
  });
  
  return Object.values(grouped);
}

// Закрепить сообщение
router.post('/:messageId/pin', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    const chat = await Chat.findById(message.chat);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    if (!chat.settings) {
      chat.settings = {};
    }
    if (!chat.settings.pinnedMessages) {
      chat.settings.pinnedMessages = [];
    }
    
    if (!chat.settings.pinnedMessages.includes(message._id)) {
      chat.settings.pinnedMessages.push(message._id);
      await chat.save();
    }
    
    res.json({ message: 'Message pinned successfully' });
  } catch (error) {
    console.error('Error pinning message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Открепить сообщение
router.delete('/:messageId/pin', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    const chat = await Chat.findById(message.chat);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    if (chat.settings?.pinnedMessages) {
      chat.settings.pinnedMessages = chat.settings.pinnedMessages.filter(
        id => id.toString() !== req.params.messageId
      );
      await chat.save();
    }
    
    res.json({ message: 'Message unpinned successfully' });
  } catch (error) {
    console.error('Error unpinning message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить контекст вокруг сообщения
router.get('/:messageId/context', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const messagesBefore = await Message.find({
      chat: message.chat,
      createdAt: { $lt: message.createdAt }
    })
      .sort({ createdAt: -1 })
      .limit(25)
      .populate('sender', 'username avatar firstName lastName');

    const messagesAfter = await Message.find({
      chat: message.chat,
      createdAt: { $gte: message.createdAt }
    })
      .sort({ createdAt: 1 })
      .limit(25)
      .populate('sender', 'username avatar firstName lastName');

    const contextMessages = [...messagesBefore.reverse(), ...messagesAfter];
    
    res.json(contextMessages);
  } catch (error) {
    console.error('Error getting message context:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Редактировать сообщение
router.patch('/:messageId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    const message = await Message.findOne({
      _id: req.params.messageId,
      sender: req.userId
    });
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }
    
    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    
    await message.save();
    
    res.json(message);
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Удалить сообщение
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      sender: req.userId
    });
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }
    
    await Message.deleteOne({ _id: req.params.messageId });
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

function groupReactions(reactions) {
  if (!reactions || reactions.length === 0) return [];
  
  const grouped = {};
  
  reactions.forEach(reaction => {
    if (!grouped[reaction.emoji]) {
      grouped[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0
      };
    }
    grouped[reaction.emoji].count++;
  });
  
  return Object.values(grouped);
}

module.exports = router;