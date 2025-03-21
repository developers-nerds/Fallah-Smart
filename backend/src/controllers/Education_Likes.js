const { Education_Like, Education_QuestionAndAnswer, Education_Reply, Users } = require('../database/assossiation');
const { Sequelize, Op } = require('sequelize');

// Add a like
exports.addLike = async (req, res) => {
  const { userId, contentType, contentId } = req.body;
  
  if (!userId || !contentType || !contentId) {
    return res.status(400).json({ 
      message: 'Missing required fields: userId, contentType, contentId' 
    });
  }
  
  // Validate contentType
  if (contentType !== 'question' && contentType !== 'reply') {
    return res.status(400).json({ 
      message: 'contentType must be either "question" or "reply"' 
    });
  }
  
  try {
    // Check if the content exists
    let content;
    
    if (contentType === 'question') {
      content = await Education_QuestionAndAnswer.findByPk(contentId);
    } else {
      content = await Education_Reply.findByPk(contentId);
    }
    
    if (!content) {
      return res.status(404).json({ 
        message: `${contentType === 'question' ? 'Question' : 'Reply'} not found` 
      });
    }
    
    // Check if the user already liked this content
    const existingLike = await Education_Like.findOne({
      where: { userId, contentType, contentId }
    });
    
    if (existingLike) {
      return res.status(400).json({ 
        message: 'User already liked this content' 
      });
    }
    
    // Create the like
    const newLike = await Education_Like.create({
      userId,
      contentType,
      contentId
    });
    
    // Get the total likes for this content
    const totalLikes = await Education_Like.count({
      where: { contentType, contentId }
    });
    
    return res.status(201).json({ 
      like: newLike,
      totalLikes
    });
  } catch (error) {
    console.error('Error adding like:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

// Remove a like
exports.removeLike = async (req, res) => {
  const { userId, contentType, contentId } = req.body;
  
  if (!userId || !contentType || !contentId) {
    return res.status(400).json({ 
      message: 'Missing required fields: userId, contentType, contentId' 
    });
  }
  
  try {
    // Find the like
    const like = await Education_Like.findOne({
      where: { userId, contentType, contentId }
    });
    
    if (!like) {
      return res.status(404).json({ 
        message: 'Like not found' 
      });
    }
    
    // Delete the like
    await like.destroy();
    
    // Get the total likes for this content
    const totalLikes = await Education_Like.count({
      where: { contentType, contentId }
    });
    
    return res.status(200).json({ 
      message: 'Like removed successfully',
      totalLikes
    });
  } catch (error) {
    console.error('Error removing like:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

// Get total likes for content
exports.getLikesCount = async (req, res) => {
  const { contentType, contentId } = req.params;
  
  if (!contentType || !contentId) {
    return res.status(400).json({ 
      message: 'Missing required parameters: contentType, contentId' 
    });
  }
  
  try {
    const totalLikes = await Education_Like.count({
      where: { contentType, contentId }
    });
    
    return res.status(200).json({ totalLikes });
  } catch (error) {
    console.error('Error getting likes count:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

// Check if a user has liked content
exports.checkUserLike = async (req, res) => {
  const { userId, contentType, contentId } = req.params;
  
  if (!userId || !contentType || !contentId) {
    return res.status(400).json({ 
      message: 'Missing required parameters: userId, contentType, contentId' 
    });
  }
  
  try {
    const like = await Education_Like.findOne({
      where: { userId, contentType, contentId }
    });
    
    return res.status(200).json({ 
      hasLiked: !!like 
    });
  } catch (error) {
    console.error('Error checking user like:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

// Get all likes for a question/reply with user info
exports.getContentLikes = async (req, res) => {
  const { contentType, contentId } = req.params;
  
  if (!contentType || !contentId) {
    return res.status(400).json({ 
      message: 'Missing required parameters: contentType, contentId' 
    });
  }
  
  try {
    const likes = await Education_Like.findAll({
      where: { contentType, contentId },
      include: [{ 
        model: Users,
        attributes: ['id', 'username', 'profilePicture']
      }]
    });
    
    return res.status(200).json(likes);
  } catch (error) {
    console.error('Error getting content likes:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}; 