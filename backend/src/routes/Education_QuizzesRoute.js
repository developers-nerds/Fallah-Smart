const express = require('express');
const router = express.Router();
const Education_QuizController = require('../controllers/Education_Quizzes');

router.get('/', Education_QuizController.getAllQuizzes);
router.get('/:id', Education_QuizController.getQuizById);
router.post('/', Education_QuizController.createQuiz);
router.put('/:id', Education_QuizController.updateQuiz);
router.delete('/:id', Education_QuizController.deleteQuiz);
router.get('/type/:type', Education_QuizController.getQuizzesByType);


module.exports = router;