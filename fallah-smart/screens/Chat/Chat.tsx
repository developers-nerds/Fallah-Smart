import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Message } from '../../types/chat';
import * as ImagePicker from 'expo-image-picker';
import * as Localization from 'expo-localization';
import * as Speech from 'expo-speech';

// Import our new components
import ChatInput from '../../components/chat/ChatInput';
import MessageList from '../../components/chat/MessageList';
import ChatHeader from '../../components/chat/ChatHeader';
import VoiceRecognitionService from '../../components/chat/VoiceRecognitionService';
import { sendMessageToGemini, sendGreeting } from '../../components/chat/ChatApiService';
import { theme } from '../../theme/theme';
import ConversationSidebar from '../../components/chat/ConversationSidebar';
import SidebarOverlay from '../../components/chat/SidebarOverlay';
import LoadingAnimation from '../../components/chat/LoadingAnimation';

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [oldRequests, setOldRequests] = useState<string>('');
  const [greetingSent, setGreetingSent] = useState(false);
  const deviceLanguage = Localization.locale;
  const [language, setLanguage] = useState<string>('');
  const myParams = 'Your parameters here';
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isNewConversation, setIsNewConversation] = useState(false);

  const toggleSidebar = () => {
    if (sidebarVisible) {
      // Close sidebar with animation
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setSidebarVisible(false);
      });
    } else {
      // Open sidebar with animation
      setSidebarVisible(true);
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    // In a real app, you would load the selected conversation here
    console.log(`Selected conversation: ${conversationId}`);
    // For now, just close the sidebar
    toggleSidebar();
  };

  const handleSend = async () => {
    if (inputText.trim() || selectedImage) {
      // Add user message to chat
      const newMessage = {
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
        imageUrl: selectedImage || undefined,
      };
      setMessages((prev) => [...prev, newMessage]);

      // Clear input and image
      const currentInputText = inputText;
      const currentSelectedImage = selectedImage;
      setInputText('');
      setSelectedImage(null);

      setIsLoading(true);

      try {
        // Send message to API
        const response = await sendMessageToGemini(
          currentInputText,
          currentSelectedImage,
          oldRequests,
          myParams
        );

        // Add AI response to chat
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          text: response.text,
          isUser: false,
        };

        setMessages((prev) => [...prev, aiResponse]);
        setOldRequests((prev) => `${prev} ${currentInputText}`);
      } catch (error) {
        console.error('Error sending message:', error);

        // Add error message to chat
        const errorMessage = {
          id: (Date.now() + 2).toString(),
          text: 'An error occurred while fetching data.',
          isUser: false,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePickImage = async () => {
    try {
      // Show loading state
      setIsImageLoading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Slightly reduced quality for better performance
        base64: true,
      });

      if (!result.canceled) {
        // Create the base64 image URI
        const imageUri = `data:image/jpeg;base64,${result.assets[0].base64}`;

        // Set the selected image with animation handled in the component
        setSelectedImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      // You could add error handling UI here if needed
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleNewConversation = () => {
    // Show loading animation and set new conversation flag
    setIsLoading(true);
    setIsNewConversation(true);

    // Use a timeout to create a nice transition effect
    setTimeout(() => {
      setMessages([]);
      setOldRequests('');
      setSelectedImage(null);
      setGreetingSent(false); // Reset greeting so it will be sent again

      // The greeting will be sent automatically due to the useEffect
    }, 800); // Short delay for better UX
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInputText(transcript);
  };

  const handleCancelImage = () => {
    // Add a small fade-out animation before clearing the image
    const tempImage = selectedImage;
    if (tempImage) {
      setSelectedImage(null);
    }
  };

  // Send greeting message when component mounts
  useEffect(() => {
    if (!greetingSent) {
      const sendFirstMessage = async () => {
        setIsLoading(true);
        try {
          const response = await sendGreeting(deviceLanguage);

          const aiResponse = {
            id: Date.now().toString(),
            text: response.text,
            isUser: false,
          };

          setMessages([aiResponse]);
          setGreetingSent(true);
        } catch (error) {
          console.error('Error sending greeting:', error);

          const errorMessage = {
            id: Date.now().toString(),
            text: 'An error occurred while fetching data.',
            isUser: false,
          };
          setMessages([errorMessage]);
        } finally {
          setIsLoading(false);
          setIsNewConversation(false); // Reset the new conversation flag
        }
      };

      sendFirstMessage();
    }
  }, [greetingSent, deviceLanguage]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}>
        <ChatHeader onNewConversation={handleNewConversation} onTitlePress={toggleSidebar} />

        <MessageList messages={messages} />

        {/* Loading indicator */}
        {(isLoading || isImageLoading) && (
          <View style={styles.loadingContainer}>
            <LoadingAnimation
              message={
                isNewConversation
                  ? 'Starting a fresh conversation...'
                  : isImageLoading
                    ? 'Processing your image...'
                    : 'Preparing your farming assistant...'
              }
            />
          </View>
        )}

        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onSendImage={handlePickImage}
          onVoiceInput={() => {}}
          selectedImage={selectedImage}
          onCancelImage={handleCancelImage}
        />

        <VoiceRecognitionService onTranscriptReceived={handleVoiceTranscript} />

        {/* Sidebar and Overlay */}
        <SidebarOverlay
          isVisible={sidebarVisible}
          onClose={toggleSidebar}
          opacity={overlayOpacity}
        />
        <ConversationSidebar
          isVisible={sidebarVisible}
          onClose={toggleSidebar}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: 10,
  },
});

export default ChatScreen;
