const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const refreshToken = require('../middleware/refreshToken');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', refreshToken);

// Protected routes (require authentication)
router.post('/logout', auth, userController.logout);
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.put('/change-password', auth, userController.changePassword);
router.delete('/account', auth, userController.deleteAccount);
router.get('/users', auth, userController.getAllUsers);

module.exports = router;