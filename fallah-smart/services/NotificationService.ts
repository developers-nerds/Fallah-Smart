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
  private notificationListener: any = null;
  private responseListener: any = null;

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
      // Step 1: Set up notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidNotificationChannels();
      }
      
      // Step 2: Request permission for notifications
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

      // Step 3: Check if this is a physical device (notifications won't work properly on simulators)
      if (!Device.isDevice) {
        console.log('Must use physical device for push notifications');
      }

      // Step 4: Get the token that uniquely identifies this device
      const token = await this.registerForPushNotificationsAsync();
      this.expoPushToken = token;
      
      // Step 5: Register this token with our backend
      await this.registerDeviceToken(this.expoPushToken);
      
      // Step 6: Set up notification listeners
      this.setupNotificationListeners();
      
      this.isInitialized = true;
      console.log('Notification service initialized with token:', this.expoPushToken);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private async setupAndroidNotificationChannels() {
    // Main notification channel
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    // Stock alerts channel
    await Notifications.setNotificationChannelAsync('stock-alerts', {
      name: 'Stock Alerts',
      description: 'Notifications for low stock and expiring items',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9800',
    });

    // Maintenance alerts channel
    await Notifications.setNotificationChannelAsync('maintenance-alerts', {
      name: 'Maintenance Alerts',
      description: 'Notifications for equipment maintenance',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
    });

    // Animal alerts channel
    await Notifications.setNotificationChannelAsync('animal-alerts', {
      name: 'Animal Alerts',
      description: 'Notifications for vaccinations and breeding',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });
  }

  private async registerForPushNotificationsAsync(): Promise<string> {
    let token = '';
    
    try {
      // First try to get an Expo push token
      try {
        const expoPushToken = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID 
        });
        
        if (expoPushToken?.data) {
          token = expoPushToken.data;
          console.log('Successfully obtained Expo push token:', token);
          return token;
        }
      } catch (expoPushError) {
        console.warn('Error getting Expo push token:', expoPushError);
      }
      
      // If Expo token fails, try to get a device push token (FCM on Android, APNS on iOS)
      try {
        const devicePushToken = await Notifications.getDevicePushTokenAsync();
        if (devicePushToken?.data) {
          token = typeof devicePushToken.data === 'string' 
            ? devicePushToken.data 
            : JSON.stringify(devicePushToken.data);
          console.log('Successfully obtained device push token (FCM/APNS):', token);
          return token;
        }
      } catch (deviceTokenError) {
        console.warn('Error getting device push token:', deviceTokenError);
      }
      
      // If all methods fail, use a simulated token for development
      token = `dev-token-${Device.modelName}-${Platform.OS}-${Date.now()}`;
      console.log('Using development fallback token:', token);
      return token;
    } catch (error) {
      console.error('Error in registerForPushNotificationsAsync:', error);
      // Return a fallback development token
      return `fallback-${Date.now()}`;
    }
  }

  private setupNotificationListeners() {
    // Remove any existing listeners to prevent memory leaks
    this.removeNotificationListeners();
    
    // Handle notification received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      // You can dispatch events or update UI state here
    });

    // Handle notification response (when user taps notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      const data = response.notification.request.content.data;
      
      // Handle navigation based on notification type
      this.handleNotificationNavigation(data);
    });
  }
  
  private handleNotificationNavigation(data: any) {
    // This would ideally use a navigation service or context to navigate
    // Example implementation:
    try {
      // Check notification type and navigate accordingly
      if (data.type === 'low_stock') {
        // If you have navigation reference: navigation.navigate('StockDetails', { id: data.stockId });
        console.log('Should navigate to stock details:', data.stockId);
      } else if (data.type === 'maintenance') {
        console.log('Should navigate to equipment details:', data.equipmentId);
      } else if (data.type === 'vaccination') {
        console.log('Should navigate to animal details:', data.animalId);
      }
    } catch (error) {
      console.error('Error handling notification navigation:', error);
    }
  }
  
  private removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  private async registerDeviceToken(deviceToken: string) {
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        console.warn('Authentication token not available, cannot register device');
        return;
      }

      // Determine device type with more details for better analytics
      const deviceInfo = {
        deviceToken,
        deviceType: Platform.OS,
        deviceName: Device.deviceName || 'Unknown Device',
        deviceModel: Device.modelName || 'Unknown Model',
        osVersion: Platform.OS === 'ios' ? Device.osVersion : Device.osVersion || 'Unknown Version'
      };

      try {
        await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/notifications/devices`,
          deviceInfo,
          {
            headers: {
              Authorization: `Bearer ${tokens.access}`,
              'Content-Type': 'application/json'
            },
          }
        );
        console.log('Device successfully registered for push notifications');
      } catch (error: any) {
        console.error('Error registering device token:', error?.response?.data || error.message);
        if (error.response?.status === 404) {
          console.warn('Notification endpoint not found, check server configuration');
        } else if (error.response?.status === 401) {
          console.warn('Authentication failed when registering device token');
        }
      }
    } catch (error) {
      console.error('Error in registerDeviceToken:', error);
    }
  }

  // Schedule a local notification for quick testing
  public async scheduleTestNotification() {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a test notification from Fallah Smart",
          data: { type: 'test' },
          sound: true,
        },
        trigger: { seconds: 2 }, // Fires after 2 seconds
      });
      
      console.log('Scheduled test notification with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      return null;
    }
  }

  // Schedule a stock alert notification
  public async scheduleStockAlert(item: string, quantity: number, unitName: string) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Low Stock Alert",
          body: `${item}: Only ${quantity} ${unitName} left in stock!`,
          data: { type: 'low_stock', itemName: item },
          sound: true,
          badge: 1,
        },
        trigger: { seconds: 1 },
      });
      
      console.log('Scheduled stock alert with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling stock alert:', error);
      return null;
    }
  }

  // Clean up resources when application is being unmounted
  public cleanup() {
    this.removeNotificationListeners();
    this.isInitialized = false;
    console.log('Notification service cleaned up');
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

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/notifications/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        }
      );
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Get the current push token
  public getPushToken(): string | null {
    return this.expoPushToken;
  }
}

export default NotificationService; 