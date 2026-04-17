const { notificationQueue } = require('../config/bull');
const User = require('../models/User');

// Обработчик уведомлений
notificationQueue.process(async (job) => {
  const { userId, type, data } = job.data;
  
  console.log(`📨 Processing notification for user ${userId}, type: ${type}`);
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    switch (type) {
      case 'message':
        await handleMessageNotification(user, data);
        break;
      case 'friend_request':
        await handleFriendRequestNotification(user, data);
        break;
      case 'mention':
        await handleMentionNotification(user, data);
        break;
      default:
        console.log(`Unknown notification type: ${type}`);
    }

    return { success: true };
  } catch (error) {
    console.error(`Notification error for user ${userId}:`, error);
    throw error;
  }
});

async function handleMessageNotification(user, data) {
  // Проверяем настройки уведомлений
  if (!user.settings?.notifications) {
    return;
  }

  // Здесь можно отправить Push-уведомление через Firebase или APNS
  console.log(`💬 New message for ${user.username}: ${data.preview}`);
  
  // Сохраняем в историю уведомлений
  if (!user.notifications) user.notifications = [];
  user.notifications.push({
    type: 'message',
    data,
    read: false,
    createdAt: new Date()
  });
  
  await user.save();
}

async function handleFriendRequestNotification(user, data) {
  console.log(`👋 Friend request for ${user.username} from ${data.fromUsername}`);
  
  if (!user.notifications) user.notifications = [];
  user.notifications.push({
    type: 'friend_request',
    data,
    read: false,
    createdAt: new Date()
  });
  
  await user.save();
}

async function handleMentionNotification(user, data) {
  console.log(`📢 ${user.username} was mentioned: ${data.preview}`);
  
  if (!user.notifications) user.notifications = [];
  user.notifications.push({
    type: 'mention',
    data,
    read: false,
    createdAt: new Date()
  });
  
  await user.save();
}

// Обработка ошибок
notificationQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err);
});

notificationQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

console.log('📨 Notification worker started');