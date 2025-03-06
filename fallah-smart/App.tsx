import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './context/ThemeContext';
import { StockProvider } from './context/StockContext';
import { createStackNavigator } from '@react-navigation/stack';
import { StockNavigator } from './navigation/StockNavigator';
import AddIncome from './screens/Wallet/components/AddIncome';
import AddExpense from './screens/Wallet/components/AddExpense';

const Stack = createStackNavigator();

const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main">
        {() => (
          <StockProvider>
            <StockNavigator />
          </StockProvider>
        )}
      </Stack.Screen>
      <Stack.Screen name="AddIncome" component={AddIncome} />
      <Stack.Screen name="AddExpense" component={AddExpense} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}

