const express = require('express');
const router = express.Router();
const educationChatController = require('../controllers/EducationChat');

// Get all chat messages
router.get('/', educationChatController.getAllChatMessages);

// Get chat messages by user ID
router.get('/user/:userId', educationChatController.getChatMessagesByUserId);

// Get latest conversation (last 20 messages)
router.get('/latest/:userId', educationChatController.getLatestConversation);

// Create a new chat message
router.post('/', educationChatController.createChatMessage);

// Delete a chat message
router.delete('/:messageId', educationChatController.deleteChatMessage);

// Clear chat history for a user
router.delete('/clear/:userId', educationChatController.clearChatHistory);

module.exports = router;

