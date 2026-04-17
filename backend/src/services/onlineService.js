const redis = require('../config/redis');

class OnlineService {
  constructor() {
    this.ONLINE_KEY_PREFIX = 'user:online:';
    this.LAST_SEEN_KEY_PREFIX = 'user:lastseen:';
    this.ONLINE_TTL = 60; // 60 секунд
  }

  // Установить пользователя онлайн
  async setOnline(userId) {
    const key = `${this.ONLINE_KEY_PREFIX}${userId}`;
    await redis.setex(key, this.ONLINE_TTL, 'online');
    await this.updateLastSeen(userId);
  }

  // Обновить время последней активности
  async updateLastSeen(userId) {
    const key = `${this.LAST_SEEN_KEY_PREFIX}${userId}`;
    await redis.set(key, Date.now());
  }

  // Продлить онлайн статус (для активных пользователей)
  async refreshOnline(userId) {
    const key = `${this.ONLINE_KEY_PREFIX}${userId}`;
    const exists = await redis.exists(key);
    if (exists) {
      await redis.expire(key, this.ONLINE_TTL);
    }
  }

  // Проверить, онлайн ли пользователь
  async isOnline(userId) {
    const key = `${this.ONLINE_KEY_PREFIX}${userId}`;
    const exists = await redis.exists(key);
    return exists === 1;
  }

  // Получить статусы нескольких пользователей
  async getUsersStatus(userIds) {
    const pipeline = redis.pipeline();
    const now = Date.now();
    
    userIds.forEach(userId => {
      pipeline.exists(`${this.ONLINE_KEY_PREFIX}${userId}`);
      pipeline.get(`${this.LAST_SEEN_KEY_PREFIX}${userId}`);
    });
    
    const results = await pipeline.exec();
    const statuses = {};
    
    userIds.forEach((userId, index) => {
      const isOnline = results[index * 2]?.[1] === 1;
      const lastSeen = results[index * 2 + 1]?.[1];
      
      statuses[userId] = {
        online: isOnline,
        lastSeen: lastSeen ? parseInt(lastSeen) : null
      };
    });
    
    return statuses;
  }

  // Установить офлайн
  async setOffline(userId) {
    const key = `${this.ONLINE_KEY_PREFIX}${userId}`;
    await redis.del(key);
    await this.updateLastSeen(userId);
  }

  // Получить всех онлайн пользователей
  async getAllOnlineUsers() {
    const keys = await redis.keys(`${this.ONLINE_KEY_PREFIX}*`);
    return keys.map(key => key.replace(this.ONLINE_KEY_PREFIX, ''));
  }

  // Очистка старых записей (вызывать периодически)
  async cleanup() {
    const keys = await redis.keys(`${this.ONLINE_KEY_PREFIX}*`);
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl < 0) {
        await redis.del(key);
      }
    }
  }
}

module.exports = new OnlineService();