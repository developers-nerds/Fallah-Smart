// Simple test script for the notification service
require('dotenv').config();
const { StockNotification } = require('./src/database/models');
const NotificationService = require('./src/services/notificationService');

async function testNotificationCreation() {
  try {
    console.log('Testing notification creation...');
    
    // Test 1: Check if the StockNotification model is properly loaded
    console.log('Test 1: StockNotification model properties:');
    console.log(Object.keys(StockNotification.rawAttributes));
    
    // Test 2: Try to create a notification directly
    console.log('\nTest 2: Creating notification directly with StockNotification.create:');
    try {
      const notification = await StockNotification.create({
        userId: 1, // Use a valid user ID from your database
        type: 'low_stock',
        title: 'Test Notification',
        message: 'This is a test notification',
        priority: 'high',
        status: 'sent',
        sentAt: new Date()
      });
      console.log('✅ Direct notification creation successful!');
      console.log('Created notification:', notification.id);
    } catch (error) {
      console.error('❌ Direct notification creation failed:', error.message);
      if (error.parent) {
        console.error('SQL Error:', error.parent.message);
      }
    }
    
    // Test 3: Try to create a notification via the service
    console.log('\nTest 3: Creating notification via NotificationService:');
    try {
      const notification = await NotificationService.createNotification({
        userId: 1, // Use a valid user ID from your database
        type: 'low_stock',
        title: 'Test Service Notification',
        message: 'This is a test notification created via the service',
        priority: 'high'
      });
      console.log('✅ Service notification creation successful!');
      console.log('Created notification:', notification.id);
    } catch (error) {
      console.error('❌ Service notification creation failed:', error.message);
      if (error.parent) {
        console.error('SQL Error:', error.parent.message);
      }
    }
    
    console.log('\nTests completed.');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testNotificationCreation(); 