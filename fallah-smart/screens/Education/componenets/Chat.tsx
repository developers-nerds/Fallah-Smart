import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  Keyboard,
  Pressable,
  PanResponder,
} from 'react-native';
import { theme } from '../../../theme/theme';
import { MaterialCommunityIcons, Ionicons, AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { getCurrentUser, getUserData } from '../utils/userProgress';
import { sendMessageToGemini } from '../../../components/chat/ChatApiService';
import { LinearGradient } from 'expo-linear-gradient';
// TODO: Install this package via: expo install expo-haptics
// import * as Haptics from 'expo-haptics';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const GEMINI_API_KEY = "AIzaSyBylRkyhIq5I7Ti0118SpIh6qCOLPk-dt8";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const { width } = Dimensions.get('window');

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  userId: number;
}

interface User {
  id: number;
  username: string;
  profilePicture?: string;
}

// Helper function to process image URLs
const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) {
    return 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
  }
  
  // Handle already complete URLs
  if (imageUrl.startsWith('http')) {
    // If it's a local development URL, replace with BASE_URL
    if (imageUrl.match(/http:\/\/\d+\.\d+\.\d+\.\d+:\d+/)) {
      return imageUrl.replace(/http:\/\/\d+\.\d+\.\d+\.\d+:\d+/, BASE_URL);
    }
    // Otherwise return as is (it's already a complete URL)
    return imageUrl;
  }
  
  // Handle relative URLs
  if (imageUrl.startsWith('/')) {
    return `${BASE_URL}${imageUrl}`;
  }
  
  // Default case - prepend BASE_URL
  return `${BASE_URL}/${imageUrl}`;
};

// Helper function to get a valid image URL or fallback to default
const getValidProfileImage = (url?: string): string => {
  if (!url || url === 'undefined' || url === 'null') {
    return 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
  }
  return url;
};

