const { Education_Animal, Education_Quiz } = require('../database/assossiation');
const { Op } = require('sequelize');

// Get all animals
exports.getAllAnimals = async (req, res) => {
  try {
    const animals = await Education_Animal.findAll();
    return res.status(200).json(animals);
  } catch (error) {
    console.error('Error fetching animals:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get a specific animal by ID
exports.getAnimalById = async (req, res) => {
  const { id } = req.params;
  try {
    const animal = await Education_Animal.findByPk(id);
    
    if (!animal) {
      return res.status(404).json({ message: 'Animal not found' });
    }
    
    return res.status(200).json(animal);
  } catch (error) {
    console.error('Error fetching animal:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get animals by category
exports.getAnimalsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const animals = await Education_Animal.findAll({
      where: { category }
    });
    return res.status(200).json(animals);
  } catch (error) {
    console.error('Error fetching animals by category:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Search animals by name
exports.searchAnimals = async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }
  
  try {
    const animals = await Education_Animal.findAll({
      where: {
        name: {
          [Op.iLike]: `%${query}%`
        }
      }
    });
    
    return res.status(200).json(animals);
  } catch (error) {
    console.error('Error searching animals:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Create a new animal
exports.createAnimal = async (req, res) => {
  const { name, icon, category, videoUrl, quizId } = req.body;
  
  // Validate required fields
  if (!name || !category) {
    return res.status(400).json({ message: 'Name and category are required' });
  }
  
  try {
    // If quizId is provided, check if the quiz exists and is of type 'animal'
    if (quizId) {
      const quiz = await Education_Quiz.findByPk(quizId);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      if (quiz.type !== 'animal') {
        return res.status(400).json({ message: 'The provided quizId must be of type "animal"' });
      }
    }
    
    const newAnimal = await Education_Animal.create({
      name,
      icon,
      category,
      videoUrl,
      quizId
    });
    
    return res.status(201).json(newAnimal);
  } catch (error) {
    console.error('Error creating animal:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Update an existing animal
exports.updateAnimal = async (req, res) => {
  const { id } = req.params;
  const { name, icon, category, videoUrl, quizId } = req.body;
  
  try {
    const animal = await Education_Animal.findByPk(id);
    
    if (!animal) {
      return res.status(404).json({ message: 'Animal not found' });
    }
    
    // If quizId is provided, check if the quiz exists and is of type 'animal'
    if (quizId) {
      const quiz = await Education_Quiz.findByPk(quizId);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      if (quiz.type !== 'animal') {
        return res.status(400).json({ message: 'The provided quizId must be of type "animal"' });
      }
    }
    
    await animal.update({
      name: name || animal.name,
      icon: icon !== undefined ? icon : animal.icon,
      category: category || animal.category,
      videoUrl: videoUrl !== undefined ? videoUrl : animal.videoUrl,
      quizId: quizId !== undefined ? quizId : animal.quizId
    });
    
    return res.status(200).json(animal);
  } catch (error) {
    console.error('Error updating animal:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete an animal
exports.deleteAnimal = async (req, res) => {
  const { id } = req.params;
  
  try {
    const animal = await Education_Animal.findByPk(id);
    
    if (!animal) {
      return res.status(404).json({ message: 'Animal not found' });
    }
    
    await animal.destroy();
    
    return res.status(200).json({ message: 'Animal deleted successfully' });
  } catch (error) {
    console.error('Error deleting animal:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}; 