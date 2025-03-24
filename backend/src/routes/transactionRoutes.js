const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Admin route to get all transactions from all accounts
router.get('/admin/all', transactionController.getAllTransactionsAdmin);

// Admin route to get all users' transactions
router.get('/admin/:accountId', transactionController.getAllUsersTransactions);

// Get all transactions for an account with optional interval filtering
router.get('/:accountId', transactionController.getAllTransactions);

// Create new transaction
router.post('/', transactionController.createTransaction);

// Update transaction
router.put('/:id', transactionController.updateTransaction);

// Delete transaction
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;