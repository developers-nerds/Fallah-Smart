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
      <TouchableOpacity style={styles.titleContainer} onPress={onTitlePress}>
        <MaterialIcons name="eco" size={24} color={theme.colors.primary.base} />
        <Text style={styles.title}>Smart Farmer</Text>
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
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.base,
    marginLeft: theme.spacing.sm,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
  },
  newChatText: {
    color: theme.colors.neutral.surface,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    marginLeft: theme.spacing.xs,
  },
});

export default ChatHeader;
