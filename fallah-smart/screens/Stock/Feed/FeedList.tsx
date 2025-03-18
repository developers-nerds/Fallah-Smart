import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { theme as defaultTheme } from '../../../theme/theme';
import { useFeed } from '../../../context/FeedContext';
import { StockFeed } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import axios from 'axios';
import { storage } from '../../../utils/storage';

// Define fallback colors to prevent undefined errors
const fallbackColors = {
  primary: { base: '#4CAF50', light: '#81C784', dark: '#388E3C' },
  secondary: { base: '#FFC107', light: '#FFD54F', dark: '#FFA000' },
  accent: { base: '#FF5722', light: '#FFAB91', dark: '#E64A19' },
  neutral: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    border: '#E0E0E0',
    textPrimary: '#212121',
    textSecondary: '#757575',
  },
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
  info: '#2196F3',
};

const ITEMS_PER_PAGE = 8;
const { width } = Dimensions.get('window');

type FeedListScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'FeedList'>;
};

// Define styles globally to fix the reference issue
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    padding: 8,
    borderRadius: 6,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  addButtonEmpty: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  loadingMoreText: {
    fontSize: 14,
  },
});

// Create a dedicated component for feed item to properly use hooks
const FeedItem = ({ 
  item, 
  index, 
  theme, 
  onPress,
  getAnimalTypeIcon
}: { 
  item: StockFeed; 
  index: number; 
  theme: any;
  onPress: () => void;
  getAnimalTypeIcon: (type: string) => string;
}) => {
  const itemAnimation = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(itemAnimation, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, [index, itemAnimation]);

  if (!item) return null;

  return (
    <Animated.View
      style={[
        {
          opacity: itemAnimation,
          transform: [
            {
              translateY: itemAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.colors.neutral.surface }
        ]}
        onPress={onPress}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.typeIcon}>{getAnimalTypeIcon(item.animalType || '')}</Text>
            <Text style={[styles.cardTitle, { color: theme.colors.neutral.textPrimary }]}>
              {item.name || 'علف بدون اسم'}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={theme.colors.neutral.textSecondary}
          />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              الكمية:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {item.quantity || 0} {item.unit || ''}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              السعر:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {item.price || 0} د.أ
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              تاريخ الصلاحية:
            </Text>
            <Text style={[styles.value, { color: theme.colors.neutral.textPrimary }]}>
              {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}
            </Text>
          </View>
        </View>

        {item.quantity && item.minQuantityAlert && item.quantity <= item.minQuantityAlert && (
          <View style={[styles.alert, { backgroundColor: theme.colors.accent.light }]}>
            <MaterialCommunityIcons
              name="alert"
              size={16}
              color={theme.colors.accent.dark}
            />
            <Text style={[styles.alertText, { color: theme.colors.accent.dark }]}>
              المخزون منخفض
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const FeedListScreen = ({ navigation }: FeedListScreenProps) => {
  // Get theme with fallbacks to prevent undefined errors
  const rawTheme = useTheme();
  const currentTheme = {
    ...defaultTheme,
    colors: {
      ...fallbackColors,
      ...(rawTheme?.colors || {}),
    }
  };
  
  const { feed: contextFeed } = useFeed();
  const [feed, setFeed] = useState<StockFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const fetchFeed = async (page = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      }
      setError(null);
      
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        setError('يرجى تسجيل الدخول أولا');
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/feed`,
          {
            headers: {
              'Authorization': `Bearer ${tokens.access}`
            }
          }
        );
        
        if (response.data) {
          // Assuming direct array response without pagination
          setFeed(response.data || []);
          setTotalPages(1); // Set to 1 since we're not using pagination in API
          
          // Animate new items
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }
      } catch (err) {
        console.error('Error fetching feed:', err);
        setError('فشل في جلب قائمة الأعلاف');
      }
    } catch (error) {
      console.error('General error:', error);
      setError('حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchFeed();
      setCurrentPage(1);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحديث قائمة الأعلاف');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadMoreItems = () => {
    // Simple client-side pagination since we're loading all data at once
    if (isLoadingMore || currentPage * ITEMS_PER_PAGE >= feed.length) return;
    
    setIsLoadingMore(true);
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setIsLoadingMore(false);
    }, 500);
  };

  const getAnimalTypeIcon = (animalType: string) => {
    switch (animalType) {
      case 'cattle': return '🐄';
      case 'sheep': return '🐑';
      case 'poultry': return '🐓';
      case 'camel': return '🐪';
      case 'fish': return '🐟';
      default: return '🌿';
    }
  };

  const handleRetry = () => {
    fetchFeed(1);
  };

  const renderFeedItem = ({ item, index }: { item: StockFeed; index: number }) => {
    if (!item) return null;
    
    return (
      <FeedItem 
        item={item} 
        index={index} 
        theme={currentTheme}
        onPress={() => navigation.navigate('FeedDetail', { feedId: item.id })}
        getAnimalTypeIcon={getAnimalTypeIcon}
      />
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={currentTheme.colors.primary.base} />
        <Text style={[styles.loadingMoreText, { color: currentTheme.colors.neutral.textSecondary }]}>
          جاري تحميل المزيد...
        </Text>
      </View>
    );
  };

  // Display loading indicator
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary.base} />
      </View>
    );
  }

  // Display error state
  if (error && !refreshing && (!feed || feed.length === 0)) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialCommunityIcons
          name="alert-circle-outline" 
          size={48}
          color={currentTheme.colors.neutral.textSecondary}
        />
        <Text style={[styles.errorText, { color: currentTheme.colors.neutral.textSecondary }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: currentTheme.colors.primary.base }]}
          onPress={handleRetry}
        >
          <Text style={{ color: currentTheme.colors.neutral.surface }}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main content view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: currentTheme.colors.neutral.textPrimary }]}>
          الأعلاف ({feed?.length || 0})
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: currentTheme.colors.primary.base }]}
          onPress={() => navigation.navigate('AddFeed', {})}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={feed || []}
        renderItem={renderFeedItem}
        keyExtractor={(item, index) => `feed-${item?.id || index}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[currentTheme.colors.primary.base]}
            tintColor={currentTheme.colors.primary.base}
          />
        }
        onEndReached={loadMoreItems}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🌿</Text>
              <Text style={[styles.emptyText, { color: currentTheme.colors.neutral.textSecondary }]}>
                لا يوجد أعلاف
              </Text>
              <TouchableOpacity
                style={[styles.addButtonEmpty, { backgroundColor: currentTheme.colors.primary.base }]}
                onPress={() => navigation.navigate('AddFeed', {})}
              >
                <Text style={{ color: currentTheme.colors.neutral.surface }}>إضافة علف جديد</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
};

export default FeedListScreen; 