const { StockEquipment } = require('../database/models');

const stockEquipmentController = {
  // Get all equipment for a user
  getAllEquipment: async (req, res) => {
    try {
      const equipment = await StockEquipment.findAll({
        where: { userId: req.user.id }
      });
      res.json(equipment);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      res.status(500).json({ error: 'Failed to fetch equipment' });
    }
  },

  // Get a single equipment by ID
  getEquipmentById: async (req, res) => {
    try {
      const equipment = await StockEquipment.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      res.json(equipment);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      res.status(500).json({ error: 'Failed to fetch equipment' });
    }
  },

  // Create new equipment
  createEquipment: async (req, res) => {
    try {
      const equipment = await StockEquipment.create({
        ...req.body,
        userId: req.user.id
      });

      res.status(201).json(equipment);
    } catch (error) {
      console.error('Error creating equipment:', error);
      res.status(500).json({ error: 'Failed to create equipment' });
    }
  },

  // Update equipment
  updateEquipment: async (req, res) => {
    try {
      const equipment = await StockEquipment.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      await equipment.update(req.body);
      const updatedEquipment = await StockEquipment.findOne({
        where: { id: req.params.id }
      });

      res.json(updatedEquipment);
    } catch (error) {
      console.error('Error updating equipment:', error);
      res.status(500).json({ error: 'Failed to update equipment' });
    }
  },

  // Delete equipment
  deleteEquipment: async (req, res) => {
    try {
      const equipment = await StockEquipment.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      await equipment.destroy();
      res.json({ message: 'Equipment deleted successfully' });
    } catch (error) {
      console.error('Error deleting equipment:', error);
      res.status(500).json({ error: 'Failed to delete equipment' });
    }
  },

  // Record maintenance
  recordMaintenance: async (req, res) => {
    try {
      const { id } = req.params;
      const { maintenanceNotes, cost, nextMaintenanceDate } = req.body;

      const equipment = await StockEquipment.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      // Update maintenance history
      const maintenanceHistory = equipment.maintenanceHistory || [];
      maintenanceHistory.push({
        date: new Date(),
        notes: maintenanceNotes,
        cost: cost || 0
      });

      // Update equipment
      await equipment.update({
        lastMaintenanceDate: new Date(),
        nextMaintenanceDate: nextMaintenanceDate || null,
        maintenanceHistory,
        maintenanceCosts: (equipment.maintenanceCosts || 0) + (cost || 0)
      });

      const updatedEquipment = await StockEquipment.findOne({
        where: { id }
      });

      res.json(updatedEquipment);
    } catch (error) {
      console.error('Error recording maintenance:', error);
      res.status(500).json({ error: 'Failed to record maintenance' });
    }
  },

  // Update equipment status
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const equipment = await StockEquipment.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      await equipment.update({ status });
      const updatedEquipment = await StockEquipment.findOne({
        where: { id }
      });

      res.json(updatedEquipment);
    } catch (error) {
      console.error('Error updating equipment status:', error);
      res.status(500).json({ error: 'Failed to update equipment status' });
    }
  }
};

module.exports = stockEquipmentController; 