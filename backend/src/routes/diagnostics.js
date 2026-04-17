const express = require('express');
const router = express.Router();
const os = require('os');
const mongoose = require('mongoose');

// Health check - публичный эндпоинт
router.get('/health', (req, res) => {
  try {
    const health = {
      status: 'healthy',
      version: '8.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        memory: {
          usage: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
        }
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        loadavg: os.loadavg()[0]
      }
    };

    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

module.exports = router;