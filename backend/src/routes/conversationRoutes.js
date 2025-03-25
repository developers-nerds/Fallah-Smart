const express = require("express");
const router = express.Router();
const {
  createConversation,
  getUserConversations,
  deleteConversations,
  getAllConversationsForAdmin,
  getConversationStats,
} = require("../controllers/conversationController");
const auth = require("../middleware/auth");

/**
 * @route   POST /api/conversations/create
 * @desc    Create a new conversation
 * @access  Private
 */
router.post("/create", auth, createConversation);

/**
 * @route   GET /api/conversations/get
 * @desc    Get all conversations for a user
 * @access  Private
 */
router.get("/get", auth, getUserConversations);

/**
 * @route   DELETE /api/conversations/delete
 * @desc    Delete one or multiple conversations
 * @access  Private
 */
router.delete("/delete", auth, deleteConversations);

/**
 * @route   GET /api/conversations/admin/all
 * @desc    Get all conversations for admin dashboard
 * @access  Private (Admin only)
 */
router.get("/admin/all", auth, getAllConversationsForAdmin);

/**
 * @route   GET /api/conversations/admin/stats
 * @desc    Get conversation statistics for admin dashboard
 * @access  Private (Admin only)
 */
router.get("/admin/stats", auth, getConversationStats);

module.exports = router;
