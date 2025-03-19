const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize Firebase Admin SDK if not already initialized
let firebaseAdmin;
try {
  // Check if already initialized
  if (admin.apps.length === 0) {
    let serviceAccount = null;
    let serviceAccountPath = null;
    
    try {
      // Try to load service account from JSON file first
      serviceAccountPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../../firebase-service-account.json'));
      
      if (fs.existsSync(serviceAccountPath)) {
        try {
          // Try to load and parse the JSON file
          const rawData = fs.readFileSync(serviceAccountPath, 'utf8');
          serviceAccount = JSON.parse(rawData);
          console.log('Successfully loaded Firebase service account from file');
        } catch (parseError) {
          console.error('Error parsing Firebase service account JSON file:', parseError.message);
          serviceAccount = null;
        }
      }
    } catch (fileError) {
      console.error('Error accessing Firebase service account file:', fileError.message);
    }
    
    // If service account from file failed, try environment variables
    if (!serviceAccount) {
      try {
        if (process.env.FIREBASE_PROJECT_ID && 
            process.env.FIREBASE_CLIENT_EMAIL && 
            process.env.FIREBASE_PRIVATE_KEY) {
          
          // Make sure to properly handle the private key from environment variable
          let privateKey = process.env.FIREBASE_PRIVATE_KEY;
          if (privateKey.includes('\\n')) {
            privateKey = privateKey.replace(/\\n/g, '\n');
          }
          
          serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
          };
          
          console.log('Using Firebase credentials from environment variables');
        } else {
          console.warn('Missing Firebase credentials in environment variables');
        }
      } catch (envError) {
        console.error('Error loading Firebase credentials from environment:', envError.message);
      }
    }
    
    // Initialize with service account if available
    if (serviceAccount) {
      try {
        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin SDK initialized successfully with credentials');
      } catch (initError) {
        console.error('Error initializing Firebase Admin with credentials:', initError.message);
        throw initError; // Rethrow to be caught by the outer try/catch
      }
    } else {
      throw new Error('No valid Firebase credentials found in file or environment variables');
    }
  } else {
    firebaseAdmin = admin.app();
    console.log('Using existing Firebase Admin SDK instance');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  
  // Create a mock implementation for development/testing
  firebaseAdmin = {
    messaging: () => ({
      send: async (message) => {
        console.log('MOCK: Would send FCM message to:', message.token);
        return `mock-message-id-${Date.now()}`;
      },
      sendMulticast: async (message) => {
        console.log('MOCK: Would send multicast FCM message to:', message.tokens?.length || 1, 'devices');
        return { 
          successCount: message.tokens ? message.tokens.length : 1, 
          failureCount: 0,
          responses: message.tokens 
            ? message.tokens.map(token => ({ success: true, messageId: `mock-message-id-${Date.now()}` }))
            : [{ success: true, messageId: `mock-message-id-${Date.now()}` }]
        };
      }
    })
  };
  
  console.warn('Using mock Firebase Admin implementation due to initialization error');
  console.warn('This is expected in development. For production, please configure valid Firebase credentials.');
}

module.exports = firebaseAdmin; 