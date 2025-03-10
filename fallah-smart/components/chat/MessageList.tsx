import React, { useRef, useEffect } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Keyboard,
  Platform,
  KeyboardEvent,
  RefreshControl,
} from 'react-native';
import ChatMessage from './ChatMessage';
import { Message } from '../../types/chat';
import { theme } from '../../theme/theme';

interface MessageListProps {
  messages: Message[];
  refreshControl?: React.ReactElement;
}

const MessageList: React.FC<MessageListProps> = ({ messages, refreshControl }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const keyboardHeight = useRef(0);

  // Handle keyboard events
  useEffect(() => {
    const keyboardWillShow = (event: KeyboardEvent) => {
      keyboardHeight.current = event.endCoordinates.height;
      requestAnimationFrame(() => scrollToBottom(true));
    };

    const keyboardWillHide = () => {
      keyboardHeight.current = 0;
      requestAnimationFrame(() => scrollToBottom(true));
    };

    // Platform-specific keyboard event listeners
    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(keyboardShowEvent, keyboardWillShow);
    const hideSubscription = Keyboard.addListener(keyboardHideEvent, keyboardWillHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    requestAnimationFrame(() => scrollToBottom(true));
  }, [messages]);

  const scrollToBottom = (animated = true) => {
    if (scrollViewRef.current && messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated });
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingBottom: keyboardHeight.current > 0 ? keyboardHeight.current / 2 : theme.spacing.xl,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => scrollToBottom(false)}
      onLayout={() => scrollToBottom(false)}
      refreshControl={refreshControl}>
      {messages.map((message) => (
        <View
          key={message.id}
          style={[
            styles.messageWrapper,
            message.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper,
          ]}>
          <View
            style={[
              styles.messageContainer,
              message.isUser ? styles.userMessage : styles.aiMessage,
            ]}>
            <ChatMessage message={message} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  messageWrapper: {
    marginBottom: theme.spacing.md,
    maxWidth: '80%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
  },
  aiMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageContainer: {
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
  },
  userMessage: {
    backgroundColor: theme.colors.primary.light,
  },
  aiMessage: {
    backgroundColor: theme.colors.neutral.surface,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
});

export default MessageList;
