import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface LoadingAnimationProps {
  message?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  message = 'Preparing your farming assistant...',
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Dots animation for ellipsis effect
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const [dots, setDots] = React.useState('');

  useEffect(() => {
    // Fade in and scale up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous spin animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Continuous bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animated dots for loading text
    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  // Interpolate the spin animation to rotate 360 degrees
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Interpolate the bounce animation
  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  // Define the icons with their properties
  const iconComponents = [
    {
      component: Ionicons,
      name: 'water',
      color: '#4FC3F7', // Light blue for water
      size: 28,
    },
    {
      component: Ionicons,
      name: 'sunny',
      color: '#FFD54F', // Amber for sun
      size: 30,
    },
    {
      component: FontAwesome5,
      name: 'seedling',
      color: '#66BB6A', // Green for plant
      size: 26,
    },
  ];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { rotate: spin }],
          },
        ]}>
        <MaterialIcons name="eco" size={50} color={theme.colors.primary.base} />
      </Animated.View>

      <View style={styles.iconRow}>
        {iconComponents.map((icon, index) => {
          const Icon = icon.component;
          return (
            <Animated.View
              key={index}
              style={[
                styles.smallIconContainer,
                {
                  transform: [
                    {
                      translateY: Animated.multiply(
                        bounceAnim,
                        new Animated.Value(index % 2 === 0 ? 1 : -1)
                      ),
                    },
                    { scale: Animated.add(0.8, Animated.multiply(bounceAnim, 0.2)) },
                  ],
                  opacity: fadeAnim,
                  backgroundColor: `${icon.color}20`, // Add slight background with opacity
                },
              ]}>
              <Icon name={icon.name} size={icon.size} color={icon.color} />
            </Animated.View>
          );
        })}
      </View>

      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        {message}
        {dots}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(232, 245, 233, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary.light,
  },
  iconRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  text: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default LoadingAnimation;
