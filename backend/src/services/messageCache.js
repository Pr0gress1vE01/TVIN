const redis = require('../config/redis');

class MessageCache {
  constructor() {
    this.ready = false;
    this.checkConnection();
  }

  async checkConnection() {
    try {
      await redis.ping();
      this.ready = true;
      console.log('✅ Redis connected');
    } catch (error) {
      console.warn('⚠️ Redis not available, caching disabled');
      this.ready = false;
    }
  }

  isReady() {
    return this.ready;
  }

  async get(key) {
    if (!this.ready) return null;
    try {
      return await redis.get(key);
    } catch (error) {
      return null;
    }
  }

  async set(key, value, ttl = 30) {
    if (!this.ready) return;
    try {
      await redis.setex(key, ttl, value);
    } catch (error) {
      // Игнорируем
    }
  }

  async del(pattern) {
    if (!this.ready) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      // Игнорируем
    }
  }

  async invalidateChat(chatId) {
    await this.del(`messages:${chatId}:*`);
    await this.del(`chats:*`);
  }

  // Новый метод: кеширование с компрессией
  async setCompressed(key, data, ttl = 30) {
    if (!this.ready) return;
    try {
      const compressed = JSON.stringify(data);
      await redis.setex(key, ttl, compressed);
    } catch (error) {
      // Игнорируем
    }
  }
}

module.exports = new MessageCache();