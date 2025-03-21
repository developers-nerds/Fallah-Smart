const express = require('express');
const router = express.Router();
const Education_UserProgressController = require('../controllers/Education_UserProgress');

router.get('/', Education_UserProgressController.getAllUserProgress);
router.get('/:id', Education_UserProgressController.getUserProgressById);
router.delete('/:id', Education_UserProgressController.deleteUserProgress);
router.get('/user/:userId', Education_UserProgressController.getUserProgressByUserId);
router.get('/user/:userId/quiz/:quizId', Education_UserProgressController.getUserProgressForQuiz);
router.get('/user/:userId/completed-count', Education_UserProgressController.getCompletedQuizzesCount);
router.post('/', Education_UserProgressController.createOrUpdateUserProgress);

module.exports = router;