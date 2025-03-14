import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';

interface PhotoPreviewScreenProps {
  photo: string;
  loading: boolean;
  aiResponse: string | null;
  imageScaleAnim: Animated.Value;
  imageSlideAnim: Animated.Value;
  responseSlideAnim: Animated.Value;
  slideAnim: Animated.Value;
  buttonScaleAnim: Animated.Value;
  dot1Anim: Animated.Value;
  dot2Anim: Animated.Value;
  dot3Anim: Animated.Value;
  pulseAnim: Animated.Value;
  colorAnim: Animated.Value;
  scanPhoto: () => Promise<void>;
  retakePicture: () => void;
}

const PhotoPreviewScreen = ({
  photo,
  loading,
  aiResponse,
  imageScaleAnim,
  imageSlideAnim,
  responseSlideAnim,
  slideAnim,
  buttonScaleAnim,
  dot1Anim,
  dot2Anim,
  dot3Anim,
  pulseAnim,
  colorAnim,
  scanPhoto,
  retakePicture,
}: PhotoPreviewScreenProps) => {
  const interpolatedColor = colorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      theme.colors.primary.base,
      theme.colors.secondary.base,
      theme.colors.primary.base,
    ],
  });

  return (
    <View style={styles.previewContainer}>
      {/* Image Preview */}
      <Animated.View
        style={[
          styles.imageContainer,
          {
            transform: [{ scale: imageScaleAnim }, { translateY: imageSlideAnim }],
          },
        ]}>
        <Image source={{ uri: photo }} style={styles.previewImage} />
      </Animated.View>

      {/* Response or Loading Section */}
      <View style={styles.contentContainer}>
        {loading ? (
          <Animated.View
            style={[
              styles.loadingContainerAnimated,
              {
                opacity: 1,
                transform: [{ translateY: responseSlideAnim }, { scale: pulseAnim }],
              },
            ]}>
            <Ionicons name="hourglass-outline" size={20} color={theme.colors.primary.base} />
            <Text style={styles.loadingText}>Analyzing your scan</Text>
            <View style={styles.dotContainer}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    transform: [
                      {
                        translateY: dot1Anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -8],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.dot,
                  {
                    transform: [
                      {
                        translateY: dot2Anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -8],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.dot,
                  {
                    transform: [
                      {
                        translateY: dot3Anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -8],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </Animated.View>
        ) : aiResponse ? (
          <Animated.View
            style={[
              styles.responseContainer,
              { transform: [{ translateY: responseSlideAnim }] },
            ]}>
            <Text style={styles.responseTitle}>Scan Result</Text>
            <ScrollView style={styles.responseScroll}>
              <Text style={styles.responseText}>{aiResponse}</Text>
            </ScrollView>
          </Animated.View>
        ) : (
          <Animated.Text
            style={[
              styles.noResponseText,
              { transform: [{ translateY: responseSlideAnim }] },
            ]}>
            Press "Scan" to analyze your image
          </Animated.Text>
        )}
      </View>

      {/* Action Buttons */}
      <Animated.View
        style={[
          styles.actionButtons,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 300],
                  outputRange: [0, 100],
                }),
              },
            ],
          },
        ]}>
        <TouchableOpacity
          style={[styles.actionButton, loading && styles.disabledButton]}
          onPress={scanPhoto}
          disabled={loading}>
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <Ionicons
              name="scan-outline"
              size={28}
              color={loading ? theme.colors.neutral.gray.light : theme.colors.primary.base}
            />
            <Text style={styles.actionText}>Scan</Text>
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={retakePicture}>
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <Ionicons name="camera-outline" size={28} color={theme.colors.neutral.gray.dark} />
            <Text style={styles.actionText}>Retake</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.background,
    paddingTop: theme.spacing.md,
  },
  imageContainer: {
    width: '85%',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.large,
    borderWidth: 2,
    borderColor: theme.colors.primary.base,
    marginBottom: theme.spacing.sm,
  },
  contentContainer: {
    flex: 1, // Takes up remaining space
    width: '85%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainerAnimated: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.medium,
    elevation: 4,
    marginVertical: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.fontSizes.body - 2,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  dotContainer: {
    flexDirection: 'row',
    marginLeft: theme.spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary.base,
    marginHorizontal: 2,
  },
  responseContainer: {
    width: '100%',
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.large,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginVertical: theme.spacing.sm,
    flex: 1, // Expands to take available space
  },
  responseTitle: {
    fontSize: theme.fontSizes.title - 2,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    marginBottom: theme.spacing.xs,
  },
  responseScroll: {
    flex: 1,
  },
  responseText: {
    fontSize: theme.fontSizes.body - 2,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    lineHeight: 20,
  },
  noResponseText: {
    fontSize: theme.fontSizes.body - 2,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginVertical: theme.spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '85%',
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.large,
    elevation: 6,
    marginBottom: theme.spacing.md, // Ensure some spacing at the bottom
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginTop: theme.spacing.xs,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default PhotoPreviewScreen;