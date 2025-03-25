const { Conversations } = require("../database/assossiation");
const { sequelize } = require("../database/assossiation");

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

/**
 * Get all conversations with user info for admin dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllConversationsForAdmin = async (req, res) => {
  try {
    // Check if this is an admin request - you may need to add admin role check
    // if (!req.user.isAdmin) return res.status(403).json({ success: false, message: "Unauthorized" });

    // Find all conversations with associated user data
    const conversations = await Conversations.findAll({
      include: [
        {
          model: sequelize.models.User,
          attributes: ["email", "username"],
        },
        {
          model: sequelize.models.Message,
          attributes: [
            [
              sequelize.fn("COUNT", sequelize.col("Messages.id")),
              "messageCount",
            ],
          ],
        },
      ],
      group: ["Conversation.id"],
      order: [["updatedAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    console.error("Error fetching admin conversations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations for admin",
      error: error.message,
    });
  }
};

/**
 * Get conversation statistics for admin dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getConversationStats = async (req, res) => {
  try {
    // Check if this is an admin request - you may need to add admin role check
    // if (!req.user.isAdmin) return res.status(403).json({ success: false, message: "Unauthorized" });

    const { Op } = require("sequelize");
    const { Users, Messages } = require("../database/assossiation");

    // Get date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get conversations per day for the last 7 days
    const dailyConversations = await Conversations.findAll({
      attributes: [
        [sequelize.fn("date_trunc", "day", sequelize.col("createdAt")), "day"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
      group: [sequelize.fn("date_trunc", "day", sequelize.col("createdAt"))],
      order: [
        [sequelize.fn("date_trunc", "day", sequelize.col("createdAt")), "ASC"],
      ],
    });

    // Get total conversations
    const totalConversations = await Conversations.count();

    // Get recent conversations with user info - fixed include
    const recentConversations = await Conversations.findAll({
      include: [
        {
          model: Users,
          as: "user", // Make sure this matches the association alias in assossiation.js
          attributes: ["email", "username"],
        },
      ],
      order: [["updatedAt", "DESC"]],
      limit: 10,
    });

    res.status(200).json({
      success: true,
      data: {
        dailyConversations: dailyConversations.map((dc) => ({
          day: new Date(dc.getDataValue("day")).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          conversations: parseInt(dc.getDataValue("count")),
        })),
        totalConversations,
        recentConversations,
      },
    });
  } catch (error) {
    console.error("Error fetching conversation stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversation statistics",
      error: error.message,
    });
  }
};

module.exports = {
  createConversation,
  getUserConversations,
  deleteConversations,
  getAllConversationsForAdmin,
  getConversationStats,
};
