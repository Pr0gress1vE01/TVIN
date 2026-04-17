const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Создаем папки для загрузок
const uploadDirs = ['avatars', 'banners', 'posts', 'backgrounds'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '../../uploads', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Настройка multer для аватара
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/avatars')),
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'avatar-' + unique + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, mime && ext);
  }
});

// Настройка multer для баннера
const bannerUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/banners')),
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'banner-' + unique + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, mime && ext);
  }
});

// Получить настройки пользователя
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('settings');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('📤 Sending settings for user:', req.userId);
    console.log('Settings:', JSON.stringify(user.settings, null, 2));
    
    res.json(user.settings || {});
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET - Получение данных
// ============================================

// Получить пользователя по ID или username
router.get('/:identifier', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const query = mongoose.isValidObjectId(identifier) 
      ? { _id: identifier }
      : { username: identifier };
    
    const user = await User.findOne(query)
      .select('-password -email')
      .populate('contacts', 'username avatar firstName lastName status');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const postsCount = await Post.countDocuments({ author: user._id });
    
    res.json({
      ...user.toJSON(),
      postsCount
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить друзей пользователя
router.get('/:identifier/friends', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const user = await User.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(identifier) ? identifier : null },
        { username: identifier }
      ]
    }).populate('contacts', 'username avatar firstName lastName status');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.contacts || []);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить посты пользователя
