const express = require('express');
const router = express.Router();
const stockSeedsController = require('../controllers/stockSeedsController');
const auth = require('../middleware/auth');
const { StockSeeds } = require('../database/models');

// Middleware to check if seed exists and belongs to user
const checkSeedOwnership = async (req, res, next) => {
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

    req.seed = seed;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking seed ownership' });
  }
};

// All routes require authentication
router.use(auth);

// CRUD routes
router.post('/', stockSeedsController.createSeed);
router.get('/', stockSeedsController.getAllSeeds);
router.get('/:id', checkSeedOwnership, stockSeedsController.getSeedById);
router.put('/:id', checkSeedOwnership, stockSeedsController.updateSeed);
router.delete('/:id', checkSeedOwnership, stockSeedsController.deleteSeed);

// Quantity management
router.patch('/:id/quantity', checkSeedOwnership, stockSeedsController.updateSeedQuantity);

module.exports = router; 