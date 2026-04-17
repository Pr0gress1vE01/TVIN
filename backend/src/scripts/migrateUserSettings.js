const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = 'mongodb://admin:admin@ac-mzatqwk-shard-00-00.5lb2e2e.mongodb.net:27017,ac-mzatqwk-shard-00-01.5lb2e2e.mongodb.net:27017,ac-mzatqwk-shard-00-02.5lb2e2e.mongodb.net:27017/?ssl=true&replicaSet=atlas-5wh3vb-shard-0&authSource=admin&appName=TVIN';

const defaultChatSettings = {
  background: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #0a0f1a 0%, #1a2333 100%)',
    image: null
  },
  background3D: {
    enabled: false,
    effect: 'particles',
    color: '#0088cc',
    intensity: 50
  },
  messageStyle: 'modern',
  bubbleRadius: 16,
  showAvatar: true,
  showTime: true,
  animations: true,
  fontSize: 'medium',
  compactMode: false
};

const migrateUserSettings = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'TVINWEB'
    });

    console.log('Connected to MongoDB');

    // Находим всех пользователей
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let updatedCount = 0;

    for (const user of users) {
      let needsUpdate = false;

      // Инициализируем settings если нет
      if (!user.settings) {
        user.settings = {};
        needsUpdate = true;
      }

      // Инициализируем settings.chat если нет
      if (!user.settings.chat) {
        user.settings.chat = defaultChatSettings;
        needsUpdate = true;
      } else {
        // Проверяем и добавляем отсутствующие поля
        if (!user.settings.chat.background) {
          user.settings.chat.background = defaultChatSettings.background;
          needsUpdate = true;
        }
        if (!user.settings.chat.background3D) {
          user.settings.chat.background3D = defaultChatSettings.background3D;
          needsUpdate = true;
        }
        if (user.settings.chat.messageStyle === undefined) {
          user.settings.chat.messageStyle = defaultChatSettings.messageStyle;
          needsUpdate = true;
        }
        if (user.settings.chat.bubbleRadius === undefined) {
          user.settings.chat.bubbleRadius = defaultChatSettings.bubbleRadius;
          needsUpdate = true;
        }
        if (user.settings.chat.showAvatar === undefined) {
          user.settings.chat.showAvatar = defaultChatSettings.showAvatar;
          needsUpdate = true;
        }
        if (user.settings.chat.showTime === undefined) {
          user.settings.chat.showTime = defaultChatSettings.showTime;
          needsUpdate = true;
        }
        if (user.settings.chat.animations === undefined) {
          user.settings.chat.animations = defaultChatSettings.animations;
          needsUpdate = true;
        }
        if (user.settings.chat.fontSize === undefined) {
          user.settings.chat.fontSize = defaultChatSettings.fontSize;
          needsUpdate = true;
        }
        if (user.settings.chat.compactMode === undefined) {
          user.settings.chat.compactMode = defaultChatSettings.compactMode;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        user.markModified('settings');
        await user.save();
        updatedCount++;
        console.log(`Updated user: ${user.username}`);
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} users.`);

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Запускаем миграцию
migrateUserSettings();