const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const refreshToken = require('../middleware/refreshToken');
const multer = require('multer');
const path = require('path');

const { getProfile } = require('../controllers/userController');

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/profiles'));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

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