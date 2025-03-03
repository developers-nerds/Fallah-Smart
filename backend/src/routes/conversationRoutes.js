const express = require("express");
const router = express.Router();
const {
  createConversation,
  getUserConversations,
} = require("../controllers/conversationController");
const auth = require("../middleware/auth");

/**
 * @route   POST /api/conversations
 * @desc    Create a new conversation
 * @access  Private
 */
router.post("/", auth, createConversation);

/**
 * @route   GET /api/conversations
 * @desc    Get all conversations for a user
 * @access  Private
 */
router.get("/", auth, getUserConversations);

module.exports = router;
