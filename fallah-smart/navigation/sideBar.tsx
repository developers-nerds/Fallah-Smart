import React from 'react';
import { View } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';

const SideBar = (props) => {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem
        label="Home"
        onPress={() => {
          props.navigation.navigate('HomeContent');
          props.navigation.closeDrawer();
        }}
      />
      <DrawerItem
        label="Scan"
        onPress={() => props.navigation.navigate('Scan')}
      />
      <DrawerItem
        label="Stock"
        onPress={() => props.navigation.navigate('Stock')}
      />
      <DrawerItem
        label="Wallet"
        onPress={() => props.navigation.navigate('Wallet')}
      />
      <DrawerItem
        label="Dictionary"
        onPress={() => props.navigation.navigate('Dictionary')}
      />
    </DrawerContentScrollView>
  );
};

export default SideBar; 