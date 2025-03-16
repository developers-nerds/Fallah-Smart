const express = require('express');
const router = express.Router();
const stockToolsController = require('../controllers/stockToolsController');
const auth = require('../middleware/auth');
const { StockTools } = require('../database/models');

// Middleware to check if tool exists and belongs to user
const checkToolOwnership = async (req, res, next) => {
  try {
    const tool = await StockTools.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    req.tool = tool;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking tool ownership' });
  }
};

// All routes require authentication
router.use(auth);

// CRUD routes
router.post('/', stockToolsController.createTool);
router.get('/', stockToolsController.getAllTools);
router.get('/:id', checkToolOwnership, stockToolsController.getToolById);
router.put('/:id', checkToolOwnership, stockToolsController.updateTool);
router.delete('/:id', checkToolOwnership, stockToolsController.deleteTool);

// Quantity management
router.patch('/:id/quantity', checkToolOwnership, stockToolsController.updateQuantity);

module.exports = router; 