const express = require("express");
const router = express.Router();
const {
  createMessage,
  getConversationMessages,
  getMessageStats,
} = require("../controllers/messageController");
const auth = require("../middleware/auth");

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

/**
 * @route   GET /api/messages/stats/admin
 * @desc    Get message statistics for admin dashboard
 * @access  Private (Admin only)
 */
router.get("/stats/admin", auth, getMessageStats);

module.exports = router;
