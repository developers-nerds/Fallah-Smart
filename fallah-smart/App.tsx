
import 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { ThemeProvider } from './context/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StockNavigator } from './navigation/StockNavigator';
import { StockProvider } from './context/StockContext';
import { PesticideProvider } from './context/PesticideContext';
import { AuthProvider } from './contexts/AuthContext';
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

const AppContent = () => {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ThemeProvider>
        <AuthProvider>
          <PesticideProvider>
            <AppContent />
          </PesticideProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}
