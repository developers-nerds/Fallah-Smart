const { Education_Reply, Education_QuestionAndAnswer } = require('../database/assossiation');

// Get all replies
exports.getAllReplies = async (req, res) => {
  try {
    const replies = await Education_Reply.findAll();
    return res.status(200).json(replies);
  } catch (error) {
    console.error('Error fetching replies:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get a specific reply by ID
exports.getReplyById = async (req, res) => {
  const { id } = req.params;
  try {
    const reply = await Education_Reply.findByPk(id);
    
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    
    return res.status(200).json(reply);
  } catch (error) {
    console.error('Error fetching reply:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get replies by question and answer ID
exports.getRepliesByQnAId = async (req, res) => {
  const { questionAndAnswerId } = req.params;
  try {
    console.log(`Fetching replies for question ID: ${questionAndAnswerId}`);
    
    // First check if the QnA exists
    const qna = await Education_QuestionAndAnswer.findByPk(questionAndAnswerId);
    if (!qna) {
      console.log(`Question with ID ${questionAndAnswerId} not found`);
      return res.status(404).json({ message: 'Question and answer not found' });
    }
    
    console.log(`Found question: ${qna.text.substring(0, 30)}...`);
    
    const replies = await Education_Reply.findAll({
      where: { questionAndAnswerId },
      order: [['timestamp', 'ASC']] // Keep oldest first consistently for conversation flow
    });
    
    console.log(`Found ${replies.length} replies for question ID ${questionAndAnswerId}`);
    
    return res.status(200).json(replies);
  } catch (error) {
    console.error('Error fetching replies by QnA ID:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get replies by user ID
exports.getRepliesByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const replies = await Education_Reply.findAll({
      where: { userId },
      order: [['timestamp', 'DESC']] // Latest first
    });
    return res.status(200).json(replies);
  } catch (error) {
    console.error('Error fetching replies by user ID:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Create a new reply
exports.createReply = async (req, res) => {
  const { text, authorName, authorImage, timestamp, likesisClicked, questionAndAnswerId, userId } = req.body;
  
  // Validate required fields
  if (!text || !authorName || !authorImage || !questionAndAnswerId) {
    return res.status(400).json({ message: 'Text, authorName, authorImage, and questionAndAnswerId are required' });
  }
  
  try {
    // Check if the QnA exists
    const qna = await Education_QuestionAndAnswer.findByPk(questionAndAnswerId);
    if (!qna) {
      return res.status(404).json({ message: 'Question and answer not found' });
    }
    
    const newReply = await Education_Reply.create({
      text,
      authorName,
      authorImage,
      timestamp: timestamp || new Date(),
      likesisClicked: likesisClicked !== undefined ? likesisClicked : false,
      questionAndAnswerId,
      userId
    });
    
    return res.status(201).json(newReply);
  } catch (error) {
    console.error('Error creating reply:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Update an existing reply
exports.updateReply = async (req, res) => {
  const { id } = req.params;
  const { text, userId } = req.body;
  
  // Text and userId are required for update
  if (!text || !userId) {
    return res.status(400).json({ message: 'Text and userId are required for update' });
  }
  
  try {
    const reply = await Education_Reply.findByPk(id);
    
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    
    // Check if the requesting user is the owner of the reply
    if (reply.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: Only the owner can update this reply' });
    }
    
    await reply.update({ text });
    
    return res.status(200).json(reply);
  } catch (error) {
    console.error('Error updating reply:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Like or unlike a reply
exports.likeReply = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  try {
    const reply = await Education_Reply.findByPk(id);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // Toggle the likesisClicked value
    const newLikeStatus = !reply.likesisClicked;
    
    // Update only the likesisClicked status without changing the owner (userId)
    await reply.update({ 
      likesisClicked: newLikeStatus
    });
    
    return res.status(200).json({ 
      ...reply.toJSON(),
      likesisClicked: newLikeStatus
    });
  } catch (error) {
    console.error('Error toggling reply like:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete a reply
exports.deleteReply = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  // userId is required for delete operation
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required for deletion' });
  }
  
  try {
    const reply = await Education_Reply.findByPk(id);
    
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    
    // Check if the requesting user is the owner of the reply
    if (reply.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: Only the owner can delete this reply' });
    }
    
    await reply.destroy();
    
    return res.status(200).json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Error deleting reply:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
