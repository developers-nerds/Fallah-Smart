const express = require('express');
const router = express.Router();
const stockDashboardController = require('../controllers/stockDashboardController');
const auth = require('../middleware/auth');
const { Users } = require('../database/models');

// Admin authorization middleware
const adminAuth = async (req, res, next) => {
  try {
    // Check if user exists and is an admin
    const user = await Users.findByPk(req.user.id);
    
    if (!user) {
      console.log('Admin auth failed: User not found', req.user.id);
      return res.status(403).json({ error: 'Access denied. User not found.' });
    }
    
    const userRole = user.role || '';
    const isAdmin = 
      userRole.toLowerCase() === 'admin' || 
      userRole.toUpperCase() === 'ADMIN' ||
      userRole === 'ROLE_ADMIN';
    
    console.log('Admin auth check:', { 
      userId: user.id, 
      role: user.role, 
      isAdmin 
    });
    
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.',
        provided: userRole
      });
    }
    
    // Add role to req.user for later use
    req.user.role = user.role;
    req.user.email = user.email;
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authorization error' });
  }
};

// All routes require authentication and admin privileges
router.use(auth);
router.use(adminAuth);

// Get stock dashboard summary
router.get('/summary', stockDashboardController.getSummary);

// Get users with stock statistics
router.get('/users-stats', stockDashboardController.getUsersStats);

// Debug endpoint to check auth status
router.get('/auth-check', (req, res) => {
  res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    },
    message: 'You have admin access to the stock dashboard'
  });
});

module.exports = router; 