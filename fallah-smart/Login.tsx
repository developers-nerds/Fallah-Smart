import React from 'react';
import { View, Text, Button } from 'react-native';
import notificationService from './services/NotificationService';
import StockNotificationService from './services/StockNotificationService';

export default function LoginTest() {
  const handleTestNotification = async () => {
    try {
      await notificationService.initialize();
      await notificationService.scheduleTestNotification('This is a test notification');
      console.log('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const handleStockTest = async () => {
    try {
      const stockService = StockNotificationService.getInstance();
      await stockService.initialize();
      await stockService.runManualStockCheck();
      console.log('Stock check completed!');
    } catch (error) {
      console.error('Error running stock check:', error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Notification Test</Text>
      <Button title="Test Notification" onPress={handleTestNotification} />
      <Button title="Test Stock Notifications" onPress={handleStockTest} />
    </View>
  );
} 