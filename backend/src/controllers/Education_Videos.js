const { Education_Video, Education_AdditionalVideo, Education_QuestionAndAnswer } = require('../database/assossiation');
const { Op } = require('sequelize');

// Get all videos
exports.getAllVideos = async (req, res) => {
  try {
    const videos = await Education_Video.findAll();
    return res.status(200).json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get a specific video by ID
exports.getVideoById = async (req, res) => {
  const { id } = req.params;
  try {
    const video = await Education_Video.findByPk(id, {
      include: [
        { model: Education_AdditionalVideo },
        { model: Education_QuestionAndAnswer }
      ]
    });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    return res.status(200).json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get videos by category
exports.getVideosByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const videos = await Education_Video.findAll({
      where: { category }
    });
    return res.status(200).json(videos);
  } catch (error) {
    console.error('Error fetching videos by category:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get videos by type (animal or crop)
exports.getVideosByType = async (req, res) => {
  const { type } = req.params;
  
  // Validate type param
  if (type !== 'animal' && type !== 'crop') {
    return res.status(400).json({ message: 'Type must be either "animal" or "crop"' });
  }
  
  try {
    const videos = await Education_Video.findAll({
      where: { type }
    });
    return res.status(200).json(videos);
  } catch (error) {
    console.error('Error fetching videos by type:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Search videos by title
exports.searchVideos = async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }
  
  try {
    const videos = await Education_Video.findAll({
      where: {
        title: {
          [Op.iLike]: `%${query}%`
        }
      }
    });
    
    return res.status(200).json(videos);
  } catch (error) {
    console.error('Error searching videos:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Create a new video
exports.createVideo = async (req, res) => {
  const { title, category, youtubeId, type } = req.body;
  
  // Validate required fields
  if (!title || !category || !type) {
    return res.status(400).json({ message: 'Title, category, and type are required' });
  }
  
  // Validate type field
  if (type !== 'animal' && type !== 'crop') {
    return res.status(400).json({ message: 'Type must be either "animal" or "crop"' });
  }
  
  try {
    const newVideo = await Education_Video.create({
      title,
      category,
      youtubeId,
      type
    });
    
    return res.status(201).json(newVideo);
  } catch (error) {
    console.error('Error creating video:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Update an existing video
exports.updateVideo = async (req, res) => {
  const { id } = req.params;
  const { title, category, youtubeId, type } = req.body;
  
  // Validate type if provided
  if (type && type !== 'animal' && type !== 'crop') {
    return res.status(400).json({ message: 'Type must be either "animal" or "crop"' });
  }
  
  try {
    const video = await Education_Video.findByPk(id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    await video.update({
      title: title || video.title,
      category: category || video.category,
      youtubeId: youtubeId !== undefined ? youtubeId : video.youtubeId,
      type: type || video.type
    });
    
    return res.status(200).json(video);
  } catch (error) {
    console.error('Error updating video:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete a video
exports.deleteVideo = async (req, res) => {
  const { id } = req.params;
  
  try {
    const video = await Education_Video.findByPk(id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    await video.destroy();
    
    return res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
