const express = require('express');
const router = express.Router();
const Education_QuestionController = require('../controllers/Education_Questions');

router.get('/', Education_QuestionController.getAllQuestions);
router.get('/:id', Education_QuestionController.getQuestionById);
router.post('/', Education_QuestionController.createQuestion);
router.put('/:id', Education_QuestionController.updateQuestion);
router.delete('/:id', Education_QuestionController.deleteQuestion);
router.get('/quiz/:quizId', Education_QuestionController.getQuestionsByQuizId);

module.exports = router;