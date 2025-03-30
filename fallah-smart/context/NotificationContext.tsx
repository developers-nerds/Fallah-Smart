import React, { createContext, useContext, useState, useEffect } from 'react';
import notificationService, { NotificationService } from '../services/NotificationService';
import StockNotificationService from '../services/StockNotificationService';
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
  schedulePesticideAlert: (itemName: string, message: string, alertType?: 'low_stock' | 'expiry' | 'other', additionalData?: any) => Promise<string | null>;
  scheduleAnimalAlert: (itemName: string, message: string, alertType: 'vaccination' | 'breeding' | 'other', additionalData?: any) => Promise<string | null>;
  scheduleEquipmentAlert: (itemName: string, message: string, alertType?: 'maintenance' | 'other', additionalData?: any) => Promise<string | null>;
  scheduleFeedAlert: (itemName: string, message: string, alertType?: 'low_stock' | 'expiry' | 'other', additionalData?: any) => Promise<string | null>;
  scheduleFertilizerAlert: (itemName: string, message: string, alertType?: 'low_stock' | 'expiry' | 'other', additionalData?: any) => Promise<string | null>;
  scheduleHarvestAlert: (itemName: string, message: string, alertType?: 'expiry' | 'other', additionalData?: any) => Promise<string | null>;
  scheduleSeedAlert: (itemName: string, message: string, alertType?: 'low_stock' | 'expiry' | 'other', additionalData?: any) => Promise<string | null>;
  scheduleToolAlert: (itemName: string, message: string, alertType?: 'maintenance' | 'other', additionalData?: any) => Promise<string | null>;
  updateSettings: (settings: NotificationSettings) => Promise<void>;
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  lowStockAlerts?: boolean;
  expiryAlerts?: boolean;
  maintenanceAlerts?: boolean;
  vaccinationAlerts?: boolean;
  breedingAlerts?: boolean;
  automaticStockAlerts?: boolean;
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
    automaticStockAlerts: true,
  });
  
  const { isAuthenticated } = useAuth();
  const stockNotificationService = StockNotificationService.getInstance();

  useEffect(() => {
    if (isAuthenticated) {
      initializeNotifications();
    }
    return () => {
      cleanup();
    };
  }, [isAuthenticated]);

  const initializeNotifications = async () => {
    try {
      await notificationService.initialize();
      await stockNotificationService.initialize();
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

  const cleanup = () => {
    notificationService.cleanup();
    stockNotificationService.cleanup();
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

  const schedulePesticideAlert = async (itemName: string, message: string, alertType: 'low_stock' | 'expiry' | 'other' = 'low_stock', additionalData?: any) => {
    try {
      return await notificationService.schedulePesticideAlert(itemName, message, alertType, additionalData);
    } catch (error) {
      console.error('Error scheduling pesticide alert:', error);
      return null;
    }
  };

  const scheduleAnimalAlert = async (itemName: string, message: string, alertType: 'vaccination' | 'breeding' | 'other', additionalData?: any) => {
    try {
      return await notificationService.scheduleAnimalAlert(itemName, message, alertType, additionalData);
    } catch (error) {
      console.error('Error scheduling animal alert:', error);
      return null;
    }
  };

  const scheduleEquipmentAlert = async (itemName: string, message: string, alertType: 'maintenance' | 'other' = 'maintenance', additionalData?: any) => {
    try {
      return await notificationService.scheduleEquipmentAlert(itemName, message, alertType, additionalData);
    } catch (error) {
      console.error('Error scheduling equipment alert:', error);
      return null;
    }
  };

  const scheduleFeedAlert = async (itemName: string, message: string, alertType: 'low_stock' | 'expiry' | 'other' = 'low_stock', additionalData?: any) => {
    try {
      return await notificationService.scheduleFeedAlert(itemName, message, alertType, additionalData);
    } catch (error) {
      console.error('Error scheduling feed alert:', error);
      return null;
    }
  };

  const scheduleFertilizerAlert = async (itemName: string, message: string, alertType: 'low_stock' | 'expiry' | 'other' = 'low_stock', additionalData?: any) => {
    try {
      return await notificationService.scheduleFertilizerAlert(itemName, message, alertType, additionalData);
    } catch (error) {
      console.error('Error scheduling fertilizer alert:', error);
      return null;
    }
  };

  const scheduleHarvestAlert = async (itemName: string, message: string, alertType: 'expiry' | 'other' = 'expiry', additionalData?: any) => {
    try {
      return await notificationService.scheduleHarvestAlert(itemName, message, alertType, additionalData);
    } catch (error) {
      console.error('Error scheduling harvest alert:', error);
      return null;
    }
  };

  const scheduleSeedAlert = async (itemName: string, message: string, alertType: 'low_stock' | 'expiry' | 'other' = 'low_stock', additionalData?: any) => {
    try {
      return await notificationService.scheduleSeedAlert(itemName, message, alertType, additionalData);
    } catch (error) {
      console.error('Error scheduling seed alert:', error);
      return null;
    }
  };

  const scheduleToolAlert = async (itemName: string, message: string, alertType: 'maintenance' | 'other' = 'maintenance', additionalData?: any) => {
    try {
      return await notificationService.scheduleToolAlert(itemName, message, alertType, additionalData);
    } catch (error) {
      console.error('Error scheduling tool alert:', error);
      return null;
    }
  };

  const updateSettings = async (settings: NotificationSettings) => {
    try {
      await notificationService.updateNotificationSettings(settings);
      await stockNotificationService.updateSettings(settings);
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
        schedulePesticideAlert,
        updateSettings,
        notificationSettings,
        scheduleAnimalAlert,
        scheduleEquipmentAlert,
        scheduleFeedAlert,
        scheduleFertilizerAlert,
        scheduleHarvestAlert,
        scheduleSeedAlert,
        scheduleToolAlert,
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