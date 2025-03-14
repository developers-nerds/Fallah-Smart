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
import EditTransaction from './screens/Wallet/components/EditTransaction';
import Wallet from './screens/Wallet/Wallet'; // Import the Wallet screen
import { I18nManager } from 'react-native';

// Force RTL and allow RTL globally
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

// Define the navigation param list
type RootStackParamList = {
  Main: undefined;
  AddTransaction: { transactionType: 'income' | 'expense' };
  EditTransaction: { transaction: Transaction };
  Wallet: undefined; // Add Wallet to the param list
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

// Create the stack navigator with typed params
const Stack = createStackNavigator<RootStackParamList>();

// Export RootNavigator as a named export
export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="Main" 
        component={() => (
          <StockProvider>
            <StockNavigator />
          </StockProvider>
        )}
      />
      <Stack.Screen name="AddTransaction" component={AddTransaction} />
      <Stack.Screen name="EditTransaction" component={EditTransaction} />
      <Stack.Screen 
        name="Wallet" 
        component={Wallet} 
        options={{ title: 'محفظتي' }} // Set the header title here
      />
    </Stack.Navigator>
  );
};

// Default export remains the App component
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
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
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}