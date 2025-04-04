const express = require('express');
const router = express.Router();
const phoneAuthController = require('../controllers/phoneAuthController');
const authenticate = require('../middleware/auth');

// Send verification code to phone number
router.post('/send-code', phoneAuthController.sendVerificationCode);

// Verify code and login/register
router.post('/verify', phoneAuthController.verifyAndLogin);

// Complete profile after phone authentication (requires auth)
router.put('/complete-profile', authenticate, phoneAuthController.completeProfile);

module.exports = router; 