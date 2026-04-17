const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = 'mongodb://admin:admin@ac-mzatqwk-shard-00-00.5lb2e2e.mongodb.net:27017,ac-mzatqwk-shard-00-01.5lb2e2e.mongodb.net:27017,ac-mzatqwk-shard-00-02.5lb2e2e.mongodb.net:27017/?ssl=true&replicaSet=atlas-5wh3vb-shard-0&authSource=admin&appName=TVIN';

const updateUserSettings = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'TVINWEB'
    });

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

    // Обновляем всех пользователей у которых нет настроек чата
    const result = await User.updateMany(
      { 'settings.chat': { $exists: false } },
      { $set: { 'settings.chat': defaultChatSettings } }
    );

    console.log(`Updated ${result.modifiedCount} users`);
    
    // Проверяем одного пользователя
    const user = await User.findOne();
    console.log('Sample user settings:', user?.settings);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

updateUserSettings();