import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/Home/Home';
import BlogsScreen from '../screens/blogs/blogs';
import ProfileScreen from '../screens/Profile/Profile';

const Tab = createBottomTabNavigator();

const TabBar = () => {
  return (
    <Tab.Navigator 
      screenOptions={{ headerShown: false }}
      screenListeners={({ navigation }) => ({
        tabPress: (e) => {
          const target = e.target?.split('-')[0];
          if (target === 'Home') {
            e.preventDefault();
            // Navigate to HomeContent directly through the nested navigator
            navigation.navigate('Home', {
              screen: 'HomeContent',
              initial: false
            });
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Blogs" component={BlogsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default TabBar;
