import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import StockScreen from '../screens/Stock/stock';
import { StockDetail } from '../screens/Stock/StockDetail';
import { StockForm } from '../screens/Stock/components/StockForm';
import AnimalsScreen from '../screens/Stock/Animals/Animals';
import AnimalList from '../screens/Stock/Animals/AnimalList';
import { useStock } from '../context/StockContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { ThemeProvider } from '../context/ThemeContext';
import TabBar from './TabBar';
import Login from '../screens/Auth/Login';
import Register from '../screens/Auth/Register';
import { StockItem } from '../screens/Stock/types';
import { View, ActivityIndicator, Text } from 'react-native';
import { PesticideList } from '../screens/Stock/Pesticides/PesticideList';
import { PesticideDetail } from '../screens/Stock/Pesticides/PesticideDetail';
import { AddPesticide } from '../screens/Stock/Pesticides/AddPesticide';

export type StockStackParamList = {
  Login: undefined;
  Register: undefined;
  StockTab: undefined;
  StockList: undefined;
  StockDetail: { stockId: string };
  AddStock: undefined;
  Animals: undefined;
  AnimalList: undefined;
  PesticideList: undefined;
  PesticideDetail: { pesticideId: number };
  AddPesticide: undefined;
};

const Stack = createStackNavigator<StockStackParamList>();

export const StockNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={Login}
        options={{ headerShown: true }}
      />
      <Stack.Screen 
        name="Register" 
        component={Register}
        options={{ headerShown: true }}
      />
      <Stack.Screen 
        name="StockTab" 
        component={TabBar}
        options={{ title: 'Mes Stocks' }}
      />
      <Stack.Screen 
        name="StockList" 
        component={StockScreen}
        options={{
          title: 'Gestion des Stocks',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="StockDetail" 
        component={StockDetail}
        options={{
          title: 'Détails du Stock',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="AddStock" 
        component={AddStockScreen}
        options={{ title: 'Ajouter un Stock', headerShown: true }}
      />
      <Stack.Screen 
        name="Animals" 
        component={AnimalsScreen}
        options={{ title: 'Ajouter un Animal', headerShown: true }}
      />
      <Stack.Screen 
        name="AnimalList" 
        component={AnimalList}
        options={{ title: 'Mes Animaux', headerShown: true }}
      />
      <Stack.Screen 
        name="PesticideList" 
        component={PesticideList}
        options={{ title: 'Liste des Pesticides', headerShown: true }}
      />
      <Stack.Screen 
        name="PesticideDetail" 
        component={PesticideDetail}
        options={{ title: 'Détails du Pesticide', headerShown: true }}
      />
      <Stack.Screen 
        name="AddPesticide" 
        component={AddPesticide}
        options={{ title: 'Ajouter un Pesticide', headerShown: true }}
      />
    </Stack.Navigator>
  );
};
const AddStockScreen = () => {
  const { addStock, loading, error, refreshStocks } = useStock();
  const navigation = useNavigation<NavigationProp<StockStackParamList>>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: Omit<StockItem, 'id' | 'stockHistory'>) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      await addStock(values);
      await refreshStocks();
      navigation.navigate('StockList');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigation.navigate('StockList');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <StockForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        error={submitError}
        isSubmitting={submitting}
      />
    </ThemeProvider>
  );
}; 
