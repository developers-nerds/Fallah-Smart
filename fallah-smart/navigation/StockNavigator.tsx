import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import StockScreen from '../screens/Stock/stock';
import { StockDetail } from '../screens/Stock/StockDetail';
import { StockForm } from '../screens/Stock/components/StockForm';
import { AnimalsScreen } from '../screens/Stock/Animals/Animals';
import { AddAnimalScreen } from '../screens/Stock/Animals/AddAnimal';
import { AnimalDetailScreen } from '../screens/Stock/Animals/AnimalDetail';
import { useStock } from '../context/StockContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import TabBar from './TabBar';
import Login from '../screens/Auth/Login';
import Register from '../screens/Auth/Register';
import { StockItem } from '../screens/Stock/types';
import { View, ActivityIndicator, Text } from 'react-native';
import { PesticideList } from '../screens/Stock/Pesticides/PesticideList';
import { PesticideDetail } from '../screens/Stock/Pesticides/PesticideDetail';
import { AddPesticide } from '../screens/Stock/Pesticides/AddPesticide';
import { PesticideProvider } from '../context/PesticideContext';
import Blogs from '../screens/blogs/blogs';
import PostDetail from '../screens/blogs/PostDetail';
import { StockStackParamList } from './types';

const Stack = createStackNavigator<StockStackParamList>();

export const StockNavigator = () => {
  const theme = useTheme();

  return (
    <PesticideProvider>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.neutral.surface,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: theme.colors.neutral.textPrimary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          cardStyle: {
            backgroundColor: theme.colors.neutral.background,
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
          options={{ title: 'مخزوني', headerShown: false }}
        />
        <Stack.Screen 
          name="StockList" 
          component={StockScreen}
          options={{
            title: 'إدارة المخزون',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="StockDetail" 
          component={StockDetail}
          options={{ title: 'تفاصيل المخزون', headerShown: true }}
        />
        <Stack.Screen 
          name="AddStock" 
          component={AddStockScreen}
          options={{ title: 'إضافة مخزون', headerShown: true }}
        />
        <Stack.Screen 
          name="Animals" 
          component={AnimalsScreen}
          options={{
            title: 'حيواناتي',
          }}
        />
        <Stack.Screen 
          name="AddAnimal" 
          component={AddAnimalScreen}
          options={{
            title: 'إضافة حيوان',
          }}
        />
        <Stack.Screen 
          name="AnimalDetail" 
          component={AnimalDetailScreen}
          options={{
            title: 'تفاصيل الحيوان',
          }}
        />
        <Stack.Screen 
          name="PesticideList" 
          component={PesticideList}
          options={{ title: 'قائمة المبيدات', headerShown: true }}
        />
        <Stack.Screen 
          name="PesticideDetail" 
          component={PesticideDetail}
          options={{ title: 'تفاصيل المبيد', headerShown: true }}
        />
        <Stack.Screen 
          name="AddPesticide" 
          component={AddPesticide}
          options={{ title: 'إضافة مبيد', headerShown: true }}
        />
        <Stack.Screen 
          name="Blogs" 
          component={Blogs}
          options={{ title: 'المدونة', headerShown: true }}
        />
        <Stack.Screen 
          name="PostDetail" 
          component={PostDetail}
          options={{ title: 'تفاصيل المنشور', headerShown: false }}
        />
      </Stack.Navigator>
    </PesticideProvider>
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
      navigation.navigate('StockList' as never);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigation.navigate('StockList' as never);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <StockForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      error={submitError}
      isSubmitting={submitting}
    />
  );
}; 
