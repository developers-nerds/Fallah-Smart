import React from 'react';
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
import NotificationService from './services/NotificationService';
import * as Notifications from 'expo-notifications';

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

// Default export remains the App component
export default function App() {
  // Initialize notification service
  React.useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const notificationService = NotificationService.getInstance();
        await notificationService.initialize();
        
        // You can use this for testing notifications during development
        if (__DEV__) {
          // Wait a bit to allow initialization to complete
          setTimeout(async () => {
            await notificationService.scheduleTestNotification();
          }, 3000);
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();
    
    // Clean up notification listeners when component unmounts
    return () => {
      const notificationService = NotificationService.getInstance();
      notificationService.cleanup();
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
                              <NavigationContainer>
                                <RootNavigator />
                              </NavigationContainer>
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
