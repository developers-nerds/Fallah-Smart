import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
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
import AddIncome from './screens/Wallet/components/AddIncome';
import AddExpense from './screens/Wallet/components/AddExpense';
import EditExpense from './screens/Wallet/components/EditExpense';
import EditIncome from './screens/Wallet/components/EditIncome'; // New import

// Define the navigation param list
type RootStackParamList = {
  Main: undefined;
  AddIncome: undefined;
  AddExpense: undefined;
  EditExpense: { transaction: Transaction };
  EditIncome: { transaction: Transaction }; // Added EditIncome
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
      <Stack.Screen name="AddIncome" component={AddIncome} />
      <Stack.Screen name="AddExpense" component={AddExpense} />
      <Stack.Screen name="EditExpense" component={EditExpense} />
      <Stack.Screen name="EditIncome" component={EditIncome} />
    </Stack.Navigator>
  );
};

// Default export remains the App component
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <StockProvider>
            <AnimalProvider>
              <PesticideProvider>
                <ToolProvider>
                  <EquipmentProvider>
                    <SeedProvider>
                      <FeedProvider>
                        <HarvestProvider>
                          <FertilizerProvider>
                            <RootNavigator />
                          </FertilizerProvider>
                        </HarvestProvider>
                      </FeedProvider>
                    </SeedProvider>
                  </EquipmentProvider>
                </ToolProvider>
              </PesticideProvider>
            </AnimalProvider>
          </StockProvider>
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}