const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Добавить трек в избранное
router.post('/add', auth, async (req, res) => {
  try {
    const { trackId } = req.body;
    
    // Здесь логика добавления трека
    
    res.json({ message: 'Track added successfully' });
  } catch (error) {
    console.error('Error adding track:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;