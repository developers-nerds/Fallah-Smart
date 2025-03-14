import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StockNavigator } from './StockNavigator';
// import { EducationNavigator } from './EducationNavigator';
import  EducationScreen  from '../screens/Education/education';
import HomeScreen from '../screens/Home/Home';
import ProfileScreen from '../screens/Profile/Profile';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type TabParamList = {
  Home: undefined;
  Stock: undefined;
  Education: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary.base,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Stock" 
        component={StockNavigator}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="warehouse" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Education" 
        component={EducationScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="school" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

