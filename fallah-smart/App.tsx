import './config/i18n'; // Import i18n configuration first
import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { StockProvider } from './context/StockContext';
import { AnimalProvider } from './context/AnimalContext';
import { PesticideProvider } from './context/PesticideContext';
import { ToolProvider } from './context/ToolContext';
import { EquipmentProvider } from './context/EquipmentContext';
import { SeedProvider } from './context/SeedContext';
import { FeedProvider } from './context/FeedContext';
import { HarvestProvider } from './context/HarvestContext';
import { FertilizerProvider } from './context/FertilizerContext';
import { createStackNavigator } from '@react-navigation/stack';
import { StockNavigator } from './navigation/StockNavigator';
import AddTransaction from './screens/Wallet/components/AddTransaction';
import { EducationNavigator } from "./navigation/EducationNavigator"
import EditTransaction from './screens/Wallet/components/EditTransaction';
import Wallet from './screens/Wallet/Wallet'; // Import the Wallet screen
import AdvisorApplication from './screens/AdvisorApplication/AdvisorApplication';
import { I18nManager } from 'react-native';
import { NotificationProvider } from './context/NotificationContext';
import notificationService from './services/NotificationService';
import StockNotificationService from './services/StockNotificationService';
import * as Notifications from 'expo-notifications';
import { storage } from './utils/storage';
import { StatusBar } from "expo-status-bar";
import { LogBox, View, Text, StyleSheet, Platform, Alert } from "react-native";
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import i18next from './translations/i18n';
import { I18nextProvider } from 'react-i18next';
import { LanguageProvider } from './context/LanguageContext';

// Configure notification behavior for the entire app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Force RTL and allow RTL globally
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

// Define the navigation param list
type RootStackParamList = {
  Main: undefined;
  AddTransaction: { transactionType: 'income' | 'expense' };
  EditTransaction: { transaction: Transaction };
  Wallet: undefined; // Add Wallet to the param list
  Education: undefined;
  AdvisorApplication: undefined;
};

// Define the Transaction interface
interface Transaction {
  id: number;
  accountId: number;
  amount: number;
  note: string;
  date: string;
  type: string;
  category: {
    id: number;
    name: string;
    icon: string;
    type: string;
    color: string;
  };
}

// Create a separate component for the Main screen
const MainScreen = () => {
  return (
    <StockProvider>
      <StockNavigator />
    </StockProvider>
  );
};

// Create the stack navigator with typed params
const Stack = createStackNavigator<RootStackParamList>();

// Export RootNavigator as a named export
export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="Main" 
        component={MainScreen}
      />
      <Stack.Screen name="AddTransaction" component={AddTransaction} />
      <Stack.Screen name="EditTransaction" component={EditTransaction} />
      <Stack.Screen 
        name="Wallet" 
        component={Wallet} 
        options={{ title: 'محفظتي' }} // Set the header title here
      />
      <Stack.Screen name="Education" component={EducationNavigator}
       options={{ title: 'تعليم' }} />
      <Stack.Screen 
        name="AdvisorApplication" 
        component={AdvisorApplication}
        options={{ title: 'تطبيق مستشار' }}
      />
    </Stack.Navigator>
  );
};

// Check if environment variables are set - but don't cause errors if they're missing
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (!apiUrl) {
  console.warn('EXPO_PUBLIC_API_URL environment variable is not set or empty. Using fallback URLs.');
  
  // Log all environment variables for debugging
  console.log('Environment variables available:');
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('EXPO_PUBLIC_')) {
      console.log(`- ${key}: ${process.env[key] || '(empty)'}`);
    }
  });
  
  // Try to check Constants
  try {
    console.log('Checking Expo Constants:');
    const constantsExtraKeys = Object.keys(Constants.expoConfig?.extra || {});
    if (constantsExtraKeys.length > 0) {
      constantsExtraKeys.forEach(key => {
        if (key.startsWith('expoPublic')) {
          console.log(`- ${key}: ${Constants.expoConfig?.extra?.[key] || '(empty)'}`);
        }
      });
    } else {
      console.log('No extra values found in Constants');
    }
  } catch (err) {
    console.log('Error checking Constants:', err);
  }
} else {
  console.log(`App initialized with API URL: ${apiUrl}`);
}

