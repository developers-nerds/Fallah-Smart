const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Users } = require('../database/assossiation');
const { Op } = require('sequelize');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || '1234';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '12345';
const JWT_EXPIRES_IN = '30d';
const JWT_REFRESH_EXPIRES_IN = '30d';

const userController = {
  // Register new user
  register: async (req, res) => {
    try {
      const {
        username,
        firstName,
        lastName,
        role,
        gender,
        email,
        phoneNumber,
        password,
        profilePicture
      } = req.body;

      // Check if user already exists
      const existingUser = await Users.findOne({
        where: {
          [Op.or]: [{ email }, { username }]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          message: 'User with this email or username already exists'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = await Users.create({
        username,
        firstName,
        lastName,
        role,
        gender,
        email,
        phoneNumber,
        password: hashedPassword,
        profilePicture,
        isOnline: true,
        lastLogin: new Date()
      });

      // Generate tokens with user data
      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);

      // Save refresh token to user
      await Users.update(
        { refreshToken },
        { where: { id: newUser.id } }
      );

      // Remove sensitive data from response
      const userResponse = { ...newUser.toJSON() };
      delete userResponse.password;
      delete userResponse.refreshToken;

      res.status(201).json({
        user: userResponse,
        tokens: {
          access: {
            token: accessToken,
          },
          refresh: {
            token: refreshToken,
          }
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        message: 'Error registering user',
        error: error.message
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user with additional data
      const user = await Users.findOne({ 
        where: { email },
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Get user with password for verification
      const userWithPassword = await Users.findOne({ where: { email } });
      
      // Verify password
      const validPassword = await bcrypt.compare(password, userWithPassword.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      await user.update({
        isOnline: true,
        lastLogin: new Date()
      });

      // Generate tokens with user data
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Save refresh token
      await user.update({ refreshToken });

      res.json({
        user: user,
        tokens: {
          access: {
            token: accessToken,
            expires: JWT_EXPIRES_IN
          },
          refresh: {
            token: refreshToken,
            expires: JWT_REFRESH_EXPIRES_IN
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        message: 'Error logging in',
        error: error.message
      });
    }
  },

  // Logout user
  logout: async (req, res) => {
    try {
      const { id } = req.user;
      
      await Users.update(
        {
          isOnline: false,
          refreshToken: null
        },
        { where: { id } }
      );

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        message: 'Error logging out',
        error: error.message
      });
    }
  },

  // New methods moved from routes
  getProfile: async (req, res) => {
    try {
      const user = await Users.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'refreshToken'] }
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ message: 'Error fetching profile' });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        gender,
        phoneNumber,
        profilePicture
      } = req.body;

      const user = await Users.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await user.update({
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        gender: gender || user.gender,
        phoneNumber: phoneNumber || user.phoneNumber,
        profilePicture: profilePicture || user.profilePicture
      });

      const updatedUser = await Users.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'refreshToken'] }
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await Users.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await user.update({ password: hashedPassword });

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ message: 'Error changing password' });
    }
  },

  deleteAccount: async (req, res) => {
    try {
      const user = await Users.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await user.destroy();
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({ message: 'Error deleting account' });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const users = await Users.findAll({
        attributes: { exclude: ['password', 'refreshToken'] }
      });

      res.json(users);
    } catch (error) {
      console.error('Users fetch error:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  }
};

// Updated token generation functions
function generateAccessToken(user) {
  const userData = {
    id: user.id,
    email: user.email,
    role: user.role,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName
  };

  return jwt.sign(
    userData,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  const userData = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(
    userData,
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

module.exports = userController;
