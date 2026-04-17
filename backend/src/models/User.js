const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  avatar: { type: String, default: '/default-avatar.svg' },
  banner: { type: String, default: null },
  status: { type: String, default: 'online', enum: ['online', 'offline', 'away', 'busy'] },
  bio: { type: String, maxlength: 150, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  role: { type: String, default: 'user', enum: ['user', 'admin', 'moderator'] },
    subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  verified: { type: Boolean, default: false },
  occupation: { type: String, default: '' },
  featuredLink: {
    title: String,
    url: String
  },
  hasStory: { type: Boolean, default: false },
  
  // Виртуальные поля для подсчетов
  subscribersCount: { type: Number, default: 0 },
  subscriptionsCount: { type: Number, default: 0 },
  settings: {
    notifications: { type: Boolean, default: true },
    theme: { type: String, default: 'dark' },
    privacy: {
      lastSeen: { type: Boolean, default: true },
      profilePhoto: { type: String, default: 'everyone' }
    },
    security: { twoFactorAuth: { type: Boolean, default: false } },
    chat: {
      background: {
        type: { type: String, default: 'gradient' },
        value: { type: String, default: 'linear-gradient(135deg, #0a0f1a 0%, #1a2333 100%)' },
        image: { type: String, default: null }
      },
      background3D: {
        enabled: { type: Boolean, default: false },
        effect: { type: String, default: 'particles' },
        color: { type: String, default: '#0088cc' },
        intensity: { type: Number, default: 50 }
      },
      messageStyle: { type: String, default: 'modern' },
      bubbleRadius: { type: Number, default: 16 },
      showAvatar: { type: Boolean, default: true },
      showTime: { type: Boolean, default: true },
      animations: { type: Boolean, default: true },
      fontSize: { type: String, default: 'medium' },
      compactMode: { type: Boolean, default: false }
    }
  },
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
  }],
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.pre('save', function(next) {
  if (this.subscribers) {
    this.subscribersCount = this.subscribers.length;
  }
  if (this.subscriptions) {
    this.subscriptionsCount = this.subscriptions.length;
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

module.exports = mongoose.model('User', userSchema);