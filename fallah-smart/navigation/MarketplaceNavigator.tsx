import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MarketplaceScreen from '../screens/Marketplace/marketplace';
import AddProduct from '../screens/Marketplace/AddProduct';
import { useTheme } from '@react-navigation/native';
import { StockStackParamList } from './types';

const Stack = createStackNavigator<StockStackParamList>();

const MarketplaceNavigator = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTitleStyle: {
          color: colors.text,
        },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          title: 'Marketplace',
        }}
      />
      <Stack.Screen
        name="AddProduct"
        component={AddProduct}
        options={{
          title: 'Add Product',
        }}
      />
    </Stack.Navigator>
  );
};

export default MarketplaceNavigator;
