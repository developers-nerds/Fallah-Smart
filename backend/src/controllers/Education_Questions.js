const { Education_Question, Education_Quiz } = require('../database/assossiation');

// Get all questions
exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Education_Question.findAll();
    return res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get a specific question by ID
exports.getQuestionById = async (req, res) => {
  const { id } = req.params;
  try {
    const question = await Education_Question.findByPk(id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    return res.status(200).json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get questions by quiz ID
exports.getQuestionsByQuizId = async (req, res) => {
  const { quizId } = req.params;
  try {
    // First check if the quiz exists
    const quiz = await Education_Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    const questions = await Education_Question.findAll({
      where: { quizId }
    });
    return res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching questions by quiz ID:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Create a new question
exports.createQuestion = async (req, res) => {
  let { question, options, correctAnswer, explanation, quizId } = req.body;
  
  // Validate required fields
  if (!question || !options || correctAnswer === undefined || !quizId) {
    return res.status(400).json({ message: 'Question, options, correctAnswer, and quizId are required' });
  }
  
  // Validate options is an array with at least 2 items
  if (!Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ message: 'Options must be an array with at least 2 items' });
  }
  
  // Validate correctAnswer is a valid index in options array
  if (correctAnswer < 0 || correctAnswer >= options.length) {
    return res.status(400).json({ message: 'CorrectAnswer must be a valid index in the options array' });
  }
  
  try {
    // Check if the quiz exists
    const quiz = await Education_Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Set defaults if not provided
    if (!explanation) explanation = '';
    
    // Create without specifying ID to let Sequelize auto-assign it
    const newQuestion = await Education_Question.create({
      question,
      options,
      correctAnswer,
      explanation,
      quizId
    });
    
    return res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error creating question:', error);
    
    // Handle specific database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      try {
        // Try to reset the sequence
        await Education_Question.resetSequence();
        
        // Try one more time with the sequence reset
        const newQuestion = await Education_Question.create({
          question,
          options,
          correctAnswer,
          explanation,
          quizId
        });
        
        return res.status(201).json(newQuestion);
      } catch (retryError) {
        console.error('Error after resetting sequence:', retryError);
        return res.status(409).json({ 
          message: 'Conflict with existing question ID. Please try again later.',
          error: error.message
        });
      }
    }
    
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Update an existing question
exports.updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { question, options, correctAnswer, explanation, quizId } = req.body;
  
  try {
    const questionRecord = await Education_Question.findByPk(id);
    
    if (!questionRecord) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // If quizId is provided, check if the quiz exists
    if (quizId) {
      const quiz = await Education_Quiz.findByPk(quizId);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
    }
    
    // If options and correctAnswer are both provided, validate correctAnswer
    if (options && correctAnswer !== undefined) {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ message: 'Options must be an array with at least 2 items' });
      }
      
      if (correctAnswer < 0 || correctAnswer >= options.length) {
        return res.status(400).json({ message: 'CorrectAnswer must be a valid index in the options array' });
      }
    } 
    // If only correctAnswer is provided, validate against existing options
    else if (correctAnswer !== undefined) {
      if (correctAnswer < 0 || correctAnswer >= questionRecord.options.length) {
        return res.status(400).json({ message: 'CorrectAnswer must be a valid index in the options array' });
      }
    }
    
    await questionRecord.update({
      question: question || questionRecord.question,
      options: options || questionRecord.options,
      correctAnswer: correctAnswer !== undefined ? correctAnswer : questionRecord.correctAnswer,
      explanation: explanation !== undefined ? explanation : questionRecord.explanation,
      quizId: quizId || questionRecord.quizId
    });
    
    return res.status(200).json(questionRecord);
  } catch (error) {
    console.error('Error updating question:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
  const { id } = req.params;
  
  try {
    const question = await Education_Question.findByPk(id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    await question.destroy();
    
    return res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Bulk create questions
exports.bulkCreateQuestions = async (req, res) => {
  const { questions } = req.body;
  
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Questions must be a non-empty array' });
  }
  
  try {
    // Validate all questions
    for (const q of questions) {
      const { question, options, correctAnswer, quizId } = q;
      
      if (!question || !options || correctAnswer === undefined || !quizId) {
        return res.status(400).json({ 
          message: 'Each question must have question, options, correctAnswer, and quizId fields',
          invalidQuestion: q
        });
      }
      
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ 
          message: 'Options must be an array with at least 2 items',
          invalidQuestion: q
        });
      }
      
      if (correctAnswer < 0 || correctAnswer >= options.length) {
        return res.status(400).json({ 
          message: 'CorrectAnswer must be a valid index in the options array',
          invalidQuestion: q
        });
      }
      
      // Check if the quiz exists
      const quiz = await Education_Quiz.findByPk(quizId);
      if (!quiz) {
        return res.status(404).json({ 
          message: 'Quiz not found',
          invalidQuizId: quizId,
          invalidQuestion: q
        });
      }
    }
    
    // Create all questions
    const createdQuestions = await Education_Question.bulkCreate(questions);
    
    return res.status(201).json(createdQuestions);
  } catch (error) {
    console.error('Error bulk creating questions:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
