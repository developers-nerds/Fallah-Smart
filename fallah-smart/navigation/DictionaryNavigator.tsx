import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Dictionary from '../screens/dictionary/dictionary';
import CropDetails from '../screens/dictionary/components/CropDetails';
import AnimalDetails from '../screens/dictionary/components/AnimalDetails';

type DictionaryStackParamList = {
  DictionaryMain: undefined;
  CropDetails: { id: number };
  AnimalDetails: { id: number };
};

const Stack = createStackNavigator<DictionaryStackParamList>();

export const DictionaryNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DictionaryMain" 
        component={Dictionary}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CropDetails" 
        component={CropDetails}
        options={{ 
          title: 'تفاصيل المحصول',
          headerShown: true,
          headerTitleAlign: 'center'
        }}
      />
      <Stack.Screen 
        name="AnimalDetails" 
        component={AnimalDetails}
        options={{ 
          title: 'تفاصيل الحيوان',
          headerShown: true,
          headerTitleAlign: 'center'
        }}
      />
    </Stack.Navigator>
  );
}; 