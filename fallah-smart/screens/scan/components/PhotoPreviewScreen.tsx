import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ScrollView,
  Share,
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

  const renderNumberedList = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (/^\d+\./.test(line)) {
        return (
          <View key={i} style={styles.numberedListItem}>
            <Text style={styles.numberedText}>{line}</Text>
          </View>
        );
      }
      return (
        <Text key={i} style={styles.responseText}>
          {line}
        </Text>
      );
    });
  };

  const renderStyledResponse = (text: string) => {
    const sections = text.split('\n');
    return sections.map((section, index) => {
      // What's Growing section - look for "What's Growing?" text
      if (section.includes("What's Growing?") && section.includes('نبات')) {
        const title = section.replace(/##/g, '').trim();
        return (
          <View key={index} style={styles.sectionWrapper}>
            <View style={styles.sectionTitleWrapper}>
              <Ionicons name="leaf-outline" size={24} color={theme.colors.primary.dark} />
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <View style={styles.divider} />
          </View>
        );
      }

      // Health Report section - look for ++ markers with more flexible matching
      else if (section.includes('++')) {
        const content = section.replace(/\+\+/g, '').trim();
        return (
          <View key={index} style={styles.healthReportWrapper}>
            <Text style={styles.healthReport}>{content}</Text>
            <View style={styles.iconContainer}>
              <Ionicons
                name="medical"
                size={20}
                color={theme.colors.secondary.base}
                style={styles.iconRTL}
              />
            </View>
          </View>
        );
      }

      // Plant Care Plan section - look for >> and << markers
      else if (section.includes('>>') && section.includes('<<')) {
        const content = section.replace(/>>/g, '').replace(/<</g, '').trim();
        return (
          <View key={index} style={styles.carePlanWrapper}>
            <Text style={styles.carePlan}>{content}</Text>
            <Ionicons
              name="leaf"
              size={20}
              color={theme.colors.primary.dark}
              style={styles.iconRTL}
            />
          </View>
        );
      }

      // Bug Control section - look for || markers
      else if (section.includes('||') && section.includes('Bug Control')) {
        const content = section.replace(/\|\|/g, '').trim();
        return (
          <View key={index} style={styles.bugControlWrapper}>
            <Text style={styles.bugControl}>{content}</Text>
            <Ionicons
              name="bug"
              size={20}
              color={theme.colors.warning.dark}
              style={styles.iconRTL}
            />
          </View>
        );
      }

      // Mistakes section - look for -- markers with more flexible matching
      else if (section.includes('--')) {
        const content = section.replace(/--/g, '').trim();
        return (
          <View key={index} style={styles.mistakesWrapper}>
            <Text style={styles.mistakes}>{content}</Text>
            <View style={styles.iconContainer}>
              <Ionicons
                name="alert-circle"
                size={20}
                color={theme.colors.error.base}
                style={styles.iconRTL}
              />
            </View>
          </View>
        );
      }

      // Keep Thriving section - look for ~~ markers
      else if (section.includes('~~')) {
        const content = section.replace(/~~/g, '').trim();
        return (
          <View key={index} style={styles.thrivingWrapper}>
            <Text style={styles.thriving}>{content}</Text>
            <Ionicons
              name="sunny"
              size={20}
              color={theme.colors.success.base}
              style={styles.iconRTL}
            />
          </View>
        );
      }

      // Handle italic text and ## markers within regular text
      else {
        // Check if the section contains numbered items
        if (/^\d+\./.test(section)) {
          return (
            <View key={index} style={styles.listContainer}>
              {renderNumberedList(section)}
            </View>
          );
        }

        // Handle both italic and ## markers
        const parts = section.split(/(##[^#]+##|_[^_]+_)/g);

        return (
          <Text key={index} style={styles.responseText}>
            {parts.map((part, i) => {
              if (part.startsWith('##') && part.endsWith('##')) {
                const content = part.slice(2, -2);
                return (
                  <Text key={i} style={styles.highlightedText}>
                    {content}
                  </Text>
                );
              } else if (part.startsWith('_') && part.endsWith('_')) {
                return (
                  <Text key={i} style={styles.italicText}>
                    {part.slice(1, -1)}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        );
      }
    });
  };

  const handleShare = async () => {
    if (!aiResponse) return;

    try {
      await Share.share({
        message: aiResponse,
        url: photo,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

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
            <Text style={styles.loadingText}>تحليل الصورة</Text>
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
            style={[styles.responseContainer, { transform: [{ translateY: responseSlideAnim }] }]}>
            <Text style={styles.responseTitle}>نتيجة الفحص</Text>
            <ScrollView style={styles.responseScroll}>
              {aiResponse && renderStyledResponse(aiResponse)}
            </ScrollView>
          </Animated.View>
        ) : (
          <Animated.Text
            style={[styles.noResponseText, { transform: [{ translateY: responseSlideAnim }] }]}>
            اضغط "تحليل" لتحليل الصورة
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
            <Text style={styles.actionText}>تحليل</Text>
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.cameraButtonContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={retakePicture}>
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <Ionicons name="camera-outline" size={28} color={theme.colors.neutral.gray.dark} />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.cameraText}>اضغط لإعادة التصوير</Text>
        </View>

        {aiResponse && (
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <Ionicons name="share-outline" size={28} color={theme.colors.primary.base} />
              <Text style={styles.actionText}>مشاركة</Text>
            </Animated.View>
          </TouchableOpacity>
        )}
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
    alignItems: 'center',
    width: '85%',
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.large,
    elevation: 6,
    marginBottom: theme.spacing.md,
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
  sectionWrapper: {
    backgroundColor: theme.colors.primary.lighter,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.large,
    marginVertical: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary.base,
    elevation: 3,
  },
  sectionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.title,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.dark,
    textAlign: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  divider: {
    height: 2,
    backgroundColor: theme.colors.primary.light,
    marginVertical: theme.spacing.xs,
  },
  healthReportWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary.lighter,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.large,
    marginVertical: theme.spacing.xs,
    borderWidth: 2,
    borderColor: theme.colors.secondary.light,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  healthReport: {
    flex: 1,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.secondary.dark,
    textAlign: 'right',
    lineHeight: 24,
  },
  carePlanWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.lighter,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.large,
    marginVertical: theme.spacing.xs,
    borderWidth: 2,
    borderColor: theme.colors.primary.light,
    elevation: 2,
  },
  carePlan: {
    flex: 1,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary.dark,
    textAlign: 'right',
  },
  bugControlWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning.lighter,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.large,
    marginVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.warning.light,
  },
  bugControl: {
    flex: 1,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.warning.dark,
    textAlign: 'right',
  },
  mistakesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error.lighter,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.large,
    marginVertical: theme.spacing.xs,
    borderWidth: 2,
    borderColor: theme.colors.error.light,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mistakes: {
    flex: 1,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.error.dark,
    textAlign: 'right',
    lineHeight: 24,
  },
  thrivingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success.lighter,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.large,
    marginVertical: theme.spacing.xs,
    borderWidth: 2,
    borderColor: theme.colors.success.light,
    elevation: 2,
  },
  thriving: {
    flex: 1,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.success.dark,
    textAlign: 'right',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: theme.borderRadius.circle,
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  iconRTL: {
    marginLeft: 0,
    marginRight: theme.spacing.sm,
  },
  italicText: {
    fontStyle: 'italic',
    color: theme.colors.primary.dark,
    fontFamily: theme.fonts.mediumItalic,
    backgroundColor: theme.colors.primary.lighter,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  listContainer: {
    marginVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  numberedListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.neutral.background,
    borderRadius: theme.borderRadius.small,
  },
  numberedText: {
    flex: 1,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
    lineHeight: 24,
  },
  highlightedText: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.dark,
    backgroundColor: theme.colors.primary.lighter,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    marginHorizontal: theme.spacing.xs,
  },
  cameraButtonContainer: {
    alignItems: 'center',
  },
  cameraText: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});

export default PhotoPreviewScreen;