const Chat = ({ visible = true }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{username: string, profilePicture: string} | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputBoxAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const typingDots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [messageActionVisible, setMessageActionVisible] = useState(false);
  const actionMenuAnim = useRef(new Animated.Value(0)).current;
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [swipedMessageId, setSwipedMessageId] = useState<number | null>(null);
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const deleteButtonAnim = useRef(new Animated.Value(0)).current;

  // Function to animate typing dots
  const animateTypingDots = () => {
    const animations = typingDots.map((dot, index) => {
      return Animated.sequence([
        Animated.timing(dot, {
          toValue: -5,
          duration: 300,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.loop(
      Animated.stagger(150, animations)
    ).start();
  };

  useEffect(() => {
    if (isSending) {
      animateTypingDots();
    }
  }, [isSending]);

  // Add animation effects
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Add keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        scrollToBottom();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Animation for input box focus
  const handleInputFocus = () => {
    Animated.spring(inputBoxAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  const handleInputBlur = () => {
    Animated.spring(inputBoxAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  // Load current user and profile on component mount
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        // Get the authenticated user
        const user = await getCurrentUser();
        setCurrentUser(user);
        console.log("Current user loaded:", user);

        // Get the user profile data (username, profilePicture)
        const profileData = await getUserData();
        if (profileData) {
          console.log("User profile loaded:", profileData);
          console.log("Profile picture URL:", profileData.profilePicture);
          setUserProfile(profileData);
        } else {
          console.warn("Could not load user profile data");
        }
      } catch (error) {
        console.error('Error loading user information:', error);
        Alert.alert('خطأ', 'فشل في تحميل معلومات المستخدم');
      }
    };

    loadUserInfo();
  }, []);

  // Load messages when user is available
  useEffect(() => {
    if (currentUser) {
      loadMessages();
    }
  }, [currentUser]);

  // Load messages from the API
  const loadMessages = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/education/chat/latest/${currentUser.id}`);
      setMessages(response.data);
      
      // If no messages, add a greeting
      if (response.data.length === 0) {
        sendBotMessage('مرحبا! كيف يمكنني مساعدتك في تعلم الزراعة اليوم؟');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('خطأ', 'فشل في تحميل الرسائل');
      
      // Add a fallback greeting if loading fails
      setMessages([{
        id: 0,
        text: 'مرحبا! كيف يمكنني مساعدتك في تعلم الزراعة اليوم؟',
        isBot: true,
        timestamp: new Date(),
        userId: currentUser?.id || 0
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send a bot message using Gemini AI
  const sendBotMessage = async (text: string) => {
    if (!currentUser) return;
    
    // Create a bot message with temporary ID
    const tempBotMessage = {
      id: Date.now(),
      text: text,
      isBot: true,
      timestamp: new Date(),
      userId: currentUser.id
    };
    
    // Update UI immediately
    setMessages(prev => [...prev, tempBotMessage]);
    
    try {
      // Send bot message to server
      const response = await axios.post(`${API_URL}/education/chat`, {
        text: text,
        isBot: true,
        userId: currentUser.id
      });
      
      // Replace temp message with actual one from server
      setMessages(prev => 
        prev.map(msg => msg.id === tempBotMessage.id ? response.data : msg)
      );
    } catch (error) {
      console.error('Error saving bot message:', error);
    }
  };

  // Get AI response from Gemini API
  const getGeminiResponse = async (userMessage: string): Promise<string> => {
    try {
      // Get username for personalized response
      const username = userProfile?.username || 'مستخدم';
      
      console.log("Getting AI response from Gemini for user:", username);
      
      // Use ChatApiService to send message to Gemini
      const oldMessages = messages
        .slice(-3) // Get last 3 messages for context
        .map(msg => msg.text)
        .join(' || ');
      
      // Include context about agriculture and the username
      const params = `
        You are an AI assistant specializing in agriculture, farming, crops, and livestock.
        You will respond to the user ${username} in Arabic.
        Keep answers concise, informative, and focused on agriculture.
        Always be friendly and helpful.
      `;
      
      console.log("Sending request to Gemini API using ChatApiService");
      
      // Call ChatApiService
      const response = await sendMessageToGemini(userMessage, null, oldMessages, params);
      
      if (response.success) {
        console.log("Received successful response from Gemini API");
        return response.text;
      } else {
        console.error("Failed to get response from Gemini API");
        return 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.';
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      return 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.';
    }
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  // Send user message with haptic feedback
  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser) return;
    
    // Add haptic feedback (commented until package is installed)
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setIsSending(true);
    
    // Create temporary message for immediate display
    const tempUserMessage = {
      id: Date.now(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
      userId: currentUser.id
    };
    
    // Store the message text before clearing input
    const messageText = inputText;
    
    // Update UI immediately
    setMessages(prev => [...prev, tempUserMessage]);
    setInputText('');
    
    // Scroll to bottom
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    try {
      // Send user message to our API
      const response = await axios.post(`${API_URL}/education/chat`, {
        text: messageText,
        isBot: false,
        userId: currentUser.id
      });
      
      // Replace temp message with actual one from server
      setMessages(prev => 
        prev.map(msg => msg.id === tempUserMessage.id ? response.data : msg)
      );
      
      // Show typing indicator
      setIsSending(true);
      
      // Get AI response from Gemini
      const aiResponse = await getGeminiResponse(messageText);
      
      // Send bot response to save it
      sendBotMessage(aiResponse);
      
      // Add success haptic feedback (commented until package is installed)
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('خطأ', 'فشل في إرسال الرسالة');
      
 
      
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  // Handle long press on a message
  const handleLongPress = (messageId: number) => {
    // Only allow deleting user messages
    const message = messages.find(msg => msg.id === messageId);
    if (message && !message.isBot) {
      // Add haptic feedback (commented until package is installed)
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Check if any message has an open menu and close it first
      if (messageActionVisible) {
        closeActionMenu();
        
        // Add a small delay before opening the new menu to avoid animation conflicts
        setTimeout(() => {
          setSelectedMessage(messageId);
          setMessageActionVisible(true);
          
          // Animate the action menu
          Animated.spring(actionMenuAnim, {
            toValue: 1,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }, 100);
      } else {
        setSelectedMessage(messageId);
        setMessageActionVisible(true);
        
        // Animate the action menu
        Animated.spring(actionMenuAnim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }
      
      // Auto-close menu after 3 seconds of inactivity
      const autoCloseTimer = setTimeout(() => {
        closeActionMenu();
      }, 3000);
      
      // Clear the timer if component unmounts or menu closes manually
      return () => clearTimeout(autoCloseTimer);
    }
  };

  // Close action menu
  const closeActionMenu = () => {
    Animated.timing(actionMenuAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setMessageActionVisible(false);
      setSelectedMessage(null);
    });
  };

  // Delete message with confirmation
  const confirmDeleteMessage = async () => {
    if (!currentUser || !selectedMessage) return;
    
    // Add haptic feedback (commented until package is installed)
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await axios.delete(`${API_URL}/education/chat/${selectedMessage}`, {
        data: { userId: currentUser.id }
      });
      
      // Update UI
      setMessages(prev => prev.filter(msg => msg.id !== selectedMessage));
      
      // Add feedback (commented until package is installed)
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Close menu
      closeActionMenu();
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('خطأ', 'فشل في حذف الرسالة');
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Clear chat history
  const clearHistory = async () => {
    if (!currentUser) return;
    
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد أنك تريد حذف جميع رسائل المحادثة؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'حذف الكل',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/education/chat/clear/${currentUser.id}`);
              setMessages([]);
              
              // Add a welcome message after clearing
              setTimeout(() => {
                sendBotMessage('تم حذف المحادثة. كيف يمكنني مساعدتك اليوم؟');
              }, 500);
            } catch (error) {
              console.error('Error clearing chat history:', error);
              Alert.alert('خطأ', 'فشل في حذف سجل المحادثة');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show delete button for user message on hover/press
  const handleMessagePress = (messageId: number, isBot: boolean) => {
    if (!isBot) {
      setHoveredMessageId(messageId === hoveredMessageId ? null : messageId);
    }
  };

  // Reset any swiped messages when new messages arrive
  useEffect(() => {
    if (swipedMessageId) {
      resetSwipe();
    }
  }, [messages.length]);

  // Reset swipe state
  const resetSwipe = () => {
    Animated.timing(swipeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSwipedMessageId(null);
      Animated.timing(deleteButtonAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });
  };

  // Delete message function
  const deleteMessage = async (messageId: number) => {
    if (!currentUser) return;
    
    // Add haptic feedback (commented until package is installed)
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await axios.delete(`${API_URL}/education/chat/${messageId}`, {
        data: { userId: currentUser.id }
      });
      
      // Update UI
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      resetSwipe();
      
      // Add feedback (commented until package is installed)
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('خطأ', 'فشل في حذف الرسالة');
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Create pan responder for message swiping
  const createMessagePanResponder = (messageId: number, isBot: boolean) => {
    if (isBot) return null; // Only allow swiping user messages
    
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // If another message is swiped, reset it first
        if (swipedMessageId !== null && swipedMessageId !== messageId) {
          resetSwipe();
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;
        if (dx < 0) { // only allow left swipe (for RTL layout)
          // Limit the swipe to -100
          const newValue = Math.max(dx, -100);
          swipeAnim.setValue(newValue);
          
          // Show delete button when swiping
          if (newValue < -20) {
            deleteButtonAnim.setValue(1);
          } else {
            deleteButtonAnim.setValue(0);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        
        if (dx < -50) { // If swiped enough, keep it open
          Animated.spring(swipeAnim, {
            toValue: -100,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }).start();
          
          setSwipedMessageId(messageId);
          
          // Show delete button
          Animated.timing(deleteButtonAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
          
          // Auto-close after 5 seconds
          setTimeout(() => {
            if (swipedMessageId === messageId) {
              resetSwipe();
            }
          }, 5000);
        } else { // Otherwise, snap back
          resetSwipe();
        }
      }
    });
  };

  if (!visible) return null;

  if (!currentUser) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary.dark} />
        <ActivityIndicator color={theme.colors.primary.base} size="large" />
        <Text style={styles.loadingText}>جاري تحميل المحادثة...</Text>
      </View>
    );
  }

  // Calculate input container styles based on animation
  const inputContainerDynamicStyle = {
    shadowOpacity: inputBoxAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.1, 0.3]
    }),
    transform: [
      {
        scale: inputBoxAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.02]
        })
      }
    ]
  };

  // Function to fade in messages with animation
  const getMessageAnimationStyle = (index: number) => {
    const opacity = new Animated.Value(0);
    
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
    
    return {
      opacity,
      transform: [
        {
          translateY: opacity.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    };
  };

  // Render message component with swipe-to-delete
  const renderMessage = (message: Message, index: number) => {
    // Check if we should show date separator
    let showDateSeparator = false;
    if (index > 0) {
      const prevDate = new Date(messages[index-1].timestamp).toDateString();
      const currentDate = new Date(message.timestamp).toDateString();
      if (prevDate !== currentDate) {
        showDateSeparator = true;
      }
    }
    
    // Calculate message grouping for visual styling
    const isLastInGroup = 
      index === messages.length - 1 || 
      messages[index + 1].isBot !== message.isBot;
    
    // Create pan responder for this message
    const panResponder = createMessagePanResponder(message.id, message.isBot);
    
    // Is this message being swiped
    const isBeingSwiped = swipedMessageId === message.id;
    
    // Delete button opacity and scale animation
    const deleteButtonStyle = {
      opacity: deleteButtonAnim,
      transform: [
        { scale: deleteButtonAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1]
          })
        }
      ]
    };
    
    // Render component
    return (
      <React.Fragment key={message.id}>
        {showDateSeparator && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>
              {new Date(message.timestamp).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        )}
        
        <View style={styles.messageWrapper}>
          {/* Delete button that appears behind the message when swiped */}
          {!message.isBot && (
            <Animated.View style={[
              styles.deleteButtonContainer,
              deleteButtonStyle
            ]}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteMessage(message.id)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="delete-outline" size={15} color="#fff" />
                <Text style={styles.deleteButtonText}>مسح </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          
          {/* Swipeable message container */}
          <Animated.View
            {...(panResponder ? panResponder.panHandlers : {})}
            style={[
              getMessageAnimationStyle(index),
              styles.messageContainer,
              message.isBot ? styles.botMessage : styles.userMessage,
              isLastInGroup && (message.isBot ? styles.lastBotMessage : styles.lastUserMessage),
              // Add swipe animation for user messages
              !message.isBot && {
                transform: [{ 
                  translateX: isBeingSwiped ? swipeAnim : new Animated.Value(0) 
                }]
              }
            ]}
          >
            {message.isBot ? (
              <View style={styles.botMessageHeader}>
                <View style={styles.botAvatarContainer}>
                  <MaterialCommunityIcons
                    name="robot"
                    size={18}
                    color={theme.colors.primary.dark}
                  />
                </View>
                <Text style={styles.botName}>المساعد الزراعي</Text>
              </View>
            ) : (
              <View style={styles.userMessageHeader}>
                <Text style={styles.userName}>{userProfile?.username || 'أنت'}</Text>
                <Image 
                  source={{ 
                    uri: userProfile?.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
                  }} 
                  style={styles.userAvatar}
                  onError={() => console.log("Failed to load profile image")}
                />
              </View>
            )}
            
            <Text style={[
              styles.messageText,
              message.isBot ? styles.botMessageText : styles.userMessageText
            ]}>
              {message.text}
            </Text>
            
            <View style={styles.messageFooter}>
              <Text style={[
                styles.timestamp,
                message.isBot ? styles.botTimestamp : styles.userTimestamp
              ]}>
                {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </Text>
            </View>
          </Animated.View>
        </View>
      </React.Fragment>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary.dark} />
      <LinearGradient
        colors={[theme.colors.primary.dark, theme.colors.primary.base]}
        style={styles.header}
      >
        <View style={styles.headerIconContainer}>
          <MaterialCommunityIcons 
            name="robot-outline"
            size={24}
            color={theme.colors.neutral.surface}
          />
        </View>
        <Text style={styles.headerTitle}>المساعد الزراعي الذكي</Text>
        <View style={styles.headerButtonsContainer}>
          <Text style={styles.poweredBy}>Gemini AI</Text>
          {messages.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearHistory}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={22} color={theme.colors.neutral.surface} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={theme.colors.primary.base} size="large" />
          <Text style={styles.loadingText}>جاري تحميل المحادثة...</Text>
        </View>
      ) : (
        <Animated.View 
          style={[styles.chatOuterContainer, { opacity: fadeAnim }]}
        >
          <LinearGradient
            colors={[theme.colors.neutral.background, `${theme.colors.primary.light}20`]}
            style={styles.backgroundGradient}
          />
          
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </View>
            
            {messages.map((message, index) => renderMessage(message, index))}
            
            {isSending && (
              <Animated.View 
                style={[
                  { opacity: fadeAnim },
                  styles.messageContainer,
                  styles.botMessage,
                  styles.typingMessageContainer
                ]}
              >
                <View style={styles.typingContainer}>
                  <View style={styles.botAvatarContainerSmall}>
                    <MaterialCommunityIcons
                      name="robot"
                      size={14}
                      color={theme.colors.primary.dark}
                    />
                  </View>
                  <View style={styles.typingIndicator}>
                    {typingDots.map((dot, index) => (
                      <Animated.View 
                        key={index}
                        style={[
                          styles.typingDot,
                          { transform: [{ translateY: dot }] }
                        ]} 
                      />
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}
            
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </Animated.View>
      )}

      <Animated.View style={[
        styles.inputOuterContainer,
        inputContainerDynamicStyle
      ]}>
        <Pressable style={styles.background} onPress={Keyboard.dismiss} />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="اكتب سؤالك عن الزراعة..."
            placeholderTextColor={theme.colors.neutral.gray.base}
            value={inputText}
            onChangeText={setInputText}
            multiline
            textAlign="right"
            maxLength={500}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() ? styles.activeButton : styles.disabledButton
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isSending}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={inputText.trim() ? 
                [theme.colors.primary.base, theme.colors.primary.dark] : 
                [theme.colors.neutral.gray.light, theme.colors.neutral.gray.base]
              }
              style={styles.sendButtonGradient}
              start={[0, 0]}
              end={[1, 1]}
            >
              <MaterialCommunityIcons
                name="send"
                size={24}
                color={theme.colors.neutral.surface}
                style={{ transform: [{ scaleX: -1 }] }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={styles.characterCount}>
          <Text style={[
            styles.characterCountText,
            inputText.length > 400 && styles.characterCountWarning,
            inputText.length > 480 && styles.characterCountDanger
          ]}>
            {500 - inputText.length}
          </Text>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingTop: Platform.OS === 'android' ? theme.spacing.lg : theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary.dark}80`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.neutral.surface,
    textAlign: 'center',
    flex: 1,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poweredBy: {
    fontSize: 12,
    fontStyle: 'italic',
    color: theme.colors.neutral.surface,
    opacity: 0.8,
    marginRight: theme.spacing.sm,
  },
  clearButton: {
    padding: theme.spacing.xs,
    backgroundColor: `${theme.colors.primary.dark}60`,
    borderRadius: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.neutral.textSecondary,
    marginTop: theme.spacing.md,
  },
  chatOuterContainer: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  dateHeaderText: {
    fontSize: 12,
    color: theme.colors.neutral.textSecondary,
    backgroundColor: `${theme.colors.neutral.gray.light}40`,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary.base,
    borderBottomLeftRadius: 4,
    marginRight: '10%',
  },
  botMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.neutral.surface,
    borderTopRightRadius: 4,
    marginLeft: '10%',
  },
  lastUserMessage: {
    borderBottomLeftRadius: 16,
  },
  lastBotMessage: {
    borderTopRightRadius: 16,
  },
  botMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  userMessageHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  botAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: theme.spacing.xs,
    backgroundColor: `${theme.colors.primary.light}60`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  botName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.neutral.textSecondary,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginRight: theme.spacing.xs,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userMessageText: {
    color: theme.colors.neutral.surface,
    textAlign: 'left',
  },
  botMessageText: {
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  timestamp: {
    fontSize: 12,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'left',
  },
  botTimestamp: {
    color: theme.colors.neutral.textSecondary,
    textAlign: 'right',
  },
  inputOuterContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.62,
    elevation: 4,
    backgroundColor: theme.colors.neutral.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: theme.spacing.sm,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.neutral.surface,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlignVertical: 'center',
    minHeight: 48,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.neutral.gray.light,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    shadowColor: theme.colors.primary.base,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  typingMessageContainer: {
    minWidth: 80,
    padding: theme.spacing.sm,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatarContainerSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: theme.spacing.xs,
    backgroundColor: `${theme.colors.primary.light}60`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 30,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary.base,
    marginHorizontal: 3,
    opacity: 0.8,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
  characterCount: {
    alignItems: 'flex-end',
    paddingRight: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  characterCountText: {
    fontSize: 12,
    color: theme.colors.neutral.textSecondary,
    opacity: 0.7,
  },
  characterCountWarning: {
    color: theme.colors.warning,
  },
  characterCountDanger: {
    color: theme.colors.error,
  },
  selectedMessage: {
    borderWidth: 2,
    borderColor: theme.colors.primary.dark,
  },
  
  actionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  
  messageActions: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.sm,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: 8,
  },
  
  actionText: {
    marginLeft: theme.spacing.xs,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.neutral.textPrimary,
  },
  
  messageWrapper: {
    position: 'relative',
    marginVertical: theme.spacing.xs,
    overflow: 'hidden',
  },
  
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  
  deleteButton: {
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  
  deleteButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default Chat; 