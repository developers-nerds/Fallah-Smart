const express = require('express');
const router = express.Router();
const stockFertilizerController = require('../controllers/stockFertilizerController');
const auth = require('../middleware/auth');
const { StockFertilizer } = require('../database/models');

// Middleware to check if fertilizer exists and belongs to user
const checkFertilizerOwnership = async (req, res, next) => {
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

    req.fertilizer = fertilizer;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking fertilizer ownership' });
  }
};

// All routes require authentication
router.use(auth);

// CRUD routes
router.post('/', stockFertilizerController.createFertilizer);
router.get('/', stockFertilizerController.getAllFertilizers);
router.get('/:id', checkFertilizerOwnership, stockFertilizerController.getFertilizerById);
router.put('/:id', checkFertilizerOwnership, stockFertilizerController.updateFertilizer);
router.delete('/:id', checkFertilizerOwnership, stockFertilizerController.deleteFertilizer);

// Quantity management
router.patch('/:id/quantity', checkFertilizerOwnership, stockFertilizerController.updateFertilizerQuantity);

module.exports = router; 