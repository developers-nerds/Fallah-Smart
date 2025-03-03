import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Message } from '../../types/chat';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { theme } from '../../theme/theme';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const imageScaleAnim = useRef(new Animated.Value(0.8)).current;

  // State for image loading
  const [imageLoading, setImageLoading] = useState(!!message.imageUrl);

  // Get screen width for responsive image sizing
  const screenWidth = Dimensions.get('window').width;
  const imageWidth = Math.min(screenWidth * 0.7, 250);

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

    // Image specific animation
    if (message.imageUrl) {
      Animated.spring(imageScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [fadeAnim, scaleAnim, bounceAnim, imageScaleAnim, message.imageUrl]);

  const speakMessage = () => {
    Speech.speak(message.text);
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
              <MaterialIcons name="image" size={24} color={theme.colors.neutral.gray.base} />
            </View>
          )}
        </Animated.View>
      )}
      <Animated.Text
        style={[
          styles.text,
          {
            opacity: fadeAnim,
          },
        ]}>
        {message.text}
      </Animated.Text>
      <TouchableOpacity onPress={speakMessage} style={styles.speakButton}>
        <Animated.View
          style={{
            transform: [{ scale: bounceAnim }],
          }}>
          <MaterialIcons name="volume-up" size={18} color={theme.colors.accent.base} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    maxWidth: '100%',
    backgroundColor: theme.colors.neutral.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    color: theme.colors.neutral.textPrimary,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    lineHeight: 22,
  },
  imageContainer: {
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    position: 'relative',
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
  speakButton: {
    alignSelf: 'flex-end',
    padding: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
});

export default ChatMessage;
