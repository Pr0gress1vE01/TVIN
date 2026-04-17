const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = 'mongodb://admin:admin@ac-mzatqwk-shard-00-00.5lb2e2e.mongodb.net:27017,ac-mzatqwk-shard-00-01.5lb2e2e.mongodb.net:27017,ac-mzatqwk-shard-00-02.5lb2e2e.mongodb.net:27017/?ssl=true&replicaSet=atlas-5wh3vb-shard-0&authSource=admin&appName=TVIN';

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'TVINWEB'
    });

    const adminData = {
      username: 'admin',
      email: 'admin@tvin.com',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'TVIN',
      role: 'admin'
    };

    // Проверяем, существует ли уже админ
    const existingAdmin = await User.findOne({ username: adminData.username });
    
    if (existingAdmin) {
      console.log('Updating existing admin user...');
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('Admin user updated successfully!');
    } else {
      console.log('Creating new admin user...');
      const admin = new User(adminData);
      await admin.save();
      console.log('Admin user created successfully!');
    }

    console.log('Username:', adminData.username);
    console.log('Password:', adminData.password);
    console.log('Email:', adminData.email);

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();