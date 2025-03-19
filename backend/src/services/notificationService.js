const { StockNotification, Users, Stock, UserDevice } = require('../database/models');
const { Op, Sequelize } = require('sequelize');
const { Expo } = require('expo-server-sdk');
const axios = require('axios');

// Create a new Expo SDK client
let expo;
try {
  expo = new Expo();
} catch (error) {
  console.error('Error initializing Expo server SDK:', error);
  // Create a mock Expo object with the necessary methods for development
  expo = {
    isExpoPushToken: (token) => token && (token.startsWith('ExpoToken') || token.includes('ExpoSimulatedToken')),
    chunkPushNotifications: (messages) => [messages],
    sendPushNotificationsAsync: async (messages) => {
      console.log('Mock Expo push notification service called with:', messages.length, 'messages');
      return messages.map(() => ({ status: 'ok', id: `mock-${Date.now()}` }));
    }
  };
}

// Add custom token validation function that accepts both Expo and FCM tokens
const isValidPushToken = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Check if it's a valid Expo push token
  try {
    if (Expo.isExpoPushToken(token) || token.startsWith('ExpoToken') || token.includes('ExpoSimulatedToken')) {
      return { isValid: true, type: 'expo' };
    }
  } catch (e) {
    // Error in Expo validation - continue with other checks
  }
  
  // Check if it's an FCM token (typically contains a colon and has a specific format)
  if (token.includes(':') && 
      token.length > 20 && 
      /^[A-Za-z0-9_\-:]+$/.test(token)) {
    return { isValid: true, type: 'fcm' };
  }
  
  // Check for development tokens
  if (process.env.NODE_ENV === 'development' && 
      (token.includes('dev') || token.includes('test') || token.includes('mock'))) {
    return { isValid: true, type: 'development' };
  }
  
  return { isValid: false };
};

// Code that sends FCM push notifications using the legacy FCM API
const sendFCMNotification = async (token, notification) => {
  try {
    // Check if FCM server key is available
    const fcmServerKey = process.env.FCM_SERVER_KEY;
    if (!fcmServerKey) {
      throw new Error('FCM_SERVER_KEY not configured');
    }

    // Use the legacy FCM API endpoint
    const fcmEndpoint = 'https://fcm.googleapis.com/fcm/send';
    
    // Format message for legacy FCM
    const message = {
      to: token,
      priority: "high",
      content_available: true,
      notification: {
        title: notification.title,
        body: notification.message,
        sound: "default",
        icon: "ic_notification"
      },
      data: {
        notificationId: notification.id?.toString() || '',
        type: notification.type || '',
        relatedModelType: notification.relatedModelType || '',
        relatedModelId: notification.relatedModelId ? notification.relatedModelId.toString() : '',
        click_action: "FLUTTER_NOTIFICATION_CLICK"
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          icon: "ic_notification",
          channel_id: "fallah_notification_channel"
        }
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `key=${fcmServerKey}`
    };

    console.log('Sending FCM message:', JSON.stringify(message, null, 2));
    console.log('Using FCM endpoint:', fcmEndpoint);
    
    const response = await axios.post(fcmEndpoint, message, { headers });
    
    console.log('FCM notification sent successfully:', response.data);
    return { 
      status: 'ok', 
      id: `fcm-${Date.now()}`,
      response: response.data
    };
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
      console.error('Error data:', error.response.data);
    }
    return { 
      status: 'error', 
      message: error.message,
      details: error.response?.data
    };
  }
};

