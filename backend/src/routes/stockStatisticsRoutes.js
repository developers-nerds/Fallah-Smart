const express = require('express');
const router = express.Router();
const auth  = require('../middleware/auth');
const stockStatisticsController = require('../controllers/stockStatisticsController');

// Get stock statistics
router.get('/', auth, stockStatisticsController.getStatistics);

module.exports = router; 