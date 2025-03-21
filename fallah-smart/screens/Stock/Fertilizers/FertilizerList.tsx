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
import { useFertilizer } from '../../../context/FertilizerContext';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from '../../../components/TextInput';
import { FERTILIZER_TYPES, FERTILIZER_CATEGORIES, FertilizerType, FertilizerCategory } from './constants';
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

interface AddFertilizerParams {
  fertilizerId?: string;
}

interface StockFertilizer {
  id: string;
  name: string;
  type: FertilizerType;
  quantity: number;
  unit: string;
  price: number;
  minQuantityAlert: number;
  expiryDate: string;
  npkRatio?: string;
  applicationRate?: string;
  supplier?: string;
  safetyGuidelines?: string;
  updatedAt: string;
}

type FertilizerListScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'FertilizerList'>;
};

const ITEMS_PER_PAGE = 4;

const FertilizerListScreen: React.FC<FertilizerListScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { fertilizers: contextFertilizers, loading: contextLoading, error: contextError, fetchFertilizers, deleteFertilizer } = useFertilizer();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FertilizerCategory | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  
  // Local state for direct API calls
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [fertilizers, setFertilizers] = useState<any[]>([]);

  // Direct API fetch function
  const fetchFertilizersDirectly = async () => {
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
        return axios.get(`${API_URL}/stock/fertilizer`, {
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
      console.error('Error fetching fertilizers:', error);
      if (error.message && error.message.includes('فشل الاتصال بالخادم')) {
        setLocalError(error.message);
      } else {
        setLocalError('فشل في جلب الأسمدة');
      }
      return [];
    } finally {
      setLocalLoading(false);
    }
  };

  // Fetch fertilizers on component mount
  useEffect(() => {
    console.log('FertilizerListScreen mounted - fetching fertilizers directly');
    
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLocalLoading(true);
        setLocalError(null);
        
        // Try direct API call first
        const fertilizersData = await fetchFertilizersDirectly();
        
        if (isMounted) {
          console.log('Fertilizers fetched successfully, updating UI');
          setFertilizers(fertilizersData);
          setLocalLoading(false);
        }
      } catch (err) {
        console.error('Error directly loading fertilizers:', err);
        
        // Try context as fallback
        try {
          console.log('Falling back to context method...');
          await fetchFertilizers();
          
          if (isMounted) {
            console.log('Context method succeeded, using context fertilizers');
            setFertilizers(contextFertilizers);
            setLocalLoading(false);
          }
        } catch (contextErr) {
          console.error('Context method also failed:', contextErr);
          
          if (isMounted) {
            const errorMsg = err instanceof Error 
              ? err.message 
              : 'Failed to load fertilizers';
            setLocalError(errorMsg);
            setLocalLoading(false);
          }
        }
      }
    };
    
    loadData();
    
    return () => {
      console.log('FertilizerListScreen unmounting - cleaning up');
      isMounted = false;
    };
  }, []);

  // Pull-to-refresh functionality
  const handleRefresh = useCallback(async () => {
    console.log('Refreshing fertilizers list...');
    setRefreshing(true);
    setLocalError(null);
    
    try {
      // Try direct API first
      await fetchFertilizersDirectly();
      setPage(1);
      console.log('Fertilizers refreshed successfully with direct API');
    } catch (err) {
      console.error('Error refreshing fertilizers with direct API:', err);
      
      // Try context as fallback
    try {
      await fetchFertilizers();
        setFertilizers(contextFertilizers);
        console.log('Fertilizers refreshed with context method');
      } catch (contextErr) {
        console.error('Context refresh also failed:', contextErr);
        setLocalError('Failed to refresh fertilizers. Please try again.');
      }
    } finally {
      setRefreshing(false);
    }
  }, [fetchFertilizers, contextFertilizers]);

  // Filter fertilizers based on search query and category
  const filteredFertilizers = useMemo(() => {
    let result = fertilizers;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        fertilizer =>
          fertilizer.name.toLowerCase().includes(query) ||
          fertilizer.type.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      result = result.filter(fertilizer => {
        const fertilizerType = FERTILIZER_TYPES[fertilizer.type as FertilizerType];
        return fertilizerType && fertilizerType.category === selectedCategory;
      });
    }

    return result.sort((a, b) => 
      new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime()
    );
  }, [fertilizers, searchQuery, selectedCategory]);

  // Get paginated fertilizers
  const paginatedFertilizers = useMemo(() => {
    return filteredFertilizers.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredFertilizers, page]);

  // Function to handle loading more items
  const handleLoadMore = useCallback(() => {
    if (paginatedFertilizers.length < filteredFertilizers.length) {
      setPage(prev => prev + 1);
    }
  }, [paginatedFertilizers.length, filteredFertilizers.length]);

  // Function to handle deletion
  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من رغبتك في حذف هذا السماد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              // Try direct API delete first
              try {
                const tokens = await storage.getTokens();
                const deleteURL = `${API_URL}/stock/fertilizer/${id}`;
                console.log('Deleting fertilizer at:', deleteURL);
                
                await axios.delete(deleteURL, {
                  headers: {
                    'Authorization': `Bearer ${tokens.access}`
                  }
                });
                
                // Refresh fertilizers list after delete
                await fetchFertilizersDirectly();
                console.log('Fertilizer deleted successfully via direct API');
              } catch (directError) {
                console.error('Direct delete failed, falling back to context:', directError);
                // Fall back to context delete
                await deleteFertilizer(id);
                console.log('Fertilizer deleted successfully via context');
              }
              
              Alert.alert('نجاح', 'تم حذف السماد بنجاح');
            } catch (err) {
              console.error('Error deleting fertilizer:', err);
              Alert.alert('خطأ', 'فشل في حذف السماد');
            }
          },
        },
      ]
    );
  }, [deleteFertilizer]);

  // Function to render a fertilizer item
  const renderItem = useCallback(({ item, index }: { item: StockFertilizer; index: number }) => {
    const fertilizerType = (item.type && Object.prototype.hasOwnProperty.call(FERTILIZER_TYPES, item.type) 
      ? FERTILIZER_TYPES[item.type as FertilizerType]
      : Object.values(FERTILIZER_TYPES).find(fert => fert.name === item.name)) || 
      { icon: '⚗️', name: 'سماد', category: 'chemical' as FertilizerCategory };

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
          onEdit={() => navigation.navigate('AddFertilizer', { fertilizerId: item.id } as AddFertilizerParams)}
        >
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => navigation.navigate('FertilizerDetail', { fertilizerId: item.id })}
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
                <Text style={styles.fertilizerIconText}>{fertilizerType.icon}</Text>
                {isLowStock && <Text style={styles.statusIndicator}>⚠️</Text>}
                {isExpired && <Text style={styles.statusIndicator}>⏱️</Text>}
              </View>
              
              <View style={styles.headerInfo}>
                <Text style={[styles.fertilizerName, { color: theme.colors.neutral.textPrimary }]}>
              {item.name}
            </Text>
                <View style={styles.subtitleContainer}>
                  <Text style={[styles.fertilizerType, { color: theme.colors.neutral.textSecondary }]}>
                    {fertilizerType.name}
                  </Text>
                  
                  <View style={styles.categoryContainer}>
                    <Text style={styles.categoryIcon}>
                      {FERTILIZER_CATEGORIES[fertilizerType.category].icon}
                    </Text>
                    <Text style={[styles.categoryText, { color: theme.colors.neutral.textSecondary }]}>
                      {FERTILIZER_CATEGORIES[fertilizerType.category].label}
                    </Text>
                  </View>
                </View>
          </View>
        </View>

            <View style={styles.cardFooter}>
              <View style={styles.quantityContainer}>
                <Text style={[
                  styles.fertilizerQuantity, 
                  { color: isLowStock ? theme.colors.error : theme.colors.primary.base }
                ]}>
              {item.quantity} {item.unit}
            </Text>
                <Text style={[styles.fertilizerPrice, { color: theme.colors.accent.base }]}>
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
        
        {Object.entries(FERTILIZER_CATEGORIES).map(([category, { icon, label }]) => (
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
              onPress={() => setSelectedCategory(category as FertilizerCategory)}
            >
              <Text style={styles.categoryIcon}>{icon}</Text>
              <Text style={[
                styles.categoryText,
                { color: selectedCategory === category ? '#FFF' : theme.colors.neutral.textSecondary }
              ]}>
                {label}
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
          placeholder="البحث عن الأسمدة..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>
      {renderCategoryFilters()}
    </Animated.View>
  ), [searchQuery, renderCategoryFilters]);

  if (localLoading && !fertilizers.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar
          backgroundColor={theme.colors.neutral.surface}
          barStyle="dark-content"
        />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={styles.loadingContainer}
          >
            <Text style={styles.fertilizerIconLarge}>⚗️</Text>
            <ActivityIndicator size="large" color={theme.colors.primary.base} />
            <Text style={[styles.loadingText, { color: theme.colors.neutral.textSecondary }]}>
              جاري تحميل الأسمدة...
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
            style={styles.errorContainer}
          >
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
            الأسمدة ({fertilizers.length})
          </Text>
        </View>

        <FlatList
          data={paginatedFertilizers}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>⚗️</Text>
              <Text style={[styles.emptyText, { color: theme.colors.neutral.textPrimary }]}>
                لا توجد أسمدة في المخزون
              </Text>
              <Text style={[styles.emptySubText, { color: theme.colors.neutral.textSecondary }]}>
                يمكنك إضافة أسمدة جديدة عن طريق الضغط على زر الإضافة
              </Text>
              <TouchableOpacity
                style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary.base }]}
                onPress={handleRefresh}
              >
                <Text style={styles.seeMoreText}>تحديث</Text>
                <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary.base]}
              tintColor={theme.colors.primary.base}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
        
        <FAB
          icon="plus"
          onPress={() => navigation.navigate('AddFertilizer', {})}
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
    paddingBottom: 80,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fertilizerIconText: {
    fontSize: 32,
  },
  fertilizerName: {
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
  fertilizerType: {
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
  fertilizerQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fertilizerPrice: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  fertilizerIconLarge: {
    fontSize: 80,
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    maxWidth: '80%',
  },
  errorSubText: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24,
    marginTop: 8,
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
  },
  seeMoreText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 16,
  },
});

export default FertilizerListScreen; 