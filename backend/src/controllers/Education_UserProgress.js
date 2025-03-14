const { Education_UserProgress, Education_Quiz } = require('../database/assossiation');

// Get all user progress records
exports.getAllUserProgress = async (req, res) => {
  try {
    const userProgress = await Education_UserProgress.findAll();
    return res.status(200).json(userProgress);
  } catch (error) {
    console.error('Error fetching user progress records:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get a specific user progress by ID
exports.getUserProgressById = async (req, res) => {
  const { id } = req.params;
  try {
    const userProgress = await Education_UserProgress.findByPk(id);
    
    if (!userProgress) {
      return res.status(404).json({ message: 'User progress not found' });
    }
    
    return res.status(200).json(userProgress);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get user progress by user ID
exports.getUserProgressByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const userProgress = await Education_UserProgress.findAll({
      where: { userId },
      include: [{ model: Education_Quiz }]
    });
    return res.status(200).json(userProgress);
  } catch (error) {
    console.error('Error fetching user progress by user ID:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get user progress for a specific quiz
exports.getUserProgressForQuiz = async (req, res) => {
  const { userId, quizId } = req.params;
  try {
    const userProgress = await Education_UserProgress.findOne({
      where: { userId, quizId },
      include: [{ model: Education_Quiz }]
    });
    
    if (!userProgress) {
      return res.status(404).json({ message: 'User progress for this quiz not found' });
    }
    
    return res.status(200).json(userProgress);
  } catch (error) {
    console.error('Error fetching user progress for quiz:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Create or update user progress
exports.createOrUpdateUserProgress = async (req, res) => {
  const { userId, quizId, score, completed } = req.body;
  
  // Validate required fields
  if (!userId || !quizId || score === undefined) {
    return res.status(400).json({ message: 'UserId, quizId, and score are required' });
  }
  
  try {
    // Check if the quiz exists
    const quiz = await Education_Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if user progress already exists
    let userProgress = await Education_UserProgress.findOne({
      where: { userId, quizId }
    });
    
    if (userProgress) {
      // Update if the new score is higher or if completed status changes
      if (score > userProgress.score || completed !== undefined) {
        await userProgress.update({
          score: Math.max(score, userProgress.score),
          completed: completed !== undefined ? completed : userProgress.completed
        });
      }
    } else {
      // Create new progress record
      userProgress = await Education_UserProgress.create({
        userId,
        quizId,
        score,
        completed: completed !== undefined ? completed : false
      });
    }
    
    return res.status(200).json(userProgress);
  } catch (error) {
    console.error('Error creating/updating user progress:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete a user progress record
exports.deleteUserProgress = async (req, res) => {
  const { id } = req.params;
  
  try {
    const userProgress = await Education_UserProgress.findByPk(id);
    
    if (!userProgress) {
      return res.status(404).json({ message: 'User progress not found' });
    }
    
    await userProgress.destroy();
    
    return res.status(200).json({ message: 'User progress deleted successfully' });
  } catch (error) {
    console.error('Error deleting user progress:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get completed quizzes count for a user
exports.getCompletedQuizzesCount = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const count = await Education_UserProgress.count({
      where: { userId, completed: true }
    });
    
    return res.status(200).json({ userId, completedQuizzes: count });
  } catch (error) {
    console.error('Error counting completed quizzes:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
