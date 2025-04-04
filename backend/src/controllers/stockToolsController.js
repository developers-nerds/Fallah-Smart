const { StockTools, StockNotification } = require('../database/models');

const stockToolsController = {
  // Get all tools for a user
  getAllTools: async (req, res) => {
    try {
      const tools = await StockTools.findAll({
        where: { userId: req.user.id }
      });
      res.json(tools);
    } catch (error) {
      console.error('Error fetching tools:', error);
      res.status(500).json({ error: 'Failed to fetch tools' });
    }
  },

  // Get a single tool by ID
  getToolById: async (req, res) => {
    try {
      const tool = await StockTools.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!tool) {
        return res.status(404).json({ error: 'Tool not found' });
      }

      res.json(tool);
    } catch (error) {
      console.error('Error fetching tool:', error);
      res.status(500).json({ error: 'Failed to fetch tool' });
    }
  },

  // Create new tool
  createTool: async (req, res) => {
    try {
      const tool = await StockTools.create({
        ...req.body,
        userId: req.user.id
      });

      // Create low stock notification if quantity is below minQuantityAlert
      if (tool.quantity <= tool.minQuantityAlert) {
        await StockNotification.create({
          type: 'low_stock',
          title: `Low Stock Alert - ${tool.name}`,
          message: `Tool ${tool.name} is running low on stock (${tool.quantity} remaining)`,
          priority: 'high',
          relatedModelType: 'StockTools',
          relatedModelId: tool.id,
          userId: req.user.id
        });
      }

      const createdTool = await StockTools.findOne({
        where: { id: tool.id }
      });

      res.status(201).json(createdTool);
    } catch (error) {
      console.error('Error creating tool:', error);
      res.status(500).json({ error: 'Failed to create tool' });
    }
  },

  // Update tool
  updateTool: async (req, res) => {
    try {
      const tool = await StockTools.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!tool) {
        return res.status(404).json({ error: 'Tool not found' });
      }

      const previousQuantity = tool.quantity;
      await tool.update(req.body);

      // Check for low stock after update
      if (req.body.quantity <= tool.minQuantityAlert) {
        await StockNotification.create({
          type: 'low_stock',
          title: `Low Stock Alert - ${tool.name}`,
          message: `Tool ${tool.name} is running low on stock (${req.body.quantity} remaining)`,
          priority: 'high',
          relatedModelType: 'StockTools',
          relatedModelId: tool.id,
          userId: req.user.id
        });
      }

      const updatedTool = await StockTools.findOne({
        where: { id: req.params.id }
      });

      res.json(updatedTool);
    } catch (error) {
      console.error('Error updating tool:', error);
      res.status(500).json({ error: 'Failed to update tool' });
    }
  },

  // Delete tool
  deleteTool: async (req, res) => {
    try {
      const tool = await StockTools.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!tool) {
        return res.status(404).json({ error: 'Tool not found' });
      }

      await tool.destroy();
      res.json({ message: 'Tool deleted successfully' });
    } catch (error) {
      console.error('Error deleting tool:', error);
      res.status(500).json({ error: 'Failed to delete tool' });
    }
  },

  // Update tool quantity
  updateQuantity: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, type, notes } = req.body;

      const tool = await StockTools.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!tool) {
        return res.status(404).json({ error: 'Tool not found' });
      }

      const previousQuantity = tool.quantity;
      let newQuantity = previousQuantity;

      if (type === 'add') {
        newQuantity = previousQuantity + quantity;
      } else if (type === 'remove') {
        if (previousQuantity < quantity) {
          return res.status(400).json({ error: 'Insufficient quantity' });
        }
        newQuantity = previousQuantity - quantity;
      }

      await tool.update({ quantity: newQuantity });

      // Check for low stock
      if (newQuantity <= tool.minQuantityAlert) {
        await StockNotification.create({
          type: 'low_stock',
          title: `Low Stock Alert - ${tool.name}`,
          message: `Tool ${tool.name} is running low on stock (${newQuantity} remaining)`,
          priority: 'high',
          relatedModelType: 'StockTools',
          relatedModelId: tool.id,
          userId: req.user.id
        });
      }

      const updatedTool = await StockTools.findOne({
        where: { id }
      });

      res.json(updatedTool);
    } catch (error) {
      console.error('Error updating tool quantity:', error);
      res.status(500).json({ error: 'Failed to update tool quantity' });
    }
  }
};

module.exports = stockToolsController; 