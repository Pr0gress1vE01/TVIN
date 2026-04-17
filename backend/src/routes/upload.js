const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Создаем папки для загрузок
const uploadDirs = ['avatars', 'posts', 'chats', 'stories', 'voice', 'video'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '../../uploads', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
});

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../../uploads');
    
    if (req.path.includes('/avatar')) {
      uploadPath = path.join(uploadPath, 'avatars');
    } else if (req.path.includes('/post')) {
      uploadPath = path.join(uploadPath, 'posts');
    } else if (req.path.includes('/voice')) {
      uploadPath = path.join(uploadPath, 'voice');
    } else if (req.path.includes('/video')) {
      uploadPath = path.join(uploadPath, 'video');
    } else {
      uploadPath = path.join(uploadPath, 'chats');
    }
    
    console.log('Upload destination:', uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.webm';
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('Uploading file:', file.originalname, file.mimetype);
  
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|mp3|wav|ogg|webm|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  
  if (file.mimetype === 'image/webp' || file.mimetype === 'image/png') {
  return cb(null, true);
}

  // Для голосовых сообщений разрешаем audio/webm
  if (file.mimetype === 'audio/webm' || file.mimetype === 'audio/webm;codecs=opus') {
    return cb(null, true);
  }
  
  cb(new Error(`File type not allowed: ${file.mimetype}`));
};

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter
});

// Загрузка аватара
router.post('/avatar', auth, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/avatars/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Загрузка медиа для чата
router.post('/chat', auth, upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const files = req.files.map(file => {
      const isImage = file.mimetype.startsWith('image');
      const isVideo = file.mimetype.startsWith('video');
      const isAudio = file.mimetype.startsWith('audio');
      
      let type = 'file';
      let folder = 'chats';
      
      if (isImage) {
        type = 'image';
        folder = 'chats';
      } else if (isVideo) {
        type = 'video';
        folder = 'video';
      } else if (isAudio) {
        type = 'audio';
        folder = 'voice';
      }
      
      return {
        url: `/uploads/${folder}/${file.filename}`,
        type,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      };
    });
    
    console.log('Uploaded files:', files);
    res.json({ files });
  } catch (error) {
    console.error('Chat upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Загрузка голосового сообщения
router.post('/voice', auth, upload.single('audio'), (req, res) => {
  try {
    console.log('Voice upload request received');
    console.log('File:', req.file);
    console.log('Body:', req.body);
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/voice/${req.file.filename}`;
    const duration = parseInt(req.body.duration) || 0;
    
    res.json({ 
      url: fileUrl, 
      filename: req.file.filename,
      duration: duration,
      size: req.file.size
    });
  } catch (error) {
    console.error('Voice upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Загрузка видео-кружка
router.post('/video-message', auth, upload.single('video'), (req, res) => {
  try {
    console.log('Video message upload request received');
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/video/${req.file.filename}`;
    const duration = parseInt(req.body.duration) || 0;
    
    res.json({ 
      url: fileUrl, 
      filename: req.file.filename,
      duration: duration,
      size: req.file.size
    });
  } catch (error) {
    console.error('Video message upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Получение файла
router.get('/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  const filePath = path.join(__dirname, '../../uploads', type, filename);
  
  console.log('Requested file:', filePath);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.error('File not found:', filePath);
    res.status(404).json({ message: 'File not found' });
  }
});

module.exports = router;