LogBox.ignoreLogs([
  'Warning: componentWillReceiveProps has been renamed',
  'Warning: componentWillMount has been renamed',
  'Sending `onAnimatedValueUpdate`',
  'Non-serializable values were found in the navigation state',
  'Deprecation warning: value provided is not in a recognized RFC2822',
  'VirtualizedLists should never be nested'
]);

// Initialize notifications early to ensure permissions are requested
try {
  console.log('[App] Pre-initializing notification service...');
  notificationService.initialize().catch((error: Error) => {
    console.error('[App] Error pre-initializing notification service:', error);
  });
} catch (initError) {
  console.error('[App] Error setting up notifications:', initError);
}

// Default export remains the App component
export default function App() {
  // Initialize notification service
  useEffect(() => {
    let notificationInitialized = false;
    
    const initializeNotifications = async () => {
      try {
        console.log('Initializing notification services...');
        
        // Check notification permissions first
        const checkPermissions = async () => {
          try {
            if (Platform.OS === 'android') {
              const { status: androidStatus } = await Notifications.getPermissionsAsync();
              console.log('[App] Current notification permission status:', androidStatus);
              
              if (androidStatus !== 'granted') {
                console.log('[App] Requesting notification permissions on Android...');
                const { status } = await Notifications.requestPermissionsAsync();
                console.log('[App] New notification permission status:', status);
                
                if (status !== 'granted') {
                  Alert.alert(
                    'الإشعارات غير مفعلة',
                    'الرجاء تفعيل الإشعارات في إعدادات الجهاز لتلقي تنبيهات المخزون',
                    [{ text: 'حسنًا' }]
                  );
                }
              }
            }
          } catch (permError) {
            console.error('[App] Error checking notification permissions:', permError);
          }
        };
        
        // Check permissions before proceeding
        await checkPermissions();
        
        // Initialize main notification service first
        await notificationService.initialize();
        console.log('Main notification service initialized');
        
        // Don't initialize stock notification service here
        // It will be initialized after login in AuthContext
        
        notificationInitialized = true;
        
        // Force a test notification if in dev mode
        if (__DEV__) {
          setTimeout(async () => {
            try {
              console.log('[App] Scheduling startup test notification');
              const notificationId = await notificationService.scheduleTestNotification(
                'تم بدء التطبيق بنجاح! هذا اختبار للإشعارات.'
              );
              console.log('[App] Startup test notification sent with ID:', notificationId);
            } catch (error) {
              console.error('[App] Failed to send startup test notification:', error);
            }
          }, 5000);
        }
      } catch (error) {
        console.error('Failed to initialize notification services:', error);
      }
    };

    initializeNotifications();
    
    // Clean up notification listeners when component unmounts
    return () => {
      if (notificationInitialized) {
        // Only clean up the main notification service
        // Stock notification service will be cleaned up separately
        console.log('Cleaning up notification services');
        notificationService.cleanup();
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <StockProvider>
              <AnimalProvider>
                <SeedProvider>
                  <PesticideProvider>
                    <ToolProvider>
                      <EquipmentProvider>
                        <FeedProvider>
                          <HarvestProvider>
                            <FertilizerProvider>
                              <LanguageProvider>
                                <NavigationContainer>
                                  <RootNavigator />
                                </NavigationContainer>
                              </LanguageProvider>
                            </FertilizerProvider>
                          </HarvestProvider>
                        </FeedProvider>
                      </EquipmentProvider>
                    </ToolProvider>
                  </PesticideProvider>
                </SeedProvider>
              </AnimalProvider>
            </StockProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
