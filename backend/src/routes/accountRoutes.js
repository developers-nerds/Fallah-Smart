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
router.put('/', accountController.updateAccount);

// Delete authenticated user's account
router.delete('/', accountController.deleteAccount);

module.exports = router;