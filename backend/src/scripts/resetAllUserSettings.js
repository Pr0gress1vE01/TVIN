const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = 'mongodb://admin:admin@ac-mzatqwk-shard-00-00.5lb2e2e.mongodb.net:27017,ac-mzatqwk-shard-00-01.5lb2e2e.mongodb.net:27017,ac-mzatqwk-shard-00-02.5lb2e2e.mongodb.net:27017/?ssl=true&replicaSet=atlas-5wh3vb-shard-0&authSource=admin&appName=TVIN';
// Дефолтные настройки
const defaultSettings = {
  notifications: true,
  theme: 'dark',
  privacy: {
    lastSeen: true,
    profilePhoto: 'everyone'
  },
  security: {
    twoFactorAuth: false
  },
  chat: {
    background: {
      type: 'gradient',
      value: 'radial-gradient(circle at 30% 50%, #1a0a2e 0%, #0a0a1a 50%, #000000 100%)',
      image: null
    },
    background3D: {
      enabled: true,
      effect: 'particles',
      color: '#8B5CF6',
      intensity: 50
    },
    messageStyle: 'modern',
    bubbleRadius: 16,
    showAvatar: false,
    showTime: true,
    animations: true,
    fontSize: 'medium',
    compactMode: false
  }
};

const resetAllUserSettings = async () => {
  try {
    console.log('🔄 Подключение к MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'TVINWEB'
    });
    console.log('✅ Подключено к MongoDB');

    // Получаем всех пользователей
    const users = await User.find({});
    console.log(`📊 Найдено пользователей: ${users.length}`);

    if (users.length === 0) {
      console.log('❌ Нет пользователей для обновления');
      return;
    }

    // Спрашиваем подтверждение
    console.log('\n⚠️  ВНИМАНИЕ!');
    console.log(`Будут сброшены настройки у ${users.length} пользователей.`);
    console.log('Дефолтные настройки:');
    console.log(JSON.stringify(defaultSettings, null, 2));
    console.log('\nДля подтверждения введите "YES" (заглавными буквами):');

    // Ждём ввод пользователя
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('> ', async (answer) => {
      if (answer !== 'YES') {
        console.log('❌ Операция отменена');
        readline.close();
        await mongoose.disconnect();
        process.exit(0);
      }

      readline.close();
      
      console.log('\n🔄 Сброс настроек...');
      
      let successCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          // Сохраняем старые настройки в backup поле (опционально)
          user.oldSettings = user.settings;
          
          // Устанавливаем новые настройки
          user.settings = JSON.parse(JSON.stringify(defaultSettings));
          
          // Отмечаем что поле изменено
          user.markModified('settings');
          
          // Сохраняем
          await user.save();
          
          successCount++;
          console.log(`  ✅ ${user.username} - настройки сброшены`);
        } catch (error) {
          errorCount++;
          console.error(`  ❌ ${user.username} - ошибка: ${error.message}`);
        }
      }

      console.log('\n📊 Результаты:');
      console.log(`  ✅ Успешно: ${successCount}`);
      console.log(`  ❌ Ошибок: ${errorCount}`);
      console.log(`  📁 Старые настройки сохранены в поле "oldSettings"`);

      await mongoose.disconnect();
      console.log('🔌 Отключено от MongoDB');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Запускаем
resetAllUserSettings();