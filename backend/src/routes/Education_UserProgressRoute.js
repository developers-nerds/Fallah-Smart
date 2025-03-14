const express = require('express');
const router = express.Router();
const Education_UserProgressController = require('../controllers/Education_UserProgress');

router.get('/', Education_UserProgressController.getAllUserProgress);
router.get('/:id', Education_UserProgressController.getUserProgressById);
router.delete('/:id', Education_UserProgressController.deleteUserProgress);
router.get('/user/:userId', Education_UserProgressController.getUserProgressByUserId);




module.exports = router;