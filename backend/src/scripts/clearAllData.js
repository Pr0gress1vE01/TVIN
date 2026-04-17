const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin@localhost:27017/TVINWEB?authSource=admin';

const clearAllData = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: 'TVINWEB' });
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n📊 Текущее состояние:');
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`  ${coll.name}: ${count} документов`);
    }
    
    console.log('\n⚠️  ВНИМАНИЕ! Будут удалены ВСЕ ДАННЫЕ!');
    console.log('Для подтверждения введите "YES DELETE ALL DATA":');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('> ', async (answer) => {
      if (answer !== 'YES DELETE ALL DATA') {
        console.log('❌ Операция отменена');
        readline.close();
        await mongoose.disconnect();
        process.exit(0);
      }
      
      readline.close();
      
      console.log('\n🗑️ Удаление всех данных...');
      
      for (const coll of collections) {
        if (coll.name !== 'users') { // Сохраняем пользователей
          const result = await db.collection(coll.name).deleteMany({});
          console.log(`  ${coll.name}: удалено ${result.deletedCount}`);
        }
      }
      
      // Очищаем связи у пользователей
      await db.collection('users').updateMany({}, { 
        $set: { 
          contacts: [], 
          lastSeen: new Date(),
          status: 'offline'
        } 
      });
      console.log('  users: связи очищены');
      
      console.log('\n✅ Готово!');
      
      await mongoose.disconnect();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

clearAllData();