import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';

interface PermissionScreenProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  buttonScaleAnim: Animated.Value;
  requestPermission: () => void;
  animateButtonPress: () => void;
}

const PermissionScreen = ({
  fadeAnim,
  slideAnim,
  buttonScaleAnim,
  requestPermission,
  animateButtonPress,
}: PermissionScreenProps) => {
  const handlePermissionRequest = async () => {
    animateButtonPress();
    Alert.alert(
      'Camera Access Required',
      'We need camera permission to scan items. Would you like to grant access?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Allow', onPress: requestPermission },
      ]
    );
  };

  return (
    <Animated.View
      style={[
        styles.permissionContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}>
      <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
        <Ionicons name="camera-outline" size={80} color={theme.colors.neutral.gray.medium} />
      </Animated.View>
      <Text style={styles.permissionTitle}>Camera Permission Needed</Text>
      <Text style={styles.permissionText}>Please allow camera access to scan your items</Text>
      <TouchableOpacity style={styles.permissionButton} onPress={handlePermissionRequest}>
        <Animated.Text
          style={[styles.permissionButtonText, { transform: [{ scale: buttonScaleAnim }] }]}>
          Grant Permission
        </Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.neutral.background,
  },
  permissionTitle: {
    fontSize: theme.fontSizes.title + 2,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  permissionText: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.large,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  permissionButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
  },
});

export default PermissionScreen;
