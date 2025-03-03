const express = require('express');
const router = express.Router();
const pesticideController = require('../controllers/pesticideController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// CRUD routes
router.post('/', pesticideController.createPesticide);
router.get('/', pesticideController.getAllPesticides);
router.get('/:id', pesticideController.getPesticideById);
router.put('/:id', pesticideController.updatePesticide);
router.delete('/:id', pesticideController.deletePesticide);

// Quantity management
router.patch('/:id/quantity', pesticideController.updatePesticideQuantity);

module.exports = router;