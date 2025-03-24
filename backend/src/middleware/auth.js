const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '1234';
const { Users } = require('../database/assossiation');

const auth = async (req, res, next) => {
  try {
    console.log("Auth middleware called");
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log("No auth header provided");
      return res.status(401).json({ message: 'No authorization header provided' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log("No token in auth header");
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log(`Token verified for user ID: ${decoded.id}, Token role: ${decoded.role || 'not specified'}`);
      
      // Important fix: Fetch user from database to get their actual role
      const user = await Users.findByPk(decoded.id);
      if (!user) {
        console.log(`User with ID ${decoded.id} not found in database`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Create full user object with role from database
      req.user = {
        ...decoded,
        role: user.role // Override token role with database role
      };
      
      console.log(`User role from database: ${user.role}`);
      
      // Check if the route requires admin privileges
      // Add the new dashboard route to the admin routes
      const adminRoutes = [
        '/api/users/users',
        '/api/users/all',
        '/api/users/dashboard/users'
      ];
      
      if (adminRoutes.includes(req.path) && user.role?.toUpperCase() !== 'ADMIN') {
        console.log(`Access denied to ${req.path}: User role (${user.role}) is not ADMIN`);
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }
      
      next();
    } catch (error) {
      console.log("Token verification failed:", error.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: 'Server error in authentication' });
  }
};

module.exports = auth; 