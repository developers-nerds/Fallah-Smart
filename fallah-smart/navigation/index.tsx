import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '../context/ThemeContext';
import { StockProvider } from '../context/StockContext';
import { StockNavigator } from './StockNavigator';

const Navigation = () => {
  return (
    <NavigationContainer>
      <ThemeProvider>
        <StockProvider>
          <StockNavigator />
        </StockProvider>
      </ThemeProvider>
    </NavigationContainer>
  );
};

export default Navigation;
