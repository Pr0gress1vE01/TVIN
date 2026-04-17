const os = require('os');
const mongoose = require('mongoose');

let diagnosticsData = {
  status: 'healthy',
  system: {},
  database: {},
  websocket: {
    connectedUsers: 0,
    rooms: 'active'
  },
  memory: {},
  lastUpdate: null
};

const startDiagnostics = () => {
  setInterval(async () => {
    try {
      // Системная диагностика
      diagnosticsData.system = {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
        loadavg: os.loadavg()
      };

      // База данных
      const dbStatus = mongoose.connection.readyState;
      const statusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      try {
        const stats = await mongoose.connection.db.stats();
        diagnosticsData.database = {
          status: statusMap[dbStatus],
          collections: stats.collections,
          documents: stats.objects,
          dataSize: stats.dataSize,
          indexes: stats.indexes,
          indexSize: stats.indexSize,
          latency: await measureDBLatency()
        };
      } catch (error) {
        diagnosticsData.database = {
          status: statusMap[dbStatus],
          error: error.message
        };
      }

      // Память процесса
      const memUsage = process.memoryUsage();
      diagnosticsData.memory = {
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        rss: memUsage.rss,
        external: memUsage.external,
        usagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100
      };

      // Определяем статус
      if (dbStatus !== 1) {
        diagnosticsData.status = 'degraded';
      } else if (diagnosticsData.memory.usagePercent > 80) {
        diagnosticsData.status = 'degraded';
      } else {
        diagnosticsData.status = 'healthy';
      }

      diagnosticsData.lastUpdate = new Date().toISOString();
    } catch (error) {
      console.error('Diagnostics error:', error);
      diagnosticsData.status = 'error';
    }
  }, 5000);
};

const measureDBLatency = async () => {
  const start = Date.now();
  await mongoose.connection.db.command({ ping: 1 });
  return Date.now() - start;
};

const getDiagnostics = () => diagnosticsData;

const updateWebSocketUsers = (count) => {
  diagnosticsData.websocket.connectedUsers = count;
};

module.exports = { 
  startDiagnostics, 
  getDiagnostics, 
  updateWebSocketUsers 
};