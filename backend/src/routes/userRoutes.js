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

// Route to update specific user by ID (admin only)
router.put('/profile/:userId', auth, userController.updateUserById);

// Middleware to handle both image uploads and text-only updates
const profileUpdateMiddleware = (req, res, next) => {
  // Check if the request contains multipart form data
  const contentType = req.headers['content-type'] || '';
  
  if (contentType.includes('multipart/form-data')) {
    // Use multer for file uploads
    uploadProfile.single('profilePicture')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({
          message: err.message || 'Error processing file upload',
          error: err
        });
      }
      next();
    });
  } else {
    // Skip file processing for regular JSON updates
    console.log('Processing text-only profile update');
    next();
  }
};

// Update profile route to handle both file uploads and text-only updates
router.put('/profile', auth, profileUpdateMiddleware, userController.updateProfile);

router.put('/change-password', auth, userController.changePassword);
router.delete('/account', auth, userController.deleteAccount);
router.get('/users', auth, userController.getAllUsers);
router.get('/all', auth, userController.getAllUsers); // Alternative route to get all users

router.get('/verify', userController.verify);
router.post('/refresh', userController.refresh);

// Add special dashboard route
router.get('/dashboard/users', auth, userController.getDashboardUsers);

// Add advisor application routes
router.post(
  '/apply-advisor',
  auth,
  upload.fields([
    { name: 'documents', maxCount: 5 },
    { name: 'certificationPhotos', maxCount: 5 }
  ]), // Allow multiple types of files with their field names
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