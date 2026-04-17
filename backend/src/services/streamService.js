const { Transform, pipeline } = require('stream');
const Message = require('../models/Message');

class MessageStream extends Transform {
  constructor(options = {}) {
    super({ ...options, objectMode: true });
    this.batchSize = options.batchSize || 50;
    this.buffer = [];
    this.totalSent = 0;
  }
  
  _transform(message, encoding, callback) {
    this.buffer.push(message);
    
    if (this.buffer.length >= this.batchSize) {
      this.push(JSON.stringify(this.buffer));
      this.totalSent += this.buffer.length;
      this.buffer = [];
    }
    
    // Искусственная задержка для демонстрации backpressure
    if (this.totalSent > 200) {
      setTimeout(callback, 10);
    } else {
      callback();
    }
  }
  
  _flush(callback) {
    if (this.buffer.length > 0) {
      this.push(JSON.stringify(this.buffer));
    }
    callback();
  }
}

// Потоковая загрузка истории с backpressure
const streamMessages = (chatId, res, options = {}) => {
  const cursor = Message.find({ chat: chatId })
    .sort({ createdAt: -1 })
    .populate('sender', 'username avatar firstName lastName')
    .lean()
    .cursor();
  
  const messageStream = new MessageStream({ batchSize: 50 });
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.write('[');
  
  let isFirst = true;
  
  messageStream.on('data', (chunk) => {
    if (!isFirst) {
      res.write(',');
    } else {
      isFirst = false;
    }
    res.write(chunk);
  });
  
  messageStream.on('end', () => {
    res.write(']');
    res.end();
  });
  
  messageStream.on('error', (err) => {
    console.error('Stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Stream error' });
    } else {
      res.end();
    }
  });
  
  cursor.pipe(messageStream);
};

// Сжатый поток для больших ответов
const createCompressedStream = (res, acceptEncoding) => {
  if (acceptEncoding.includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
    return require('zlib').createGzip({ level: 6 });
  } else if (acceptEncoding.includes('deflate')) {
    res.setHeader('Content-Encoding', 'deflate');
    return require('zlib').createDeflate({ level: 6 });
  }
  return null;
};

module.exports = { MessageStream, streamMessages, createCompressedStream };