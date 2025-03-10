const { StockHarvest, StockHistory } = require('../database/models');

const stockHarvestController = {
  // Get all harvests for a user
  getAllHarvests: async (req, res) => {
    try {
      const harvests = await StockHarvest.findAll({
        where: { userId: req.user.id },
        include: [{ model: StockHistory, as: 'history' }]
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
        },
        include: [{ model: StockHistory, as: 'history' }]
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

      // Create initial stock history entry
      await StockHistory.create({
        stockHarvestId: harvest.id,
        type: 'initial',
        quantity: req.body.quantity,
        previousQuantity: 0,
        newQuantity: req.body.quantity,
        notes: 'Initial harvest entry'
      });

      const createdHarvest = await StockHarvest.findOne({
        where: { id: harvest.id },
        include: [{ model: StockHistory, as: 'history' }]
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

      const previousQuantity = harvest.quantity;
      const previousStatus = harvest.status;
      await harvest.update(req.body);

      // Create history entry for quantity changes
      if (previousQuantity !== req.body.quantity) {
        await StockHistory.create({
          stockHarvestId: harvest.id,
          type: 'update',
          quantity: req.body.quantity - previousQuantity,
          previousQuantity,
          newQuantity: req.body.quantity,
          notes: req.body.notes || 'Stock update'
        });
      }

      // Create history entry for status changes
      if (previousStatus !== req.body.status) {
        await StockHistory.create({
          stockHarvestId: harvest.id,
          type: 'status_change',
          notes: `Status changed from ${previousStatus} to ${req.body.status}`
        });
      }

      const updatedHarvest = await StockHarvest.findOne({
        where: { id: req.params.id },
        include: [{ model: StockHistory, as: 'history' }]
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

      // Create history entry
      await StockHistory.create({
        stockHarvestId: harvest.id,
        type: type === 'add' ? 'addition' : 'reduction',
        quantity: type === 'add' ? quantity : -quantity,
        previousQuantity,
        newQuantity,
        notes: notes || `Stock ${type === 'add' ? 'addition' : 'reduction'}`
      });

      const updatedHarvest = await StockHarvest.findOne({
        where: { id },
        include: [{ model: StockHistory, as: 'history' }]
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

      const previousQualityGrade = harvest.qualityGrade;
      await harvest.update({
        qualityGrade,
        qualityNotes,
        qualityAssessmentDate: new Date()
      });

      // Create history entry for quality assessment
      await StockHistory.create({
        stockHarvestId: harvest.id,
        type: 'quality_assessment',
        notes: `Quality grade changed from ${previousQualityGrade || 'ungraded'} to ${qualityGrade}. ${qualityNotes || ''}`
      });

      const updatedHarvest = await StockHarvest.findOne({
        where: { id },
        include: [{ model: StockHistory, as: 'history' }]
      });

      res.json(updatedHarvest);
    } catch (error) {
      console.error('Error updating harvest quality:', error);
      res.status(500).json({ error: 'Failed to update harvest quality' });
    }
  }
};

module.exports = stockHarvestController; 