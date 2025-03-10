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
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { handleNewConversation, Conversation } from '../../utils/conversationUtils';
import { storage } from '../../utils/storage';
const Url = process.env.EXPO_PUBLIC_API_URL;

// Function to fetch conversations from the API
const getConversations = async () => {
  try {
    console.log('before all conv');
    const response = await fetch(`${Url}/conversations/get`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getToken()}`,
      },
    });
    console.log('after all conv');
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    const data = await response.json();
    console.log('Fetched conversations:', data);

    // Check if data has the expected structure
    if (data && Array.isArray(data.data)) {
      return data.data; // Return the array of conversations
    } else {
      console.error('Unexpected data structure:', data);
      return [];
    }
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
    id: conv.id.toString(),
    title: conv.conversation_name || 'Untitled Conversation',
    date: new Date(conv.createdAt).toLocaleDateString(),
    preview: conv.description || 'No description',
    unread: false,
    icon: conv.icon || '💬',
    messages: [],
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
  const [searchTerm, setSearchTerm] = useState('');
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
    let animationGroup: Animated.CompositeAnimation | null = null;
    let itemAnimationInstances: Animated.CompositeAnimation[] = [];

    if (isVisible) {
      // Opening animations
      setIsAnimationComplete(false);

      // Main sidebar animations
      animationGroup = Animated.parallel([
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
      ]);

      animationGroup.start();

      // Animate conversation items sequentially
      if (conversations.length > 0) {
        conversations.forEach((_, i) => {
          if (i < 20) {
            // Limit to 20 animations for performance
            const animation = Animated.timing(itemAnimations[i], {
              toValue: 1,
              duration: 200,
              delay: 100 + i * 50,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            });
            animation.start();
            itemAnimationInstances.push(animation);
          }
        });
      }
    } else {
      // Closing animations
      animationGroup = Animated.sequence([
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
      ]);

      animationGroup.start(() => {
        // Mark animation as complete so component can be removed from DOM
        setIsAnimationComplete(true);
      });
    }

    // Cleanup function
    return () => {
      if (animationGroup) {
        animationGroup.stop();
      }

      itemAnimationInstances.forEach((animation) => {
        if (animation) {
          animation.stop();
        }
      });
    };
  }, [isVisible, conversations.length]);

  // Don't render if not visible and animation is complete
  if (!isVisible && isAnimationComplete) return null;

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    onSelectConversation(id);
  };

  // Use the actual conversations only
  const displayConversations = conversations;

  // Filter conversations based on search term
  const filteredConversations = conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    // Check if the animation exists for this index, use a default value if not
    const animValue = index < itemAnimations.length ? itemAnimations[index] : new Animated.Value(1);

    const itemAnimStyle = {
      opacity: animValue,
      transform: [
        {
          translateX: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          }),
        },
        {
          scale: animValue.interpolate({
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
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={theme.colors.neutral.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearSearch}>
              <MaterialIcons name="close" size={20} color={theme.colors.neutral.textSecondary} />
            </TouchableOpacity>
          )}
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
        ) : filteredConversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name={searchTerm ? 'search-off' : 'chat-bubble-outline'}
              size={48}
              color={theme.colors.neutral.textSecondary}
            />
            <Text style={styles.emptyText}>
              {searchTerm
                ? `No conversations found matching "${searchTerm}"`
                : 'No conversations yet'}
            </Text>
            {!searchTerm && (
              <TouchableOpacity
                style={styles.newConversationButton}
                onPress={() => {
                  if (onNewConversation) {
                    handleNewConversation(onNewConversation, onClose);
                  }
                }}>
                <Text style={styles.newConversationButtonText}>Start a new conversation</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
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
    width: '85%',
    backgroundColor: theme.colors.neutral.surface,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingVertical: theme.spacing.lg + 8,
    backgroundColor: theme.colors.primary.base,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSizes.h2 + 2,
    fontFamily: theme.fonts.bold,
    color: theme.colors.neutral.surface,
    letterSpacing: 0.7,
    marginLeft: theme.spacing.sm,
  },
  closeButton: {
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textPrimary,
    padding: 0, // Remove default padding on Android
  },
  clearSearch: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  conversationItem: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
    backgroundColor: theme.colors.neutral.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  conversationItemSelected: {
    backgroundColor: `${theme.colors.primary.base}10`,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary.base,
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  touchableItem: {
    width: '100%',
  },
  conversationContent: {
    padding: theme.spacing.lg,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: `${theme.colors.primary.base}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    shadowColor: theme.colors.primary.base,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  iconText: {
    fontSize: 18,
  },
  titleContainer: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: theme.fontSizes.body + 1,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.3,
  },
  unreadText: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary.dark,
  },
  conversationDate: {
    fontSize: theme.fontSizes.caption,
    fontFamily: theme.fonts.medium,
    color: theme.colors.neutral.textSecondary,
    opacity: 0.8,
  },
  conversationPreview: {
    fontSize: theme.fontSizes.body - 1,
    fontFamily: theme.fonts.regular,
    color: theme.colors.neutral.textSecondary,
    lineHeight: 20,
    marginLeft: 42 + theme.spacing.md,
    opacity: 0.9,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary.base,
    marginLeft: theme.spacing.sm,
    shadowColor: theme.colors.primary.base,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },
  listContent: {
    paddingVertical: theme.spacing.lg,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  newChatButton: {
    backgroundColor: theme.colors.primary.base,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary.base,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  newChatText: {
    color: theme.colors.neutral.surface,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    marginLeft: theme.spacing.sm,
    letterSpacing: 0.5,
  },
  conversationsContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    color: theme.colors.neutral.textSecondary,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    marginTop: theme.spacing.md,
    letterSpacing: 0.3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.primary.dark,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: theme.colors.primary.base,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    shadowColor: theme.colors.primary.base,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  retryButtonText: {
    color: theme.colors.neutral.surface,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.neutral.textSecondary,
    fontSize: theme.fontSizes.body + 1,
    fontFamily: theme.fonts.medium,
    marginVertical: theme.spacing.lg,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 24,
  },
  newConversationButton: {
    backgroundColor: theme.colors.primary.base,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    shadowColor: theme.colors.primary.base,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  newConversationButtonText: {
    color: theme.colors.neutral.surface,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.body,
    letterSpacing: 0.5,
  },
});

export default ConversationSidebar;
