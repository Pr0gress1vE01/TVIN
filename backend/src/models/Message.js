const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  url: String,
  type: String,
  name: String,
  filename: String,
  size: Number,
  duration: Number,
  emoji: String
}, { _id: false });

const messageSchema = new mongoose.Schema({
  forwardFrom: {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text',
    enum: ['text', 'image', 'video', 'audio', 'file', 'sticker', 'voice', 'video_message']
  },
  attachments: {
    type: [attachmentSchema],
    default: []
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  deleted: {
    type: Boolean,
    default: false
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);