const express = require('express');
const router = express.Router();
const Education_QuestionAndAnswerController = require('../controllers/Education_QuestionsAndAnswers');

router.get('/', Education_QuestionAndAnswerController.getAllQnAs);
router.get('/video/:videoId', Education_QuestionAndAnswerController.getQnAsByVideoId);
router.get('/:id', Education_QuestionAndAnswerController.getQnAById);
router.post('/', Education_QuestionAndAnswerController.createQnA);
router.put('/:id/toggle-like', Education_QuestionAndAnswerController.likeQnA);
router.put('/:id', Education_QuestionAndAnswerController.updateQnA);
router.delete('/:id', Education_QuestionAndAnswerController.deleteQnA);

module.exports = router;    