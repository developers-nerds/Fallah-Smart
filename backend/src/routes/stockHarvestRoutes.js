const express = require('express');
const router = express.Router();
const stockHarvestController = require('../controllers/stockHarvestController');
const auth = require('../middleware/auth');
const { StockHarvest } = require('../database/models');

// Middleware to check if harvest exists and belongs to user
const checkHarvestOwnership = async (req, res, next) => {
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

    req.harvest = harvest;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking harvest ownership' });
  }
};

// All routes require authentication
router.use(auth);

// CRUD routes
router.post('/', stockHarvestController.createHarvest);
router.get('/', stockHarvestController.getAllHarvests);
router.get('/:id', checkHarvestOwnership, stockHarvestController.getHarvestById);
router.put('/:id', checkHarvestOwnership, stockHarvestController.updateHarvest);
router.delete('/:id', checkHarvestOwnership, stockHarvestController.deleteHarvest);

// Quantity and quality management
router.patch('/:id/quantity', checkHarvestOwnership, stockHarvestController.updateQuantity);
router.patch('/:id/quality', checkHarvestOwnership, stockHarvestController.updateQuality);

module.exports = router; 