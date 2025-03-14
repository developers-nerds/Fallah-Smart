const { Education_Crop, Education_Quiz } = require('../database/assossiation');
const { Op } = require('sequelize');

// Get all crops
exports.getAllCrops = async (req, res) => {
  try {
    const crops = await Education_Crop.findAll();
    return res.status(200).json(crops);
  } catch (error) {
    console.error('Error fetching crops:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get a specific crop by ID
exports.getCropById = async (req, res) => {
  const { id } = req.params;
  try {
    const crop = await Education_Crop.findByPk(id);
    
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    
    return res.status(200).json(crop);
  } catch (error) {
    console.error('Error fetching crop:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get crops by category
exports.getCropsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const crops = await Education_Crop.findAll({
      where: { category }
    });
    return res.status(200).json(crops);
  } catch (error) {
    console.error('Error fetching crops by category:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Search crops by name
exports.searchCrops = async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }
  
  try {
    const crops = await Education_Crop.findAll({
      where: {
        name: {
          [Op.iLike]: `%${query}%`
        }
      }
    });
    
    return res.status(200).json(crops);
  } catch (error) {
    console.error('Error searching crops:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get crop by quiz ID
exports.getCropByQuizId = async (req, res) => {
  const { quizId } = req.params;
  try {
    const crop = await Education_Crop.findOne({
      where: { quizId }
    });
    
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found for this quiz' });
    }
    
    return res.status(200).json(crop);
  } catch (error) {
    console.error('Error fetching crop by quiz ID:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Create a new crop
exports.createCrop = async (req, res) => {
  const { name, icon, category, videoUrl, quizId } = req.body;
  
  // Validate required fields
  if (!name || !category) {
    return res.status(400).json({ message: 'Name and category are required' });
  }
  
  try {
    // If quizId is provided, check if the quiz exists and is of type 'crop'
    if (quizId) {
      const quiz = await Education_Quiz.findByPk(quizId);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      if (quiz.type !== 'crop') {
        return res.status(400).json({ message: 'The provided quizId must be of type "crop"' });
      }
    }
    
    const newCrop = await Education_Crop.create({
      name,
      icon,
      category,
      videoUrl,
      quizId
    });
    
    return res.status(201).json(newCrop);
  } catch (error) {
    console.error('Error creating crop:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Update an existing crop
exports.updateCrop = async (req, res) => {
  const { id } = req.params;
  const { name, icon, category, videoUrl, quizId } = req.body;
  
  try {
    const crop = await Education_Crop.findByPk(id);
    
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    
    // If quizId is provided, check if the quiz exists and is of type 'crop'
    if (quizId) {
      const quiz = await Education_Quiz.findByPk(quizId);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      if (quiz.type !== 'crop') {
        return res.status(400).json({ message: 'The provided quizId must be of type "crop"' });
      }
    }
    
    await crop.update({
      name: name || crop.name,
      icon: icon !== undefined ? icon : crop.icon,
      category: category || crop.category,
      videoUrl: videoUrl !== undefined ? videoUrl : crop.videoUrl,
      quizId: quizId !== undefined ? quizId : crop.quizId
    });
    
    return res.status(200).json(crop);
  } catch (error) {
    console.error('Error updating crop:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete a crop
exports.deleteCrop = async (req, res) => {
  const { id } = req.params;
  
  try {
    const crop = await Education_Crop.findByPk(id);
    
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    
    await crop.destroy();
    
    return res.status(200).json({ message: 'Crop deleted successfully' });
  } catch (error) {
    console.error('Error deleting crop:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
