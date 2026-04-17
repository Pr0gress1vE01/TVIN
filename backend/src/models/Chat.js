const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'direct',
    enum: ['direct', 'group', 'channel']
  },
  name: String,
  description: String,
  avatar: String,
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      default: 'member',
      enum: ['admin', 'member', 'moderator']
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    pinnedMessages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }]
  }
}, {
  timestamps: true
});

chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);