const { Stock, StockHistory } = require('../database/assossiation');
const { Op } = require('sequelize');
const { Users } = require('../database/assossiation');

const stockController = {
  // Get all stocks for a user
  getAllStocks: async (req, res) => {
    try {
      const stocks = await Stock.findAll({
        where: { userId: req.user.id },
        order: [['updatedAt', 'DESC']]
      });
      
      res.json(stocks);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      res.status(500).json({ 
        message: 'Error fetching stocks',
        error: error.message 
      });
    }
  },

  // Get a single stock by ID
  getStockById: async (req, res) => {
    try {
      const stock = await Stock.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!stock) {
        return res.status(404).json({ message: 'Stock not found' });
      }

      res.json(stock);
    } catch (error) {
      console.error('Error fetching stock:', error);
      res.status(500).json({ 
        message: 'Error fetching stock',
        error: error.message 
      });
    }
  },

  // Create new stock
  createStock: async (req, res) => {
    try {
      // Validate required fields
      const requiredFields = ['name', 'quantity', 'unit', 'category'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          fields: missingFields 
        });
      }

      // Check if user exists
      const user = await Users.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const stockData = {
        ...req.body,
        userId: req.user.id,
      };

      const stock = await Stock.create(stockData);

      res.status(201).json(stock);
    } catch (error) {
      console.error('Error creating stock:', error);
      res.status(500).json({ 
        message: 'Error creating stock',
        error: error.message 
      });
    }
  },

  // Update stock quantity
  updateStockQuantity: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, type, notes } = req.body;

      if (!quantity || !type) {
        return res.status(400).json({ 
          message: 'Quantity and type are required' 
        });
      }

      if (!['add', 'remove', 'expired', 'damaged'].includes(type)) {
        return res.status(400).json({ 
          message: 'Invalid type. Must be one of: add, remove, expired, damaged' 
        });
      }

      const stock = await Stock.findOne({
        where: { 
          id,
          userId: req.user.id 
        }
      });

      if (!stock) {
        return res.status(404).json({ message: 'Stock not found' });
      }

      // Calculate new quantity
      let newQuantity;
      switch (type) {
        case 'add':
          newQuantity = stock.quantity + quantity;
          break;
        case 'remove':
        case 'expired':
        case 'damaged':
          newQuantity = Math.max(0, stock.quantity - quantity);
          break;
        default:
          newQuantity = stock.quantity;
      }

      // Update stock quantity
      await stock.update({ quantity: newQuantity });

      // Create history entry
      await StockHistory.create({
        stockId: stock.id,
        quantity,
        type,
        notes
      });

      // Fetch updated stock with history
      const updatedStock = await Stock.findByPk(stock.id, {
        include: [{
          model: StockHistory,
          as: 'stockHistory',
          order: [['date', 'DESC']]
        }]
      });

      res.json(updatedStock);
    } catch (error) {
      console.error('Error updating stock quantity:', error);
      res.status(500).json({ 
        message: 'Error updating stock quantity',
        error: error.message 
      });
    }
  },

  // Update stock details
  updateStock: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Prevent updating certain fields
      delete updates.id;
      delete updates.userId;

      const stock = await Stock.findOne({
        where: { 
          id,
          userId: req.user.id 
        }
      });

      if (!stock) {
        return res.status(404).json({ message: 'Stock not found' });
      }

      await stock.update(updates);
      const updatedStock = await Stock.findByPk(stock.id);

      res.json(updatedStock);
    } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({ 
        message: 'Error updating stock',
        error: error.message 
      });
    }
  },

  // Delete stock
  deleteStock: async (req, res) => {
    try {
      const { id } = req.params;

      const stock = await Stock.findOne({
        where: { 
          id,
          userId: req.user.id 
        }
      });

      if (!stock) {
        return res.status(404).json({ message: 'Stock not found' });
      }

      // Delete the stock
      await stock.destroy();
      
      res.json({ message: 'Stock deleted successfully' });
    } catch (error) {
      console.error('Error deleting stock:', error);
      res.status(500).json({ 
        message: 'Error deleting stock',
        error: error.message 
      });
    }
  },

  // Get stock history
  getStockHistory: async (req, res) => {
    try {
      const { stockId } = req.params;
      
      const history = await StockHistory.findAll({
        where: { stockId },
        order: [['date', 'DESC']]
      });

      res.json(history);
    } catch (error) {
      console.error('Error fetching stock history:', error);
      res.status(500).json({ error: 'Failed to fetch stock history' });
    }
  }
};

module.exports = stockController; 