const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all stocks
router.get('/', stockController.getAllStocks);

// Get single stock
router.get('/:id', stockController.getStockById);

// Create new stock
router.post('/', stockController.createStock);

// Update stock quantity
router.post('/:id/quantity', stockController.updateStockQuantity);

// Update stock details
router.put('/:id', stockController.updateStock);

// Delete stock
router.delete('/:id', stockController.deleteStock);

// Add this route
router.get('/:stockId/history', stockController.getStockHistory);

module.exports = router; 