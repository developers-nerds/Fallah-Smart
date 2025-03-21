import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import NotificationSettingsScreen from '../screens/Settings/NotificationSettings';
import TestNotification from '../screens/Settings/TestNotification';
import LanguageSettings from '../screens/Settings/LanguageSettings';
import AboutScreen from '../screens/Settings/AboutScreen';
import ContactScreen from '../screens/Settings/ContactScreen';
import { useTheme } from '../context/ThemeContext';
import { I18nManager } from 'react-native';

// Define our settings stack param list type
export type SettingsStackParamList = {
  SettingsMain: undefined;
  NotificationSettings: undefined;
  TestNotification: undefined;
  LanguageSettings: undefined;
  About: undefined;
  Contact: undefined;
};

const Stack = createStackNavigator<SettingsStackParamList>();

export const SettingsNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="SettingsMain"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          color: theme.colors.text,
          textAlign: 'center',
          fontWeight: 'bold',
        },
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
        headerLeftContainerStyle: {
          paddingLeft: 16,
        },
        headerRightContainerStyle: {
          paddingRight: 16,
        },
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{
          title: 'الإعدادات',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: 'إعدادات الإشعارات',
        }}
      />
      <Stack.Screen
        name="TestNotification"
        component={TestNotification}
        options={{
          title: 'اختبار الإشعارات',
        }}
      />
      <Stack.Screen
        name="LanguageSettings"
        component={LanguageSettings}
        options={{
          title: 'إعدادات اللغة',
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'حول التطبيق',
        }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          title: 'تواصل معنا',
        }}
      />
    </Stack.Navigator>
  );
};

export default SettingsNavigator; 