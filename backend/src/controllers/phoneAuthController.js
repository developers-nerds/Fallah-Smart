const { Users } = require('../database/assossiation');
const { Op } = require('sequelize');
const smsService = require('../utils/smsService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || '1234';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '12345';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Store verification codes (in-memory storage - in production use Redis or similar)
const verificationCodes = new Map();

const phoneAuthController = {
  /**
   * Send verification code to a phone number
   */
  sendVerificationCode: async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      // Basic validation
      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
      }
      
      // Format phone number to ensure it has country code
      let formattedPhoneNumber = phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        formattedPhoneNumber = `+${phoneNumber}`;
      }
      
      // Generate verification code
      const verificationCode = smsService.generateVerificationCode();
      
      // Store verification code with expiration (5 minutes)
      verificationCodes.set(formattedPhoneNumber, {
        code: verificationCode,
        expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
      });
      
      // Send verification code via SMS
      console.log(`Attempting to send verification code to ${formattedPhoneNumber}`);
      const smsSent = await smsService.sendVerificationCode(formattedPhoneNumber, verificationCode);
      
      if (!smsSent) {
        console.error(`Failed to send SMS to ${formattedPhoneNumber}`);
        return res.status(500).json({ 
          message: 'Failed to send verification code',
          details: 'SMS service unavailable'
        });
      }
      
      // Return success response
      console.log(`Successfully sent verification code to ${formattedPhoneNumber}`);

      // In development mode, include the code in the response
      const isDevelopmentMode = process.env.NODE_ENV === 'development';
      res.status(200).json({ 
        message: 'Verification code sent successfully',
        phoneNumber: formattedPhoneNumber,
        // Include the code in development mode only
        verificationCode: isDevelopmentMode ? verificationCode : undefined,
        inDevelopment: isDevelopmentMode
      });
      
    } catch (error) {
      console.error('Error sending verification code:', error);
      res.status(500).json({ 
        message: 'Error sending verification code', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },
  
  /**
   * Login or register user with phone number and verification code
   */
  verifyAndLogin: async (req, res) => {
    try {
      const { phoneNumber, verificationCode } = req.body;
      
      console.log(`Verifying code for phone number: ${phoneNumber}`);
      
      // Basic validation
      if (!phoneNumber || !verificationCode) {
        return res.status(400).json({ message: 'Phone number and verification code are required' });
      }
      
      // Format phone number
      let formattedPhoneNumber = phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        formattedPhoneNumber = `+${phoneNumber}`;
      }
      
      // Get stored verification info
      console.log(`Checking verification code for: ${formattedPhoneNumber}`);
      const storedVerification = verificationCodes.get(formattedPhoneNumber);
      
      // Debug stored codes
      console.log('Currently stored verification codes:');
      for (const [phone, data] of verificationCodes.entries()) {
        console.log(`Phone: ${phone}, Code: ${data.code}, Expires: ${new Date(data.expiry).toISOString()}`);
      }
      
      if (!storedVerification) {
        console.log(`No verification code found for ${formattedPhoneNumber}`);
        return res.status(400).json({ message: 'No verification code found for this phone number' });
      }
      
      // Check if verification code has expired
      if (storedVerification.expiry < Date.now()) {
        // Clean up expired code
        console.log(`Verification code expired for ${formattedPhoneNumber}`);
        verificationCodes.delete(formattedPhoneNumber);
        return res.status(400).json({ message: 'Verification code has expired' });
      }
      
      // Check if verification code matches
      console.log(`Comparing codes: Stored=${storedVerification.code}, Received=${verificationCode}`);
      if (storedVerification.code !== verificationCode) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }
      
      // Clean up used verification code
      verificationCodes.delete(formattedPhoneNumber);
      console.log(`Verification successful for ${formattedPhoneNumber}`);
      
      // Check if user exists
      let user = await Users.findOne({ where: { phoneNumber: formattedPhoneNumber } });
      
      // If user doesn't exist, register new user
      if (!user) {
        console.log(`No existing user found for ${formattedPhoneNumber}, creating new user`);
        // Generate random password for the user
        const randomPassword = Math.random().toString(36).slice(-10);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);
        
        // Create username from phone number
        const baseUsername = `user${formattedPhoneNumber.replace(/\D/g, '').slice(-8)}`;
        const username = await generateUniqueUsername(baseUsername);
        
        // Create new user with a temporary email that will be updated during profile completion
        const tempEmail = `${username}@temp-fallah-smart.com`;
        
        // Create new user
        user = await Users.create({
          username,
          firstName: 'User', // Default name
          lastName: phoneNumber.slice(-4), // Last 4 digits as placeholder
          role: 'USER',
          phoneNumber: formattedPhoneNumber,
          password: hashedPassword,
          isOnline: true,
          lastLogin: new Date(),
          email: tempEmail // Add temporary email to satisfy database constraints
        });
        
        console.log(`New user created with ID: ${user.id} and username: ${username}`);
      } else {
        console.log(`Existing user found with ID: ${user.id}`);
      }
      
      // Generate tokens with user data
      console.log(`Generating tokens for user ${user.id}`);
      
      // Calculate token expiration times
      const accessTokenExpiry = new Date();
      accessTokenExpiry.setDate(accessTokenExpiry.getDate() + 1); // 1 day from now
      
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days from now
      
      // Generate tokens
      const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
      
      // Update last login
      await Users.update(
        { 
          lastLogin: new Date(),
          isOnline: true,
          refreshToken 
        },
        { where: { id: user.id } }
      );
      
      // Remove sensitive data from response
      const userResponse = { ...user.toJSON() };
      delete userResponse.password;
      delete userResponse.refreshToken;
      
      console.log(`Authentication successful for user ID: ${user.id}`);
      
      res.status(200).json({
        user: userResponse,
        tokens: {
          access: {
            token: accessToken,
            expires: accessTokenExpiry,
          },
          refresh: {
            token: refreshToken,
            expires: refreshTokenExpiry,
          }
        },
        isNewUser: user.email.includes('@temp-fallah-smart.com') // Indicate if this is a new user
      });
      
    } catch (error) {
      console.error('Error verifying code:', error);
      res.status(500).json({ 
        message: 'Error during verification', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },
  
  /**
   * Complete user profile after phone registration
   */
  completeProfile: async (req, res) => {
    try {
      const { id } = req.user; // From auth middleware
      const { email, firstName, lastName, username, gender } = req.body;
      
      console.log(`Completing profile for user ID: ${id}`);
      console.log('Profile data received:', { email, firstName, lastName, username, gender });
      
      // Basic validation
      if (!email || !firstName || !lastName || !username) {
        console.log('Missing required fields in profile completion');
        return res.status(400).json({ 
          message: 'All fields are required',
          details: 'Email, first name, last name, and username must be provided'
        });
      }
      
      // Find the user
      const user = await Users.findByPk(id);
      
      if (!user) {
        console.log(`User not found with ID: ${id}`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log(`Found user: ${user.username} (${user.email})`);
      
      // Check if email is already in use by another user
      if (email) {
        const existingEmail = await Users.findOne({ 
          where: { 
            email,
            id: { [Op.ne]: id } // Not this user
          } 
        });
        
        if (existingEmail) {
          console.log(`Email ${email} is already in use by another user`);
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
      
      // Check if username is already taken
      if (username && username !== user.username) {
        const existingUsername = await Users.findOne({ 
          where: { 
            username,
            id: { [Op.ne]: id } // Not this user
          } 
        });
        
        if (existingUsername) {
          console.log(`Username ${username} is already taken`);
          return res.status(400).json({ message: 'Username already taken' });
        }
      }
      
      // Detect if the user is updating from a temporary email
      const isUpdatingFromTemp = user.email && user.email.includes('@temp-fallah-smart.com');
      
      // Update user profile
      const updateData = {
        email,
        firstName,
        lastName,
        username,
        gender: gender || user.gender
      };
      
      console.log('Updating user with data:', updateData);
      await user.update(updateData);
      
      // Return updated user
      const updatedUser = await Users.findByPk(id);
      const userResponse = { ...updatedUser.toJSON() };
      delete userResponse.password;
      delete userResponse.refreshToken;
      
      console.log(`Profile successfully updated for user ID: ${id}`);
      res.status(200).json({
        user: userResponse,
        message: 'Profile updated successfully',
        updatedFromTemp: isUpdatingFromTemp
      });
      
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ 
        message: 'Error updating profile', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};

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

module.exports = phoneAuthController; 