const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { getDiagnostics } = require('../diagnostics/monitor');
const os = require('os');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Apply admin middleware to all routes
router.use(auth);
router.use(adminMiddleware);

// Кэш для диагностики
let diagnosticsCache = null;
let lastDiagnosticsUpdate = 0;
const DIAGNOSTICS_CACHE_TTL = 2000; // 2 секунды

router.get('/diagnostics', auth, adminMiddleware, async (req, res) => {
  try {
    const now = Date.now();
    
    // Используем кэш если он свежий
    if (diagnosticsCache && (now - lastDiagnosticsUpdate) < DIAGNOSTICS_CACHE_TTL) {
      return res.json(diagnosticsCache);
    }
    
    const diagnostics = getDiagnostics();
    diagnostics.timestamp = new Date().toISOString();
    
    diagnosticsCache = diagnostics;
    lastDiagnosticsUpdate = now;
    
    res.json(diagnostics);
  } catch (error) {
    console.error('Error getting diagnostics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Кэш для performance
let performanceCache = null;
let lastPerformanceUpdate = 0;
const PERFORMANCE_CACHE_TTL = 3000; // 3 секунды

router.get('/performance', auth, adminMiddleware, (req, res) => {
  try {
    const now = Date.now();
    
    if (performanceCache && (now - lastPerformanceUpdate) < PERFORMANCE_CACHE_TTL) {
      return res.json(performanceCache);
    }
    
    const metrics = {
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0].model,
        loadavg: os.loadavg()
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
      },
      uptime: {
        system: os.uptime(),
        process: process.uptime()
      }
    };
    
    performanceCache = metrics;
    lastPerformanceUpdate = now;
    
    res.json(metrics);
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Настройки системы (в памяти, можно заменить на БД)
let systemSettings = {
  registrationEnabled: true,
  maintenanceMode: false,
  maxFileSize: 50,
  defaultUserRole: 'user',
  siteName: 'TVIN Messenger',
  allowGuestAccess: false
};

// Загружаем настройки из файла если есть
const settingsPath = path.join(__dirname, '../../data/settings.json');
try {
  if (fs.existsSync(settingsPath)) {
    const data = fs.readFileSync(settingsPath, 'utf8');
    systemSettings = { ...systemSettings, ...JSON.parse(data) };
  }
} catch (error) {
  console.error('Error loading settings:', error);
}

// Сохраняем настройки
const saveSettings = () => {
  try {
    const dir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsPath, JSON.stringify(systemSettings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

// Get system diagnostics
router.get('/diagnostics', async (req, res) => {
  try {
    const diagnostics = getDiagnostics();
    
    diagnostics.timestamp = new Date().toISOString();
    diagnostics.request = {
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    res.json(diagnostics);
  } catch (error) {
    console.error('Error getting diagnostics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.patch('/users/:userId', async (req, res) => {
  try {
    const { role, status } = req.body;
    const updateData = {};
    
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Удаляем связанные данные
    await Post.deleteMany({ author: req.params.userId });
    await Message.deleteMany({ sender: req.params.userId });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get statistics
router.get('/statistics', async (req, res) => {
  try {
    const [
      totalUsers,
      onlineUsers,
      totalPosts,
      totalChats,
      totalMessages,
      usersByRole,
      recentUsers,
      messagesByDay
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'online' }),
      Post.countDocuments(),
      Chat.countDocuments(),
      Message.countDocuments(),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      User.find()
        .select('username avatar firstName lastName createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Message.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 7 }
      ])
    ]);

    const roleCounts = {};
    usersByRole.forEach(r => { roleCounts[r._id] = r.count; });

    res.json({
      overview: {
        totalUsers,
        onlineUsers,
        totalPosts,
        totalChats,
        totalMessages
      },
      usersByRole: {
        admin: roleCounts.admin || 0,
        moderator: roleCounts.moderator || 0,
        user: roleCounts.user || 0
      },
      messagesByDay: messagesByDay.reverse(),
      recentUsers
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get system logs
router.get('/logs', async (req, res) => {
  try {
    const logs = [];
    const diagnostics = getDiagnostics();
    
    // Системные события
    logs.push({
      timestamp: new Date(),
      level: 'info',
      message: `System status: ${diagnostics.status || 'unknown'}`
    });
    
    logs.push({
      timestamp: new Date(Date.now() - 60000),
      level: 'info',
      message: `Active connections: ${diagnostics.websocket?.connectedUsers || 0}`
    });
    
    logs.push({
      timestamp: new Date(Date.now() - 120000),
      level: 'info',
      message: `Memory usage: ${Math.round(diagnostics.memory?.usagePercent || 0)}%`
    });
    
    logs.push({
      timestamp: new Date(Date.now() - 180000),
      level: 'info',
      message: `Database status: ${diagnostics.database?.status || 'unknown'}`
    });

    // Добавляем информацию о последних регистрациях
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('username createdAt');
    
    recentUsers.forEach(user => {
      logs.push({
        timestamp: user.createdAt,
        level: 'info',
        message: `New user registered: @${user.username}`
      });
    });

    // Сортируем по времени
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(logs);
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get settings
router.get('/settings', (req, res) => {
  res.json(systemSettings);
});

// Update settings
router.post('/settings', (req, res) => {
  try {
    const allowedSettings = [
      'registrationEnabled',
      'maintenanceMode',
      'maxFileSize',
      'defaultUserRole',
      'siteName',
      'allowGuestAccess'
    ];
    
    allowedSettings.forEach(key => {
      if (req.body[key] !== undefined) {
        systemSettings[key] = req.body[key];
      }
    });
    
    saveSettings();
    
    res.json({ 
      message: 'Settings saved successfully',
      settings: systemSettings 
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get performance metrics
router.get('/performance', (req, res) => {
  try {
    const metrics = {
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0].model,
        loadavg: os.loadavg(),
        usage: process.cpuUsage()
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
        process: process.memoryUsage()
      },
      uptime: {
        system: os.uptime(),
        process: process.uptime()
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check (public)
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    maintenance: systemSettings.maintenanceMode
  });
});

module.exports = router;