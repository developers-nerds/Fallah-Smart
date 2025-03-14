const { StockSeeds } = require('../database/models');

const stockSeedsController = {
  // Get all seeds for a user
  getAllSeeds: async (req, res) => {
    try {
      const seeds = await StockSeeds.findAll({
        where: { userId: req.user.id }
      });
      res.json(seeds);
    } catch (error) {
      console.error('Error fetching seeds:', error);
      res.status(500).json({ error: 'Failed to fetch seeds' });
    }
  },

  // Get a single seed item by ID
  getSeedById: async (req, res) => {
    try {
      const seed = await StockSeeds.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!seed) {
        return res.status(404).json({ error: 'Seed not found' });
      }

      res.json(seed);
    } catch (error) {
      console.error('Error fetching seed:', error);
      res.status(500).json({ error: 'Failed to fetch seed' });
    }
  },

  // Create a new seed item
  createSeed: async (req, res) => {
    try {
      const {
        name,
        quantity,
        unit,
        minQuantityAlert,
        price,
        cropType,
        variety,
        plantingSeasonStart,
        plantingSeasonEnd,
        expiryDate,
        germination,
        supplier,
        certificationInfo
      } = req.body;

      const seed = await StockSeeds.create({
        userId: req.user.id,
        name,
        quantity,
        unit,
        minQuantityAlert,
        price,
        cropType,
        variety,
        plantingSeasonStart,
        plantingSeasonEnd,
        expiryDate,
        germination,
        supplier,
        certificationInfo
      });

      res.status(201).json(seed);
    } catch (error) {
      console.error('Error creating seed:', error);
      res.status(500).json({ error: 'Failed to create seed' });
    }
  },

  // Update a seed item
  updateSeed: async (req, res) => {
    try {
      const seed = await StockSeeds.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!seed) {
        return res.status(404).json({ error: 'Seed not found' });
      }

      await seed.update(req.body);
      res.json(seed);
    } catch (error) {
      console.error('Error updating seed:', error);
      res.status(500).json({ error: 'Failed to update seed' });
    }
  },

  // Delete a seed item
  deleteSeed: async (req, res) => {
    try {
      const seed = await StockSeeds.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!seed) {
        return res.status(404).json({ error: 'Seed not found' });
      }

      await seed.destroy();
      res.json({ message: 'Seed deleted successfully' });
    } catch (error) {
      console.error('Error deleting seed:', error);
      res.status(500).json({ error: 'Failed to delete seed' });
    }
  },

  // Update seed quantity
  updateSeedQuantity: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, type } = req.body;

      const seed = await StockSeeds.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!seed) {
        return res.status(404).json({ error: 'Seed not found' });
      }

      const previousQuantity = seed.quantity;
      let newQuantity = previousQuantity;

      if (type === 'add') {
        newQuantity = previousQuantity + quantity;
      } else if (type === 'remove') {
        if (previousQuantity < quantity) {
          return res.status(400).json({ error: 'Insufficient quantity' });
        }
        newQuantity = previousQuantity - quantity;
      }

      await seed.update({ quantity: newQuantity });
      res.json(seed);
    } catch (error) {
      console.error('Error updating seed quantity:', error);
      res.status(500).json({ error: 'Failed to update seed quantity' });
    }
  }
};

module.exports = stockSeedsController; 