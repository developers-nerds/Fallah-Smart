const { Conversations, Messages } = require("../database/assossiation");

/**
 * Create a new conversation for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createConversation = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from auth middleware
    const { conversation_name, icon, description } = req.body;

    // Generate a random icon if not provided
    const defaultIcons = [
      "🌱",
      "🌾",
      "🍅",
      "🥕",
      "🌽",
      "🥬",
      "🍎",
      "🚜",
      "💧",
      "☀️",
      "🌿",
      "🐄",
      "🐑",
      "🐓",
    ];
    const randomIcon =
      defaultIcons[Math.floor(Math.random() * defaultIcons.length)];

    // Create new conversation
    const newConversation = await Conversations.create({
      userId,
      conversation_name: conversation_name || "New Conversation",
      icon: icon || randomIcon,
      description:
        description || "How can I help with your farming needs today?",
    });

    // Create initial message from assistant
    await Messages.create({
      conversationId: newConversation.id,
      content: "How can I help with your farming needs today?",
      sender: "assistant",
      type: "text",
    });

    res.status(201).json({
      success: true,
      data: newConversation,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
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
    const userId = req.user.id; // Get user ID from auth middleware

    // Find all conversations for the user
    const conversations = await Conversations.findAll({
      where: { userId },
      include: [
        {
          model: Messages,
          as: "messages",
          limit: 1,
          order: [["createdAt", "DESC"]], // Get the most recent message
        },
      ],
      order: [["updatedAt", "DESC"]], // Sort by most recently updated
    });

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};

module.exports = {
  createConversation,
  getUserConversations,
};
