import React, { createContext, useContext, useState, useEffect } from 'react';
import StockNotificationService from '../services/StockNotificationService';
import notificationService, { NotificationService } from '../services/NotificationService';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  forceSendAllNotifications: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  // Add a special function to manually trigger stock notifications
  const forceSendAllNotifications = async () => {
    console.log('[AuthContext] Manually forcing all stock notifications...');
    
    try {
      // Get stock notification service and force notifications
      const stockNotificationService = StockNotificationService.getInstance();
      
      // Use the imported instance directly instead of getInstance()
      // Send an initial welcome notification
      await notificationService.scheduleTestNotification('مرحبًا بك! جارٍ تحميل معلومات المخزون...');
      
      // Add a delay before sending other notifications
      setTimeout(async () => {
        await stockNotificationService.runManualStockCheck();
        console.log('[AuthContext] Manual stock notification check triggered');
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('[AuthContext] Error triggering manual notifications:', error);
      return false;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Initialize notification services after login is confirmed
      const initNotificationsAfterLogin = async () => {
        try {
          console.log('[AuthContext] User authenticated, initializing stock notifications...');
          
          // Wait a moment to ensure authentication is fully established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Send a welcome notification first (single notification)
          const androidConfig = Platform.OS === 'android' ? { channelId: 'direct-test' } : {};
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🚨 تم تسجيل الدخول بنجاح',
              body: 'تم تسجيل الدخول بنجاح وتفعيل نظام الإشعارات',
              badge: 1,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.MAX,
              vibrate: [0, 250, 250, 250],
              autoDismiss: false,
              sticky: true,
              ...androidConfig,
            },
            trigger: null,
          });
          console.log('[AuthContext] Login welcome notification sent');
          
          // Wait 3 seconds before triggering stock checks
          setTimeout(async () => {
            try {
              // Get the stock notification service instance
              const stockNotificationService = StockNotificationService.getInstance();
              await stockNotificationService.runManualStockCheck();
            } catch (checkError) {
              console.error('[AuthContext] Error running stock checks after login:', checkError);
            }
          }, 3000);
        } catch (error) {
          console.error('[AuthContext] Error initializing stock notifications after login:', error);
          
          // Try again after a delay if initialization failed
          setTimeout(() => {
            console.log('[AuthContext] Retrying notification initialization...');
            initNotificationsAfterLogin();
          }, 5000);
        }
      };

      initNotificationsAfterLogin();
    } else {
      // User logged out, clean up notification services
      const cleanupNotifications = () => {
        try {
          console.log('[AuthContext] User logged out, cleaning up stock notifications');
          const stockNotificationService = StockNotificationService.getInstance();
          stockNotificationService.cleanup();
        } catch (error) {
          console.error('[AuthContext] Error cleaning up notifications on logout:', error);
        }
      };
      
      cleanupNotifications();
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        forceSendAllNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 