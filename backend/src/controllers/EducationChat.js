const { Education_Chat } = require('../database/assossiation');

// Get all chat messages
exports.getAllChatMessages = async (req, res) => {
  try {
    const messages = await Education_Chat.findAll({
      order: [['timestamp', 'ASC']]
    });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get chat messages by user ID
exports.getChatMessagesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Education_Chat.findAll({ 
      where: { userId },
      order: [['timestamp', 'ASC']]
    });   
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  

// Create a new chat message
exports.createChatMessage = async (req, res) => {
  try {
    const { text, isBot, userId } = req.body;
    
    if (!text || isBot === undefined || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newMessage = await Education_Chat.create({
      text,
      isBot,
      userId,
      timestamp: new Date()
    });
    
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a chat message
exports.deleteChatMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;
    
    const message = await Education_Chat.findByPk(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Check if the user is the owner of the message
    if (message.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }
    
    await message.destroy();
    
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get latest chat conversation (last 20 messages)
exports.getLatestConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const messages = await Education_Chat.findAll({
      where: { userId },
      order: [['timestamp', 'DESC']],
      limit: 20
    });
    
    // Return in chronological order (oldest first)
    res.status(200).json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clear chat history for a user
exports.clearChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await Education_Chat.destroy({
      where: { userId }
    });
    
    res.status(200).json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get chat messages by user ID and chat ID
exports.getChatMessagesByUserIdAndChatId = async (req, res) => {
  try {
    const { userId, chatId } = req.params;
    const messages = await Education_Chat.findAll({ where: { userId, chatId } });      
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  

// Get chat messages by user ID and chat ID
exports.getChatMessagesByUserIdAndChatId = async (req, res) => {
  try {
    const { userId, chatId } = req.params;
    const messages = await Education_Chat.findAll({ where: { userId, chatId } });      
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  

// Get chat messages by user ID and chat ID
exports.getChatMessagesByUserIdAndChatId = async (req, res) => {
  try {
    const { userId, chatId } = req.params;
    const messages = await Education_Chat.findAll({ where: { userId, chatId } });      
    res.status(200).json(messages);
  } catch (error) { 
    res.status(500).json({ error: error.message });
  }
};
    
    





