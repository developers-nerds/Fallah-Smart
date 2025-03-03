import React, { useRef, useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import ChatMessage from './ChatMessage';
import { Message } from '../../types/chat';
import { theme } from '../../theme/theme';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
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
    paddingBottom: theme.spacing.md,
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
