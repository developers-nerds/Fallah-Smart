const cron = require('node-cron');
const NotificationService = require('../services/notificationService');

// Run every day at 9:00 AM
const schedule = '0 9 * * *';

function startNotificationCron() {
  cron.schedule(schedule, async () => {
    console.log('Running notification checks...');
    
    try {
      // Check for low stock
      await NotificationService.checkLowStock();
      
      // Check for expiring items
      await NotificationService.checkExpiryDates();
      
      console.log('Notification checks completed successfully');
    } catch (error) {
      console.error('Error running notification checks:', error);
    }
  });
}

module.exports = {
  startNotificationCron,
}; 