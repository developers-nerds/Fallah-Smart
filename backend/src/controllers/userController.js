const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Users } = require('../database/assossiation');
const { Op } = require('sequelize');
require('dotenv').config();
const config = require("../config/db");

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
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

      // Basic validation
      if (!firstName || !lastName || !username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Password validation
      const passwordRegex = {
        minLength: /.{8,}/,
        hasUppercase: /[A-Z]/,
        hasLowercase: /[a-z]/,
        hasNumber: /[0-9]/,
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/
      };

      const passwordValidation = {
        minLength: passwordRegex.minLength.test(password),
        hasUppercase: passwordRegex.hasUppercase.test(password),
        hasLowercase: passwordRegex.hasLowercase.test(password),
        hasNumber: passwordRegex.hasNumber.test(password),
        hasSpecial: passwordRegex.hasSpecial.test(password)
      };

      // Check if all password requirements are met
      if (!Object.values(passwordValidation).every(value => value === true)) {
        // Identify which requirements failed
        const failedRequirements = Object.entries(passwordValidation)
          .filter(([_, value]) => !value)
          .map(([key, _]) => {
            switch(key) {
              case 'minLength': return 'at least 8 characters';
              case 'hasUppercase': return 'an uppercase letter';
              case 'hasLowercase': return 'a lowercase letter';
              case 'hasNumber': return 'a number';
              case 'hasSpecial': return 'a special character';
              default: return key;
            }
          });

        return res.status(400).json({ 
          message: `Password requirements not met. Password must contain ${failedRequirements.join(', ')}.`
        });
      }

      // Check if user already exists
      const existingUser = await Users.findOne({
        where: {
          [Op.or]: [{ email }, { username }]
        }
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        return res.status(400).json({ message: 'Username already taken' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = await Users.create({
        username,
        firstName,
        lastName,
        role: role || 'USER',
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

      const user = await Users.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Generate tokens
      const tokens = {
        access: {
          token: jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' }),
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        refresh: {
          token: jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }),
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      // Remove sensitive data
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };

      res.json({ user: userData, tokens });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error during login' });
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

  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await Users.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'refreshToken'] }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log("Sending user profile with picture:", user.profilePicture);
      res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Error fetching profile' });
    }
  },

  // Update profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await Users.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get the update data from request body
      const { username, firstName, lastName, gender, phoneNumber } = req.body;

      // Handle profile picture
      let profilePicture = user.profilePicture;
      if (req.file) {
        // Create URL for the uploaded file
        profilePicture = `/uploads/${req.file.filename}`;
        console.log("New profile picture path:", profilePicture);
      }

      // Update user data
      const updatedUser = await user.update({
        username: username || user.username,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        gender: gender || user.gender,
        phoneNumber: phoneNumber || user.phoneNumber,
        profilePicture: profilePicture
      });

      // Remove sensitive data before sending response
      const userResponse = {
        id: updatedUser.id,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        gender: updatedUser.gender,
        phoneNumber: updatedUser.phoneNumber,
        profilePicture: updatedUser.profilePicture
      };

      console.log("Updated user response:", userResponse);
      res.json(userResponse);

    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ 
        message: 'Error updating profile',
        error: error.message 
      });
    }
  },

  // Change password
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

  // Delete account
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

  // Get all users
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
  },

  verify: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await Users.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      res.json({ 
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' });
    }
  },

  refresh: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await Users.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const tokens = {
        access: {
          token: jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' }),
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        refresh: {
          token: jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }),
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      res.json({ tokens });
    } catch (error) {
      res.status(401).json({ message: 'Invalid refresh token' });
    }
  },
};

// Helper functions
function generateAccessToken(user) {
  const userData = {
    id: user.id,
    email: user.email,
    role: user.role
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

// Helper function to generate unique username
async function generateUniqueUsername(baseUsername) {
  let username = baseUsername;
  let counter = 1;
  
  while (true) {
    const existingUser = await Users.findOne({ where: { username } });
    if (!existingUser) break;
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  return username;
}

module.exports = userController;
