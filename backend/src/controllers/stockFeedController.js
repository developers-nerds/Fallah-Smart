const { StockFeed, StockHistory } = require('../database/models');

const stockFeedController = {
  // Get all feed items for a user
  getAllFeeds: async (req, res) => {
    try {
      const feeds = await StockFeed.findAll({
        where: { userId: req.user.id },
        include: [{ model: StockHistory, as: 'history' }]
      });
      res.json(feeds);
    } catch (error) {
      console.error('Error fetching feeds:', error);
      res.status(500).json({ error: 'Failed to fetch feeds' });
    }
  },

  // Get a single feed item by ID
  getFeedById: async (req, res) => {
    try {
      const feed = await StockFeed.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        },
        include: [{ model: StockHistory, as: 'history' }]
      });

      if (!feed) {
        return res.status(404).json({ error: 'Feed not found' });
      }

      res.json(feed);
    } catch (error) {
      console.error('Error fetching feed:', error);
      res.status(500).json({ error: 'Failed to fetch feed' });
    }
  },

  // Create a new feed item
  createFeed: async (req, res) => {
    try {
      const {
        name,
        quantity,
        unit,
        minQuantityAlert,
        price,
        animalType,
        dailyConsumptionRate,
        expiryDate,
        supplier
      } = req.body;

      const feed = await StockFeed.create({
        userId: req.user.id,
        name,
        quantity,
        unit,
        minQuantityAlert,
        price,
        animalType,
        dailyConsumptionRate,
        expiryDate,
        supplier
      });

      // Create initial stock history entry
      await StockHistory.create({
        stockFeedId: feed.id,
        type: 'initial',
        quantity: quantity,
        previousQuantity: 0,
        newQuantity: quantity,
        notes: 'Initial stock entry'
      });

      const createdFeed = await StockFeed.findOne({
        where: { id: feed.id },
        include: [{ model: StockHistory, as: 'history' }]
      });

      res.status(201).json(createdFeed);
    } catch (error) {
      console.error('Error creating feed:', error);
      res.status(500).json({ error: 'Failed to create feed' });
    }
  },

  // Update a feed item
  updateFeed: async (req, res) => {
    try {
      const feed = await StockFeed.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!feed) {
        return res.status(404).json({ error: 'Feed not found' });
      }

      const previousQuantity = feed.quantity;
      await feed.update(req.body);

      // If quantity changed, create history entry
      if (previousQuantity !== req.body.quantity) {
        await StockHistory.create({
          stockFeedId: feed.id,
          type: 'update',
          quantity: req.body.quantity - previousQuantity,
          previousQuantity,
          newQuantity: req.body.quantity,
          notes: req.body.notes || 'Stock update'
        });
      }

      const updatedFeed = await StockFeed.findOne({
        where: { id: req.params.id },
        include: [{ model: StockHistory, as: 'history' }]
      });

      res.json(updatedFeed);
    } catch (error) {
      console.error('Error updating feed:', error);
      res.status(500).json({ error: 'Failed to update feed' });
    }
  },

  // Delete a feed item
  deleteFeed: async (req, res) => {
    try {
      const feed = await StockFeed.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!feed) {
        return res.status(404).json({ error: 'Feed not found' });
      }

      await feed.destroy();
      res.json({ message: 'Feed deleted successfully' });
    } catch (error) {
      console.error('Error deleting feed:', error);
      res.status(500).json({ error: 'Failed to delete feed' });
    }
  },

  // Update feed quantity
  updateFeedQuantity: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, type, notes } = req.body;

      const feed = await StockFeed.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!feed) {
        return res.status(404).json({ error: 'Feed not found' });
      }

      const previousQuantity = feed.quantity;
      let newQuantity = previousQuantity;

      if (type === 'add') {
        newQuantity = previousQuantity + quantity;
      } else if (type === 'remove') {
        if (previousQuantity < quantity) {
          return res.status(400).json({ error: 'Insufficient quantity' });
        }
        newQuantity = previousQuantity - quantity;
      }

      await feed.update({ quantity: newQuantity });

      // Create history entry
      await StockHistory.create({
        stockFeedId: feed.id,
        type: type === 'add' ? 'addition' : 'reduction',
        quantity: type === 'add' ? quantity : -quantity,
        previousQuantity,
        newQuantity,
        notes: notes || `Stock ${type === 'add' ? 'addition' : 'reduction'}`
      });

      const updatedFeed = await StockFeed.findOne({
        where: { id },
        include: [{ model: StockHistory, as: 'history' }]
      });

      res.json(updatedFeed);
    } catch (error) {
      console.error('Error updating feed quantity:', error);
      res.status(500).json({ error: 'Failed to update feed quantity' });
    }
  }
};

module.exports = stockFeedController; 