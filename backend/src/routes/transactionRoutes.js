const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all transactions for an account
router.get('/:accountId', transactionController.getAllTransactions);

// Create new transaction
router.post('/', transactionController.createTransaction);

// Delete transaction
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;