const express = require('express');
const router = express.Router();
const stockEquipmentController = require('../controllers/stockEquipmentController');
const auth = require('../middleware/auth');
const { StockEquipment } = require('../database/models');

// Middleware to check if equipment exists and belongs to user
const checkEquipmentOwnership = async (req, res, next) => {
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

    req.equipment = equipment;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking equipment ownership' });
  }
};

// All routes require authentication
router.use(auth);

// CRUD routes
router.post('/', stockEquipmentController.createEquipment);
router.get('/', stockEquipmentController.getAllEquipment);
router.get('/:id', checkEquipmentOwnership, stockEquipmentController.getEquipmentById);
router.put('/:id', checkEquipmentOwnership, stockEquipmentController.updateEquipment);
router.delete('/:id', checkEquipmentOwnership, stockEquipmentController.deleteEquipment);

// Maintenance and status management
router.post('/:id/maintenance', checkEquipmentOwnership, stockEquipmentController.recordMaintenance);
router.patch('/:id/status', checkEquipmentOwnership, stockEquipmentController.updateStatus);

module.exports = router; 