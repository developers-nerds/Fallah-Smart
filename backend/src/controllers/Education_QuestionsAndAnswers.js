const { Education_QuestionAndAnswer, Education_Video, Education_Reply } = require('../database/assossiation');

// Get all QnAs
exports.getAllQnAs = async (req, res) => {
  try {
    const qnas = await Education_QuestionAndAnswer.findAll();
    return res.status(200).json(qnas);
  } catch (error) {
    console.error('Error fetching QnAs:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get a specific QnA by ID
exports.getQnAById = async (req, res) => {
  const { id } = req.params;
  try {
    const qna = await Education_QuestionAndAnswer.findByPk(id, {
      include: [{ model: Education_Reply }]
    });
    
    if (!qna) {
      return res.status(404).json({ message: 'Question and answer not found' });
    }
    
    return res.status(200).json(qna);
  } catch (error) {
    console.error('Error fetching QnA:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get QnAs by video ID
exports.getQnAsByVideoId = async (req, res) => {
  const { videoId } = req.params;
  try {
    // First check if the video exists
    const video = await Education_Video.findByPk(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    const qnas = await Education_QuestionAndAnswer.findAll({
      where: { videoId },
      include: [{ 
        model: Education_Reply,
        order: [['timestamp', 'ASC']]
      }],
      order: [['timestamp', 'DESC']]
    });
    return res.status(200).json(qnas);
  } catch (error) {
    console.error('Error fetching QnAs by video ID:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get QnAs by user ID
exports.getQnAsByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const qnas = await Education_QuestionAndAnswer.findAll({
      where: { userId },
      include: [{ model: Education_Reply }],
      order: [['timestamp', 'DESC']]
    });
    return res.status(200).json(qnas);
  } catch (error) {
    console.error('Error fetching QnAs by user ID:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Create a new QnA
exports.createQnA = async (req, res) => {
  const { text, authorName, authorImage, timestamp, likesisClicked, videoId, userId } = req.body;
  
  // Validate required fields
  if (!text || !authorName || !authorImage || !videoId) {
    return res.status(400).json({ message: 'Text, authorName, authorImage, and videoId are required' });
  }
  
  try {
    // Check if the video exists
    const video = await Education_Video.findByPk(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    const newQnA = await Education_QuestionAndAnswer.create({
      text,
      authorName,
      authorImage,
      timestamp: timestamp || new Date(),
      likesisClicked: likesisClicked !== undefined ? likesisClicked : false,
      videoId,
      userId
    });
    
    return res.status(201).json(newQnA);
  } catch (error) {
    console.error('Error creating QnA:', error);
    console.error('Error creating Q&A:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Update an existing question and answer
exports.updateQnA = async (req, res) => {
  const { id } = req.params;
  const { text, userId } = req.body;
  
  // Text and userId are required for update
  if (!text || !userId) {
    return res.status(400).json({ message: 'Text and userId are required for update' });
  }
  
  try {
    const qna = await Education_QuestionAndAnswer.findByPk(id);
    
    if (!qna) {
      return res.status(404).json({ message: 'Question and answer not found' });
    }
    
    // Check if the requesting user is the owner of the question
    if (qna.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: Only the owner can update this question' });
    }
    
    await qna.update({ text });
    
    return res.status(200).json(qna);
  } catch (error) {
    console.error('Error updating question and answer:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Like a QnA
exports.likeQnA = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  try {
    const qna = await Education_QuestionAndAnswer.findByPk(id);
    
    if (!qna) {
      return res.status(404).json({ message: 'Question and answer not found' });
    }
    
    // Toggle the likesisClicked value
    const newLikeStatus = !qna.likesisClicked;
    
    // Update only the likesisClicked status without changing the owner (userId)
    await qna.update({ 
      likesisClicked: newLikeStatus
    });
    
    return res.status(200).json({
      ...qna.toJSON(),
      likesisClicked: newLikeStatus
    });
  } catch (error) {
    console.error('Error toggling Q&A like:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete a question and answer
exports.deleteQnA = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  // userId is required for delete operation
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required for deletion' });
  }
  
  try {
    const qna = await Education_QuestionAndAnswer.findByPk(id);
    
    if (!qna) {
      return res.status(404).json({ message: 'Question and answer not found' });
    }
    
    // Check if the requesting user is the owner of the question
    if (qna.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: Only the owner can delete this question' });
    }
    
    await qna.destroy();
    
    return res.status(200).json({ message: 'Question and answer deleted successfully' });
  } catch (error) {
    console.error('Error deleting question and answer:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
