import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Message } from '../../types/chat';
import {
  MaterialIcons,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  Entypo,
  FontAwesome,
} from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { theme } from '../../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

// Text processing utilities
const processMessageText = (text: string) => {
  // Handle data:image URLs by replacing them with [Image]
  // This regex matches the entire data:image URL pattern
  text = text.replace(/data:image\/[^;]+;base64,[a-zA-Z0-9+/=]+/g, '[Image]');

  // Remove any "||" characters
  text = text.replace(/\|\|/g, '');

  // Remove single asterisks that are not part of formatting
  text = text.replace(/(?<!\*)\*(?!\*)/g, '');

  // Remove question mark prefixes like "? _substrate_" or "? >>"
  text = text.replace(/\?\s+(_.*?_|\s*>>)/g, '');

  // Remove standalone "**" that aren't part of formatting
  text = text.replace(/(?<!\*)\*\*(?!\w)/g, '');
  text = text.replace(/(?<!\w)\*\*(?!\*)/g, '');

  let lastIndex = 0;
  const segments: any[] = [];

  // Regular expressions for different patterns
  const patterns = [
    {
      regex: /##(.*?)##/g,
      type: 'heading',
    },
    {
      regex: /\*\*_Key Point_\*\*/g,
      type: 'keypoint',
    },
    {
      regex: />>([^]*?)(?=>>|$)/g, // Pattern for action steps
      type: 'action',
    },
    {
      regex: /\[(.*?)\]/g, // Pattern for fun facts - will be processed differently
      type: 'funfact',
    },
    {
      regex: /\*\*(.*?)\*\*/g,
      type: 'title',
    },
  ];

  // Sort text by finding all matches and their positions
  let allMatches: any[] = [];
  patterns.forEach((pattern) => {
    let match;
    const regex = new RegExp(pattern.regex);
    while ((match = regex.exec(text)) !== null) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        content: match[1] || match[0],
        type: pattern.type,
      });
    }
  });

  // Sort matches by their position in text
  allMatches.sort((a, b) => a.index - b.index);

  // Process matches in order
  allMatches.forEach((match) => {
    // Add any regular text before this match
    if (match.index > lastIndex) {
      segments.push({
        type: 'regular',
        content: text.slice(lastIndex, match.index).trim(),
      });
    }

    // Add the matched segment with proper cleaning
    segments.push({
      type: match.type,
      content: match.content.replace(/##|(\*\*_)|(_\*\*)|(\*\*>>)|\[|\]|>>/g, '').trim(),
    });

    lastIndex = match.index + match.length;
  });

  // Add any remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'regular',
      content: text.slice(lastIndex).trim(),
    });
  }

  return segments;
};

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const imageScaleAnim = useRef(new Animated.Value(0.8)).current;
  const speakButtonAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const actionPulseAnim = useRef(new Animated.Value(1)).current;
  const funFactPulseAnim = useRef(new Animated.Value(1)).current;

  // State for image loading
  const [imageLoading, setImageLoading] = useState(!!message.imageUrl);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Get screen width for responsive image sizing
  const screenWidth = Dimensions.get('window').width;
  const imageWidth = Math.min(screenWidth * 0.85, 300);

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Scale up
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      // Bounce effect for the speaker button
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 3,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    // Speak button animation
    Animated.timing(speakButtonAnim, {
      toValue: 1,
      duration: 500,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Shimmer animation for loading state
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Image specific animation
    if (message.imageUrl) {
      Animated.spring(imageScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }

    // Subtle pulse animations for action and fun fact containers
    Animated.loop(
      Animated.sequence([
        Animated.timing(actionPulseAnim, {
          toValue: 1.03,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(actionPulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(funFactPulseAnim, {
          toValue: 1.03,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(funFactPulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [
    fadeAnim,
    scaleAnim,
    bounceAnim,
    imageScaleAnim,
    speakButtonAnim,
    shimmerAnim,
    actionPulseAnim,
    funFactPulseAnim,
    message.imageUrl,
  ]);

  const speakMessage = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(message.text, {
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }

    // Add a small bounce animation when speaking
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 3,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const renderTextSegment = (segment: { type: string; content: string }, index: number) => {
    switch (segment.type) {
      case 'heading':
        return (
          <View key={index} style={styles.headingContainer}>
            <View style={styles.headingBackground}>
              <FontAwesome name="leaf" size={18} color="#fff" style={styles.headingIcon} />
              <Text style={styles.headingText}>{segment.content}</Text>
            </View>
          </View>
        );
      case 'keypoint':
        return (
          <View key={index} style={styles.keypointContainer}>
            <View style={styles.keypointIconContainer}>
              <FontAwesome5 name="seedling" size={14} color="#fff" />
            </View>
            <Text style={styles.keypointText}>{segment.content}</Text>
          </View>
        );
      case 'action':
        return (
          <Animated.View
            key={index}
            style={[
              styles.actionContainer,
              {
                transform: [{ scale: actionPulseAnim }],
              },
            ]}>
            <View style={styles.actionIconWrapper}>
              <FontAwesome5 name="hand-point-right" size={16} color="#fff" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>DO THIS</Text>
              <Text style={styles.actionText}>{segment.content.trim()}</Text>
            </View>
          </Animated.View>
        );
      case 'funfact':
        return (
          <Animated.View
            key={index}
            style={[
              styles.funFactContainer,
              {
                transform: [{ scale: funFactPulseAnim }],
              },
            ]}>
            <View style={styles.funFactIconWrapper}>
              <FontAwesome5 name="lightbulb" size={16} color="#fff" />
            </View>
            <View style={styles.funFactTextContainer}>
              <Text style={styles.funFactTitle}>Good to Know</Text>
              <Text style={styles.funFactText}>{segment.content}</Text>
            </View>
          </Animated.View>
        );
      case 'title':
        return (
          <View key={index} style={styles.titleContainer}>
            <FontAwesome5
              name="wheat"
              size={16}
              color={theme.colors.primary.base}
              style={styles.titleIcon}
            />
            <Text style={styles.titleText}>{segment.content}</Text>
          </View>
        );
      default:
        return (
          <Text key={index} style={styles.regularText}>
            {segment.content}
          </Text>
        );
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}>
      {message.imageUrl && (
        <Animated.View
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: imageScaleAnim }],
            },
          ]}>
          <Image
            source={{ uri: message.imageUrl }}
            style={[styles.image, { width: imageWidth, height: imageWidth * 0.75 }]}
            onLoad={handleImageLoad}
          />
          {imageLoading && (
            <View style={styles.imageLoadingOverlay}>
              <Animated.View
                style={{
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                }}>
                <MaterialIcons name="image" size={24} color={theme.colors.neutral.gray.base} />
              </Animated.View>
            </View>
          )}
        </Animated.View>
      )}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
          },
        ]}>
        {processMessageText(message.text).map((segment, index) =>
          renderTextSegment(segment, index)
        )}
      </Animated.View>
      <Animated.View
        style={[
          styles.speakButtonContainer,
          {
            opacity: speakButtonAnim,
            transform: [
              {
                translateY: speakButtonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}>
        <TouchableOpacity onPress={speakMessage} style={styles.speakButton} activeOpacity={0.7}>
          <View style={styles.speakButtonBackground}>
            <Animated.View
              style={{
                transform: [{ scale: bounceAnim }],
              }}>
              <FontAwesome5
                name={isSpeaking ? 'volume-mute' : 'volume-up'}
                size={16}
                color="#fff"
              />
            </Animated.View>
          </View>
        </TouchableOpacity>
        <Text style={styles.speakButtonText}>{isSpeaking ? 'Stop' : 'Listen'}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.large,
    maxWidth: '100%',
    backgroundColor: theme.colors.neutral.surface,
    ...theme.shadows.medium,
    marginVertical: theme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary.base,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: theme.colors.primary.base,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
      : {
          elevation: 4,
        }),
  },
  textContainer: {
    flexDirection: 'column',
  },
  regularText: {
    color: theme.colors.neutral.textPrimary,
    fontSize: theme.fontSizes.body + 2, // Increased font size for better readability
    fontFamily: theme.fonts.regular,
    lineHeight: 24, // Increased line height for better readability
    marginVertical: 6,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: `${theme.colors.primary.light}10`,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary.base,
  },
  titleIcon: {
    marginRight: theme.spacing.sm,
  },
  titleText: {
    color: theme.colors.primary.dark,
    fontSize: theme.fontSizes.body * 1.2,
    fontFamily: theme.fonts.medium,
    fontWeight: '600',
    lineHeight: 24,
    flex: 1,
  },
  imageContainer: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    position: 'relative',
    ...theme.shadows.small,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: `${theme.colors.primary.light}30`,
  },
  image: {
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.neutral.gray.light,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  speakButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: theme.spacing.md,
  },
  speakButton: {
    borderRadius: 25,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  speakButtonBackground: {
    padding: theme.spacing.sm,
    borderRadius: 25,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.accent.base,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: theme.colors.accent.dark,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        }
      : {}),
  },
  speakButtonText: {
    color: theme.colors.neutral.textSecondary,
    fontSize: theme.fontSizes.caption + 1,
    marginLeft: theme.spacing.xs,
    fontFamily: theme.fonts.medium,
  },
  headingContainer: {
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  headingBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.primary.base,
  },
  headingIcon: {
    marginRight: theme.spacing.sm,
  },
  headingText: {
    color: '#fff',
    fontSize: theme.fontSizes.body * 1.3,
    fontFamily: theme.fonts.medium,
    fontWeight: '600',
  },
  keypointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary.light}15`,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: `${theme.colors.primary.light}30`,
    ...theme.shadows.small,
  },
  keypointIconContainer: {
    backgroundColor: theme.colors.primary.base,
    padding: theme.spacing.sm,
    borderRadius: 20,
    height: 36,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  keypointText: {
    color: theme.colors.primary.dark,
    fontSize: theme.fontSizes.body + 1,
    fontFamily: theme.fonts.medium,
    flex: 1,
    lineHeight: 22,
  },
  actionContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginVertical: theme.spacing.md,
    borderLeftWidth: 0,
    ...theme.shadows.medium,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: theme.colors.primary.base,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        }
      : {
          elevation: 3,
        }),
  },
  actionIconWrapper: {
    backgroundColor: theme.colors.primary.base,
    padding: theme.spacing.sm,
    borderRadius: 12,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    ...theme.shadows.small,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    color: theme.colors.primary.base,
    fontSize: theme.fontSizes.caption + 1,
    fontFamily: theme.fonts.bold,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionText: {
    color: theme.colors.neutral.textPrimary,
    fontSize: theme.fontSizes.body + 1,
    fontFamily: theme.fonts.medium,
    lineHeight: 22,
  },
  funFactContainer: {
    flexDirection: 'row',
    backgroundColor: `${theme.colors.accent.light}10`,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginVertical: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent.base,
    ...theme.shadows.small,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: theme.colors.accent.light,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }
      : {
          elevation: 2,
        }),
  },
  funFactIconWrapper: {
    backgroundColor: theme.colors.accent.base,
    padding: theme.spacing.sm,
    borderRadius: 20,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  funFactTextContainer: {
    flex: 1,
  },
  funFactTitle: {
    color: theme.colors.accent.base,
    fontSize: theme.fontSizes.caption + 1,
    fontFamily: theme.fonts.bold,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  funFactText: {
    color: theme.colors.neutral.textPrimary,
    fontSize: theme.fontSizes.body + 1,
    fontFamily: theme.fonts.medium,
    lineHeight: 22,
  },
});

export default ChatMessage;
