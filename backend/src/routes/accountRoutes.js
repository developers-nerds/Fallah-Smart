const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get authenticated user's accounts
router.get('/', accountController.getAllAccounts);

// Create new account for authenticated user
router.post('/', accountController.createAccount);

// Update authenticated user's account
router.put('/:id', accountController.updateAccountBalance);

// Delete authenticated user's account
router.delete('/', accountController.deleteAccount);

// Add this new route after the auth middleware
router.get('/all-with-users', accountController.getAllAccountsWithUsers);

module.exports = router;