// Simple test script for the notification service
require('dotenv').config();
const { StockNotification, UserDevice, Users } = require('./src/database/models');
const NotificationService = require('./src/services/notificationService');

async function testSimpleNotification() {
  try {
    console.log('Testing notification creation...');
    
    // Get a valid user to send to
    const testUser = await Users.findOne();
    
    if (!testUser) {
      console.error('❌ No users found in the database to send notifications to!');
      return;
    }
    
    console.log(`Found user ID ${testUser.id} to send test notification to`);
    
    // Check if the user has any registered devices
    let devices = await UserDevice.findAll({
      where: { 
        userId: testUser.id,
        isActive: true
      }
    });
    
    console.log(`User has ${devices.length} registered device(s)`);
    
    // If no devices found, create a test device
    if (devices.length === 0) {
      console.log('No devices found. Creating a test device for this user...');
      
      try {
        // Create FCM-format test token for testing purposes
        const testToken = `test-fcm-token-${Date.now()}:APA91bExample_FCM_Token_Format`;
        
        const testDevice = await UserDevice.create({
          userId: testUser.id,
          deviceToken: testToken,
          deviceType: 'mobile',
          isActive: true,
          lastActive: new Date()
        });
        
        console.log('✅ Test device created with token:', testDevice.deviceToken);
        
        // Update devices list
        devices = await UserDevice.findAll({
          where: { 
            userId: testUser.id,
            isActive: true
          }
        });
      } catch (error) {
        console.error('❌ Failed to create test device:', error.message);
      }
    }
    
    // Log all device tokens for debugging
    if (devices.length > 0) {
      console.log('Registered device tokens:');
      devices.forEach(device => {
        console.log(`- ${device.deviceToken} (${device.deviceType})`);
      });
    }
    
    // Create a simple notification
    try {
      console.log('Creating test notification...');
      const notification = await NotificationService.createNotification({
        userId: testUser.id,
        type: 'low_stock',
        title: 'Test Notification',
        message: 'This is a test notification from the system',
        priority: 'high'
      });
      
      console.log('✅ Notification created successfully with ID:', notification.id);
      
      // If no devices, prompt the user to register a device
      if (devices.length === 0) {
        console.log('⚠️ User has no registered devices. Please register a device in the app to receive push notifications.');
      }
    } catch (error) {
      console.error('❌ Failed to create notification:', error.message);
      console.error('Error details:', error);
    }
    
    console.log('Test completed');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testSimpleNotification(); 