import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type MenuItemProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
};

type DrawerParamList = {
  HomeContent: undefined;
  Stock: undefined;
  Scan: undefined;
  Wallet: undefined;
  Dictionary: undefined;
};

type SideBarProps = {
  navigation: DrawerNavigationProp<DrawerParamList>;
  state: {
    routeNames: string[];
    index: number;
  };
};

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, active }) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { rotate: `${rotation.value}deg` }
    ]
  }));

  const handlePress = () => {
    if (icon === 'home-variant') {
      scale.value = withSequence(
        withSpring(1.2),
        withSpring(1)
      );
      rotation.value = withSequence(
        withTiming(360, { 
          duration: 800, 
          easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
        }),
        withTiming(0, { duration: 0 })
      );
    }
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.menuItem,
        active && styles.activeMenuItem,
        animatedStyle
      ]}
    >
      <View style={styles.menuItemContent}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={active ? theme.colors.primary.base : theme.colors.neutral.textSecondary}
        />
        <DrawerItem
          label={label}
          onPress={handlePress}
          labelStyle={[
            styles.menuItemLabel,
            { color: active ? theme.colors.primary.base : theme.colors.neutral.textSecondary }
          ]}
          style={styles.drawerItem}
        />
      </View>
    </AnimatedPressable>
  );
};

const SideBar = ({ navigation, state }: SideBarProps) => {
  const theme = useTheme();
  const currentRoute = state.routeNames[state.index];

  return (
    <DrawerContentScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="menu" size={24} color={theme.colors.neutral.textPrimary} />
      </View>
      
      <MenuItem
        icon="home-variant"
        label="Home"
        active={currentRoute === 'HomeContent'}
        onPress={() => {
          navigation.navigate('HomeContent');
          navigation.closeDrawer();
        }}
      />
      <MenuItem
        icon="barcode-scan"
        label="Scan"
        active={currentRoute === 'Scan'}
        onPress={() => {
          navigation.navigate('Scan');
          navigation.closeDrawer();
        }}
      />
      <MenuItem
        icon="warehouse"
        label="Stock"
        active={currentRoute === 'Stock'}
        onPress={() => {
          navigation.navigate('Stock');
          navigation.closeDrawer();
        }}
      />
      <MenuItem
        icon="wallet"
        label="Wallet"
        active={currentRoute === 'Wallet'}
        onPress={() => {
          navigation.navigate('Wallet');
          navigation.closeDrawer();
        }}
      />
      <MenuItem
        icon="book-open-variant"
        label="Dictionary"
        active={currentRoute === 'Dictionary'}
        onPress={() => {
          navigation.navigate('Dictionary');
          navigation.closeDrawer();
        }}
      />
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    paddingVertical: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuItem: {
    marginVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  activeMenuItem: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  menuItemLabel: {
    fontSize: 16,
    marginLeft: 16,
  },
  drawerItem: {
    flex: 1,
  },
});

export default SideBar; 