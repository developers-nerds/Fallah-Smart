import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './context/ThemeContext';
import { StockProvider } from './context/StockContext';
import { StockNavigator } from './navigation/StockNavigator';
import { StatusBar } from 'react-native';

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ThemeProvider>
        <StockProvider>
          <StockNavigator />
        </StockProvider>
      </ThemeProvider>
    </NavigationContainer>
  );
}

