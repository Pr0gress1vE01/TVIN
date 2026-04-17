const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get contacts list
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('contacts', 'username avatar status lastSeen firstName lastName')
      .select('contacts');
    
    res.json(user.contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get friend requests
router.get('/requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friendRequests.from', 'username avatar firstName lastName')
      .select('friendRequests');
    
    res.json(user.friendRequests || []);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send friend request
router.post('/request/:userId', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends
    if (targetUser.contacts.includes(req.userId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if request already sent
    const existingRequest = targetUser.friendRequests?.find(
      r => r.from.toString() === req.userId
    );
    
    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Add friend request
    await User.findByIdAndUpdate(req.params.userId, {
      $push: {
        friendRequests: {
          from: req.userId,
          createdAt: new Date(),
          status: 'pending'
        }
      }
    });

    res.json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept friend request
router.post('/accept/:userId', auth, async (req, res) => {
  try {
    // Add to both users' contacts
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { contacts: req.params.userId },
      $pull: { 
        friendRequests: { 
          from: req.params.userId 
        } 
      }
    });

    await User.findByIdAndUpdate(req.params.userId, {
      $addToSet: { contacts: req.userId }
    });

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Decline friend request
router.post('/decline/:userId', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $pull: { 
        friendRequests: { 
          from: req.params.userId 
        } 
      }
    });

    res.json({ message: 'Friend request declined' });
  } catch (error) {
    console.error('Error declining friend request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove contact
router.delete('/:userId', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $pull: { contacts: req.params.userId }
    });

    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { contacts: req.userId }
    });

    res.json({ message: 'Contact removed' });
  } catch (error) {
    console.error('Error removing contact:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get suggested friends
router.get('/suggestions', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)
      .populate('contacts');
    
    const contactIds = currentUser.contacts.map(c => c._id);
    contactIds.push(req.userId); // Exclude self

    // Find users not in contacts
    const suggestions = await User.find({
      _id: { $nin: contactIds }
    })
    .select('username avatar firstName lastName status')
    .limit(20);

    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;