const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin@localhost:27017/TVINWEB?authSource=admin';

const clearMessages = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: 'TVINWEB' });
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Получаем все коллекции
    const collections = await db.listCollections().toArray();
    
    console.log('\n📊 Текущее состояние:');
    
    // Показываем количество документов в коллекциях
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`  ${coll.name}: ${count} документов`);
    }
    
    console.log('\n⚠️  ВНИМАНИЕ! Будут удалены все сообщения!');
    console.log('Для подтверждения введите "YES DELETE ALL MESSAGES":');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('> ', async (answer) => {
      if (answer !== 'YES DELETE ALL MESSAGES') {
        console.log('❌ Операция отменена');
        readline.close();
        await mongoose.disconnect();
        process.exit(0);
      }
      
      readline.close();
      
      console.log('\n🗑️ Удаление сообщений...');
      
      // Удаляем все сообщения
      const messagesResult = await db.collection('messages').deleteMany({});
      console.log(`  Удалено сообщений: ${messagesResult.deletedCount}`);
      
      // Очищаем lastMessage у всех чатов
      const chatsResult = await db.collection('chats').updateMany(
        {},
        { $set: { lastMessage: null } }
      );
      console.log(`  Обновлено чатов: ${chatsResult.modifiedCount}`);
      
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

clearMessages();