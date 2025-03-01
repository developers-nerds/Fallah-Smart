import React from 'react';
import { View, Text } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import SideBar from '../../navigation/sideBar';
import ScanScreen from '../scan/scan';
import StockScreen from '../Stock/stock';
import WalletScreen from '../Wallet/Wallet';
import DictionaryScreen from '../dictionary/dictionary';
import ChatScreen from '../Chat/Chat';

const Drawer = createDrawerNavigator();

export const HomeContent = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to Home!</Text>
    </View>
  );
};

const HomeScreen = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <SideBar {...props} />}
      screenOptions={{ headerShown: true }}
    >
      <Drawer.Screen 
        name="HomeContent" 
        component={HomeContent}
        options={{ title: 'Home' }}
      />
      <Drawer.Screen name="Chat" component={ChatScreen} />
      <Drawer.Screen name="Scan" component={ScanScreen} />
      <Drawer.Screen name="Stock" component={StockScreen} />
      <Drawer.Screen name="Wallet" component={WalletScreen} />
      <Drawer.Screen name="Dictionary" component={DictionaryScreen} />
    </Drawer.Navigator>
  );
};

export default HomeScreen;

