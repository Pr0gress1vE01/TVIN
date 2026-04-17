const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.ready = true;
  }

  isReady() {
    return this.ready;
  }

  // Генерация ключа для чата
  generateChatKey() {
    return crypto.randomBytes(32).toString('base64');
  }

  // Шифрование сообщения
  encryptMessage(content, key) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        this.algorithm,
        Buffer.from(key, 'base64'),
        iv
      );

      let encrypted = cipher.update(content, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  }

  // Дешифрование сообщения
  decryptMessage(encryptedData, key) {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        Buffer.from(key, 'base64'),
        Buffer.from(encryptedData.iv, 'base64')
      );

      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));

      let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  // Хеширование контента
  hashContent(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // Проверка целостности
  verifyIntegrity(content, hash) {
    return this.hashContent(content) === hash;
  }
}

module.exports = new EncryptionService();