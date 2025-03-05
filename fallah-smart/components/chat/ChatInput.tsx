import React, { useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Text,
  Platform,
  LayoutAnimation,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onSendImage: () => void;
  onVoiceInput: () => void;
  selectedImage: string | null;
  onCancelImage: () => void;
}

const ChatInput = ({
  value,
  onChangeText,
  onSend,
  onSendImage,
  onVoiceInput,
  selectedImage,
  onCancelImage,
}: ChatInputProps) => {
  // Animation for the image preview
  const imageScaleAnim = React.useRef(new Animated.Value(0)).current;
  const imageOpacityAnim = React.useRef(new Animated.Value(0)).current;
  const cancelButtonAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selectedImage) {
      // Animate image preview when an image is selected
      Animated.parallel([
        Animated.spring(imageScaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(imageOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(cancelButtonAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Reset animations when image is canceled
      Animated.parallel([
        Animated.timing(imageOpacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cancelButtonAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        imageScaleAnim.setValue(0);
      });
    }
  }, [selectedImage]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [selectedImage]);

  const handleCancelImage = () => {
    // Animate before calling the cancel function
    Animated.parallel([
      Animated.timing(imageOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cancelButtonAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onCancelImage();
    });
  };

  const handleSubmitEditing = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    if (value.trim() || selectedImage) {
      onSend();
    }
  };

  return (
    <View style={styles.container}>
      {selectedImage && (
        <Animated.View
          style={[
            styles.imagePreviewContainer,
            {
              transform: [{ scale: imageScaleAnim }],
              opacity: imageOpacityAnim,
            },
          ]}>
          <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          <Animated.View
            style={[
              styles.imageInfoContainer,
              {
                opacity: imageOpacityAnim,
              },
            ]}>
            <Text style={styles.imageInfoText}>Image ready to send</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.cancelButtonContainer,
              {
                transform: [
                  { scale: cancelButtonAnim },
                  {
                    translateY: cancelButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
                opacity: cancelButtonAnim,
              },
            ]}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelImage}
              activeOpacity={0.7}>
              <MaterialIcons name="cancel" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.neutral.gray.base}
          multiline={Platform.OS === 'ios'}
          blurOnSubmit={true}
          onSubmitEditing={handleSubmitEditing}
          returnKeyType="send"
          textAlignVertical="center"
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={onSendImage}
            style={[styles.iconButton, selectedImage ? styles.iconButtonActive : null]}>
            <MaterialIcons
              name="image"
              size={24}
              color={selectedImage ? theme.colors.primary.base : theme.colors.accent.base}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onVoiceInput} style={styles.iconButton}>
            <MaterialIcons name="mic" size={24} color={theme.colors.primary.base} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSend}
            style={[
              styles.sendButton,
              !value.trim() && !selectedImage && styles.sendButtonDisabled,
            ]}
            disabled={!value.trim() && !selectedImage}>
            <MaterialIcons
              name="send"
              size={24}
              color={
                value.trim() || selectedImage
                  ? theme.colors.neutral.surface
                  : theme.colors.neutral.gray.base
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
    width: '100%',
    position: 'relative',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 50,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xs : 0,
  },
  imagePreviewContainer: {
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 2,
    borderColor: theme.colors.accent.base,
  },
  imageInfoContainer: {
    position: 'absolute',
    bottom: -20,
    backgroundColor: theme.colors.primary.light,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  imageInfoText: {
    color: theme.colors.primary.dark,
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
  },
  cancelButtonContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  cancelButton: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 20,
    padding: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.OS === 'ios' ? theme.spacing.sm : theme.spacing.xs,
    color: theme.colors.neutral.textPrimary,
    marginRight: theme.spacing.sm,
    maxHeight: 100,
    minHeight: 40,
    textAlignVertical: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 0 : theme.spacing.xs,
  },
  iconButton: {
    marginHorizontal: theme.spacing.xs,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  iconButtonActive: {
    backgroundColor: theme.colors.primary.light,
  },
  sendButton: {
    backgroundColor: theme.colors.primary.base,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.neutral.gray.light,
  },
});

export default ChatInput;
