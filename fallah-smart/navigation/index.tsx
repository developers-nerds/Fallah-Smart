import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '../context/ThemeContext';
import { StockProvider } from '../context/StockContext';
import { StockNavigator } from './StockNavigator';
import AdvisorApplicationScreen from '../screens/Advisor/AdvisorApplicationScreen';
import { SupplierRegistrationForm } from '../screens/form/form';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <ThemeProvider>
        <StockProvider>
          <Stack.Navigator>
            <Stack.Screen
              name="StockNavigator"
              component={StockNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SupplierRegistrationForm"
              component={SupplierRegistrationForm}
              options={{
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </StockProvider>
      </ThemeProvider>
    </NavigationContainer>
  );
};

export default Navigation;
