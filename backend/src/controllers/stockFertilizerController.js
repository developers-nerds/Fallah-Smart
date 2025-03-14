const { StockFertilizer } = require('../database/models');

const stockFertilizerController = {
  // Get all fertilizers for a user
  getAllFertilizers: async (req, res) => {
    try {
      const fertilizers = await StockFertilizer.findAll({
        where: { userId: req.user.id }
      });
      res.json(fertilizers);
    } catch (error) {
      console.error('Error fetching fertilizers:', error);
      res.status(500).json({ error: 'Failed to fetch fertilizers' });
    }
  },

  // Get a single fertilizer by ID
  getFertilizerById: async (req, res) => {
    try {
      const fertilizer = await StockFertilizer.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!fertilizer) {
        return res.status(404).json({ error: 'Fertilizer not found' });
      }

      res.json(fertilizer);
    } catch (error) {
      console.error('Error fetching fertilizer:', error);
      res.status(500).json({ error: 'Failed to fetch fertilizer' });
    }
  },

  // Create a new fertilizer
  createFertilizer: async (req, res) => {
    try {
      const {
        name,
        quantity,
        unit,
        minQuantityAlert,
        price,
        type,
        npkRatio,
        applicationRate,
        expiryDate,
        supplier,
        safetyGuidelines
      } = req.body;

      const fertilizer = await StockFertilizer.create({
        userId: req.user.id,
        name,
        quantity,
        unit,
        minQuantityAlert,
        price,
        type,
        npkRatio,
        applicationRate,
        expiryDate,
        supplier,
        safetyGuidelines
      });

      res.status(201).json(fertilizer);
    } catch (error) {
      console.error('Error creating fertilizer:', error);
      res.status(500).json({ error: 'Failed to create fertilizer' });
    }
  },

  // Update a fertilizer
  updateFertilizer: async (req, res) => {
    try {
      const fertilizer = await StockFertilizer.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!fertilizer) {
        return res.status(404).json({ error: 'Fertilizer not found' });
      }

      await fertilizer.update(req.body);
      const updatedFertilizer = await StockFertilizer.findOne({
        where: { id: req.params.id }
      });

      res.json(updatedFertilizer);
    } catch (error) {
      console.error('Error updating fertilizer:', error);
      res.status(500).json({ error: 'Failed to update fertilizer' });
    }
  },

  // Delete a fertilizer
  deleteFertilizer: async (req, res) => {
    try {
      const fertilizer = await StockFertilizer.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!fertilizer) {
        return res.status(404).json({ error: 'Fertilizer not found' });
      }

      await fertilizer.destroy();
      res.json({ message: 'Fertilizer deleted successfully' });
    } catch (error) {
      console.error('Error deleting fertilizer:', error);
      res.status(500).json({ error: 'Failed to delete fertilizer' });
    }
  },

  // Update fertilizer quantity
  updateFertilizerQuantity: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, type } = req.body;

      const fertilizer = await StockFertilizer.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!fertilizer) {
        return res.status(404).json({ error: 'Fertilizer not found' });
      }

      const previousQuantity = fertilizer.quantity;
      let newQuantity = previousQuantity;

      if (type === 'add') {
        newQuantity = previousQuantity + quantity;
      } else if (type === 'remove') {
        if (previousQuantity < quantity) {
          return res.status(400).json({ error: 'Insufficient quantity' });
        }
        newQuantity = previousQuantity - quantity;
      }

      await fertilizer.update({ quantity: newQuantity });
      const updatedFertilizer = await StockFertilizer.findOne({
        where: { id }
      });

      res.json(updatedFertilizer);
    } catch (error) {
      console.error('Error updating fertilizer quantity:', error);
      res.status(500).json({ error: 'Failed to update fertilizer quantity' });
    }
  }
};

module.exports = stockFertilizerController; 