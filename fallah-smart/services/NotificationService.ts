import axios from 'axios';
import { storage } from '../utils/storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Make sure notifications appear even when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,     // IMPORTANT: This makes notifications appear when the app is foregrounded
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
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });

    // Stock alerts channel
    await Notifications.setNotificationChannelAsync('stock-alerts', {
      name: 'Stock Alerts',
      description: 'Notifications for low stock and expiring items',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9800',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });

    // Maintenance alerts channel
    await Notifications.setNotificationChannelAsync('maintenance-alerts', {
      name: 'Maintenance Alerts',
      description: 'Notifications for equipment maintenance',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });

    // Animal alerts channel
    await Notifications.setNotificationChannelAsync('animal-alerts', {
      name: 'Animal Alerts',
      description: 'Notifications for vaccinations and breeding',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });
  }

  private async registerForPushNotificationsAsync(): Promise<string> {
    let token = '';
    
    try {
      // First try to get an Expo push token
      try {
        // Only use projectId if available (will fail in Expo Go without valid projectId)
        const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
        
        if (projectId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
          const expoPushToken = await Notifications.getExpoPushTokenAsync({
            projectId
          });
          
          if (expoPushToken?.data) {
            token = expoPushToken.data;
            console.log('Successfully obtained Expo push token:', token);
            return token;
          }
        } else {
          console.log('No valid projectId found, skipping Expo token registration');
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
      
      // Force display notification even when app is in foreground
      if (Platform.OS === 'android') {
        // For Android, we need extra steps to show foreground notifications
        Notifications.presentNotificationAsync({
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
          sound: true,
          vibrate: true,
        });
      }
      
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
      // Save token locally first
      await storage.set('devicePushToken', deviceToken);
      console.log('Device token saved locally:', deviceToken);
      
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        console.warn('Authentication token not available, using local token only');
        return;
      }

      // Simple device data
      const deviceData = { deviceToken };

      try {
        await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/notifications/devices`,
          deviceData,
          {
            headers: {
              Authorization: `Bearer ${tokens.access}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000 // 5 second timeout
          }
        );
        console.log('Device successfully registered on server');
      } catch (error: any) {
        console.warn('Server registration failed, using local token only:', 
          error?.response?.status || error.message);
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
          title: 'Test Notification',
          body: 'This is a test notification from Fallah Smart',
          data: { type: 'test' },
          sound: 'default',
          priority: 'high',  // Add priority for Android
        },
        trigger: null, // Send immediately
      });
      
      console.log('Scheduled test notification with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      return null;
    }
  }

  // Schedule a model-specific alert notification
  public async scheduleModelAlert(params: {
    modelType: 'pesticide' | 'animal' | 'equipment' | 'feed' | 'fertilizer' | 'harvest' | 'seed' | 'tool';
    alertType: 'low_stock' | 'expiry' | 'maintenance' | 'vaccination' | 'breeding' | 'other';
    itemName: string;
    message: string;
    additionalData?: any;
  }) {
    try {
      const { modelType, alertType, itemName, message, additionalData } = params;
      
      // Define channel ID based on alert type
      let channelId = 'default';
      if (alertType === 'low_stock' || alertType === 'expiry') {
        channelId = 'stock-alerts';
      } else if (alertType === 'maintenance') {
        channelId = 'maintenance-alerts';
      } else if (alertType === 'vaccination' || alertType === 'breeding') {
        channelId = 'animal-alerts';
      }
      
      // Get title based on alert type
      let title = 'Fallah Smart Alert';
      switch (alertType) {
        case 'low_stock':
          title = `Low Stock Alert: ${itemName}`;
          break;
        case 'expiry':
          title = `Expiry Alert: ${itemName}`;
          break;
        case 'maintenance':
          title = `Maintenance Required: ${itemName}`;
          break;
        case 'vaccination':
          title = `Vaccination Due: ${itemName}`;
          break;
        case 'breeding':
          title = `Breeding Alert: ${itemName}`;
          break;
        default:
          title = `Alert: ${itemName}`;
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data: { 
            type: alertType, 
            modelType,
            itemName,
            ...additionalData
          },
          sound: true,
          badge: 1,
        },
        trigger: { seconds: 1 },
      });
      
      console.log(`Scheduled ${modelType} ${alertType} alert with ID:`, notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling model alert:', error);
      return null;
    }
  }

  // Convenience methods for different model types
  public async schedulePesticideAlert(itemName: string, message: string, alertType: 'low_stock' | 'expiry' | 'other' = 'low_stock', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'pesticide',
      alertType,
      itemName,
      message,
      additionalData
    });
  }

  public async scheduleAnimalAlert(itemName: string, message: string, alertType: 'vaccination' | 'breeding' | 'other', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'animal',
      alertType,
      itemName,
      message,
      additionalData
    });
  }

  public async scheduleEquipmentAlert(itemName: string, message: string, alertType: 'maintenance' | 'other' = 'maintenance', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'equipment',
      alertType,
      itemName,
      message,
      additionalData
    });
  }

  public async scheduleFeedAlert(itemName: string, message: string, alertType: 'low_stock' | 'expiry' | 'other' = 'low_stock', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'feed',
      alertType,
      itemName,
      message,
      additionalData
    });
  }

  public async scheduleFertilizerAlert(itemName: string, message: string, alertType: 'low_stock' | 'expiry' | 'other' = 'low_stock', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'fertilizer',
      alertType,
      itemName,
      message,
      additionalData
    });
  }

  public async scheduleHarvestAlert(itemName: string, message: string, alertType: 'expiry' | 'other' = 'expiry', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'harvest',
      alertType,
      itemName,
      message,
      additionalData
    });
  }

  public async scheduleSeedAlert(itemName: string, message: string, alertType: 'low_stock' | 'expiry' | 'other' = 'low_stock', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'seed',
      alertType,
      itemName,
      message,
      additionalData
    });
  }

  public async scheduleToolAlert(itemName: string, message: string, alertType: 'maintenance' | 'other' = 'maintenance', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'tool',
      alertType,
      itemName,
      message,
      additionalData
    });
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

  private async saveSettingsToLocalStorage(settings: any) {
    try {
      await storage.set('notificationSettings', JSON.stringify(settings));
      console.log('Notification settings saved to local storage');
    } catch (error) {
      console.error('Error saving notification settings to local storage:', error);
    }
  }

  private async getSettingsFromLocalStorage() {
    try {
      const settingsStr = await storage.get('notificationSettings');
      if (settingsStr) {
        return JSON.parse(settingsStr);
      }
      return null;
    } catch (error) {
      console.error('Error getting notification settings from local storage:', error);
      return null;
    }
  }

  public async getNotificationSettings() {
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        const localSettings = await this.getSettingsFromLocalStorage();
        return localSettings || this.getDefaultSettings();
      }

      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/notifications/settings`,
          {
            headers: {
              Authorization: `Bearer ${tokens.access}`,
            },
          }
        );

        // If response is successful and has data
        if (response.data) {
          // Save to local storage as backup
          await this.saveSettingsToLocalStorage(response.data);
          return response.data;
        }
        
        // Try to get from local storage
        const localSettings = await this.getSettingsFromLocalStorage();
        return localSettings || this.getDefaultSettings();
      } catch (error) {
        console.error('Error fetching notification settings:', error);
        // Try to get from local storage
        const localSettings = await this.getSettingsFromLocalStorage();
        return localSettings || this.getDefaultSettings();
      }
    } catch (error) {
      console.error('Error in getNotificationSettings:', error);
      return this.getDefaultSettings();
    }
  }

  private getDefaultSettings() {
    return {
      lowStockAlerts: true,
      expiryAlerts: true,
      maintenanceAlerts: true,
      vaccinationAlerts: true,
      breedingAlerts: true,
      automaticStockAlerts: true,
    };
  }

  public async updateNotificationSettings(settings: {
    lowStockAlerts?: boolean;
    expiryAlerts?: boolean;
    maintenanceAlerts?: boolean;
    vaccinationAlerts?: boolean;
    breedingAlerts?: boolean;
    automaticStockAlerts?: boolean;
  }) {
    try {
      // Always save to local storage first
      await this.saveSettingsToLocalStorage(settings);
      
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        console.warn('No access token available');
        return true; // Return success since we saved to local storage
      }

      try {
        await axios.put(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/notifications/settings`,
          settings,
          {
            headers: {
              Authorization: `Bearer ${tokens.access}`,
            },
          }
        );
        console.log('Notification settings updated successfully on server');
        return true;
      } catch (error: any) {
        // If endpoint doesn't exist (404), log it but don't fail
        if (error.response && error.response.status === 404) {
          console.warn('Notification settings endpoint not found, settings saved locally only');
          return true; // Return success so the app continues to function
        }
        console.error('Error updating notification settings on server:', error);
        return true; // Return success since we saved to local storage
      }
    } catch (error) {
      console.error('Error in updateNotificationSettings:', error);
      return false;
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

  public async scheduleDeviceTestNotification() {
    try {
      // This notification will be sent directly to the device
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Direct Device Test",
          body: "This is a direct device test notification - if you see this, your device notifications are working",
          data: { type: 'direct_test' },
          sound: true,
          priority: 'high', // For Android
          vibrate: [0, 250, 250, 250],
        },
        trigger: null, // Send immediately
      });
      
      console.log('Direct device test notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling direct device test notification:', error);
      return null;
    }
  }
}

export default NotificationService; 