import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Keyboard,
  LayoutAnimation,
} from 'react-native';
import { Message } from '../../types/chat';
import * as ImagePicker from 'expo-image-picker';
import * as Localization from 'expo-localization';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../../navigation/sideBar';
import ChatInput from '../../components/chat/ChatInput';
import MessageList from '../../components/chat/MessageList';
import ChatHeader from '../../components/chat/ChatHeader';
import VoiceRecognitionService from '../../components/chat/VoiceRecognitionService';
import { sendMessageToGemini, sendGreeting } from '../../components/chat/ChatApiService';
import { theme } from '../../theme/theme';
import ConversationSidebar from '../../components/chat/ConversationSidebar';
import SidebarOverlay from '../../components/chat/SidebarOverlay';
import LoadingAnimation from '../../components/chat/LoadingAnimation';
import MessageAlert from '../../components/chat/MessageAlert';
import { GetConversationName, createConversationInDB } from '../../utils/buildConversations';
import { storage } from '../../utils/storage';

type ChatScreenProps = {
  navigation: DrawerNavigationProp<DrawerParamList, 'Chat'>;
};

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [oldRequests, setOldRequests] = useState<string>('');
  const [greetingSent, setGreetingSent] = useState(false);
  const deviceLanguage = Localization.locale;
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardTimer = useRef<NodeJS.Timeout | null>(null);
  const [showMessageLimitAlert, setShowMessageLimitAlert] = useState(false);
  const MESSAGE_LIMIT = 10;

  const toggleSidebar = () => {
    if (sidebarVisible) {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setSidebarVisible(false));
    } else {
      setSidebarVisible(true);
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    console.log(`Selected conversation: ${conversationId}`);
    toggleSidebar();
  };

  const handleSend = async () => {
    if (messages.length >= MESSAGE_LIMIT) {
      setShowMessageLimitAlert(true);
      setTimeout(() => setShowMessageLimitAlert(false), 3000);
      return;
    }

    if (inputText.trim() || selectedImage) {
      const messageNumber = messages.length + 1;
      console.log(
        `Message number: ${messageNumber} ${messageNumber === 1 ? '(First message!)' : ''}`
      );

      // Special handling for second message
      if (messageNumber === 2) {
        console.log('Second message detected!');
        console.log('Message content:', inputText);
        try {
          const conversationNameResponse = await GetConversationName(inputText);
          if (conversationNameResponse.success && conversationNameResponse.parsedData) {
            console.log('Conversation name response:', conversationNameResponse.text);

            // Get the access token
            const tokens = await storage.getTokens();
            if (tokens.accessToken) {
              // Create the conversation in the database
              const result = await createConversationInDB(
                conversationNameResponse.parsedData,
                tokens.accessToken
              );

              if (result.success) {
                console.log('Conversation created successfully:', result.data);
              } else {
                console.error('Failed to create conversation:', result.error);
              }
            }
          }
        } catch (error) {
          console.error('Error getting conversation name:', error);
        }
      }

      const newMessage = {
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
        imageUrl: selectedImage || undefined,
      };
      setMessages((prev) => [...prev, newMessage]);
      const currentInputText = inputText;
      const currentSelectedImage = selectedImage;
      setInputText('');
      setSelectedImage(null);
      setIsLoading(true);

      try {
        const response = await sendMessageToGemini(
          currentInputText,
          currentSelectedImage,
          oldRequests,
          'Your parameters here'
        );
        const aiResponse = { id: (Date.now() + 1).toString(), text: response.text, isUser: false };
        setMessages((prev) => [...prev, aiResponse]);
        setOldRequests((prev) => `${prev} ${currentInputText}`);
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = {
          id: (Date.now() + 2).toString(),
          text: 'An error occurred.',
          isUser: false,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePickImage = async () => {
    setIsImageLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled) {
        const imageUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setSelectedImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleNewConversation = () => {
    setIsLoading(true);
    setIsNewConversation(true);
    setTimeout(() => {
      setMessages([]);
      setOldRequests('');
      setSelectedImage(null);
      setGreetingSent(false);
    }, 800);
  };

  const handleVoiceTranscript = (transcript: string) => setInputText(transcript);
  const handleCancelImage = () => setSelectedImage(null);

  useEffect(() => {
    if (!greetingSent) {
      const sendFirstMessage = async () => {
        setIsLoading(true);
        try {
          const response = await sendGreeting(deviceLanguage);
          const aiResponse = { id: Date.now().toString(), text: response.text, isUser: false };
          setMessages([aiResponse]);
          setGreetingSent(true);
        } catch (error) {
          console.error('Error sending greeting:', error);
          setMessages([{ id: Date.now().toString(), text: 'An error occurred.', isUser: false }]);
        } finally {
          setIsLoading(false);
          setIsNewConversation(false);
        }
      };
      sendFirstMessage();
    }
  }, [greetingSent, deviceLanguage]);

  useEffect(() => {
    const keyboardWillShow = (event: any) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardHeight(event.endCoordinates.height);
    };

    const keyboardWillHide = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardHeight(0);
    };

    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      keyboardWillShow
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      keyboardWillHide
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={styles.mainContent}>
          <ChatHeader onNewConversation={handleNewConversation} onTitlePress={toggleSidebar} />
          <MessageList messages={messages} />
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
          <MessageAlert
            visible={showMessageLimitAlert}
            message="You've reached the maximum limit of 5 messages. Please start a new conversation."
            type="warning"
          />
          <View style={styles.inputContainer}>
            <ChatInput
              value={inputText}
              onChangeText={setInputText}
              onSend={handleSend}
              onSendImage={handlePickImage}
              onVoiceInput={() => {}}
              selectedImage={selectedImage}
              onCancelImage={handleCancelImage}
            />
          </View>
        </View>

        <VoiceRecognitionService onTranscriptReceived={handleVoiceTranscript} />
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
    backgroundColor: theme.colors.neutral.surface,
  },
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 90 : 80,
  },
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 100 : 90,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 25 : 0,
    backgroundColor: theme.colors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 1,
  },
});

export default ChatScreen;
