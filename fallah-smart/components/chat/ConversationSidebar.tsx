import React, { useEffect, useRef, useState, useCallback } from 'react';
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
    const tokens = await storage.getTokens();
    if (!tokens || !tokens.access) {
      console.error('No access token found');
      throw new Error('Authentication required');
    }

    console.log('Fetching conversations from:', `${Url}/conversations/get`);
    console.log('Using token:', tokens.access.substring(0, 10) + '...');

    const response = await fetch(`${Url}/conversations/get`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.access}`,
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response:', errorData);
      throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText}`);
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
    throw error; // Re-throw to handle in the component
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
  currentConversationId?: string | number;
  onCurrentConversationDeleted?: () => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  isVisible,
  onClose,
  onSelectConversation,
  onNewConversation,
  currentConversationId,
  onCurrentConversationDeleted,
}) => {
  // All hooks must be declared at the top level
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const multiSelectAnim = useRef(new Animated.Value(0)).current;
  const longPressTimeout = useRef<NodeJS.Timeout>();
  const itemScaleAnims = useRef<{ [key: string]: Animated.Value }>({});
  const itemPressAnims = useRef<{ [key: string]: Animated.Value }>({});
  const itemAnimations = useRef(
    Array(20)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  const [isAnimationComplete, setIsAnimationComplete] = useState(!isVisible);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isLongPressActive, setIsLongPressActive] = useState(false);

  // All handlers must be declared at the top level
  const handleDeleteConversations = useCallback(
    async (ids: string[]) => {
      try {
        const tokens = await storage.getTokens();
        if (!tokens || !tokens.access) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`${Url}/conversations/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify({ conversationIds: ids }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete conversations');
        }

        // Check if current conversation was deleted
        if (currentConversationId && ids.includes(currentConversationId.toString())) {
          onCurrentConversationDeleted?.();
        }

        // Remove deleted conversations from state
        setConversations((prev) => prev.filter((conv) => !ids.includes(conv.id)));
        setSelectedConversations([]);
        setIsMultiSelectMode(false);
        setShowOptionsMenu(null);
      } catch (error) {
        console.error('Error deleting conversations:', error);
        // Show error message to user
      }
    },
    [currentConversationId, onCurrentConversationDeleted]
  );

  const handleLongPress = useCallback((conversationId: string) => {
    setIsMultiSelectMode(true);
    setSelectedConversations([conversationId]);
    Animated.spring(multiSelectAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, []);

  const handlePressIn = useCallback(
    (conversationId: string) => {
      setIsLongPressing(true);
      const scale = itemScaleAnims.current[conversationId] || new Animated.Value(1);
      const press = itemPressAnims.current[conversationId] || new Animated.Value(0);

      itemScaleAnims.current[conversationId] = scale;
      itemPressAnims.current[conversationId] = press;

      longPressTimeout.current = setTimeout(() => {
        setIsLongPressActive(true);
        handleLongPress(conversationId);
      }, 1500);

      Animated.parallel([
        Animated.spring(scale, {
          toValue: 0.98,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(press, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [handleLongPress]
  );

  const handlePressOut = useCallback((conversationId: string) => {
    setIsLongPressing(false);
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }

    const scale = itemScaleAnims.current[conversationId];
    const press = itemPressAnims.current[conversationId];

    if (scale && press) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(press, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  const handleConversationPress = useCallback(
    (conversationId: string) => {
      // If we're in multi-select mode or a long press just happened
      if (isMultiSelectMode) {
        setSelectedConversations((prev) => {
          const newSelected = prev.includes(conversationId)
            ? prev.filter((id) => id !== conversationId)
            : [...prev, conversationId];

          if (newSelected.length === 0) {
            Animated.spring(multiSelectAnim, {
              toValue: 0,
              useNativeDriver: true,
              friction: 8,
              tension: 40,
            }).start(() => {
              setIsMultiSelectMode(false);
              setIsLongPressActive(false);
            });
          }
          return newSelected;
        });
      } else if (!isLongPressActive) {
        // Only handle normal press if not a long press
        setSelectedId(conversationId);
        onSelectConversation(conversationId);
      }
      setIsLongPressActive(false); // Reset the long press state
    },
    [isMultiSelectMode, multiSelectAnim, onSelectConversation, isLongPressActive]
  );

  const handleSelectAll = useCallback(() => {
    const allIds = conversations.map((conv) => conv.id);
    setSelectedConversations(allIds);
    setIsMultiSelectMode(true);
    Animated.spring(multiSelectAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [conversations]);

  const handleCancelSelection = useCallback(() => {
    setIsLongPressActive(false);
    Animated.sequence([
      Animated.spring(multiSelectAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.elastic(1),
      }),
    ]).start(() => {
      setIsMultiSelectMode(false);
      setSelectedConversations([]);
      bounceAnim.setValue(0);
    });
  }, [multiSelectAnim, bounceAnim]);

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
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
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

  // Use the actual conversations only
  const displayConversations = conversations;

  // Filter conversations based on search term
  const filteredConversations = conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderItem = ({ item, index }: { item: Conversation; index: number }) => {
    // Get or create animation values for this item
    const scale = itemScaleAnims.current[item.id] || new Animated.Value(1);
    const pressAnim = itemPressAnims.current[item.id] || new Animated.Value(0);

    // Store the animation values if they're new
    if (!itemScaleAnims.current[item.id]) {
      itemScaleAnims.current[item.id] = scale;
    }
    if (!itemPressAnims.current[item.id]) {
      itemPressAnims.current[item.id] = pressAnim;
    }

    const isSelected = selectedId === item.id;
    const isMultiSelected = selectedConversations.includes(item.id);

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
          scale: Animated.multiply(
            scale,
            animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            })
          ),
        },
      ],
    };

    const pressStyle = {
      backgroundColor: pressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.colors.neutral.surface, `${theme.colors.primary.base}08`],
      }),
    };

    return (
      <Animated.View
        style={[
          styles.conversationItem,
          itemAnimStyle,
          pressStyle,
          isSelected && styles.conversationItemSelected,
          isMultiSelected && styles.conversationItemMultiSelected,
        ]}>
        <TouchableOpacity
          onPressIn={() => handlePressIn(item.id)}
          onPressOut={() => handlePressOut(item.id)}
          onPress={() => handleConversationPress(item.id)}
          activeOpacity={1}
          style={styles.touchableItem}>
          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Animated.View
                style={[
                  styles.checkbox,
                  isMultiSelected && styles.checkboxSelected,
                  {
                    opacity: multiSelectAnim,
                    transform: [
                      {
                        scale: multiSelectAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        }),
                      },
                    ],
                  },
                ]}>
                {isMultiSelected && (
                  <MaterialIcons name="check" size={16} color={theme.colors.neutral.surface} />
                )}
              </Animated.View>
              <View style={[styles.iconContainer, isMultiSelected && styles.iconContainerSelected]}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>
              <View style={styles.titleContainer}>
                <Text style={[styles.conversationTitle, item.unread && styles.unreadText]}>
                  {item.title}
                </Text>
                <Text style={styles.conversationDate}>{item.date}</Text>
              </View>
              {!isMultiSelectMode && (
                <TouchableOpacity
                  style={styles.optionsButton}
                  onPress={() => setShowOptionsMenu(showOptionsMenu === item.id ? null : item.id)}>
                  <MaterialIcons
                    name="more-vert"
                    size={20}
                    color={theme.colors.neutral.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
            {showOptionsMenu === item.id && (
              <View style={styles.optionsMenu}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleDeleteConversations([item.id])}>
                  <MaterialIcons name="delete" size={20} color={theme.colors.error} />
                  <Text style={[styles.optionText, { color: theme.colors.error }]}>
                    حذف المحادثة
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
          {isMultiSelectMode ? (
            <>
              <Text style={styles.headerTitle}>تم تحديد {selectedConversations.length} محادثة</Text>
              <TouchableOpacity style={styles.selectAllButton} onPress={handleSelectAll}>
                <Text style={styles.selectAllButtonText}>تحديد الكل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSelection}>
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <MaterialIcons name="chat" size={24} color={theme.colors.neutral.surface} />
              <Text style={styles.headerTitle}>المحادثات</Text>
            </>
          )}
        </View>
        {isMultiSelectMode ? (
          <TouchableOpacity
            style={[styles.deleteButton, { opacity: selectedConversations.length > 0 ? 1 : 0.5 }]}
            onPress={() => handleDeleteConversations(selectedConversations)}
            disabled={selectedConversations.length === 0}>
            <MaterialIcons name="delete" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Animated.View style={closeButtonAnimatedStyle}>
              <MaterialIcons name="close" size={24} color={theme.colors.neutral.textPrimary} />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={theme.colors.neutral.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن المحادثات..."
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
            <Text style={styles.loadingText}>جاري تحميل المحادثات...</Text>
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
              <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
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
              {searchTerm ? `لا يوجد محادثات مطابقة لـ "${searchTerm}"` : 'لا يوجد محادثات بعد'}
            </Text>
            {!searchTerm && (
              <TouchableOpacity
                style={styles.newConversationButton}
                onPress={() => {
                  if (onNewConversation) {
                    handleNewConversation(onNewConversation, onClose);
                  }
                }}>
                <Text style={styles.newConversationButtonText}>ابدأ محادثة جديدة</Text>
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
          <Text style={styles.newChatText}>دردشة جديدة</Text>
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
    borderRightColor: 'rgba(0, 0, 0, 0.08)',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
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
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(8px)',
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
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
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
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  conversationItemSelected: {
    backgroundColor: `${theme.colors.primary.base}08`,
    borderColor: theme.colors.primary.base,
    borderLeftWidth: 4,
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.12,
    shadowRadius: 8,
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
    backgroundColor: `${theme.colors.primary.base}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    shadowColor: theme.colors.primary.base,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: `${theme.colors.primary.base}20`,
  },
  iconContainerSelected: {
    backgroundColor: `${theme.colors.primary.base}20`,
    borderColor: theme.colors.primary.base,
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
    padding: theme.spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary.base,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: `${theme.colors.primary.base}40`,
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
  conversationItemMultiSelected: {
    backgroundColor: `${theme.colors.primary.base}12`,
    borderColor: theme.colors.primary.base,
    borderWidth: 1.5,
    transform: [{ scale: 1.01 }],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.neutral.textSecondary,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary.base,
    borderColor: theme.colors.primary.base,
  },
  optionsButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  optionsMenu: {
    position: 'absolute',
    right: theme.spacing.lg,
    top: 50,
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  optionText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
  },
  deleteButton: {
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    marginLeft: theme.spacing.md,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
  },
  selectAllButton: {
    marginLeft: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
  },
  selectAllButtonText: {
    color: theme.colors.neutral.surface,
    fontSize: theme.fontSizes.body,
    fontFamily: theme.fonts.medium,
  },
});

export default ConversationSidebar;
