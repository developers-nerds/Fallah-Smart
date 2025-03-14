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

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

// Direct API URL for testing
const DIRECT_API_URL = `${process.env.EXPO_PUBLIC_API_URL}/stock/seeds`;

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeds, setSeeds] = useState<StockSeed[]>([]);

  // Direct API fetch function
  const fetchSeedsDirectly = async () => {
    try {
      const tokens = await storage.getTokens();
      console.log('Tokens available:', tokens ? 'Yes' : 'No');
      
      console.log('Fetching seeds directly from:', DIRECT_API_URL);
      
      const response = await axios.get(DIRECT_API_URL, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tokens?.accessToken ? `Bearer ${tokens.accessToken}` : ''
        },
        timeout: 10000
      });
      
      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', response.headers);
      console.log('Seeds fetched successfully, count:', response.data?.length || 0);
      
      // For debugging
      if (response.data?.length > 0) {
        console.log('First seed example:', JSON.stringify(response.data[0], null, 2));
      }
      
      setSeeds(response.data || []);
      return response.data;
    } catch (error) {
      console.error('Direct API fetch error:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:');
        console.error('- Status:', error.response?.status);
        console.error('- Response data:', error.response?.data);
        console.error('- Request config:', error.config);
        
        // Try with a fallback
        if (error.response?.status === 401) {
          console.log('Unauthorized, trying without token...');
          try {
            const fallbackResponse = await axios.get(DIRECT_API_URL, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000
            });
            
            console.log('Fallback API call successful, seeds count:', fallbackResponse.data?.length || 0);
            setSeeds(fallbackResponse.data || []);
            return fallbackResponse.data;
          } catch (fallbackError) {
            console.error('Fallback API call also failed:', fallbackError);
            throw fallbackError;
          }
        }
      }
      
      throw error;
    }
  };

  // Fetch seeds on component mount using the improved pattern to prevent infinite loops
  useEffect(() => {
    console.log('SeedListScreen mounted - fetching seeds directly');
    
    // Create an isMounted flag to prevent state updates after unmount
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try direct API call first
        const seedsData = await fetchSeedsDirectly();
        
        // If that works, we're done
        if (isMounted) {
          console.log('Seeds fetched successfully, updating UI');
          setLoading(false);
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
            setLoading(false);
          }
        } catch (contextErr) {
          console.error('Context method also failed:', contextErr);
          
          if (isMounted) {
            const errorMsg = err instanceof Error 
              ? err.message 
              : 'Failed to load seeds';
            setError(errorMsg);
            setLoading(false);
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
    setError(null);
    
    try {
      // Try direct API first
      await fetchSeedsDirectly();
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
        setError('Failed to refresh seeds. Please try again.');
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
        <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
          لا توجد بذور
        </Text>
        <Text style={[styles.emptySubText, { color: theme.colors.neutral.textSecondary }]}>
          API URL: {DIRECT_API_URL}
        </Text>
        <Text style={[styles.emptySubText, { color: theme.colors.neutral.textSecondary }]}>
          عدد البذور: {seeds.length}, مصفى: {filteredSeeds.length}, صفحة: {paginatedSeeds.length}
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
  }, [theme, handleRefresh, seeds.length, filteredSeeds.length, paginatedSeeds.length]);

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
                const deleteURL = `${DIRECT_API_URL}/${id}`;
                console.log('Deleting seed at:', deleteURL);
                
                await axios.delete(deleteURL, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': tokens?.accessToken ? `Bearer ${tokens.accessToken}` : ''
                  }
                });
                
                // Refresh seeds list after delete
                fetchSeedsDirectly();
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
    const seedType = SEED_TYPES[item.type as keyof typeof SEED_TYPES] || { icon: '🌱', name: 'بذور', category: 'أخرى' };
    const isLowStock = item.quantity <= (item.minQuantityAlert || 0);
    
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
                { backgroundColor: isLowStock ? theme.colors.error + '20' : '#E8F5E9' }
              ]}>
                <Text style={styles.seedIconText}>{seedType.icon}</Text>
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
                      {seedType.category}
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
              
              {item.expiryDate && (
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
          <TouchableOpacity
            key={category}
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

  if (loading && !seeds.length) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
        <Text style={{ marginTop: 10, color: theme.colors.neutral.textSecondary }}>
          جاري تحميل البذور...
        </Text>
        <Text style={{ marginTop: 10, color: theme.colors.neutral.textSecondary }}>
          API URL: {DIRECT_API_URL}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          حدث خطأ: {error}
        </Text>
        <Text style={{ marginTop: 10, color: theme.colors.neutral.textSecondary }}>
          API URL: {DIRECT_API_URL}
        </Text>
        <TouchableOpacity
          style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary.base, marginTop: 20 }]}
          onPress={handleRefresh}
        >
          <Text style={styles.seeMoreText}>إعادة المحاولة</Text>
          <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
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
  },
  title: {
    fontSize: 24,
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
    paddingBottom: 8,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryIcon: {
    fontSize: 16,
  },
  clearIcon: {
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  seedType: {
    fontSize: 14,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  seedPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 64,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  seeMoreText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
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
});

export default SeedListScreen; 