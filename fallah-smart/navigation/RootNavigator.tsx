import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { StockNavigator } from './StockNavigator';
import { EducationNavigator } from './EducationNavigator';
import HomeScreen from '../screens/Home/Home';
import ProfileScreen from '../screens/Profile/Profile';

export type RootStackParamList = {
  Home: undefined;
  Stock: undefined;
  Profile: undefined;
  Education: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Stock" component={StockNavigator} />
      <Stack.Screen name="Education" component={EducationNavigator} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigator; 