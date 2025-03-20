import axios from 'axios';
import { storage } from '../utils/storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Alert } from 'react-native';

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
      name: 'تنبيهات فلاح الافتراضية',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50', // Green color for brand
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });

    // Stock alerts channel
    await Notifications.setNotificationChannelAsync('stock-alerts', {
      name: 'تنبيهات المخزون',
      description: 'إشعارات للمخزون المنخفض والعناصر منتهية الصلاحية',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9800', // Orange color for alerts
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });

    // Maintenance alerts channel
    await Notifications.setNotificationChannelAsync('maintenance-alerts', {
      name: 'تنبيهات الصيانة',
      description: 'إشعارات لصيانة المعدات والأدوات',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3', // Blue color for maintenance
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });

    // Animal alerts channel
    await Notifications.setNotificationChannelAsync('animal-alerts', {
      name: 'تنبيهات الحيوانات',
      description: 'إشعارات للتطعيمات والتربية',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#9C27B0', // Purple color for animal care
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
    try {
      // Remove any existing listeners to avoid memory leaks
      if (this.notificationListener) {
        this.notificationListener.remove();
      }
      if (this.responseListener) {
        this.responseListener.remove();
      }

      // Add listener for notifications received while app is in foreground
      this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
        // Android doesn't show notifications in foreground by default, so we schedule it
        if (Platform.OS === 'android') {
          // Check if this is already a processed foreground notification to prevent infinite loop
          if (notification.request.content.data && notification.request.content.data.isProcessedForeground) {
            console.log('Skipping already processed foreground notification');
            return;
          }

          // Add a significantly LARGER random delay (1-3 seconds) to spread out notifications
          const delayMs = 1000 + Math.random() * 2000;
          setTimeout(() => {
            console.log('Showing foreground notification with delay:', Math.round(delayMs), 'ms');
            
            // Schedule the notification immediately 
            Notifications.scheduleNotificationAsync({
              content: {
                title: notification.request.content.title,
                body: notification.request.content.body,
                data: {
                  ...notification.request.content.data,
                  isProcessedForeground: true, // Mark as processed to prevent infinite loop
                },
                sound: true,
                vibrate: [0, 250, 250, 250],
              },
              trigger: null, // null trigger means show immediately
            }).then(id => {
              console.log('Foreground notification scheduled with ID:', id);
            }).catch(error => {
              console.error('Error scheduling foreground notification:', error);
            });
          }, delayMs);
        }
      });

      // Add listener for notification responses (when user taps notification)
      this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data as NotificationData;
        
        console.log('Notification tapped:', data);
        
        // Check if we have a route to navigate to
        if (data.screen) {
          // Wait a bit for navigation to be ready
          setTimeout(() => {
            console.log('Navigating to:', data.screen);
            
            if (this.navigation) {
              if (data.params) {
                this.navigation.navigate(data.screen, data.params);
              } else {
                this.navigation.navigate(data.screen);
              }
            } else {
              console.log('Navigation not available');
            }
          }, 300);
        }
      });
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
    }
  }
  
  private handleNotificationNavigation(data: any) {
    try {
      console.log('Handling notification navigation with data:', data);
      
      // If the notification contains a fullMessage with enlarged text
      if (data.fullMessage) {
        // Show an alert with the enlarged message for farmers
        Alert.alert(
          data.itemName || 'تنبيه',
          data.fullMessage,
          [{ text: 'حسنًا', style: 'default' }],
          { cancelable: true }
        );
      }
      
      // Handle type-specific navigation
      if (data.type === 'low_stock') {
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
  public async scheduleTestNotification(fullMessage?: string) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Add a random delay (1-3 seconds)
      const delaySeconds = 1 + Math.random() * 2;
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));

      const title = "👋 اختبار الإشعارات";
      const body = "هذا إشعار تجريبي. يمكنك الآن تلقي الإشعارات!";
      
      // Create full message for detailed view
      const detailedMessage = fullMessage || 
        `<div style="font-size: 110%; text-align: right; direction: rtl;">
          <h3 style="color: #4CAF50; margin-bottom: 10px;">👋 اختبار الإشعارات الناجح</h3>
          <p style="margin-bottom: 8px;">تم إعداد نظام الإشعارات بنجاح!</p>
          <p style="margin-bottom: 8px;">ستتلقى الآن إشعارات مهمة حول مزرعتك عندما تحتاج إلى اهتمامك.</p>
          <p style="color: #555;">يمكنك ضبط إعدادات الإشعارات من صفحة الإعدادات.</p>
        </div>`;
      
      console.log(`Scheduling test notification with ${delaySeconds.toFixed(1)}s delay...`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'test',
            fullMessage: detailedMessage,
            timestamp: new Date().toISOString(),
          },
          sound: true,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null // null trigger means send immediately
      });
      
      console.log('Test notification scheduled:', notificationId);
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
      // Determine which channel to use
      let channelId = 'default';
      let icon = '📋'; // Default icon
      let color = '#4CAF50'; // Default color (green)
      
      // Set channel, icon and color based on alert type
      switch (params.alertType) {
        case 'low_stock':
          channelId = 'stock-alerts';
          color = '#FF9800'; // Orange
          icon = '⚠️';
          break;
        case 'expiry':
          channelId = 'stock-alerts';
          color = '#F44336'; // Red
          icon = '⏱️';
          break;
        case 'maintenance':
          channelId = 'maintenance-alerts';
          color = '#2196F3'; // Blue
          icon = '🔧';
          break;
        case 'vaccination':
          channelId = 'animal-alerts';
          color = '#9C27B0'; // Purple
          icon = '💉';
          break;
        case 'breeding':
          channelId = 'animal-alerts';
          color = '#E91E63'; // Pink
          icon = '🐄';
          break;
        default:
          icon = '📱';
      }
      
      // Set model-specific icons
      switch (params.modelType) {
        case 'pesticide':
          icon = params.alertType === 'low_stock' ? '🧪' : '⚠️';
          break;
        case 'animal':
          icon = params.alertType === 'vaccination' ? '💉' : '🐑';
          break;
        case 'equipment':
          icon = '🚜';
          break;
        case 'feed':
          icon = '🌾';
          break;
        case 'fertilizer':
          icon = '♻️';
          break;
        case 'harvest':
          icon = '🌽';
          break;
        case 'seed':
          icon = '🌱';
          break;
        case 'tool':
          icon = '🔨';
          break;
      }
      
      // Convert model type to Arabic
      let modelTypeArabic = '';
      switch (params.modelType) {
        case 'pesticide':
          modelTypeArabic = 'مبيد';
          break;
        case 'animal':
          modelTypeArabic = 'حيوان';
          break;
        case 'equipment':
          modelTypeArabic = 'معدات';
          break;
        case 'feed':
          modelTypeArabic = 'علف';
          break;
        case 'fertilizer':
          modelTypeArabic = 'سماد';
          break;
        case 'harvest':
          modelTypeArabic = 'محصول';
          break;
        case 'seed':
          modelTypeArabic = 'بذور';
          break;
        case 'tool':
          modelTypeArabic = 'أداة';
          break;
      }
      
      // Convert alert type to Arabic
      let alertTypeArabic = '';
      switch (params.alertType) {
        case 'low_stock':
          alertTypeArabic = 'مخزون منخفض';
          break;
        case 'expiry':
          alertTypeArabic = 'قرب انتهاء الصلاحية';
          break;
        case 'maintenance':
          alertTypeArabic = 'صيانة';
          break;
        case 'vaccination':
          alertTypeArabic = 'تطعيم';
          break;
        case 'breeding':
          alertTypeArabic = 'تربية';
          break;
        case 'other':
          alertTypeArabic = 'تنبيه';
          break;
      }
      
      // Create title and body using plain text (no HTML tags)
      const title = `${icon} تنبيه ${modelTypeArabic}: ${params.itemName}`;
      const body = params.message;
      
      // Add a significant random delay between 2 and 7 seconds
      const delaySeconds = 2 + Math.random() * 5;
      console.log(`Scheduling ${params.modelType} ${params.alertType} alert with ${delaySeconds.toFixed(1)}s delay...`);
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      
      // Schedule the notification
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: params.alertType,
            modelType: params.modelType,
            itemName: params.itemName,
            fullMessage: `<div style="font-size: 120%; line-height: 1.5;">
              <h2 style="font-size: 130%; color: ${color}; text-align: right; margin-bottom: 10px;">
                ${icon} تنبيه ${modelTypeArabic}: ${params.itemName}
              </h2>
              <p style="font-size: 120%; text-align: right; margin-bottom: 15px;">
                ${params.message}
              </p>
              <p style="color: #666; text-align: right; font-size: 110%;">
                نوع التنبيه: ${alertTypeArabic}
              </p>
            </div>`,
            ...params.additionalData,
          },
          sound: true,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null // Send immediately (after our manual delay)
      });
      
      console.log(`Scheduled ${params.modelType} ${params.alertType} alert:`, id);
      return id;
    } catch (error) {
      console.error('Error scheduling model alert:', error);
      throw error;
    }
  }

  // Convenience methods for different model types
  public async schedulePesticideAlert(itemName: string, message: string, alertType: 'low_stock' | 'expiry' | 'other' = 'low_stock', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'pesticide',
      alertType,
      itemName,
      message: alertType === 'low_stock' ? `مخزون منخفض: ${message}` : alertType === 'expiry' ? `ينتهي قريباً: ${message}` : message,
      additionalData
    });
  }

  public async scheduleAnimalAlert(itemName: string, message: string, alertType: 'vaccination' | 'breeding' | 'other', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'animal',
      alertType,
      itemName,
      message: alertType === 'vaccination' ? `موعد تطعيم: ${message}` : alertType === 'breeding' ? `موعد تربية: ${message}` : message,
      additionalData
    });
  }

  public async scheduleEquipmentAlert(itemName: string, message: string, alertType: 'maintenance' | 'other' = 'maintenance', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'equipment',
      alertType,
      itemName,
      message: alertType === 'maintenance' ? `صيانة مطلوبة: ${message}` : message,
      additionalData
    });
  }

  public async scheduleFeedAlert(itemName: string, message: string, alertType: 'low_stock' | 'expiry' | 'other' = 'low_stock', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'feed',
      alertType,
      itemName,
      message: alertType === 'low_stock' ? `مخزون منخفض: ${message}` : alertType === 'expiry' ? `ينتهي قريباً: ${message}` : message,
      additionalData
    });
  }

  public async scheduleFertilizerAlert(itemName: string, message: string, alertType: 'low_stock' | 'expiry' | 'other' = 'low_stock', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'fertilizer',
      alertType,
      itemName,
      message: alertType === 'low_stock' ? `مخزون منخفض: ${message}` : alertType === 'expiry' ? `ينتهي قريباً: ${message}` : message,
      additionalData
    });
  }

  public async scheduleHarvestAlert(itemName: string, message: string, alertType: 'expiry' | 'other' = 'expiry', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'harvest',
      alertType,
      itemName,
      message: alertType === 'expiry' ? `قرب انتهاء الصلاحية: ${message}` : message,
      additionalData
    });
  }

  public async scheduleSeedAlert(itemName: string, message: string, alertType: 'low_stock' | 'expiry' | 'other' = 'low_stock', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'seed',
      alertType,
      itemName,
      message: alertType === 'low_stock' ? `مخزون منخفض: ${message}` : alertType === 'expiry' ? `ينتهي قريباً: ${message}` : message,
      additionalData
    });
  }

  public async scheduleToolAlert(itemName: string, message: string, alertType: 'maintenance' | 'other' = 'maintenance', additionalData?: any) {
    return this.scheduleModelAlert({
      modelType: 'tool',
      alertType,
      itemName,
      message: alertType === 'maintenance' ? `صيانة مطلوبة: ${message}` : message,
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
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Add a random delay (1-3 seconds)
      const delaySeconds = 1 + Math.random() * 2;
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));

      const title = "📱 اختبار الجهاز";
      const body = "تم تكوين الإشعارات بنجاح على هذا الجهاز!";
      
      // Create full message for detailed view
      const detailedMessage = 
        `<div style="font-size: 110%; text-align: right; direction: rtl;">
          <h3 style="color: #2196F3; margin-bottom: 10px;">📱 تم تكوين الجهاز بنجاح</h3>
          <p style="margin-bottom: 8px;">تم إعداد الإشعارات بنجاح على هذا الجهاز.</p>
          <p style="margin-bottom: 8px;">سيتم إرسال التنبيهات المهمة إلى هذا الجهاز عندما تكون هناك حاجة إلى اهتمامك.</p>
          <p style="color: #555;">يمكنك تعديل إعدادات الإشعارات من صفحة الإعدادات.</p>
        </div>`;
      
      console.log(`Scheduling device test notification with ${delaySeconds.toFixed(1)}s delay...`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'device-test',
            fullMessage: detailedMessage,
            timestamp: new Date().toISOString(),
          },
          sound: true,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null // null trigger means send immediately
      });
      
      console.log('Device test notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling device test notification:', error);
      return null;
    }
  }

  public async scheduleStockNotification(
    stockItem: StockItem, 
    messageType: 'low' | 'maintenance' | 'expiration' | 'feed' | 'fertilizer' | 'test',
    options?: {
      screen?: string;
      params?: any;
    }
  ) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Add a random delay (1-4 seconds)
      const delaySeconds = 1 + Math.random() * 3;
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));

      // Get the notification content based on the message type
      const { title, body, fullMessage, color, iconType } = this.getStockNotificationContent(stockItem, messageType);
      
      console.log(`Scheduling ${messageType} stock notification for ${stockItem.name} with ${delaySeconds.toFixed(1)}s delay...`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: messageType,
            itemId: stockItem.id,
            itemType: stockItem.type,
            fullMessage,
            screen: options?.screen || 'StockDetails',
            params: options?.params || {
              itemId: stockItem.id,
              itemType: stockItem.type,
            },
            timestamp: new Date().toISOString(),
          },
          sound: true,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null // null trigger means send immediately
      });
      
      console.log(`${messageType} stock notification scheduled for ${stockItem.name}:`, notificationId);
      return notificationId;
    } catch (error) {
      console.error(`Error scheduling ${messageType} stock notification:`, error);
      return null;
    }
  }

  private getStockNotificationContent(
    stockItem: StockItem,
    messageType: 'low' | 'maintenance' | 'expiration' | 'feed' | 'fertilizer' | 'test'
  ) {
    const arabicName = stockItem.nameAr || stockItem.name;
    let title = '';
    let body = '';
    let color = '#4CAF50'; // Default green
    let iconType = 'md-information-circle';
    
    // Create HTML for the full message view
    let fullMessage = '';
    
    switch (messageType) {
      case 'low':
        title = `⚠️ مخزون منخفض: ${arabicName}`;
        body = `لديك مخزون منخفض من ${arabicName}. يرجى التحقق والتزود بالمزيد.`;
        color = '#FFC107'; // Warning yellow
        iconType = 'warning';
        
        fullMessage = `<div style="font-size: 110%; text-align: right; direction: rtl;">
          <h3 style="color: #FFC107; margin-bottom: 10px;">⚠️ تنبيه: مخزون منخفض</h3>
          <p style="margin-bottom: 8px;">
            <b>${arabicName}</b> وصل إلى مستوى منخفض في المخزون.
          </p>
          <p style="margin-bottom: 8px;">
            الكمية المتبقية: ${stockItem.quantity} ${stockItem.unit || ''}
          </p>
          <p style="color: #555;">
            يرجى التحقق من المخزون وإعادة التزود في أقرب وقت ممكن.
          </p>
        </div>`;
        break;
        
      case 'maintenance':
        title = `🔧 صيانة مطلوبة: ${arabicName}`;
        body = `حان وقت صيانة ${arabicName}. يرجى التحقق من الحالة.`;
        color = '#FF9800'; // Orange for maintenance
        iconType = 'tools';
        
        fullMessage = `<div style="font-size: 110%; text-align: right; direction: rtl;">
          <h3 style="color: #FF9800; margin-bottom: 10px;">🔧 تنبيه: صيانة مطلوبة</h3>
          <p style="margin-bottom: 8px;">
            <b>${arabicName}</b> بحاجة إلى صيانة.
          </p>
          <p style="margin-bottom: 8px;">
            تاريخ الصيانة الأخيرة: ${new Date(stockItem.lastMaintenance || new Date()).toLocaleDateString('ar-SA')}
          </p>
          <p style="color: #555;">
            يرجى إجراء الصيانة المطلوبة لضمان أداء أفضل وعمر أطول.
          </p>
        </div>`;
        break;
        
      case 'expiration':
        title = `⏱️ تنبيه انتهاء الصلاحية: ${arabicName}`;
        body = `${arabicName} على وشك انتهاء الصلاحية. يرجى التحقق من المخزون.`;
        color = '#F44336'; // Red for expiration
        iconType = 'alarm';
        
        fullMessage = `<div style="font-size: 110%; text-align: right; direction: rtl;">
          <h3 style="color: #F44336; margin-bottom: 10px;">⏱️ تنبيه: انتهاء الصلاحية</h3>
          <p style="margin-bottom: 8px;">
            <b>${arabicName}</b> على وشك انتهاء الصلاحية.
          </p>
          <p style="margin-bottom: 8px;">
            تاريخ انتهاء الصلاحية: ${new Date(stockItem.expiryDate || new Date()).toLocaleDateString('ar-SA')}
          </p>
          <p style="color: #555;">
            يرجى التحقق من المخزون واستخدامه قبل انتهاء الصلاحية أو التخلص منه بشكل مناسب.
          </p>
        </div>`;
        break;
        
      case 'feed':
        title = `🌾 تذكير بالتغذية: ${arabicName}`;
        body = `حان وقت تغذية الحيوانات باستخدام ${arabicName}.`;
        color = '#2196F3'; // Blue for feed
        iconType = 'nutrition';
        
        fullMessage = `<div style="font-size: 110%; text-align: right; direction: rtl;">
          <h3 style="color: #2196F3; margin-bottom: 10px;">🌾 تذكير بالتغذية</h3>
          <p style="margin-bottom: 8px;">
            حان وقت تغذية الحيوانات باستخدام <b>${arabicName}</b>.
          </p>
          <p style="margin-bottom: 8px;">
            الكمية المتاحة: ${stockItem.quantity} ${stockItem.unit || ''}
          </p>
          <p style="color: #555;">
            تأكد من توفير كمية كافية من العلف للحيوانات.
          </p>
        </div>`;
        break;
        
      case 'fertilizer':
        title = `🌱 تذكير بالتسميد: ${arabicName}`;
        body = `حان وقت تسميد المحاصيل باستخدام ${arabicName}.`;
        color = '#4CAF50'; // Green for fertilizer
        iconType = 'leaf';
        
        fullMessage = `<div style="font-size: 110%; text-align: right; direction: rtl;">
          <h3 style="color: #4CAF50; margin-bottom: 10px;">🌱 تذكير بالتسميد</h3>
          <p style="margin-bottom: 8px;">
            حان وقت تسميد المحاصيل باستخدام <b>${arabicName}</b>.
          </p>
          <p style="margin-bottom: 8px;">
            الكمية المتاحة: ${stockItem.quantity} ${stockItem.unit || ''}
          </p>
          <p style="color: #555;">
            تأكد من توفير كمية كافية من السماد للمحاصيل.
          </p>
        </div>`;
        break;
        
      case 'test':
        title = `🔔 اختبار الإشعارات`;
        body = `هذا اختبار لإشعارات المخزون: ${arabicName}.`;
        color = '#9C27B0'; // Purple for test
        iconType = 'notifications';
        
        fullMessage = `<div style="font-size: 110%; text-align: right; direction: rtl;">
          <h3 style="color: #9C27B0; margin-bottom: 10px;">🔔 اختبار إشعارات المخزون</h3>
          <p style="margin-bottom: 8px;">
            هذا اختبار لنظام إشعارات المخزون.
          </p>
          <p style="margin-bottom: 8px;">
            عنصر: <b>${arabicName}</b>
          </p>
          <p style="margin-bottom: 8px;">
            الكمية: ${stockItem.quantity} ${stockItem.unit || ''}
          </p>
          <p style="color: #555;">
            تم إرسال هذا الإشعار للتأكد من أن نظام إشعارات المخزون يعمل بشكل صحيح.
          </p>
        </div>`;
        break;
    }
    
    return { title, body, fullMessage, color, iconType };
  }
}

export default NotificationService; 