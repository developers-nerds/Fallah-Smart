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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { handleNewConversation, Conversation } from '../../utils/conversationUtils';

// Fake data with added unread status and icons
const fakeConversations = [
  {
    id: '1',
    title: 'Tomato disease prevention',
    date: '2023-12-15',
    preview: 'How do I prevent blight in tomatoes?',
    unread: true,
    icon: '🍅',
  },
  {
    id: '2',
    title: 'Irrigation systems',
    date: '2023-12-10',
    preview: 'What irrigation system is best for my small farm?',
    unread: false,
    icon: '💧',
  },
  {
    id: '3',
    title: 'Organic fertilizers',
    date: '2023-12-05',
    preview: 'Can you recommend organic fertilizers for vegetables?',
    unread: true,
    icon: '🌱',
  },
  {
    id: '4',
    title: 'Pest control',
    date: '2023-11-28',
    preview: 'How to control aphids without chemicals?',
    unread: false,
    icon: '🐞',
  },
  {
    id: '5',
    title: 'Crop rotation',
    date: '2023-11-20',
    preview: "What's a good crop rotation schedule for my garden?",
    unread: false,
    icon: '🌾',
  },
  {
    id: '6',
    title: 'Soil testing',
    date: '2023-11-15',
    preview: 'How often should I test my soil?',
    unread: false,
    icon: '🧪',
  },
  {
    id: '7',
    title: 'Weather patterns',
    date: '2023-11-10',
    preview: 'How will changing weather affect my crops?',
    unread: false,
    icon: '☁️',
  },
  {
    id: '8',
    title: 'Seed selection',
    date: '2023-11-05',
    preview: 'Which tomato varieties are disease resistant?',
    unread: false,
    icon: '🌰',
  },
];

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

  // Create animated values for each conversation item
  const itemAnimations = useRef(fakeConversations.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isVisible) {
      // Opening animations
      setIsAnimationComplete(false);

      // Main sidebar animations
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.elastic(1),
          useNativeDriver: true,
        }),
      ]).start();

      // Staggered animations for conversation items
      Animated.stagger(
        50, // Stagger each item by 50ms
        itemAnimations.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          })
        )
      ).start();
    } else {
      // Closing animations - more fun and bouncy

      // First animate the items out in reverse order
      Animated.stagger(
        30,
        [...itemAnimations].reverse().map((anim) =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          })
        )
      ).start();

      // Then animate the sidebar with bounce and rotation
      Animated.sequence([
        // Small bounce before closing
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        // Then slide out with rotation
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -300,
            duration: 400,
            easing: Easing.bezier(0.25, 1, 0.5, 1),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        if (finished) {
          setIsAnimationComplete(true);
          // Reset bounce animation for next time
          bounceAnim.setValue(0);
        }
      });
    }
  }, [isVisible]);

  // Don't render if not visible and animation is complete
  if (!isVisible && isAnimationComplete) return null;

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    onSelectConversation(id);
  };

  const renderItem = ({ item, index }: { item: (typeof fakeConversations)[0]; index: number }) => {
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
      // Add rotation on close
      {
        rotateY: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-10deg'],
        }),
      },
      // Add bounce effect before closing
      {
        translateX: bounceAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 10, 0],
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
          <Text style={styles.searchPlaceholder}>Search conversations...</Text>
        </View>
      </View>

      <FlatList
        data={fakeConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

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
});

export default ConversationSidebar;
