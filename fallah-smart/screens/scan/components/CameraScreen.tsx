import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';

interface CameraScreenProps {
  cameraRef: React.RefObject<any>;
  facing: CameraType;
  flash: 'on' | 'off' | 'auto';
  zoom: number;
  isButtonDisabled: boolean;
  slideAnim: Animated.Value;
  buttonScaleAnim: Animated.Value;
  toggleFlash: () => void;
  handleZoom: (direction: 'in' | 'out') => void;
  takePicture: () => Promise<void>;
  toggleCameraFacing: () => void;
  pickImage: () => Promise<void>;
}

const CameraScreen = ({
  cameraRef,
  facing,
  flash,
  zoom,
  isButtonDisabled,
  slideAnim,
  buttonScaleAnim,
  toggleFlash,
  handleZoom,
  takePicture,
  toggleCameraFacing,
  pickImage,
}: CameraScreenProps) => {
  return (
    <CameraView style={styles.camera} facing={facing} ref={cameraRef} flash={flash} zoom={zoom}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.topBar,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 300],
                    outputRange: [-100, 0],
                  }),
                },
              ],
            },
          ]}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <Ionicons
                name={flash === 'on' ? 'flash' : flash === 'auto' ? 'flash' : 'flash-off'}
                size={28}
                color={theme.colors.neutral.surface}
              />
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomButton} onPress={() => handleZoom('out')}>
              <Ionicons
                name="remove-circle-outline"
                size={28}
                color={theme.colors.neutral.surface}
              />
            </TouchableOpacity>
            <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
            <TouchableOpacity style={styles.zoomButton} onPress={() => handleZoom('in')}>
              <Ionicons name="add-circle-outline" size={28} color={theme.colors.neutral.surface} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.navBar,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 300],
                    outputRange: [0, 150],
                  }),
                },
              ],
            },
          ]}>
          <TouchableOpacity style={styles.navButton} onPress={pickImage}>
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <Ionicons name="image-outline" size={32} color={theme.colors.neutral.surface} />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.captureButton, isButtonDisabled && styles.disabledButton]}
            onPress={takePicture}
            disabled={isButtonDisabled}>
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <Ionicons
                name="camera-outline"
                size={44}
                color={
                  isButtonDisabled ? theme.colors.neutral.gray.light : theme.colors.neutral.surface
                }
              />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={toggleCameraFacing}>
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <Ionicons
                name="camera-reverse-outline"
                size={32}
                color={theme.colors.neutral.surface}
              />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </CameraView>
  );
};

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.xs,
  },
  zoomButton: {
    padding: theme.spacing.sm,
  },
  zoomText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    marginHorizontal: theme.spacing.sm,
  },
  iconButton: {
    padding: theme.spacing.sm,
  },
  navBar: {
    position: 'absolute',
    bottom: 40,
    right: '-4%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: theme.spacing.sm,
    borderRadius: 50,
    marginHorizontal: theme.spacing.md,
    elevation: 6,
  },
  navButton: {
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    marginHorizontal: theme.spacing.sm,
  },
  captureButton: {
    backgroundColor: theme.colors.primary.base,
    borderRadius: 50,
    padding: theme.spacing.md + 2,
    marginHorizontal: theme.spacing.lg,
    borderWidth: 4,
    borderColor: theme.colors.neutral.surface,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default CameraScreen;
