import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/Home/Home';
import BlogsScreen from '../screens/blogs/blogs';
import ProfileScreen from '../screens/Profile/Profile';

const Tab = createBottomTabNavigator();

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TabIconProps = {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  focused: boolean;
  onPress?: () => void;
  isHome?: boolean;
};

const TabIcon: React.FC<TabIconProps> = ({ name, color, focused, onPress, isHome }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const navigation = useNavigation();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ]
  }));

  const navigateToHome = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Home',
        params: { screen: 'HomeContent' }
      })
    );
  };

  const handlePress = () => {
    if (isHome) {
      navigateToHome();
    }
    onPress?.();

    // Animation logic
    switch (name) {
      case 'home-variant':
        rotation.value = withSequence(
          withTiming(360, { 
            duration: 800, 
            easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
          }),
          withTiming(0, { duration: 0 })
        );
        scale.value = withSequence(
          withSpring(1.3),
          withSpring(1)
        );
        break;

      case 'post':
        scale.value = withSequence(
          withTiming(0.8, { duration: 150 }),
          withTiming(1, { duration: 150 })
        );
        rotation.value = withSequence(
          withTiming(-180, { duration: 400 }),
          withTiming(0, { duration: 400 })
        );
        break;

      case 'account':
        scale.value = withRepeat(
          withSequence(
            withSpring(1.3),
            withSpring(0.9),
            withSpring(1.2),
            withSpring(1)
          ),
          1,
          false
        );
        break;
    }
  };

  return (
    <View style={styles.iconContainer}>
      <AnimatedPressable onPress={handlePress} style={[styles.iconButton, animatedStyle]}>
        <MaterialCommunityIcons name={name} size={24} color={color} />
      </AnimatedPressable>
    </View>
  );
};

const TabBar = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.neutral.surface,
          borderTopColor: theme.colors.neutral.gray.light,
          borderTopWidth: 1,
          height: 60,
          paddingHorizontal: theme.spacing.md,
        },
        tabBarActiveTintColor: theme.colors.primary.base,
        tabBarInactiveTintColor: theme.colors.neutral.textSecondary,
        tabBarLabelStyle: {
          fontSize: theme.fontSizes.caption,
          marginTop: theme.spacing.xs,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarButton: (props) => (
            <TabIcon 
              name="home-variant" 
              color={props.accessibilityState?.selected ? 
                theme.colors.primary.base : 
                theme.colors.neutral.textSecondary
              }
              focused={props.accessibilityState?.selected || false}
              onPress={() => props.onPress?.()}
              isHome={true}
            />
          )
        }}
      />
      <Tab.Screen 
        name="Blogs" 
        component={BlogsScreen}
        options={{
          tabBarButton: (props) => (
            <TabIcon 
              name="post" 
              color={props.accessibilityState?.selected ? 
                theme.colors.primary.base : 
                theme.colors.neutral.textSecondary
              }
              focused={props.accessibilityState?.selected || false}
              onPress={() => props.onPress?.()}
            />
          )
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarButton: (props) => (
            <TabIcon 
              name="account" 
              color={props.accessibilityState?.selected ? 
                theme.colors.primary.base : 
                theme.colors.neutral.textSecondary
              }
              focused={props.accessibilityState?.selected || false}
              onPress={() => props.onPress?.()}
            />
          )
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    padding: 8,
  },
});

export default TabBar;
