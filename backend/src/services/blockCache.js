const redis = require('../config/redis');

class BlockCache {
  constructor() {
    this.CHAT_BLOCKS_KEY = 'chat:blocks:';
    this.BLOCK_SIZE = 50; // Количество сообщений в блоке
    this.BLOCK_TTL = 3600; // 1 час
  }

  // Получить ключ блока
  getBlockKey(chatId, blockIndex) {
    return `${this.CHAT_BLOCKS_KEY}${chatId}:block:${blockIndex}`;
  }

  // Кешировать блок сообщений
  async cacheBlock(chatId, blockIndex, messages) {
    const key = this.getBlockKey(chatId, blockIndex);
    await redis.setex(key, this.BLOCK_TTL, JSON.stringify(messages));
  }

  // Получить блок из кеша
  async getBlock(chatId, blockIndex) {
    const key = this.getBlockKey(chatId, blockIndex);
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // Инвалидировать все блоки чата
  async invalidateChatBlocks(chatId) {
    const pattern = `${this.CHAT_BLOCKS_KEY}${chatId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  // Получить индекс блока для сообщения
  getBlockIndex(messageIndex) {
    return Math.floor(messageIndex / this.BLOCK_SIZE);
  }

  // Кешировать несколько блоков
  async cacheMessageBlocks(chatId, allMessages) {
    const blocks = {};
    
    allMessages.forEach((msg, index) => {
      const blockIndex = this.getBlockIndex(index);
      if (!blocks[blockIndex]) {
        blocks[blockIndex] = [];
      }
      blocks[blockIndex].push(msg);
    });

    const promises = Object.entries(blocks).map(([blockIndex, messages]) => 
      this.cacheBlock(chatId, parseInt(blockIndex), messages)
    );

    await Promise.all(promises);
  }
}

module.exports = new BlockCache();