import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';

interface SidebarOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  opacity?: Animated.Value;
}

const SidebarOverlay: React.FC<SidebarOverlayProps> = ({
  isVisible,
  onClose,
  opacity = new Animated.Value(0),
}) => {
  const scaleAnim = useRef(new Animated.Value(1.1)).current;

  useEffect(() => {
    if (isVisible) {
      // Animate in with scale effect
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animations when hidden
      scaleAnim.setValue(1.1);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  // Create a ripple effect when tapped
  const handlePress = () => {
    // Quick pulse animation before closing
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ scale: scaleAnim }],
        },
      ]}>
      <TouchableOpacity style={styles.overlay} activeOpacity={0.9} onPress={handlePress} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default SidebarOverlay;
