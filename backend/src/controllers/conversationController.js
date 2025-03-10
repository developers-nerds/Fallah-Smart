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
      conversation_name: conversation_name ,
      icon: icon,
      description: description,
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
    const userId = req.user.id;
    console.log( "userId",userId);
    // Find all conversations for the user
    const conversations = await Conversations.findAll({
      where: { userId },
      order: [["updatedAt", "DESC"]], // Sort by most recently updated
    });
    console.log( "conversations",conversations);
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
