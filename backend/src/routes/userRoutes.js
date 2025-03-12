            const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const refreshToken = require('../middleware/refreshToken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload'); // Multer middleware for file uploads

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

const uploadProfile = multer({ 
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

// Import necessary modules for file uploads
const documentUpload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      // Create a separate directory for advisor application documents
      const uploadsDir = path.join(__dirname, '../../uploads/advisor-documents');
      fs.mkdirSync(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    },
    filename: function(req, file, cb) {
      const userId = req.user.id;
      const timestamp = Date.now();
      const uniqueName = `${userId}-${timestamp}-${file.originalname.replace(/\s/g, '_')}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, images, and common document formats
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload PDF, images, or document files.'), false);
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
router.put('/profile', auth, uploadProfile.single('profileImage'), userController.updateProfile);

router.put('/change-password', auth, userController.changePassword);
router.delete('/account', auth, userController.deleteAccount);
router.get('/users', auth, userController.getAllUsers);

router.get('/verify', userController.verify);
router.post('/refresh', userController.refresh);

// Add advisor application routes
router.post(
  '/apply-advisor',
  auth,
  upload.array('documents', 5), // Allow up to 5 documents
  userController.applyForAdvisor
);

// Get advisor application status
router.get(
  '/advisor-application-status',
  auth,
  userController.getAdvisorApplicationStatus
);

// Admin routes for reviewing applications
router.put(
  '/review-advisor-application',
  auth,
  userController.reviewAdvisorApplication
);

// Get all applications (admin only)
router.get(
  '/advisor-applications',
  auth,
  userController.getAllAdvisorApplications
);

module.exports = router;