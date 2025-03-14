const { Education_AdditionalVideo, Education_Video } = require('../database/assossiation');

// Get all additional videos
exports.getAllAdditionalVideos = async (req, res) => {
  try {
    const additionalVideos = await Education_AdditionalVideo.findAll();
    return res.status(200).json(additionalVideos);
  } catch (error) {
    console.error('Error fetching additional videos:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get a specific additional video by ID
exports.getAdditionalVideoById = async (req, res) => {
  const { id } = req.params;
  try {
    const additionalVideo = await Education_AdditionalVideo.findByPk(id);
    
    if (!additionalVideo) {
      return res.status(404).json({ message: 'Additional video not found' });
    }
    
    return res.status(200).json(additionalVideo);
  } catch (error) {
    console.error('Error fetching additional video:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get additional videos by main video ID
exports.getAdditionalVideosByVideoId = async (req, res) => {
  const { videoId } = req.params;
  try {
    // First check if the main video exists
    const mainVideo = await Education_Video.findByPk(videoId);
    if (!mainVideo) {
      return res.status(404).json({ message: 'Main video not found' });
    }
    
    const additionalVideos = await Education_AdditionalVideo.findAll({
      where: { videoId }
    });
    return res.status(200).json(additionalVideos);
  } catch (error) {
    console.error('Error fetching additional videos by video ID:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Create a new additional video
exports.createAdditionalVideo = async (req, res) => {
  const { title, youtubeId, videoId } = req.body;
  
  // Validate required fields
  if (!title || !youtubeId || !videoId) {
    return res.status(400).json({ message: 'Title, youtubeId, and videoId are required' });
  }
  
  try {
    // Check if the main video exists
    const mainVideo = await Education_Video.findByPk(videoId);
    if (!mainVideo) {
      return res.status(404).json({ message: 'Main video not found' });
    }
    
    const newAdditionalVideo = await Education_AdditionalVideo.create({
      title,
      youtubeId,
      videoId
    });
    
    return res.status(201).json(newAdditionalVideo);
  } catch (error) {
    console.error('Error creating additional video:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Update an existing additional video
exports.updateAdditionalVideo = async (req, res) => {
  const { id } = req.params;
  const { title, youtubeId, videoId } = req.body;
  
  try {
    const additionalVideo = await Education_AdditionalVideo.findByPk(id);
    
    if (!additionalVideo) {
      return res.status(404).json({ message: 'Additional video not found' });
    }
    
    // If videoId is provided, check if the main video exists
    if (videoId) {
      const mainVideo = await Education_Video.findByPk(videoId);
      if (!mainVideo) {
        return res.status(404).json({ message: 'Main video not found' });
      }
    }
    
    await additionalVideo.update({
      title: title || additionalVideo.title,
      youtubeId: youtubeId || additionalVideo.youtubeId,
      videoId: videoId || additionalVideo.videoId
    });
    
    return res.status(200).json(additionalVideo);
  } catch (error) {
    console.error('Error updating additional video:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete an additional video
exports.deleteAdditionalVideo = async (req, res) => {
  const { id } = req.params;
  
  try {
    const additionalVideo = await Education_AdditionalVideo.findByPk(id);
    
    if (!additionalVideo) {
      return res.status(404).json({ message: 'Additional video not found' });
    }
    
    await additionalVideo.destroy();
    
    return res.status(200).json({ message: 'Additional video deleted successfully' });
  } catch (error) {
    console.error('Error deleting additional video:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};










