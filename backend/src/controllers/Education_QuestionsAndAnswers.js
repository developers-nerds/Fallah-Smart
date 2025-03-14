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
      include: [{ model: Education_Reply }],
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
  const { text, authorName, authorImage, timestamp, likes, videoId, userId } = req.body;
  
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
      likes: likes || 0,
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

// Update an existing QnA
exports.updateQnA = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  
  // Only text can be updated
  if (!text) {
    return res.status(400).json({ message: 'Text is required for update' });
  }
  
  try {
    const qna = await Education_QuestionAndAnswer.findByPk(id);
    
    if (!qna) {
      return res.status(404).json({ message: 'Q&A not found' });
    }
    
    await qna.update({ text });
    
    return res.status(200).json(qna);
  } catch (error) {
    console.error('Error updating Q&A:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Like a QnA
exports.likeQnA = async (req, res) => {
  const { id } = req.params;
  
  try {
    const qna = await Education_QuestionAndAnswer.findByPk(id);
    
    if (!qna) {
      return res.status(404).json({ message: 'Q&A not found' });
    }
    
    await qna.update({ likes: qna.likes + 1 });
    
    return res.status(200).json(qna);
  } catch (error) {
    console.error('Error liking Q&A:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete a QnA
exports.deleteQnA = async (req, res) => {
  const { id } = req.params;
  
  try {
    const qna = await Education_QuestionAndAnswer.findByPk(id);
    
    if (!qna) {
      return res.status(404).json({ message: 'Q&A not found' });
    }
    
    await qna.destroy();
    
    return res.status(200).json({ message: 'Q&A deleted successfully' });
  } catch (error) {
    console.error('Error deleting Q&A:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
