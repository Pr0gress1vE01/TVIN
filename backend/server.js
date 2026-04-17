require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const authRoutes = require('./src/routes/auth');
const chatRoutes = require('./src/routes/chat');
const userRoutes = require('./src/routes/user');
const postRoutes = require('./src/routes/post');
const adminRoutes = require('./src/routes/admin');
const uploadRoutes = require('./src/routes/upload');
const contactRoutes = require('./src/routes/contact');
const messageRoutes = require('./src/routes/message');
const diagnosticsRoutes = require('./src/routes/diagnostics');

const { setupSocket } = require('./src/socket');
const { startDiagnostics } = require('./src/diagnostics/monitor');
const encryptionService = require('./src/services/encryption');
const messageCache = require('./src/services/messageCache');
const onlineService = require('./src/services/onlineService');

const app = express();
const server = http.createServer(app);

// Настройка Socket.IO с оптимизациями
const io = socketIO(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket'], // Только WebSocket для скорости
  pingInterval: 10000,
  pingTimeout: 5000,
  allowEIO3: true,
  perMessageDeflate: {
    threshold: 1024,
    zlibDeflateOptions: { level: 6 },
    zlibInflateOptions: { chunkSize: 1024 }
  },
  maxHttpBufferSize: 1e8
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin@ac-mzatqwk-shard-00-00.5lb2e2e.mongodb.net:27017,ac-mzatqwk-shard-00-01.5lb2e2e.mongodb.net:27017,ac-mzatqwk-shard-00-02.5lb2e2e.mongodb.net:27017/?ssl=true&replicaSet=atlas-5wh3vb-shard-0&authSource=admin&appName=TVIN';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'TVINWEB'
}).then(() => {
  console.log('✅ Connected to MongoDB');
  startDiagnostics();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

app.use(compression({ level: 9 })); // Максимальное сжатие

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Статические файлы с кешированием
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '30d',
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cache-Control', 'public, max-age=2592000');
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '8.0.0',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: messageCache.isReady() ? 'connected' : 'disconnected',
      encryption: encryptionService.isReady() ? 'enabled' : 'disabled'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/post', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);

// Socket setup
setupSocket(io);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                    TVIN Messenger 8.0                      ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  🚀 Server running on http://localhost:${PORT}              ║`);
  console.log('║  📁 Uploads: /uploads                                     ║');
  console.log('║  🔐 Encryption: AES-256-GCM                               ║');
  console.log('║  📦 Compression: gzip (level 6)                           ║');
  console.log('║  💓 Smart Heartbeat: 25s/20s                              ║');
  console.log('║  🔄 Backpressure: Enabled                                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
});