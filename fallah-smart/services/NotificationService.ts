import axios from 'axios';
import { storage } from '../utils/storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private isInitialized: boolean = false;
  private expoPushToken: string | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Step 1: Request permission for notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      // Step 2: Check if this is a physical device (notifications won't work properly on simulators)
      if (!Device.isDevice) {
        console.log('Must use physical device for push notifications');
      }

      // Step 3: Get the token that uniquely identifies this device
      // Try multiple methods to get a push token
      let token = null;
      
      try {
        // First try to get an Expo push token
        const expoPushToken = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PROJECT_ID // Optional, use if you have a valid Expo project ID
        }).catch(() => null);
        
        if (expoPushToken) {
          token = expoPushToken.data;
          console.log('Using Expo push token:', token);
        } else {
          // If that fails, try to get a device push token (FCM on Android, APNS on iOS)
          const devicePushToken = await Notifications.getDevicePushTokenAsync().catch(() => null);
          if (devicePushToken) {
            token = devicePushToken.data;
            console.log('Using device push token (FCM/APNS):', token);
          }
        }
      } catch (tokenError) {
        console.warn('Error getting push token, using simulated token:', tokenError);
      }
      
      // If all methods fail, use a simulated token for development
      if (!token) {
        token = `ExpoSimulatedToken-${Device.modelName}-${Date.now()}`;
        console.log('Using simulated token:', token);
      }
      
      this.expoPushToken = token;
      
      // Step 4: Register this token with our backend
      await this.registerDeviceToken(this.expoPushToken);
      
      // Step 5: Set up notification listeners
      this.setupNotificationListeners();
      
      this.isInitialized = true;
      console.log('Notification service initialized with token:', this.expoPushToken);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private setupNotificationListeners() {
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification response (when user taps notification)
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // You can navigate to a specific screen here based on the notification
      const data = response.notification.request.content.data;
      // Example: If you have a navigation reference, you could navigate like this:
      // navigation.navigate('NotificationDetails', { id: data.id });
    });
  }

  private async registerDeviceToken(deviceToken: string) {
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.access) return;

      try {
        await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/notifications/devices`,
          { deviceToken, deviceType: Platform.OS },
          {
            headers: {
              Authorization: `Bearer ${tokens.access}`,
            },
          }
        );
        console.log('Device registered for push notifications');
      } catch (error) {
        console.error('Error registering device token:', error);
        if (error.response && error.response.status === 404) {
          console.warn('Notification endpoint not found, check server configuration');
        }
      }
    } catch (error) {
      console.error('Error in registerDeviceToken:', error);
    }
  }

  public async getNotifications() {
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.access) return [];

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/notifications`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  public async markAsRead(notificationId: number) {
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.access) return;

      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  public async markAllAsRead() {
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.access) return;

      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/notifications/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  public async getNotificationSettings() {
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.access) return {};

      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/notifications/settings`,
          {
            headers: {
              Authorization: `Bearer ${tokens.access}`,
            },
          }
        );
        return response.data;
      } catch (error) {
        console.error('Error fetching notification settings:', error);
        // Return default settings if endpoint not available
        return {
          lowStockAlerts: true,
          expiryAlerts: true,
          maintenanceAlerts: true,
          vaccinationAlerts: true,
          breedingAlerts: true
        };
      }
    } catch (error) {
      console.error('Error in getNotificationSettings:', error);
      return {};
    }
  }

  public async updateNotificationSettings(settings: {
    lowStockAlerts?: boolean;
    expiryAlerts?: boolean;
    maintenanceAlerts?: boolean;
    vaccinationAlerts?: boolean;
    breedingAlerts?: boolean;
  }) {
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.access) return;

      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/notifications/settings`,
        settings,
        {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        }
      );
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }

  public async getUnreadCount(): Promise<number> {
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.access) return 0;

      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/notifications/unread-count`,
          {
            headers: {
              Authorization: `Bearer ${tokens.access}`,
            },
          }
        );
        return response.data.count;
      } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  }
}

export default NotificationService; 