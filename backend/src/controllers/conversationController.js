const { Conversations } = require("../database/assossiation");

/**
 * Create a new conversation for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createConversation = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from auth middleware
    const { conversation_name, icon, description } = req.body;

    // Create new conversation
    const newConversation = await Conversations.create({
      userId,
      conversation_name: conversation_name,
      icon: icon,
      description: description,
    });

    res.status(201).json({
      success: true,
      data: newConversation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create conversation",
      error: error.message,
    });
  }
};

/**
 * Get all conversations for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all conversations for the user
    const conversations = await Conversations.findAll({
      where: { userId },
      order: [["updatedAt", "DESC"]], // Sort by most recently updated
    });

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};

/**
 * Delete one or multiple conversations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationIds } = req.body;

    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one conversation ID to delete",
      });
    }

    // Delete conversations that belong to the user
    const deletedCount = await Conversations.destroy({
      where: {
        id: conversationIds,
        userId: userId,
      },
    });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${deletedCount} conversation(s)`,
      deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete conversations",
      error: error.message,
    });
  }
};

module.exports = {
  createConversation,
  getUserConversations,
  deleteConversations,
};
