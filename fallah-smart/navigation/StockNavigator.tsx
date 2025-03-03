import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import StockScreen from '../screens/Stock/stock';
import { StockDetail } from '../screens/Stock/StockDetail';
import { StockForm } from '../screens/Stock/components/StockForm';
import AnimalsScreen from '../screens/Stock/Animals/Animals';
import AnimalList from '../screens/Stock/Animals/AnimalList';
import { useStock } from '../context/StockContext';
import { useNavigation } from '@react-navigation/native';
import { ThemeProvider } from '../context/ThemeContext';
import TabBar from './TabBar';
import Login from '../screens/Auth/Login';
import Register from '../screens/Auth/Register';
import Blogs from '../screens/blogs/blogs';
import PostDetail from '../screens/blogs/PostDetail';

const Stack = createStackNavigator();

export const StockNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="Login" 
        component={Login}
      />
      <Stack.Screen 
        name="Register" 
        component={Register}
      />
      <Stack.Screen 
        name="StockTab" 
        component={TabBar}
        options={{ title: 'Mes Stocks' }}
      />
      <Stack.Screen 
        name="StockDetail" 
        component={StockDetail}
        options={{ title: 'Détails du Stock', headerShown: true }}
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
        name="Blogs" 
        component={Blogs}
        options={{ title: 'Blog', headerShown: true }}
      />
      <Stack.Screen 
        name="PostDetail" 
        component={PostDetail}
        options={{ title: 'Post Detail', headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const AddStockScreen = () => {
  const { addStock } = useStock();
  const navigation = useNavigation();

  const handleSubmit = (values: any) => {
    addStock({
      ...values,
      id: Date.now().toString(),
      history: []
    });
    navigation.goBack();
  };

  return (
    <ThemeProvider>
      <StockForm
        onSubmit={handleSubmit}
        onCancel={() => navigation.goBack()}
      />
    </ThemeProvider>
  );
}; 