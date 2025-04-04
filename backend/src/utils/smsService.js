const twilio = require('twilio');
const logger = require('./logger');

// Check for Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const isDevelopmentMode = process.env.NODE_ENV === 'development';

// Log environment information
logger.info(`SMS Service Environment: ${process.env.NODE_ENV || 'not set'}`);
logger.info(`Development mode: ${isDevelopmentMode ? 'YES' : 'NO'}`);
logger.info(`Using Twilio phone number: ${twilioPhoneNumber}`);

// Initialize Twilio client if credentials are available
let twilioClient = null;
if (accountSid && authToken) {
  try {
    twilioClient = twilio(accountSid, authToken);
    logger.info('✅ Twilio client initialized successfully with account: ' + accountSid);
  } catch (error) {
    logger.error('❌ Failed to initialize Twilio client:', error);
  }
} else {
  logger.warn('⚠️ Twilio credentials incomplete. Check your .env file for TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
}

if (!twilioPhoneNumber) {
  logger.warn('⚠️ No Twilio phone number configured. Set TWILIO_PHONE_NUMBER in your .env file');
}

// Development mode helper function to format a verification code box for better visibility
const formatVerificationCodeBox = (phoneNumber, code) => {
  return `
╔══════════════════════════════════════════════════════╗
║                  SMS VERIFICATION                     ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  📱 Phone: ${phoneNumber.padEnd(38, ' ')} ║
║  🔑 Code:  ${code.padEnd(38, ' ')} ║
║                                                      ║
║  ℹ️ Use this code to verify your account             ║
║  ⏰ This code will expire in 5 minutes                ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
  `;
};

// Format phone number to E.164 format for Twilio
const formatPhoneNumber = (phoneNumber) => {
  // Remove spaces, dashes, parentheses
  let cleaned = phoneNumber.replace(/\s|\(|\)|-/g, '');
  
  // Make sure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

// SMS Service
const smsService = {
  // Generate a 6-digit verification code
  generateVerificationCode: () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
  
  // Send verification code via SMS
  sendVerificationCode: async (phoneNumber, code) => {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      logger.info(`Attempting to send verification code to ${formattedPhone}`);
      
      // Always log the code to console (for backup/debugging)
      logger.info(formatVerificationCodeBox(formattedPhone, code));
      
      // Check if Twilio is properly configured
      if (!twilioClient) {
        logger.error('❌ Twilio client not initialized. Cannot send SMS.');
        return false;
      }
      
      if (!twilioPhoneNumber) {
        logger.error('❌ No Twilio phone number configured. Set TWILIO_PHONE_NUMBER in your .env file');
        return false;
      }
      
      // Always attempt to send a real SMS regardless of development mode
      logger.info(`Sending real SMS to ${formattedPhone} from ${twilioPhoneNumber}`);
      const message = await twilioClient.messages.create({
        body: `Your verification code for Fallah Smart is: ${code}. This code will expire in 5 minutes.`,
        from: twilioPhoneNumber,
        to: formattedPhone
      });
      
      logger.info(`✅ SMS sent to ${formattedPhone} with SID: ${message.sid}`);
      return true;
    } catch (error) {
      logger.error('❌ Error sending SMS:', error.message);
      
      if (error.code) {
        logger.error(`Twilio Error Code: ${error.code}`);
      }
      
      // Common Twilio error handling
      if (error.code === 21211) {
        logger.error('Invalid phone number format. Please use E.164 format (+123456789)');
      } else if (error.code === 21608) {
        logger.error('Twilio account cannot send SMS to this country. You may need to upgrade your Twilio account.');
      } else if (error.code === 21610) {
        logger.error('This destination number is not currently reachable via SMS.');
      } else if (error.code === 21614) {
        logger.error('This phone number is not verified with Twilio. Verify it in your Twilio console.');
      }
      
      // In development, provide the code in logs so testing can continue
      if (isDevelopmentMode) {
        logger.warn('🧪 Development mode: SMS sending failed, but the code is available in logs above.');
        return true; // Return success for development testing even though SMS failed
      }
      
      return false;
    }
  }
};

module.exports = smsService; 