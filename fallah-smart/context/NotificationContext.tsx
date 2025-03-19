import React, { createContext, useContext, useState, useEffect } from 'react';
import NotificationService from '../services/NotificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  notifications: any[];
  deviceToken: string | null;
  updateUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  scheduleTestNotification: () => Promise<string | null>;
  scheduleStockAlert: (item: string, quantity: number, unitName: string) => Promise<string | null>;
  updateSettings: (settings: NotificationSettings) => Promise<void>;
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  lowStockAlerts?: boolean;
  expiryAlerts?: boolean;
  maintenanceAlerts?: boolean;
  vaccinationAlerts?: boolean;
  breedingAlerts?: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    lowStockAlerts: true,
    expiryAlerts: true,
    maintenanceAlerts: true,
    vaccinationAlerts: true,
    breedingAlerts: true,
  });
  
  const { isAuthenticated } = useAuth();
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    if (isAuthenticated) {
      initializeNotifications();
    }
  }, [isAuthenticated]);

  const initializeNotifications = async () => {
    try {
      await notificationService.initialize();
      await updateUnreadCount();
      await refreshNotifications();
      await loadNotificationSettings();
      
      // Get the device token
      const token = notificationService.getPushToken();
      setDeviceToken(token);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const settings = await notificationService.getNotificationSettings();
      setNotificationSettings(settings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const refreshNotifications = async () => {
    try {
      const fetchedNotifications = await notificationService.getNotifications();
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const updateUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      await updateUnreadCount();
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const scheduleTestNotification = async () => {
    try {
      return await notificationService.scheduleTestNotification();
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      return null;
    }
  };

  const scheduleStockAlert = async (item: string, quantity: number, unitName: string) => {
    try {
      return await notificationService.scheduleStockAlert(item, quantity, unitName);
    } catch (error) {
      console.error('Error scheduling stock alert:', error);
      return null;
    }
  };

  const updateSettings = async (settings: NotificationSettings) => {
    try {
      await notificationService.updateNotificationSettings(settings);
      setNotificationSettings({ ...notificationSettings, ...settings });
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        deviceToken,
        updateUnreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        scheduleTestNotification,
        scheduleStockAlert,
        updateSettings,
        notificationSettings,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 