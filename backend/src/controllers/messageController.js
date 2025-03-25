const { Messages, Conversations } = require("../database/assossiation");

/**
 * Create a new message in a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createMessage = async (req, res) => {
  try {
    const { conversationId, content, type, sender } = req.body;

    // Validate required fields
    if (!conversationId || !content) {
      return res.status(400).json({
        success: false,
        message: "ConversationId and content are required fields",
      });
    }

    // Validate sender field
    if (!sender || !["user", "assistant"].includes(sender)) {
      return res.status(400).json({
        success: false,
        message: "Sender must be either 'user' or 'assistant'",
      });
    }

    // Verify conversation exists
    const conversation = await Conversations.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Create new message
    const newMessage = await Messages.create({
      sender,
      type,
      content,
      conversationId: conversationId,
    });

    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create message",
      error: error.message,
    });
  }
};

/**
 * Get all messages for a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "ConversationId is required",
      });
    }

    // Verify conversation exists
    const conversation = await Conversations.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Get all messages for the conversation
    const messages = await Messages.findAll({
      where: { conversationId: conversationId },
      order: [["createdAt", "ASC"]],
    });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

/**
 * Get message statistics for admin dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMessageStats = async (req, res) => {
  try {
    // Check if this is an admin request - you may need to add admin role check
    // if (!req.user.isAdmin) return res.status(403).json({ success: false, message: "Unauthorized" });

    const { Users } = require("../database/assossiation");
    const sequelize = Messages.sequelize;
    const { Op } = require("sequelize");

    // Set the total tokens amount
    const totalTokens = 1000;

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count today's messages
    const todayMessagesCount = await Messages.count({
      where: {
        createdAt: {
          [Op.gte]: today,
        },
      },
    });

    // Calculate used and remaining tokens
    const usedTokens = todayMessagesCount / 2;
    const remainingTokens = totalTokens - usedTokens;

    // Get recent conversations
    const recentConversations = await Conversations.findAll({
      include: [
        {
          model: Users,
          as: "user",
          attributes: ["email", "username"],
        },
      ],
      order: [["updatedAt", "DESC"]],
      limit: 5,
    });

    // Get message counts for these conversations
    const conversationIds = recentConversations.map((conv) => conv.id);
    const messageCounts = await Messages.findAll({
      attributes: [
        "conversationId",
        [sequelize.fn("COUNT", sequelize.col("id")), "messageCount"],
        [sequelize.fn("MAX", sequelize.col("createdAt")), "lastMessageTime"],
      ],
      where: {
        conversationId: conversationIds,
      },
      group: ["conversationId"],
    });

    // Create a map of conversation ID to message count and time
    const messageData = {};
    messageCounts.forEach((count) => {
      const convId = count.conversationId;
      messageData[convId] = {
        count: parseInt(count.getDataValue("messageCount")),
        time: count.getDataValue("lastMessageTime"),
      };
    });

    // Format the response data
    const formattedConversations = recentConversations.map((conv) => {
      const convId = conv.id;
      const data = messageData[convId] || { count: 0, time: null };

      return {
        id: convId,
        user: conv.user ? conv.user.email : "Unknown",
        time: data.time ? new Date(data.time).toLocaleTimeString() : "-",
        tokens: data.count, // Using message count as token count
        messages: data.count,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        tokenUsage: {
          used: usedTokens,
          remaining: remainingTokens,
          total: totalTokens,
        },
        recentConversations: formattedConversations,
      },
    });
  } catch (error) {
    console.error("Error fetching message stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch message statistics",
      error: error.message,
    });
  }
};

module.exports = {
  createMessage,
  getConversationMessages,
  getMessageStats,
};
