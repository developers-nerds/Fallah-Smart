const express = require('express');
const router = express.Router();
const Education_LikesController = require('../controllers/Education_Likes');

// Add a like
router.post('/add', Education_LikesController.addLike);

// Remove a like
router.post('/remove', Education_LikesController.removeLike);

// Get likes count for content
router.get('/count/:contentType/:contentId', Education_LikesController.getLikesCount);

// Check if a user has liked content
router.get('/check/:userId/:contentType/:contentId', Education_LikesController.checkUserLike);

// Get all likes for content with user info
router.get('/:contentType/:contentId', Education_LikesController.getContentLikes);

module.exports = router; 