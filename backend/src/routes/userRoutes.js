const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const refreshToken = require('../middleware/refreshToken');
const upload = require('../utils/multerConfig'); // Import multer config

const { getProfile } = require('../controllers/userController');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', refreshToken);

// Protected routes (require authentication)
router.post('/logout', auth, userController.logout);
router.get('/profile', auth, getProfile);

// Update route with file upload middleware for profile image
router.put('/profile', auth, upload.single('profileImage'), userController.updateProfile);

router.put('/change-password', auth, userController.changePassword);
router.delete('/account', auth, userController.deleteAccount);
router.get('/users', auth, userController.getAllUsers);

router.get('/verify', userController.verify);
router.post('/refresh', userController.refresh);

module.exports = router;