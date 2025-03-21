import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  I18nManager,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useSeed } from '../../../context/SeedContext';
import { StockSeed } from '../types';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from '../../../components/TextInput';
import { SEED_TYPES, SEED_CATEGORIES } from './constants';
import { SwipeableRow } from '../../../components/SwipeableRow';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { FAB } from '../../../components/FAB';
import { API_URL } from '../../../config/api';
import { withRetry } from '../../../services/api';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

type SeedListScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'SeedList'>;
};

// Number of items to show per page
const ITEMS_PER_PAGE = 4;

const SeedListScreen: React.FC<SeedListScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { seeds: contextSeeds, loading: contextLoading, error: contextError, fetchSeeds, deleteSeed } = useSeed();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  
  // Local state for direct API calls
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [seeds, setSeeds] = useState<StockSeed[]>([]);

  // Direct API fetch function
  const fetchSeedsDirectly = async () => {
    try {
      setLocalLoading(true);
      setLocalError(null);
      
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        console.error('No authentication token available');
        setLocalError('يرجى تسجيل الدخول أولا');
        return [];
      }
      
      const response = await withRetry(async () => {
        return axios.get(`${API_URL}/stock/seeds`, {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        });
      }, 2, 1500);
      
      if (response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching seeds:', error);
      if (error.message && error.message.includes('فشل الاتصال بالخادم')) {
        setLocalError(error.message);
      } else {
        setLocalError('فشل في جلب البذور');
      }
      return [];
    } finally {
      setLocalLoading(false);
    }
  };

  // Fetch seeds on component mount using the improved pattern to prevent infinite loops
  useEffect(() => {
    console.log('SeedListScreen mounted - fetching seeds directly');
    
    // Create an isMounted flag to prevent state updates after unmount
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLocalLoading(true);
        setLocalError(null);
        
        // Try direct API call first
        const seedsData = await fetchSeedsDirectly();
        
        // If that works, we're done
        if (isMounted) {
          console.log('Seeds fetched successfully, updating UI');
          setSeeds(seedsData);
          setLocalLoading(false);
        }
      } catch (err) {
        console.error('Error directly loading seeds:', err);
        
        // Try context as fallback
        try {
          console.log('Falling back to context method...');
          await fetchSeeds();
          
          if (isMounted) {
            console.log('Context method succeeded, using context seeds');
            setSeeds(contextSeeds);
            setLocalLoading(false);
          }
        } catch (contextErr) {
          console.error('Context method also failed:', contextErr);
          
          if (isMounted) {
            const errorMsg = err instanceof Error 
              ? err.message 
              : 'Failed to load seeds';
            setLocalError(errorMsg);
            setLocalLoading(false);
          }
        }
      }
    };
    
    loadData();
    
    // Cleanup function
    return () => {
      console.log('SeedListScreen unmounting - cleaning up');
      isMounted = false;
    };
  }, []); // Empty dependency array ensures this only runs once

  // Pull-to-refresh functionality
  const handleRefresh = useCallback(async () => {
    console.log('Refreshing seeds list...');
    setRefreshing(true);
    setLocalError(null);
    
    try {
      // Try direct API first
      const seedsData = await fetchSeedsDirectly();
      setSeeds(seedsData);
      setPage(1);
      console.log('Seeds refreshed successfully with direct API');
    } catch (err) {
      console.error('Error refreshing seeds with direct API:', err);
      
      // Try context as fallback
    try {
      await fetchSeeds();
        setSeeds(contextSeeds);
        console.log('Seeds refreshed with context method');
      } catch (contextErr) {
        console.error('Context refresh also failed:', contextErr);
        setLocalError('Failed to refresh seeds. Please try again.');
      }
    } finally {
      setRefreshing(false);
    }
  }, [fetchSeeds, contextSeeds]);

  // Filter seeds based on search query and category
  const filteredSeeds = useMemo(() => {
    let result = seeds;
    console.log('Filtering seeds. Total seeds count:', seeds.length);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        seed =>
          seed.name.toLowerCase().includes(query) ||
          seed.type.toLowerCase().includes(query) ||
          (seed.variety && seed.variety.toLowerCase().includes(query))
      );
      console.log('After search filter. Filtered count:', result.length);
    }

    // Apply category filter
    if (selectedCategory) {
      result = result.filter(seed => {
        const seedType = SEED_TYPES[seed.type as keyof typeof SEED_TYPES];
        return seedType && seedType.category === selectedCategory;
      });
      console.log('After category filter. Filtered count:', result.length);
    }

    // Sort by updated date, most recent first
    return result.sort((a, b) => 
      new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime()
    );
  }, [seeds, searchQuery, selectedCategory]);

  // Get paginated seeds
  const paginatedSeeds = useMemo(() => {
    return filteredSeeds.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredSeeds, page]);

  // Function to handle loading more items
  const handleLoadMore = useCallback(() => {
    if (paginatedSeeds.length < filteredSeeds.length) {
      setPage(prev => prev + 1);
      console.log('Loading more seeds. New page:', page + 1);
    }
  }, [paginatedSeeds.length, filteredSeeds.length, page]);

  // Function to render footer (Show More button)
  const renderFooter = useCallback(() => {
    if (paginatedSeeds.length >= filteredSeeds.length) return null;
    
    return (
      <TouchableOpacity
        style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary.base }]}
        onPress={handleLoadMore}
      >
        <Text style={styles.seeMoreText}>عرض المزيد</Text>
        <MaterialCommunityIcons name="chevron-down" size={24} color="#FFF" />
      </TouchableOpacity>
    );
  }, [paginatedSeeds.length, filteredSeeds.length, handleLoadMore, theme]);

  // Function to render the empty state
  const renderListEmptyComponent = useCallback(() => {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🌱</Text>
        <Text style={[styles.emptyText, { color: theme.colors.neutral.textPrimary }]}>
          لا توجد بذور في المخزون
        </Text>
        <Text style={[styles.emptySubText, { color: theme.colors.neutral.textSecondary }]}>
          يمكنك إضافة بذور جديدة عن طريق الضغط على زر الإضافة
        </Text>
        <TouchableOpacity
          style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary.base, marginTop: 16 }]}
          onPress={handleRefresh}
        >
          <Text style={styles.seeMoreText}>تحديث</Text>
          <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }, [theme, handleRefresh]);

  // Function to confirm and delete a seed
  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من رغبتك في حذف هذه البذور؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`Attempting to delete seed with ID: ${id}`);
              
              // Try direct API delete first
              try {
                const tokens = await storage.getTokens();
                const deleteURL = `${API_URL}/stock/seeds/${id}`;
                console.log('Deleting seed at:', deleteURL);
                
                await axios.delete(deleteURL, {
                  headers: {
                    'Authorization': `Bearer ${tokens.access}`
                  }
                });
                
                // Refresh seeds list after delete
                await fetchSeedsDirectly();
                console.log('Seed deleted successfully via direct API');
              } catch (directError) {
                console.error('Direct delete failed, falling back to context:', directError);
                // Fall back to context delete
                await deleteSeed(id);
                console.log('Seed deleted successfully via context');
              }
              
              Alert.alert('نجاح', 'تم حذف البذور بنجاح');
            } catch (err) {
              console.error('Error deleting seed:', err);
              Alert.alert('خطأ', 'فشل في حذف البذور');
            }
          },
        },
      ]
    );
  }, [deleteSeed]);

  // Function to render a seed item
  const renderItem = useCallback(({ item, index }: { item: StockSeed; index: number }) => {
    const seedType = SEED_TYPES[item.type as keyof typeof SEED_TYPES] || 
      Object.values(SEED_TYPES).find(seed => seed.name === item.name) || 
      { icon: '🌱', name: 'بذور', category: 'أخرى' };
    const isLowStock = item.quantity <= (item.minQuantityAlert || 0);
    const isNearExpiry = (() => {
      if (!item.expiryDate) return false;
      const today = new Date();
      const expiry = new Date(item.expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays > 0;
    })();
    const isExpired = (() => {
      if (!item.expiryDate) return false;
      const today = new Date();
      const expiry = new Date(item.expiryDate);
      return expiry < today;
    })();
    
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={[
          styles.card,
          { 
            backgroundColor: theme.colors.neutral.surface,
            ...Platform.select({
              ios: {
                shadowColor: theme.colors.neutral.textPrimary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              },
              android: {
                elevation: 4,
              },
            }),
          }
        ]}
      >
        <SwipeableRow
          onDelete={() => handleDelete(item.id)}
          onEdit={() => navigation.navigate('AddSeed', { seedId: item.id, mode: 'edit' })}
        >
          <TouchableOpacity
            style={styles.cardContent}
        onPress={() => navigation.navigate('SeedDetail', { seedId: item.id })}
            activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
              <View style={[
                styles.iconContainer, 
                { 
                  backgroundColor: isExpired 
                    ? theme.colors.error + '20' 
                    : isLowStock 
                      ? theme.colors.warning + '20' 
                      : isNearExpiry
                        ? theme.colors.info + '20'
                        : '#E8F5E9' 
                }
              ]}>
                <Text style={styles.seedIconText}>{seedType.icon}</Text>
                {isLowStock && <Text style={styles.statusIndicator}>⚠️</Text>}
                {isExpired && <Text style={styles.statusIndicator}>⏱️</Text>}
              </View>
              
              <View style={styles.headerInfo}>
                <Text style={[styles.seedName, { color: theme.colors.neutral.textPrimary }]}>
              {item.name}
            </Text>
                <View style={styles.subtitleContainer}>
                  <Text style={[styles.seedType, { color: theme.colors.neutral.textSecondary }]}>
                    {seedType.name}
                    {item.variety ? ` - ${item.variety}` : ''}
                  </Text>
                  
                  <View style={styles.categoryContainer}>
                    <Text style={styles.categoryIcon}>
                      {seedType.category && 
                        (SEED_CATEGORIES[seedType.category as keyof typeof SEED_CATEGORIES] || '🌿')
                      }
                    </Text>
                    <Text style={[styles.categoryText, { color: theme.colors.neutral.textSecondary }]}>
                      {seedType.category || 'أخرى'}
                    </Text>
                  </View>
                </View>
          </View>
        </View>

            <View style={styles.cardFooter}>
              <View style={styles.quantityContainer}>
                <Text style={[
                  styles.seedQuantity, 
                  { color: isLowStock ? theme.colors.error : theme.colors.primary.base }
                ]}>
              {item.quantity} {item.unit}
            </Text>
                <Text style={[styles.seedPrice, { color: theme.colors.accent.base }]}>
                  {item.price} د.ج
            </Text>
          </View>

              {isLowStock && (
                <View style={[styles.statusBadge, { backgroundColor: theme.colors.error + '20' }]}>
                  <MaterialCommunityIcons 
                    name="alert" 
                    size={16} 
                    color={theme.colors.error} 
                  />
                  <Text style={[styles.statusText, { color: theme.colors.error }]}>
                    مخزون منخفض
            </Text>
                </View>
              )}

              {isExpired && (
                <View style={[styles.statusBadge, { backgroundColor: theme.colors.error + '20' }]}>
                  <MaterialCommunityIcons 
                    name="calendar-alert" 
                    size={16} 
                    color={theme.colors.error} 
                  />
                  <Text style={[styles.statusText, { color: theme.colors.error }]}>
                    منتهية الصلاحية
            </Text>
          </View>
              )}

              {isNearExpiry && !isExpired && (
                <View style={[styles.statusBadge, { backgroundColor: theme.colors.warning + '20' }]}>
                  <MaterialCommunityIcons 
                    name="calendar-clock" 
                    size={16} 
                    color={theme.colors.warning} 
                  />
                  <Text style={[styles.statusText, { color: theme.colors.warning }]}>
                    قريبة الإنتهاء
                  </Text>
        </View>
              )}

              {item.expiryDate && !isNearExpiry && !isExpired && (
                <View style={styles.expiryContainer}>
            <MaterialCommunityIcons
                    name="calendar" 
              size={16}
                    color={theme.colors.neutral.textSecondary} 
                  />
                  <Text style={[styles.expiryText, { color: theme.colors.neutral.textSecondary }]}>
                    {new Date(item.expiryDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
            </Text>
          </View>
        )}
            </View>
      </TouchableOpacity>
        </SwipeableRow>
      </Animated.View>
    );
  }, [theme, navigation, handleDelete]);

  // Function to render category filters
  const renderCategoryFilters = useCallback(() => {
  return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        <TouchableOpacity
          key="all"
          style={[
            styles.categoryChip,
            { 
              backgroundColor: selectedCategory === null ? theme.colors.primary.base : theme.colors.neutral.surface,
              borderColor: theme.colors.neutral.border,
            }
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={styles.categoryIcon}>🌐</Text>
          <Text style={[
            styles.categoryText,
            { color: selectedCategory === null ? '#FFF' : theme.colors.neutral.textSecondary }
          ]}>
            الكل
          </Text>
        </TouchableOpacity>
        
        {Object.entries(SEED_CATEGORIES).map(([category, icon]) => (
          <Animated.View
            key={category}
            entering={FadeInDown.springify().delay(100)}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                { 
                  backgroundColor: selectedCategory === category ? theme.colors.primary.base : theme.colors.neutral.surface,
                  borderColor: theme.colors.neutral.border,
                }
              ]}
              onPress={() => setSelectedCategory(selectedCategory === category ? null : category)}
            >
              <Text style={styles.categoryIcon}>{icon}</Text>
              <Text style={[
                styles.categoryText,
                { color: selectedCategory === category ? '#FFF' : theme.colors.neutral.textSecondary }
              ]}>
                {category}
              </Text>
              {selectedCategory === category && (
                <MaterialCommunityIcons 
                  name="close-circle" 
                  size={16} 
                  color="#FFF"
                  style={styles.clearIcon}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    );
  }, [selectedCategory, theme]);

  // Function to render the header
  const renderHeader = useCallback(() => (
    <Animated.View entering={FadeIn.springify()}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="البحث عن البذور..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>
      {renderCategoryFilters()}
    </Animated.View>
  ), [searchQuery, renderCategoryFilters]);

  if (localLoading && !seeds.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar
          backgroundColor={theme.colors.neutral.surface}
          barStyle="dark-content"
        />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={styles.loadingContainer}>
            <Text style={styles.seedIconLarge}>🌾</Text>
            <ActivityIndicator size="large" color={theme.colors.primary.base} />
            <Text style={[styles.loadingText, { color: theme.colors.neutral.textSecondary }]}>
              جاري تحميل البذور...
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (localError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar
          backgroundColor={theme.colors.neutral.surface}
          barStyle="dark-content"
        />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              حدث خطأ: {localError}
            </Text>
            <Text style={[styles.errorSubText, { color: theme.colors.neutral.textSecondary }]}>
              يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.colors.primary.base }]}
              onPress={handleRefresh}
            >
              <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
              <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar
        backgroundColor={theme.colors.neutral.surface}
        barStyle="dark-content"
      />
      <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
            البذور ({seeds.length})
          </Text>
      </View>

      <FlatList
          data={paginatedSeeds}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderListEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
              onRefresh={handleRefresh}
            colors={[theme.colors.primary.base]}
              tintColor={theme.colors.primary.base}
            />
          }
          showsVerticalScrollIndicator={false}
        />
        
        <FAB
          icon="plus"
          onPress={() => navigation.navigate('AddSeed', {})}
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.primary.base
          }}
      />
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    paddingTop: 0,
  },
  searchInput: {
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryIcon: {
    fontSize: 18,
  },
  clearIcon: {
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
    shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  seedIconText: {
    fontSize: 32,
  },
  seedInfo: {
    flex: 1,
  },
  seedName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  seedType: {
    fontSize: 14,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    gap: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    flexWrap: 'wrap',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  seedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seedQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  seedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: 6,
  },
  expiryText: {
    fontSize: 14,
  },
  chevron: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  emptySubText: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    maxWidth: '80%',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  seeMoreText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  addSeedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addSeedButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  seedIconLarge: {
    fontSize: 80,
    marginBottom: 24,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  errorSubText: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24,
    marginTop: 8,
  },
  statusIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 16,
  },
});

export default SeedListScreen; 