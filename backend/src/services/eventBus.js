const redis = require('../config/redis');

class EventBus {
  constructor() {
    this.CHANNELS = {
      MESSAGE_NEW: 'message:new',
      MESSAGE_UPDATE: 'message:update',
      MESSAGE_DELETE: 'message:delete',
      REACTION: 'reaction',
      TYPING: 'typing',
      ONLINE: 'online',
      CHAT_UPDATE: 'chat:update'
    };
  }

  async publish(channel, data) {
    const event = {
      ...data,
      timestamp: Date.now(),
      serverId: process.env.SERVER_ID || 'primary'
    };
    await redis.publish(channel, JSON.stringify(event));
    return event;
  }

  async subscribe(channel, callback) {
    const subscriber = redis.duplicate();
    await subscriber.subscribe(channel);
    subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        try {
          callback(JSON.parse(message));
        } catch (error) {
          console.error('Event parse error:', error);
        }
      }
    });
    return subscriber;
  }
}

module.exports = new EventBus();