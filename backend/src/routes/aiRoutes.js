const express = require('express');
const router = express.Router();
const { analyzeStock } = require('../controllers/aiController');
const auth = require('../middleware/auth');

// Route for stock analysis
router.post('/analyze-stock', auth, analyzeStock);

module.exports = router; 