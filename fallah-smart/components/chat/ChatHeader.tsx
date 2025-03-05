import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { handleNewConversation, Conversation } from '../../utils/conversationUtils';

interface ChatHeaderProps {
  onNewConversation: (conversation: Conversation) => void;
  onTitlePress: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onNewConversation, onTitlePress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.historyButton} onPress={onTitlePress}>
        <MaterialIcons name="history" size={22} color={theme.colors.primary.base} />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Smart Farmer</Text>
          <Text style={styles.subtitle}>View conversation history</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={theme.colors.primary.base} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          handleNewConversation(onNewConversation);
        }}
        style={styles.newChatButton}>
        <MaterialIcons name="add" size={20} color={theme.colors.neutral.surface} />
        <Text style={styles.newChatText}>New Chat</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    ...theme.shadows.small,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
  },
  subtitle: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    marginTop: 2,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
  },
  newChatText: {
    color: theme.colors.neutral.surface,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    marginLeft: theme.spacing.xs,
  },
});

export default ChatHeader;
