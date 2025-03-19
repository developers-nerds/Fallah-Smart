const { StockNotification, UserDevice, Users, Sequelize } = require('../database/models');
const { Op } = Sequelize;

// Get all notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, status } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { userId };
    
    if (type) {
      whereClause.type = type;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    const notifications = await StockNotification.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });
    
    res.json({
      notifications: notifications.rows,
      totalCount: notifications.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(notifications.count / limit)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Get unread notifications count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await StockNotification.count({
      where: {
        userId,
        status: 'pending'
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({ message: 'Error counting unread notifications' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    const notification = await StockNotification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notification.status = 'read';
    notification.readAt = new Date();
    await notification.save();
    
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await StockNotification.update(
      {
        status: 'read',
        readAt: new Date()
      },
      {
        where: {
          userId,
          status: 'pending'
        }
      }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
};

// Get notification by ID
exports.getNotificationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    const notification = await StockNotification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ message: 'Error fetching notification' });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    const notification = await StockNotification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    await notification.destroy();
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
};

// Register device for push notifications
exports.registerDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token, deviceType } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Device token is required' });
    }
    
    // Check if device already registered
    const existingDevice = await UserDevice.findOne({
      where: {
        deviceToken: token
      }
    });
    
    if (existingDevice) {
      // Update the existing device with the current user
      existingDevice.userId = userId;
      await existingDevice.save();
      
      return res.json({ message: 'Device token updated', device: existingDevice });
    }
    
    // Create a new device entry
    const device = await UserDevice.create({
      userId,
      deviceToken: token,
      deviceType: deviceType || 'mobile',
      isActive: true
    });
    
    res.status(201).json({ message: 'Device registered successfully', device });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ message: 'Error registering device' });
  }
};

// Unregister device from push notifications
exports.unregisterDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Device token is required' });
    }
    
    const device = await UserDevice.findOne({
      where: {
        userId,
        deviceToken: token
      }
    });
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    await device.destroy();
    
    res.json({ message: 'Device unregistered successfully' });
  } catch (error) {
    console.error('Error unregistering device:', error);
    res.status(500).json({ message: 'Error unregistering device' });
  }
};

// Update notification settings
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lowStockAlerts, expiryAlerts, maintenanceAlerts, vaccinationAlerts, breedingAlerts } = req.body;
    
    const user = await Users.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Assuming users table has notification settings columns
    // If not, you might need to create a separate table for notification settings
    await user.update({
      notificationSettings: {
        lowStockAlerts: lowStockAlerts !== undefined ? lowStockAlerts : user.notificationSettings?.lowStockAlerts,
        expiryAlerts: expiryAlerts !== undefined ? expiryAlerts : user.notificationSettings?.expiryAlerts,
        maintenanceAlerts: maintenanceAlerts !== undefined ? maintenanceAlerts : user.notificationSettings?.maintenanceAlerts,
        vaccinationAlerts: vaccinationAlerts !== undefined ? vaccinationAlerts : user.notificationSettings?.vaccinationAlerts,
        breedingAlerts: breedingAlerts !== undefined ? breedingAlerts : user.notificationSettings?.breedingAlerts
      }
    });
    
    res.json({ 
      message: 'Notification settings updated successfully',
      settings: user.notificationSettings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Error updating notification settings' });
  }
}; 