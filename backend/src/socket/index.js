const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const redis = require('../config/redis');

const connectedUsers = new Map();

const setupSocket = (io) => {
  // Redis Pub/Sub для мгновенной доставки
  const subscriber = redis.duplicate();
  subscriber.subscribe('messages', 'reactions', 'typing', 'online', 'read', 'delete', 'edit', 'pin');
  
  subscriber.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message);
      
      switch (channel) {
        case 'messages':
          io.to(`user:${data.targetUserId}`).emit('message:new', data.message);
          io.to(`user:${data.targetUserId}`).emit('chat:update', { 
            chatId: data.chatId, 
            lastMessage: data.message 
          });
          break;
        case 'reactions':
          io.to(`user:${data.targetUserId}`).emit('message:updated', {
            messageId: data.messageId,
            reactions: data.reactions
          });
          break;
        case 'typing':
          io.to(`user:${data.targetUserId}`).emit('user:typing', {
            userId: data.userId,
            chatId: data.chatId,
            isTyping: data.isTyping
          });
          break;
        case 'online':
          io.to(`user:${data.targetUserId}`).emit(data.isOnline ? 'user:online' : 'user:offline', {
            userId: data.userId
          });
          break;
        case 'read':
          io.to(`user:${data.targetUserId}`).emit('messages:read', {
            chatId: data.chatId,
            userId: data.readerId,
            messageIds: data.messageIds
          });
          break;
        case 'delete':
          io.to(`user:${data.targetUserId}`).emit('message:deleted', {
            messageId: data.messageId,
            chatId: data.chatId
          });
          break;
        case 'edit':
          io.to(`user:${data.targetUserId}`).emit('message:updated', {
            messageId: data.messageId,
            message: data.message
          });
          break;
        case 'pin':
          io.to(`user:${data.targetUserId}`).emit('message:pinned', {
            messageId: data.messageId,
            chatId: data.chatId
          });
          break;
      }
    } catch (error) {
      console.error('Redis message parse error:', error);
    }
  });

  io.use(async (socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) return next(new Error('Invalid user'));
    
    try {
      const user = await User.findById(userId);
      if (!user) return next(new Error('User not found'));
      
      socket.userId = userId;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    
    connectedUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);
    
    console.log(`✅ User ${userId} connected`);
    
    await User.findByIdAndUpdate(userId, { status: 'online', lastSeen: new Date() });
    
    const user = await User.findById(userId).populate('contacts');
    if (user?.contacts) {
      const statuses = [];
      for (const contact of user.contacts) {
        const contactId = contact._id.toString();
        const isOnline = connectedUsers.has(contactId);
        statuses.push({
          userId: contactId,
          status: isOnline ? 'online' : 'offline',
          lastSeen: contact.lastSeen
        });
        
        redis.publish('online', JSON.stringify({
          targetUserId: contactId,
          isOnline: true,
          userId
        }));
      }
      socket.emit('contacts:status', statuses);
    }

    socket.on('chat:join', (chatId) => socket.join(`chat:${chatId}`));
    socket.on('chat:leave', (chatId) => socket.leave(`chat:${chatId}`));

    // ПЕЧАТЬ
    socket.on('typing:start', async ({ chatId }) => {
      const chat = await Chat.findById(chatId).populate('participants.user');
      if (chat) {
        chat.participants.forEach(({ user: participant }) => {
          if (participant._id.toString() !== userId) {
            redis.publish('typing', JSON.stringify({
              targetUserId: participant._id.toString(),
              userId,
              chatId,
              isTyping: true
            }));
          }
        });
      }
    });

    socket.on('typing:stop', async ({ chatId }) => {
      const chat = await Chat.findById(chatId).populate('participants.user');
      if (chat) {
        chat.participants.forEach(({ user: participant }) => {
          if (participant._id.toString() !== userId) {
            redis.publish('typing', JSON.stringify({
              targetUserId: participant._id.toString(),
              userId,
              chatId,
              isTyping: false
            }));
          }
        });
      }
    });

    // ОТПРАВКА СООБЩЕНИЯ
    socket.on('message:send', async (data) => {
      try {
        const { chatId, content, type = 'text', replyTo, attachments = [] } = data;
        
        const message = await Message.create({
          chat: chatId,
          sender: userId,
          content: content || '',
          type,
          attachments: attachments.map(att => ({
            url: att.url,
            type: att.type,
            name: att.name || att.filename,
            filename: att.filename,
            size: att.size,
            duration: att.duration
          })),
          replyTo: replyTo || null
        });
        
        await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id, updatedAt: new Date() });
        
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar firstName lastName')
          .populate({ path: 'replyTo', populate: { path: 'sender', select: 'username' } });
        
        const chat = await Chat.findById(chatId).populate('participants.user');
        
        chat.participants.forEach(({ user: participant }) => {
          redis.publish('messages', JSON.stringify({
            targetUserId: participant._id.toString(),
            chatId,
            message: populatedMessage
          }));
        });
        
      } catch (error) {
        console.error('Send error:', error);
      }
    });

    // РЕАКЦИИ
    socket.on('message:react', async ({ messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;
        
        if (!message.reactions) message.reactions = [];
        
        const existingIndex = message.reactions.findIndex(
          r => r.user.toString() === userId && r.emoji === emoji
        );
        
        if (existingIndex !== -1) {
          message.reactions.splice(existingIndex, 1);
        } else {
          message.reactions.push({ user: userId, emoji, createdAt: new Date() });
        }
        
        await message.save();
        
        const grouped = {};
        message.reactions.forEach(r => {
          if (!grouped[r.emoji]) grouped[r.emoji] = { emoji: r.emoji, count: 0 };
          grouped[r.emoji].count++;
        });
        
        const reactions = Object.values(grouped);
        
        socket.emit('message:updated', { messageId, reactions });
        
        const chat = await Chat.findById(message.chat).populate('participants.user');
        chat.participants.forEach(({ user: participant }) => {
          if (participant._id.toString() !== userId) {
            redis.publish('reactions', JSON.stringify({
              targetUserId: participant._id.toString(),
              messageId,
              reactions
            }))
            socket.emit('message:updated', { messageId, reactions });
          }
        });
        
      } catch (error) {
        console.error('Reaction error:', error);
        socket.emit('message:updated', { messageId, reactions });
      }
    });

    // ПРОЧТЕНИЕ
    socket.on('messages:read', async ({ chatId, messageIds }) => {
      if (!messageIds?.length) return;
      
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $addToSet: { readBy: { user: userId, readAt: new Date() } } }
      );
      
      socket.emit('messages:read', { chatId, userId, messageIds });
      
      const chat = await Chat.findById(chatId).populate('participants.user');
      chat.participants.forEach(({ user: participant }) => {
        if (participant._id.toString() !== userId) {
          redis.publish('read', JSON.stringify({
            targetUserId: participant._id.toString(),
            chatId,
            readerId: userId,
            messageIds
          }));
        }
      });
    });

    // УДАЛЕНИЕ
    socket.on('message:delete', async ({ messageId }) => {
      try {
        const message = await Message.findOne({ _id: messageId, sender: userId });
        if (!message) return;
        
        const chatId = message.chat;
        await Message.deleteOne({ _id: messageId });
        
        const lastMessage = await Message.findOne({ chat: chatId }).sort({ createdAt: -1 });
        await Chat.findByIdAndUpdate(chatId, { lastMessage: lastMessage?._id || null });
        
        const chat = await Chat.findById(chatId).populate('participants.user');
        chat.participants.forEach(({ user: participant }) => {
          redis.publish('delete', JSON.stringify({
            targetUserId: participant._id.toString(),
            messageId,
            chatId
          }));
        });
        
      } catch (error) {
        console.error('Delete error:', error);
      }
    });

    // РЕДАКТИРОВАНИЕ
    socket.on('message:edit', async ({ messageId, content }) => {
      try {
        const message = await Message.findOne({ _id: messageId, sender: userId });
        if (!message) return;
        
        message.content = content;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();
        
        const chat = await Chat.findById(message.chat).populate('participants.user');
        chat.participants.forEach(({ user: participant }) => {
          redis.publish('edit', JSON.stringify({
            targetUserId: participant._id.toString(),
            messageId,
            message
          }));
        });
        
      } catch (error) {
        console.error('Edit error:', error);
      }
    });

    // ЗАКРЕПЛЕНИЕ
    socket.on('message:pin', async ({ messageId, chatId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;
        
        if (!chat.settings) chat.settings = {};
        if (!chat.settings.pinnedMessages) chat.settings.pinnedMessages = [];
        
        if (!chat.settings.pinnedMessages.includes(messageId)) {
          chat.settings.pinnedMessages.push(messageId);
          await chat.save();
        }
        
        chat.participants.forEach(({ user: participant }) => {
          redis.publish('pin', JSON.stringify({
            targetUserId: participant._id.toString(),
            messageId,
            chatId
          }));
        });
        
      } catch (error) {
        console.error('Pin error:', error);
      }
    });

    // ОТКЛЮЧЕНИЕ
    socket.on('disconnect', async () => {
      console.log(`❌ User ${userId} disconnected`);
      connectedUsers.delete(userId);
      
      setTimeout(async () => {
        if (!connectedUsers.has(userId)) {
          await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() });
          
          const user = await User.findById(userId).populate('contacts');
          if (user?.contacts) {
            user.contacts.forEach(contact => {
              redis.publish('online', JSON.stringify({
                targetUserId: contact._id.toString(),
                isOnline: false,
                userId
              }));
            });
          }
        }
      }, 10000);
    });
  });

  return io;
};

module.exports = { setupSocket };