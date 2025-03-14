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
  Dimensions,
} from 'react-native';
import { theme } from '../../../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const Chat = ({ visible = true }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Add initial greeting message
    if (messages.length === 0) {
      setMessages([{
        id: '0',
        text: 'مرحبا',
        isBot: true,
        timestamp: new Date()
      }]);
    }
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(process.env.EXPO_PUBLIC_API_KEY!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: inputText
            }]
          }]
        })
      });

      const data = await response.json();
      const botResponse = data.candidates[0].content.parts[0].text;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map(message => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.isBot ? styles.botMessage : styles.userMessage,
            ]}
          >
            <Text style={[
              styles.messageText,
              message.isBot ? styles.botMessageText : styles.userMessageText
            ]}>
              {message.text}
            </Text>
            <Text style={[
              styles.timestamp,
              message.isBot ? styles.botTimestamp : styles.userTimestamp
            ]}>
              {new Date(message.timestamp).toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary.base} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
        >
          <MaterialCommunityIcons
            name="send"
            size={24}
            color={theme.colors.primary.base}
            style={{ transform: [{ scaleX: -1 }] }}
          />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="اكتب رسالة..."
          placeholderTextColor={theme.colors.neutral.gray.base}
          value={inputText}
          onChangeText={setInputText}
          multiline
          textAlign="right"
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: theme.spacing.md,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary.base,
    borderBottomLeftRadius: 4,
  },
  botMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary.surface,
    borderBottomRightRadius: 4,
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
  timestamp: {
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'left',
  },
  botTimestamp: {
    color: theme.colors.neutral.textSecondary,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.gray.light,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.neutral.textPrimary,
    textAlignVertical: 'center',
    minHeight: 40,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
});

export default Chat; 