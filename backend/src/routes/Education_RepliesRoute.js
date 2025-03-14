const express = require('express');
const router = express.Router();
const Education_ReplyController = require('../controllers/Education_Replies');

router.get('/', Education_ReplyController.getAllReplies);
router.get('/:id', Education_ReplyController.getReplyById);
router.post('/', Education_ReplyController.createReply);                        
router.put('/:id', Education_ReplyController.updateReply);
router.delete('/:id', Education_ReplyController.deleteReply);


module.exports = router;