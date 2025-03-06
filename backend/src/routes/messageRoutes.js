const express = require("express");
const router = express.Router();
const {
  createMessage,
  getConversationMessages,
} = require("../controllers/messageController");

/**
 * @route   POST /api/messages/create
 * @desc    Create a new message in a conversation
 * @access  Public
 */
router.post("/create", createMessage);

/**
 * @route   GET /api/messages/:conversationId
 * @desc    Get all messages for a conversation
 * @access  Public
 */
router.get("/:conversationId", getConversationMessages);

module.exports = router;
