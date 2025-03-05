import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Image,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { handleNewConversation, Conversation } from '../../utils/conversationUtils';
import { storage } from '../../utils/storage';
const Url = process.env.EXPO_PUBLIC_API_URL;

// Function to fetch conversations from the API
const getConversations = async () => {
  try {
    const response = await fetch(`${Url}/conversations/get`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    const data = await response.json();
    console.log('data', data);
    return data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

// Helper function to get the auth token from storage
const getToken = async () => {
  try {
    // Get token from storage utility
    const tokens = await storage.getTokens();
    return tokens.accessToken || '';
  } catch (error) {
    console.error('Error getting token:', error);
    return '';
  }
};

// Helper function to map API conversation data to our Conversation interface
const mapApiConversations = (apiData: any[]): Conversation[] => {
  if (!Array.isArray(apiData)) return [];

  return apiData.map((conv: any) => ({
    id: conv.id || conv._id,
    title: conv.conversation_name || 'Untitled Conversation',
    date: new Date(conv.createdAt || Date.now()).toISOString().split('T')[0],
    preview: conv.description || 'No preview available',
    unread: conv.unread || false,
    icon: conv.icon || '🌱',
    messages: conv.messages || [],
  }));
};

interface ConversationSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation?: (conversation: Conversation) => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  isVisible,
  onClose,
  onSelectConversation,
  onNewConversation,
}) => {
  const slideAnim = useRef(new Animated.Value(-300)).current; // Slide from left
  const scaleAnim = useRef(new Animated.Value(0.95)).current; // Slight scale effect
  const rotateAnim = useRef(new Animated.Value(0)).current; // Rotation animation
  const bounceAnim = useRef(new Animated.Value(0)).current; // Bounce animation
  const [isAnimationComplete, setIsAnimationComplete] = useState(!isVisible);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  // Create animated values for each conversation item - max 20 for performance
  const itemAnimations = useRef(
    Array(20)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  // Fetch conversations when component mounts
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getConversations();
        if (data && Array.isArray(data)) {
          // Map API data to match our Conversation interface
          const formattedConversations = mapApiConversations(data);
          setConversations(formattedConversations);
        } else {
          setConversations([]);
        }
      } catch (err) {
        console.error('Error in fetchConversations:', err);
        setError('Failed to load conversations');
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    if (isVisible) {
      fetchConversations();
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      // Opening animations
      setIsAnimationComplete(false);

      // Main sidebar animations
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // Animate conversation items sequentially
      if (conversations.length > 0) {
        conversations.forEach((_, i) => {
          Animated.timing(itemAnimations[i], {
            toValue: 1,
            duration: 200,
            delay: 100 + i * 50,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        });
      }
    } else {
      // Closing animations
      Animated.sequence([
        // First bounce slightly
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        // Then slide out and scale down
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -300,
            duration: 200,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 200,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Mark animation as complete so component can be removed from DOM
        setIsAnimationComplete(true);
      });
    }
  }, [isVisible, conversations.length]);

  // Don't render if not visible and animation is complete
  if (!isVisible && isAnimationComplete) return null;

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    onSelectConversation(id);
  };

  // Use the actual conversations only
  const displayConversations = conversations;

  const renderItem = ({ item, index }: { item: Conversation; index: number }) => {
    const scale = new Animated.Value(1); // For hover-like effect
    const isSelected = selectedId === item.id;

    const onPressIn = () => {
      Animated.spring(scale, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    // Calculate item animation styles
    const itemAnimStyle = {
      opacity: itemAnimations[index],
      transform: [
        {
          translateX: itemAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          }),
        },
        {
          scale: itemAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        },
      ],
    };

    return (
      <Animated.View
        style={[
          styles.conversationItem,
          itemAnimStyle,
          { transform: [...itemAnimStyle.transform, { scale }] },
          isSelected && styles.conversationItemSelected,
        ]}>
        <TouchableOpacity
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleSelectConversation(item.id)}
          activeOpacity={0.9}
          style={styles.touchableItem}>
          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>
              <View style={styles.titleContainer}>
                <Text style={[styles.conversationTitle, item.unread && styles.unreadText]}>
                  {item.title}
                </Text>
                <Text style={styles.conversationDate}>{item.date}</Text>
              </View>
              {item.unread && <View style={styles.unreadIndicator} />}
            </View>
            <Text style={styles.conversationPreview} numberOfLines={2}>
              {item.preview}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Calculate combined animations for the sidebar
  const sidebarAnimatedStyle = {
    transform: [
      { translateX: slideAnim },
      { scale: scaleAnim },
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['-3deg', '0deg'],
        }),
      },
    ],
  };

  // Animated rotation for the close button
  const closeButtonAnimatedStyle = {
    transform: [
      {
        rotate: slideAnim.interpolate({
          inputRange: [-300, 0],
          outputRange: ['180deg', '0deg'],
        }),
      },
      // Add a little wobble to the close button
      {
        rotate: bounceAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: ['0deg', '15deg', '0deg'],
        }),
      },
    ],
  };

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons
        name="chat-bubble-outline"
        size={48}
        color={theme.colors.neutral.textSecondary}
      />
      <Text style={styles.emptyText}>No conversations yet</Text>
      <TouchableOpacity
        style={styles.newConversationButton}
        onPress={() => {
          if (onNewConversation) {
            handleNewConversation(onNewConversation, onClose);
          }
        }}>
        <Text style={styles.newConversationButtonText}>Start a new conversation</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View style={[styles.container, sidebarAnimatedStyle]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons name="chat" size={24} color={theme.colors.neutral.surface} />
          <Text style={styles.headerTitle}>Conversations</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Animated.View style={closeButtonAnimatedStyle}>
            <MaterialIcons name="close" size={24} color={theme.colors.neutral.textPrimary} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={theme.colors.neutral.textSecondary} />
          <Text style={styles.searchPlaceholder}>Search conversations...</Text>
        </View>
      </View>

      {/* Conversations list */}
      <View style={styles.conversationsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.base} />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                // Trigger a re-fetch
                setConversations([]);
                setError(null);
                setLoading(true);
                getConversations()
                  .then((data) => {
                    if (data && Array.isArray(data)) {
                      const formattedConversations = mapApiConversations(data);
                      setConversations(formattedConversations);
                    }
                  })
                  .catch((err) => {
                    console.error('Error retrying fetch:', err);
                    setError('Failed to load conversations');
                  })
                  .finally(() => setLoading(false));
              }}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : conversations.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => {
            handleNewConversation(onNewConversation, onClose);
          }}>
          <MaterialIcons name="add" size={24} color={theme.colors.neutral.surface} />
          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%', // Slightly narrower for better mobile experience
    backgroundColor: theme.colors.neutral.surface,
    borderRightWidth: 1,
    borderRightColor: theme.colors.neutral.border,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderTopRightRadius: 16, // Increased rounded edges
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    backgroundColor: theme.colors.primary.base,
    paddingVertical: theme.spacing.lg + 4, // Extra vertical padding
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSizes.h2,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.surface,
    letterSpacing: 0.5,
    marginLeft: theme.spacing.sm,
  },
  closeButton: {
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.gray.light,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  searchPlaceholder: {
    color: theme.colors.neutral.textSecondary,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
  },
  conversationItem: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    backgroundColor: theme.colors.neutral.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conversationItemSelected: {
    backgroundColor: theme.colors.neutral.gray.light,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary.base,
  },
  touchableItem: {
    width: '100%',
  },
  conversationContent: {
    padding: theme.spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  iconText: {
    fontSize: 16,
  },
  titleContainer: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.xs / 2,
  },
  unreadText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.dark,
  },
  conversationDate: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
  },
  conversationPreview: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    lineHeight: 18,
    marginLeft: 36 + theme.spacing.sm, // Align with title
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary.base,
    marginLeft: theme.spacing.sm,
  },
  listContent: {
    paddingVertical: theme.spacing.md,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  newChatButton: {
    backgroundColor: theme.colors.primary.base,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatText: {
    color: theme.colors.neutral.surface,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    marginLeft: theme.spacing.sm,
  },
  conversationsContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.neutral.textSecondary,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    marginTop: theme.spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.primary.dark,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    marginBottom: theme.spacing.sm,
  },
  retryButton: {
    backgroundColor: theme.colors.primary.base,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.sm,
  },
  retryButtonText: {
    color: theme.colors.neutral.surface,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.neutral.textSecondary,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    marginBottom: theme.spacing.sm,
  },
  newConversationButton: {
    backgroundColor: theme.colors.primary.base,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.sm,
  },
  newConversationButtonText: {
    color: theme.colors.neutral.surface,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
  },
});

export default ConversationSidebar;
