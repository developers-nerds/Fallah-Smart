const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { StockNotification, UserDevice, Users } = require('../database/models');
const NotificationService = require('../services/notificationService');

// Get all notifications for the current user
router.get('/', auth, async (req, res) => {
  try {
    // Define specific attributes to select to avoid SQL errors with non-existent columns
    const notifications = await StockNotification.findAll({
      where: {
        userId: req.user.id,
      },
      attributes: [
        'id', 'type', 'title', 'message', 'priority', 
        'status', 'scheduledFor', 'sentAt', 'readAt', 
        'actionedAt', 'relatedModelType', 'relatedModelId',
        'phoneNumber', 'userId', 'createdAt', 'updatedAt'
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Mark a notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await StockNotification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.status = 'read';
    notification.readAt = new Date();
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await StockNotification.update(
      {
        status: 'read',
        readAt: new Date(),
      },
      {
        where: {
          userId: req.user.id,
          status: 'sent',
        },
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register a new device for push notifications
router.post('/devices', auth, async (req, res) => {
  try {
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    // Check if device is already registered
    let device = await UserDevice.findOne({
      where: {
        userId: req.user.id,
        deviceToken,
      },
    });

    if (device) {
      // Update existing device
      device.isActive = true;
      await device.save();
    } else {
      // Create new device
      device = await UserDevice.create({
        userId: req.user.id,
        deviceToken,
        isActive: true,
      });
    }

    res.json(device);
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unregister a device for push notifications
router.delete('/devices/:deviceToken', auth, async (req, res) => {
  try {
    const { deviceToken } = req.params;

    await UserDevice.update(
      { isActive: false },
      {
        where: {
          userId: req.user.id,
          deviceToken,
        },
      }
    );

    res.json({ message: 'Device unregistered successfully' });
  } catch (error) {
    console.error('Error unregistering device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's notification settings
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await Users.findByPk(req.user.id);
    res.json(user.notificationSettings || {});
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user's notification settings
router.put('/settings', auth, async (req, res) => {
  try {
    const settings = req.body;
    const user = await Users.findByPk(req.user.id);

    user.notificationSettings = {
      ...user.notificationSettings,
      ...settings,
    };

    await user.save();
    res.json(user.notificationSettings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await StockNotification.count({
      where: {
        userId: req.user.id,
        status: 'sent',
        readAt: null,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test notification (for debugging)
router.post('/test', auth, async (req, res) => {
  try {
    // Verify user exists before proceeding
    const user = await Users.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find user's device tokens
    const userDevices = await UserDevice.findAll({
      where: { userId: req.user.id, isActive: true }
    });

    if (userDevices.length === 0) {
      return res.status(400).json({ 
        error: 'No devices registered for this user',
        message: 'No device tokens found to send test notification to. Please register your device first.'
      });
    }

    // Show what device tokens we'll be sending to
    console.log('Found', userDevices.length, 'devices for user', user.id);
    const tokenInfo = userDevices.map(device => ({
      id: device.id,
      token: device.deviceToken,
      type: device.deviceToken.includes(':') ? 'FCM' : 
            device.deviceToken.startsWith('ExpoToken') ? 'Expo' : 'Unknown'
    }));
    console.log('Device tokens:', JSON.stringify(tokenInfo, null, 2));

    // Create basic notification data
    const notificationData = {
      userId: req.user.id,
      type: 'low_stock',
      title: 'اختبار الإشعارات',
      message: 'هذا إشعار تجريبي للتأكد من عمل الإشعارات',
      priority: 'high',
    };

    // Try to create the notification but handle errors gracefully
    try {
      // Create notification in the database
      const notification = await StockNotification.create({
        ...notificationData,
        status: 'sent',
        sentAt: new Date(),
      });

      // If we got here, send push notification using the service
      try {
        await NotificationService.sendPushNotification(notification);
        
        return res.json({ 
          success: true,
          message: 'Test notification sent',
          notificationId: notification.id,
          devices: tokenInfo
        });
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
        return res.json({ 
          success: true,
          message: 'Test notification created but push notification failed',
          notificationId: notification.id,
          error: pushError.message,
          devices: tokenInfo
        });
      }
    } catch (dbError) {
      console.error('Error creating notification in database:', dbError);
      // Return a success response for testing purposes
      return res.json({ 
        success: false,
        message: 'Test notification simulation completed',
        note: 'Actual notification creation failed, but test completed',
        error: dbError.message,
        devices: tokenInfo
      });
    }
  } catch (error) {
    console.error('Error in test notification endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 