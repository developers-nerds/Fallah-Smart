const express = require('express');
const router = express.Router();
const stockFeedController = require('../controllers/stockFeedController');
const auth = require('../middleware/auth');
const { StockFeed } = require('../database/models');

// Middleware to check if feed exists and belongs to user
const checkFeedOwnership = async (req, res, next) => {
  try {
    const feed = await StockFeed.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!feed) {
      return res.status(404).json({ error: 'Feed not found' });
    }

    req.feed = feed;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking feed ownership' });
  }
};

// All routes require authentication
router.use(auth);

// CRUD routes
router.post('/', stockFeedController.createFeed);
router.get('/', stockFeedController.getAllFeeds);
router.get('/:id', checkFeedOwnership, stockFeedController.getFeedById);
router.put('/:id', checkFeedOwnership, stockFeedController.updateFeed);
router.delete('/:id', checkFeedOwnership, stockFeedController.deleteFeed);

// Quantity management
router.patch('/:id/quantity', checkFeedOwnership, stockFeedController.updateFeedQuantity);

module.exports = router; 