const { StockEquipment, StockHistory, StockNotification } = require('../database/models');

const stockEquipmentController = {
  // Get all equipment for a user
  getAllEquipment: async (req, res) => {
    try {
      const equipment = await StockEquipment.findAll({
        where: { userId: req.user.id },
        include: [
          { model: StockHistory, as: 'history' },
          { model: StockNotification, as: 'notifications' }
        ]
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
        },
        include: [
          { model: StockHistory, as: 'history' },
          { model: StockNotification, as: 'notifications' }
        ]
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

      // Create initial stock history entry
      await StockHistory.create({
        stockEquipmentId: equipment.id,
        type: 'initial',
        quantity: 1,
        previousQuantity: 0,
        newQuantity: 1,
        notes: 'Initial equipment entry'
      });

      // Create maintenance notification if maintenance interval is set
      if (equipment.maintenanceInterval) {
        const nextMaintenanceDate = new Date();
        nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + equipment.maintenanceInterval);
        
        await StockNotification.create({
          type: 'maintenance',
          title: `Maintenance Due - ${equipment.name}`,
          message: `Scheduled maintenance is due for ${equipment.name}`,
          scheduledFor: nextMaintenanceDate,
          priority: 'medium',
          relatedModelType: 'StockEquipment',
          relatedModelId: equipment.id,
          userId: req.user.id
        });

        await equipment.update({ nextMaintenanceDate });
      }

      const createdEquipment = await StockEquipment.findOne({
        where: { id: equipment.id },
        include: [
          { model: StockHistory, as: 'history' },
          { model: StockNotification, as: 'notifications' }
        ]
      });

      res.status(201).json(createdEquipment);
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

      const previousStatus = equipment.status;
      await equipment.update(req.body);

      // Create history entry for status changes
      if (previousStatus !== req.body.status) {
        await StockHistory.create({
          stockEquipmentId: equipment.id,
          type: 'status_change',
          notes: `Status changed from ${previousStatus} to ${req.body.status}`
        });
      }

      // Update maintenance notification if maintenance interval changed
      if (req.body.maintenanceInterval && req.body.maintenanceInterval !== equipment.maintenanceInterval) {
        const nextMaintenanceDate = new Date();
        nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + req.body.maintenanceInterval);

        await StockNotification.create({
          type: 'maintenance',
          title: `Updated Maintenance Schedule - ${equipment.name}`,
          message: `Maintenance schedule updated for ${equipment.name}`,
          scheduledFor: nextMaintenanceDate,
          priority: 'medium',
          relatedModelType: 'StockEquipment',
          relatedModelId: equipment.id,
          userId: req.user.id
        });

        await equipment.update({ nextMaintenanceDate });
      }

      const updatedEquipment = await StockEquipment.findOne({
        where: { id: req.params.id },
        include: [
          { model: StockHistory, as: 'history' },
          { model: StockNotification, as: 'notifications' }
        ]
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

      // Create history entry
      await StockHistory.create({
        stockEquipmentId: equipment.id,
        type: 'maintenance',
        notes: maintenanceNotes || 'Maintenance performed'
      });

      // Create next maintenance notification if date is provided
      if (nextMaintenanceDate) {
        await StockNotification.create({
          type: 'maintenance',
          title: `Next Maintenance - ${equipment.name}`,
          message: `Next maintenance scheduled for ${equipment.name}`,
          scheduledFor: nextMaintenanceDate,
          priority: 'medium',
          relatedModelType: 'StockEquipment',
          relatedModelId: equipment.id,
          userId: req.user.id
        });
      }

      const updatedEquipment = await StockEquipment.findOne({
        where: { id },
        include: [
          { model: StockHistory, as: 'history' },
          { model: StockNotification, as: 'notifications' }
        ]
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
      const { status, notes } = req.body;

      const equipment = await StockEquipment.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      const previousStatus = equipment.status;
      await equipment.update({ status });

      // Create history entry
      await StockHistory.create({
        stockEquipmentId: equipment.id,
        type: 'status_change',
        notes: notes || `Status changed from ${previousStatus} to ${status}`
      });

      const updatedEquipment = await StockEquipment.findOne({
        where: { id },
        include: [
          { model: StockHistory, as: 'history' },
          { model: StockNotification, as: 'notifications' }
        ]
      });

      res.json(updatedEquipment);
    } catch (error) {
      console.error('Error updating equipment status:', error);
      res.status(500).json({ error: 'Failed to update equipment status' });
    }
  }
};

module.exports = stockEquipmentController; 