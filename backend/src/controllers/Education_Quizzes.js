const { Education_Quiz } = require('../database/assossiation');

// Get all quizzes
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Education_Quiz.findAll();
    return res.status(200).json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get a specific quiz by ID
exports.getQuizById = async (req, res) => {
  const { id } = req.params;
  try {
    const quiz = await Education_Quiz.findByPk(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    return res.status(200).json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get quizzes by type (animal or crop)
exports.getQuizzesByType = async (req, res) => {
  const { type } = req.params;
  
  // Validate type param
  if (type !== 'animal' && type !== 'crop') {
    return res.status(400).json({ message: 'Type must be either "animal" or "crop"' });
  }
  
  try {
    const quizzes = await Education_Quiz.findAll({
      where: { type }
    });
    return res.status(200).json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes by type:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Create a new quiz
exports.createQuiz = async (req, res) => {
  const { title, description, type } = req.body;
  
  // Validate required fields
  if (!title || !description || !type) {
    return res.status(400).json({ message: 'Title, description, and type are required' });
  }
  
  // Validate type field
  if (type !== 'animal' && type !== 'crop') {
    return res.status(400).json({ message: 'Type must be either "animal" or "crop"' });
  }
  
  try {
    const newQuiz = await Education_Quiz.create({
      title,
      description,
      type
    });
    
    return res.status(201).json(newQuiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Update an existing quiz
exports.updateQuiz = async (req, res) => {
  const { id } = req.params;
  const { title, description, type } = req.body;
  
  // Validate type if provided
  if (type && type !== 'animal' && type !== 'crop') {
    return res.status(400).json({ message: 'Type must be either "animal" or "crop"' });
  }
  
  try {
    const quiz = await Education_Quiz.findByPk(id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    await quiz.update({
      title: title || quiz.title,
      description: description || quiz.description,
      type: type || quiz.type
    });
    
    return res.status(200).json(quiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete a quiz
exports.deleteQuiz = async (req, res) => {
  const { id } = req.params;
  
  try {
    const quiz = await Education_Quiz.findByPk(id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    await quiz.destroy();
    
    return res.status(200).json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