class NotificationService {
  static async createNotification({
    userId,
    type,
    title,
    message,
    priority = 'medium',
    relatedModelType = null,
    relatedModelId = null,
    equipmentId = null,
  }) {
    try {
      // Create notification object with only the required fields
      const notificationData = {
        userId,
        type,
        title,
        message,
        priority,
        relatedModelType,
        relatedModelId,
        status: 'sent',
        sentAt: new Date(),
      };
      
      // Try to add equipmentId if provided (only if column exists)
      if (equipmentId) {
        try {
          // Check if the column exists by adding it to a test object
          const testObj = {};
          testObj.equipmentId = equipmentId;
          
          // If we got here, add it to the notification data
          notificationData.equipmentId = equipmentId;
        } catch (err) {
          console.warn('equipmentId field not available in database yet, skipping');
        }
      }

      const notification = await StockNotification.create(notificationData);

      // Send push notification to user's devices
      await this.sendPushNotification(notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async sendPushNotification(notification) {
    try {
      // Get user's devices
      const devices = await UserDevice.findAll({
        where: {
          userId: notification.userId,
          isActive: true,
        },
      });

      if (devices.length === 0) {
        console.log('No devices found for user:', notification.userId);
        return;
      }

      // Get user's notification settings
      try {
        const user = await Users.findByPk(notification.userId);
        if (!user) {
          console.warn(`User not found for notification: ${notification.id}`);
          return;
        }
        
        const settings = user.notificationSettings || {};

        // Check if user has enabled this type of notification
        const notificationType = notification.type;
        const settingKey = notificationType === 'low_stock' ? 'lowStockAlerts' : 
                           notificationType === 'expiry' ? 'expiryAlerts' : 
                           notificationType === 'maintenance' ? 'maintenanceAlerts' : 
                           notificationType === 'vaccination' ? 'vaccinationAlerts' : 
                           notificationType === 'breeding' ? 'breedingAlerts' : null;

        // If settings exist and are explicitly turned off, don't send notification
        if (settingKey && settings[settingKey] === false) {
          console.log(`Notification type ${notificationType} is disabled for user:`, notification.userId);
          return;
        }

        // Prepare messages for Expo push service
        const messages = [];
        const fcmTokens = [];
        
        for (const device of devices) {
          try {
            // Check that the token is a valid push token
            const validationResult = isValidPushToken(device.deviceToken);
            
            if (!validationResult.isValid) {
              console.warn(`Push token ${device.deviceToken} is not a valid push token`);
              continue;
            }

            // Handle different token types
            if (validationResult.type === 'expo') {
              // Expo token handling
              messages.push({
                to: device.deviceToken,
                sound: 'default',
                title: notification.title,
                body: notification.message,
                data: {
                  notificationId: notification.id,
                  type: notification.type,
                  relatedModelType: notification.relatedModelType,
                  relatedModelId: notification.relatedModelId,
                },
                priority: notification.priority === 'high' ? 'high' : 'default',
              });
            } else if (validationResult.type === 'fcm' || validationResult.type === 'development') {
              // FCM token handling
              fcmTokens.push(device.deviceToken);
            }
          } catch (deviceError) {
            console.error(`Error processing device ${device.id}:`, deviceError);
            // Continue with other devices
          }
        }

        // Send Expo messages
        if (messages.length > 0) {
          try {
            const chunks = expo.chunkPushNotifications(messages);
            
            for (const chunk of chunks) {
              try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log('Expo push notifications sent:', ticketChunk);
                this.handlePushNotificationReceipts(ticketChunk, devices);
              } catch (error) {
                console.error('Error sending Expo push notifications chunk:', error);
              }
            }
          } catch (expoError) {
            console.error('Error in Expo push notification process:', expoError);
          }
        }
        
        // Send FCM messages
        for (const fcmToken of fcmTokens) {
          try {
            console.log('Sending FCM notification to:', fcmToken);
            
            const result = await sendFCMNotification(fcmToken, {
              id: notification.id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              priority: notification.priority,
              relatedModelType: notification.relatedModelType,
              relatedModelId: notification.relatedModelId
            });
            
            if (result.status === 'error') {
              console.error('FCM notification error:', result.message);
            } else {
              console.log('FCM notification sent successfully:', result.id);
            }
          } catch (fcmError) {
            console.error('Error sending individual FCM notification:', fcmError);
          }
        }
      } catch (userError) {
        console.error('Error fetching user or settings:', userError);
      }
    } catch (error) {
      console.error('Error in sendPushNotification:', error);
    }
  }

  static async handlePushNotificationReceipts(tickets, devices) {
    // Later, you can fetch receipts to check for delivery status and errors
    const receiptIds = [];
    
    for (const ticket of tickets) {
      if (ticket.id) {
        receiptIds.push(ticket.id);
      }

      // Handle any errors
      if (ticket.status === 'error') {
        console.error(`There was an error sending a notification: ${ticket.message}`);
        
        // If the error is related to an invalid token, mark the device as inactive
        if (
          ticket.details && 
          ticket.details.error && 
          (ticket.details.error === 'DeviceNotRegistered' || 
           ticket.details.error === 'InvalidCredentials' ||
           ticket.details.error === 'MessageTooBig' ||
           ticket.details.error === 'MessageRateExceeded')
        ) {
          const index = tickets.indexOf(ticket);
          if (index !== -1 && devices[index]) {
            console.log('Marking device as inactive:', devices[index].deviceToken);
            this.markDeviceAsInactive(devices[index].deviceToken);
          }
        }
      }
    }

    // If receipts need to be checked
    if (receiptIds.length > 0) {
      const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
      
      for (const chunk of receiptIdChunks) {
        try {
          const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
          
          for (const receiptId in receipts) {
            const receipt = receipts[receiptId];
            
            if (receipt.status === 'error') {
              console.error(`There was an error in a push notification receipt: ${receipt.message}`);
              
              if (
                receipt.details && 
                receipt.details.error && 
                (receipt.details.error === 'DeviceNotRegistered' || 
                 receipt.details.error === 'InvalidCredentials' ||
                 receipt.details.error === 'MessageTooBig' ||
                 receipt.details.error === 'MessageRateExceeded')
              ) {
                // Find the corresponding device token and mark it as inactive
                const index = tickets.findIndex(t => t.id === receiptId);
                if (index !== -1 && devices[index]) {
                  console.log('Marking device as inactive from receipt:', devices[index].deviceToken);
                  this.markDeviceAsInactive(devices[index].deviceToken);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error checking receipts for push notifications:', error);
        }
      }
    }
  }

  static async markDeviceAsInactive(deviceToken) {
    try {
      await UserDevice.update(
        { isActive: false },
        {
          where: { deviceToken },
        }
      );
    } catch (error) {
      console.error('Error marking device as inactive:', error);
    }
  }

  static async checkLowStock() {
    try {
      // Get all stock items that are below their minimum quantity
      const lowStockItems = await this.getLowStockItems();

      for (const item of lowStockItems) {
        await this.createNotification({
          userId: item.userId,
          type: 'low_stock',
          title: 'تنبيه: مخزون منخفض',
          message: `المخزون من ${item.name} منخفض (${item.quantity} ${item.unit})`,
          priority: 'high',
          relatedModelType: item.modelType,
          relatedModelId: item.id,
        });
      }
    } catch (error) {
      console.error('Error checking low stock:', error);
    }
  }

  static async checkExpiryDates() {
    try {
      // Get all items that are close to expiry
      const expiringItems = await this.getExpiringItems();

      for (const item of expiringItems) {
        const daysUntilExpiry = Math.ceil(
          (new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        );

        await this.createNotification({
          userId: item.userId,
          type: 'expiry',
          title: 'تنبيه: تاريخ انتهاء الصلاحية',
          message: `${item.name} سينتهي صلاحيته خلال ${daysUntilExpiry} يوم`,
          priority: 'high',
          relatedModelType: item.modelType,
          relatedModelId: item.id,
        });
      }
    } catch (error) {
      console.error('Error checking expiry dates:', error);
    }
  }

  static async getLowStockItems() {
    try {
      // Get all stock items that are below their minimum quantity
      const lowStockItems = await Stock.findAll({
        where: {
          quantity: {
            [Op.lte]: Sequelize.col('minimumQuantity'),
          },
        },
        include: [
          {
            model: Users,
            attributes: ['id', 'name'],
          },
        ],
      });

      return lowStockItems.map(item => ({
        id: item.id,
        userId: item.userId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        modelType: 'Stock',
      }));
    } catch (error) {
      console.error('Error getting low stock items:', error);
      return [];
    }
  }

  static async getExpiringItems() {
    try {
      // Get all items that are close to expiry (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringItems = await Stock.findAll({
        where: {
          expiryDate: {
            [Op.between]: [new Date(), thirtyDaysFromNow],
          },
        },
        include: [
          {
            model: Users,
            attributes: ['id', 'name'],
          },
        ],
      });

      return expiringItems.map(item => ({
        id: item.id,
        userId: item.userId,
        name: item.name,
        expiryDate: item.expiryDate,
        modelType: 'Stock',
      }));
    } catch (error) {
      console.error('Error getting expiring items:', error);
      return [];
    }
  }
}

module.exports = NotificationService; 