router.get('/:identifier/posts', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    const { page = 1, limit = 12 } = req.query;
    
    const user = await User.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(identifier) ? identifier : null },
        { username: identifier }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const posts = await Post.find({ 
      author: user._id,
      $or: [{ visibility: 'public' }, { author: req.userId }]
    })
      .populate('author', 'username avatar firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({ author: user._id });

    res.json({ posts, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// POST - Загрузка файлов
// ============================================

// Загрузка аватара
router.post('/avatar', auth, (req, res) => {
  avatarUpload.single('avatar')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        req.userId,
        { avatar: avatarUrl },
        { new: true }
      ).select('-password');
      
      res.json({ url: avatarUrl, user });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
});

// Загрузка баннера
router.post('/banner', auth, (req, res) => {
  bannerUpload.single('banner')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
      const bannerUrl = `/uploads/banners/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        req.userId,
        { banner: bannerUrl },
        { new: true }
      ).select('-password');
      
      res.json({ url: bannerUrl, user });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
});

// ============================================
// PATCH - Обновление профиля
// ============================================

router.patch('/profile', auth, async (req, res) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'bio', 'location', 'website', 'phone'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Обновление настроек чата
router.patch('/settings/chat', auth, async (req, res) => {
  try {
    const { chat } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) user.settings = {};
    if (!user.settings.chat) user.settings.chat = {};
    
    if (chat?.background) {
      user.settings.chat.background = chat.background;
    }
    if (chat?.background3D) {
      user.settings.chat.background3D = chat.background3D;
    }
    if (chat?.bubbleRadius !== undefined) {
      user.settings.chat.bubbleRadius = chat.bubbleRadius;
    }
    if (chat?.fontSize) {
      user.settings.chat.fontSize = chat.fontSize;
    }
    if (chat?.showAvatar !== undefined) {
      user.settings.chat.showAvatar = chat.showAvatar;
    }
    if (chat?.showTime !== undefined) {
      user.settings.chat.showTime = chat.showTime;
    }
    if (chat?.animations !== undefined) {
      user.settings.chat.animations = chat.animations;
    }
    if (chat?.compactMode !== undefined) {
      user.settings.chat.compactMode = chat.compactMode;
    }

    user.markModified('settings');
    await user.save();
    
    const updated = await User.findById(req.userId).select('-password');
    res.json(updated);
  } catch (error) {
    console.error('Error updating chat settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить подписчиков пользователя
router.get('/:identifier/subscribers', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const user = await User.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(identifier) ? identifier : null },
        { username: identifier }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Пока возвращаем пустой массив, позже добавим логику подписчиков
    res.json([]);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить текущий трек пользователя
router.get('/:identifier/current-music', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const user = await User.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(identifier) ? identifier : null },
        { username: identifier }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Здесь логика получения текущего трека из VK Music API
    // Пока возвращаем null
    res.json(null);
  } catch (error) {
    console.error('Error fetching current music:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить музыку пользователя
router.get('/:identifier/music', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const user = await User.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(identifier) ? identifier : null },
        { username: identifier }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Здесь логика получения музыки
    res.json({ tracks: [] });
  } catch (error) {
    console.error('Error fetching music:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить Reels пользователя
router.get('/:identifier/reels', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    const { page = 1, limit = 12 } = req.query;
    
    const user = await User.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(identifier) ? identifier : null },
        { username: identifier }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const posts = await Post.find({ 
      author: user._id,
      type: 'reel',
      $or: [{ visibility: 'public' }, { author: req.userId }]
    })
      .populate('author', 'username avatar firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({ author: user._id, type: 'reel' });

    res.json({ 
      posts, 
      hasMore: posts.length === parseInt(limit),
      total 
    });
  } catch (error) {
    console.error('Error fetching reels:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить файлы пользователя
router.get('/:identifier/files', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const user = await User.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(identifier) ? identifier : null },
        { username: identifier }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Здесь логика получения файлов из сообщений
    res.json({ files: [] });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Подписаться на пользователя
router.post('/:identifier/subscribe', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const targetUser = await User.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(identifier) ? identifier : null },
        { username: identifier }
      ]
    });
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (targetUser._id.toString() === req.userId) {
      return res.status(400).json({ message: 'Cannot subscribe to yourself' });
    }
    
    // Добавляем подписчика
    await User.findByIdAndUpdate(targetUser._id, {
      $addToSet: { subscribers: req.userId }
    });
    
    // Добавляем подписку у текущего пользователя
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { subscriptions: targetUser._id }
    });
    
    res.json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Отписаться от пользователя
router.post('/:identifier/unsubscribe', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const targetUser = await User.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(identifier) ? identifier : null },
        { username: identifier }
      ]
    });
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await User.findByIdAndUpdate(targetUser._id, {
      $pull: { subscribers: req.userId }
    });
    
    await User.findByIdAndUpdate(req.userId, {
      $pull: { subscriptions: targetUser._id }
    });
    
    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить активность пользователя
router.get('/:identifier/activity', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const user = await User.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(identifier) ? identifier : null },
        { username: identifier }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Определяем активность
    let activity = null;
    
    if (user.status === 'online') {
      activity = 'Онлайн';
    } else if (user.lastSeen) {
      const minutesAgo = Math.floor((Date.now() - user.lastSeen) / 60000);
      if (minutesAgo < 60) {
        activity = `Был(а) ${minutesAgo} мин назад`;
      } else {
        activity = 'Был(а) недавно';
      }
    }
    
    res.json({ 
      activity,
      status: user.status,
      lastSeen: user.lastSeen
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить каналы пользователя
router.get('/:identifier/channels', auth, async (req, res) => {
  try {
    res.json({ channels: [], count: 0 });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Загрузка фона чата
router.post('/settings/chat/background', auth, (req, res) => {
  const bgUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/backgrounds')),
      filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bg-' + unique + path.extname(file.originalname));
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }
  }).single('background');

  bgUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
      const bgUrl = `/uploads/backgrounds/${req.file.filename}`;
      const user = await User.findById(req.userId);
      
      if (!user.settings) user.settings = {};
      if (!user.settings.chat) user.settings.chat = {};
      if (!user.settings.chat.background) user.settings.chat.background = {};
      
      user.settings.chat.background = {
        type: 'image',
        value: null,
        image: bgUrl
      };
      
      user.markModified('settings');
      await user.save();
      
      const updated = await User.findById(req.userId).select('-password');
      res.json({ url: bgUrl, user: updated });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
});

module.exports = router;