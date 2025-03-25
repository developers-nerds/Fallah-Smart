import React from 'react';
import { View, StyleSheet, Pressable, Text, TouchableOpacity, Alert } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerContentComponentProps,
  DrawerNavigationProp,
} from '@react-navigation/drawer';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { storage } from '../utils/storage';
import { theme } from '../theme/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type MenuItemProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  navigation: any;
};

export type DrawerParamList = {
  HomeContent: { refreshScanHistory?: boolean } | undefined;
  Chat: undefined;
  Scan: undefined;
  Stock: undefined;
  محفظتي: undefined;
  Dictionary: undefined;
  Marketplace: undefined;
  Weather: undefined;
};

type SideBarProps = {
  navigation: DrawerNavigationProp<DrawerParamList>;
  state: {
    routeNames: string[];
    index: number;
  };
  Education: undefined;
};

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, active, navigation }) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const handlePress = () => {
    if (icon === 'home-variant') {
      scale.value = withSequence(withSpring(1.2), withSpring(1));
      rotation.value = withSequence(
        withTiming(360, {
          duration: 800,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        withTiming(0, { duration: 0 })
      );
    }
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.menuItem, active && styles.activeMenuItem, animatedStyle]}>
      <View style={styles.menuItemContent}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={active ? '#ffffff' : '#e0e0e0'}
        />
        <DrawerItem
          label={label}
          onPress={handlePress}
          labelStyle={[
            styles.menuItemLabel,
            {
              color: active ? '#ffffff' : '#e0e0e0',
            },
          ]}
          style={styles.drawerItem}
        />
      </View>
    </AnimatedPressable>
  );
};

const SideBar: React.FC<DrawerContentComponentProps> = (props) => {
  const theme = useTheme();
  const currentRoute = props.state.routeNames[props.state.index];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await storage.clearAuth();
            props.navigation.getParent()?.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const navigateToTab = (tabName: string) => {
    props.navigation.getParent()?.navigate(tabName);
    props.navigation.closeDrawer();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="menu" size={24} color="#ffffff" />
      </View>

      <MenuItem
        icon="home-variant"
        label="بيت"
        active={currentRoute === 'HomeContent'}
        onPress={() => {
          props.navigation.navigate('HomeContent', { refreshScanHistory: true });
          props.navigation.closeDrawer();
        }}
        navigation={props.navigation}
      />
      <MenuItem
        icon="warehouse"
        label="المخزون "
        active={currentRoute === 'Stock'}
        onPress={() => {
          props.navigation.navigate('Stock');
          props.navigation.closeDrawer();
        }}
        navigation={props.navigation}
      />
      <MenuItem
        icon="store"
        label="السوق"
        active={currentRoute === 'Marketplace'}
        onPress={() => {
          props.navigation.navigate('Marketplace');
          props.navigation.closeDrawer();
        }}
        navigation={props.navigation}
      />
  
      <MenuItem
        icon="chat"
        label="محادثة"
        active={currentRoute === 'Chat'}
        onPress={() => {
          props.navigation.navigate('Chat');
          props.navigation.closeDrawer();
        }}
        navigation={props.navigation}
      />
      <MenuItem
        icon="barcode-scan"
        label="مسح ضوئي"
        active={currentRoute === 'Scan'}
        onPress={() => {
          props.navigation.navigate('Scan');
          props.navigation.closeDrawer();
        }}
        navigation={props.navigation}
      />

      <MenuItem
        icon="wallet"
        label="محفظتي"
        active={currentRoute === 'محفظتي'}
        onPress={() => {
          props.navigation.navigate('Wallet');
          props.navigation.closeDrawer();
        }}
        navigation={props.navigation}
      />

      <MenuItem
        icon="weather-partly-cloudy"
        label="الطقس والزراعة"
        active={currentRoute === 'Weather'}
        onPress={() => {
          props.navigation.navigate('Weather');
          props.navigation.closeDrawer();
        }}
        navigation={props.navigation}
      />

      <MenuItem
        icon="book-open-variant"
        label="قاموس"
        active={currentRoute === 'Dictionary'}
        onPress={() => {
          props.navigation.navigate('Dictionary');
          props.navigation.closeDrawer();
        }}
        navigation={props.navigation}
      />
      <MenuItem
        icon="school"
        label="تعليم"
        active={currentRoute === 'تعليم'}
        onPress={() => {
          props.navigation.navigate('Education')
          props.navigation.closeDrawer();
        }}
        navigation={props.navigation}
      />

      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ffffff" />
          <Text style={[styles.logoutText, { color: "#ffffff" }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#093731',
    padding: theme.spacing.md,
  },
  header: {
    paddingVertical: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuItem: {
    marginVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  menuItemLabel: {
    fontSize: 16,
    marginLeft: 16,
    color: '#ffffff',
  },
  drawerItem: {
    flex: 1,
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 'auto',
    paddingVertical: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#ffffff',
  },
});

export default SideBar;
