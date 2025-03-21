const express = require('express');
const router = express.Router();
const Education_ReplyController = require('../controllers/Education_Replies');

router.get('/', Education_ReplyController.getAllReplies);
router.get('/question/:questionAndAnswerId', Education_ReplyController.getRepliesByQnAId);
router.get('/:id', Education_ReplyController.getReplyById);
router.post('/', Education_ReplyController.createReply);                        
router.put('/:id/toggle-like', Education_ReplyController.likeReply);
router.put('/:id', Education_ReplyController.updateReply);
router.delete('/:id', Education_ReplyController.deleteReply);

module.exports = router;