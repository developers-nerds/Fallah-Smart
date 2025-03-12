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

module.exports = {
  createMessage,
  getConversationMessages,
};
