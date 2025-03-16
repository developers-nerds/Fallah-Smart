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
  RefreshControl,
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

const API_URL = process.env.EXPO_PUBLIC_API_URL; // Update this with your actual API URL

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
  const [currentConversationId, setCurrentConversationId] = useState<number | any>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardTimer = useRef<NodeJS.Timeout | null>(null);
  const [showMessageLimitAlert, setShowMessageLimitAlert] = useState(false);
  const MESSAGE_LIMIT = 20;
  const [refreshing, setRefreshing] = useState(false);

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

  const handleSelectConversation = async (conversationId: string) => {
    toggleSidebar();
    setCurrentConversationId(conversationId);

    try {
      // Fetch messages for the selected conversation
      const response = await fetch(`${API_URL}/messages/${conversationId}`);
      const result = await response.json();

      if (result.success) {
        // Map backend messages to frontend Message format
        const loadedMessages: Message[] = result.data.map((msg: any) => ({
          id: msg.id.toString(),
          text: msg.content,
          isUser: msg.sender === 'user',
          sender: msg.sender as 'user' | 'assistant',
          imageUrl: msg.type === 'image' ? msg.content : undefined,
        }));

        setMessages(loadedMessages);
      } else {
        console.error('Failed to load messages:', result.message);
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    }
  };

  const handleSend = async () => {
    if (messages.length >= MESSAGE_LIMIT) {
      setShowMessageLimitAlert(true);
      setTimeout(() => setShowMessageLimitAlert(false), 3000);
      return;
    }

    if (inputText.trim() || selectedImage) {
      const messageNumber = messages.length + 1;
      let conversationId = currentConversationId;

      // If there's no active conversation and we're past the first message, create a new one
      if (!conversationId && messageNumber > 2) {
        try {
          const conversationNameResponse = await GetConversationName(inputText);
          if (conversationNameResponse.success && conversationNameResponse.parsedData) {
            const tokens = await storage.getTokens();
            if (tokens.access) {
              const result = await createConversationInDB(
                conversationNameResponse.parsedData,
                tokens.access
              );

              if (result.success) {
                conversationId = result.data.data.id;
                setCurrentConversationId(conversationId);
              } else {
                console.error('Failed to create conversation:', result.error);
              }
            }
          }
        } catch (error) {
          console.error('Error creating new conversation:', error);
        }
      }

      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
        imageUrl: selectedImage || undefined,
        sender: 'user',
      };
      setMessages((prev) => [...prev, newMessage]);
      const currentInputText = inputText;
      const currentSelectedImage = selectedImage;
      setInputText('');
      setSelectedImage(null);
      setIsLoading(true);

      try {
        if (!conversationId && messageNumber > 2) {
          throw new Error('لا توجد محادثة نشطة. يرجى بدء محادثة جديدة.');
        }

        // Store user message in database - only from message 2 onwards (which creates message pair)
        if (messageNumber >= 2 && conversationId) {
          const userMessageResponse = await fetch(`${API_URL}/messages/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationId: conversationId,
              content: currentSelectedImage ? currentSelectedImage : currentInputText,
              type: currentSelectedImage ? 'image' : 'text',
              sender: 'user',
            }),
          });
          console.log('userMessageResponse', userMessageResponse);
          if (!userMessageResponse.ok) {
            console.error('Failed to store user message in database');
          }
        }

        // Get AI response
        const response = await sendMessageToGemini(
          currentInputText,
          currentSelectedImage,
          oldRequests,
          'Your parameters here'
        );

        // Store AI response in database - only if we have a valid conversation ID
        if (messageNumber >= 2 && conversationId) {
          const aiMessageResponse = await fetch(`${API_URL}/messages/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationId: conversationId,
              content: response.text,
              type: 'text',
              sender: 'assistant',
            }),
          });
          console.log('aiMessageResponse', JSON.stringify(aiMessageResponse));
          console.log(
            'body',
            JSON.stringify({
              conversationId: conversationId,
              content: response.text,
              type: 'text',
              sender: 'assistant',
            })
          );
          if (!aiMessageResponse.ok) {
            console.error('Failed to store AI message in database');
          }
        }

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: response.text,
          isUser: false,
          sender: 'assistant',
        };
        setMessages((prev) => [...prev, aiResponse]);
        setOldRequests((prev) => `${prev} ${currentInputText}`);
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: 'An error occurred.',
          isUser: false,
          sender: 'assistant',
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
      setCurrentConversationId(0);
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
          if (response.success) {
            setMessages([
              {
                id: Date.now().toString(),
                text: response.text,
                isUser: false,
                sender: 'assistant',
              },
            ]);
            setGreetingSent(true);
          } else {
            setMessages([
              {
                id: Date.now().toString(),
                text: 'عذراً، حدث خطأ في تحميل المحادثة. يرجى المحاولة مرة أخرى.',
                isUser: false,
                sender: 'assistant',
              },
            ]);
          }
        } catch (error) {
          console.error('Error sending greeting:', error);
          setMessages([
            {
              id: Date.now().toString(),
              text: 'عذراً، حدث خطأ في تحميل المحادثة. يرجى المحاولة مرة أخرى.',
              isUser: false,
              sender: 'assistant',
            },
          ]);
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

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);

    try {
      // If we have a conversation ID, refresh messages for that conversation
      if (currentConversationId) {
        const response = await fetch(`${API_URL}/messages/${currentConversationId}`);
        const result = await response.json();

        if (result.success) {
          // Map backend messages to frontend Message format
          const loadedMessages: Message[] = result.data.map((msg: any) => ({
            id: msg.id.toString(),
            text: msg.content,
            isUser: msg.sender === 'user',
            sender: msg.sender as 'user' | 'assistant',
            imageUrl: msg.type === 'image' ? msg.content : undefined,
          }));

          setMessages(loadedMessages);
        } else {
          console.error('Failed to refresh messages:', result.message);
        }
      } else {
        // If no conversation ID (new chat), just reset to initial greeting
        setMessages([]);
        setGreetingSent(false);
      }
    } catch (error) {
      console.error('Error refreshing conversation:', error);
    } finally {
      setRefreshing(false);
    }
  }, [currentConversationId]);

  const resetConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setOldRequests('');
    setGreetingSent(false);
    // Trigger the greeting message again
    sendGreeting(deviceLanguage).then((response) => {
      if (response.success) {
        setMessages([
          {
            id: Date.now().toString(),
            text: response.text,
            isUser: false,
            sender: 'assistant',
          },
        ]);
        setGreetingSent(true);
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={styles.mainContent}>
          <ChatHeader
            onMenuPress={toggleSidebar}
            onResetPress={resetConversation}
            showReset={messages.length > 0}
          />
          <MessageList
            messages={messages}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary.base]}
                tintColor={theme.colors.primary.base}
                title="Refreshing conversation..."
                titleColor={theme.colors.primary.base}
              />
            }
          />
          {(isLoading || isImageLoading) && (
            <View style={styles.loadingContainer}>
              <LoadingAnimation
                message={
                  isNewConversation
                    ? 'بدء محادثة جديدة...'
                    : isImageLoading
                      ? 'جارٍ معالجة صورتك...'
                      : 'جارٍ تجهيز مساعد الزراعة الخاص بك...'
                }
              />
            </View>
          )}
          <MessageAlert
            visible={showMessageLimitAlert}
            message="لقد وصلت إلى الحد الأقصى البالغ 10 رسائل. يرجى بدء محادثة جديدة."
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
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 10,
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
