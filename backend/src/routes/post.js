const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Configure multer for post media
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/posts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `post-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image and video files are allowed'));
  }
});

// Create post
router.post('/', auth, upload.array('media', 10), async (req, res) => {
  try {
    const { content, location, visibility, tags } = req.body;
    
    const media = req.files?.map(file => ({
      url: `/uploads/posts/${file.filename}`,
      type: file.mimetype.startsWith('image') ? 'image' : 'video'
    })) || [];

    const post = new Post({
      author: req.userId,
      content,
      media,
      location,
      visibility,
      tags: tags ? JSON.parse(tags) : []
    });

    await post.save();
    await post.populate('author', 'username avatar firstName lastName');

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feed
router.get('/feed', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findById(req.userId);
    
    const posts = await Post.find({
      $or: [
        { author: { $in: [...user.contacts, req.userId] } },
        { visibility: 'public' }
      ]
    })
    .populate('author', 'username avatar firstName lastName')
    .populate('comments.author', 'username avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    res.json(posts);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Получить пользователя по ID или username
router.get('/:identifier', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Ищем по ID или username
    const user = await User.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(identifier) ? identifier : null },
        { username: identifier }
      ]
    })
      .select('-password -email')
      .populate('contacts', 'username avatar status');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Лайк поста
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const likeIndex = post.likes.indexOf(req.userId);
    
    if (likeIndex === -1) {
      post.likes.push(req.userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }
    
    await post.save();
    
    res.json({ 
      liked: likeIndex === -1,
      likesCount: post.likes.length 
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      author: req.userId,
      content,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();
    
    await post.populate('comments.author', 'username avatar');

    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.postId,
      author: req.userId
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;