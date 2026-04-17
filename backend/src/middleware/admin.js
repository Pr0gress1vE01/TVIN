const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isAdmin()) {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const moderatorMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isModerator()) {
      return res.status(403).json({ message: 'Access denied. Moderator rights required.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Moderator middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { adminMiddleware, moderatorMiddleware };