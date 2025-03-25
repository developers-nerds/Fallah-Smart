const { StockHarvest } = require('../database/models');

const stockHarvestController = {
  // Get all harvests for a user
  getAllHarvests: async (req, res) => {
    try {
      const harvests = await StockHarvest.findAll({
        where: { userId: req.user.id }
      });
      res.json(harvests);
    } catch (error) {
      console.error('Error fetching harvests:', error);
      res.status(500).json({ error: 'Failed to fetch harvests' });
    }
  },

  // Get a single harvest by ID
  getHarvestById: async (req, res) => {
    try {
      const harvest = await StockHarvest.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!harvest) {
        return res.status(404).json({ error: 'Harvest not found' });
      }

      res.json(harvest);
    } catch (error) {
      console.error('Error fetching harvest:', error);
      res.status(500).json({ error: 'Failed to fetch harvest' });
    }
  },

  // Create new harvest
  createHarvest: async (req, res) => {
    try {
      const harvest = await StockHarvest.create({
        ...req.body,
        userId: req.user.id,
        status: 'stored'
      });

      const createdHarvest = await StockHarvest.findOne({
        where: { id: harvest.id }
      });

      res.status(201).json(createdHarvest);
    } catch (error) {
      console.error('Error creating harvest:', error);
      res.status(500).json({ error: 'Failed to create harvest' });
    }
  },

  // Update harvest
  updateHarvest: async (req, res) => {
    try {
      const harvest = await StockHarvest.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!harvest) {
        return res.status(404).json({ error: 'Harvest not found' });
      }

      await harvest.update(req.body);
      
      const updatedHarvest = await StockHarvest.findOne({
        where: { id: req.params.id }
      });

      res.json(updatedHarvest);
    } catch (error) {
      console.error('Error updating harvest:', error);
      res.status(500).json({ error: 'Failed to update harvest' });
    }
  },

  // Delete harvest
  deleteHarvest: async (req, res) => {
    try {
      const harvest = await StockHarvest.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!harvest) {
        return res.status(404).json({ error: 'Harvest not found' });
      }

      await harvest.destroy();
      res.json({ message: 'Harvest deleted successfully' });
    } catch (error) {
      console.error('Error deleting harvest:', error);
      res.status(500).json({ error: 'Failed to delete harvest' });
    }
  },

  // Update harvest quantity
  updateQuantity: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, type, notes } = req.body;

      const harvest = await StockHarvest.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!harvest) {
        return res.status(404).json({ error: 'Harvest not found' });
      }

      const previousQuantity = harvest.quantity;
      let newQuantity = previousQuantity;

      if (type === 'add') {
        newQuantity = previousQuantity + quantity;
      } else if (type === 'remove') {
        if (previousQuantity < quantity) {
          return res.status(400).json({ error: 'Insufficient quantity' });
        }
        newQuantity = previousQuantity - quantity;
      }

      await harvest.update({ quantity: newQuantity });

      const updatedHarvest = await StockHarvest.findOne({
        where: { id }
      });

      res.json(updatedHarvest);
    } catch (error) {
      console.error('Error updating harvest quantity:', error);
      res.status(500).json({ error: 'Failed to update harvest quantity' });
    }
  },

  // Update harvest quality assessment
  updateQuality: async (req, res) => {
    try {
      const { id } = req.params;
      const { qualityGrade, qualityNotes } = req.body;

      const harvest = await StockHarvest.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!harvest) {
        return res.status(404).json({ error: 'Harvest not found' });
      }

      await harvest.update({
        qualityGrade,
        qualityNotes,
        qualityAssessmentDate: new Date()
      });

      const updatedHarvest = await StockHarvest.findOne({
        where: { id }
      });

      res.json(updatedHarvest);
    } catch (error) {
      console.error('Error updating harvest quality:', error);
      res.status(500).json({ error: 'Failed to update harvest quality' });
    }
  }
};

module.exports = stockHarvestController; 