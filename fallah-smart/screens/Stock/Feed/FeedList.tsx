import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  Platform,
  StatusBar,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { theme as defaultTheme } from '../../../theme/theme';
import { useFeed } from '../../../context/FeedContext';
import { StockFeed } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import { API_URL } from '../../../config/api';
import { withRetry } from '../../../services/api';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SearchBar } from '../../../components/SearchBar';
import { FAB } from '../../../components/FAB';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { createThemedStyles } from '../../../utils/createThemedStyles';

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

const ITEMS_PER_PAGE = 4;
const { width } = Dimensions.get('window');

// Define animal category colors for the feed categories
const ANIMAL_CATEGORY_COLORS = {
  'ماشية': '#4CAF50', // Green for livestock
  'دواجن': '#FF9800', // Orange for poultry
  'طيور': '#2196F3', // Blue for birds
  'أسماك': '#03A9F4', // Light blue for fish
  'حيوانات صغيرة': '#9C27B0', // Purple for small animals
  'حيوانات الحراسة والعمل': '#795548', // Brown for guard/working animals
  'حشرات': '#FF5722', // Deep orange for insects
  'أخرى': '#607D8B', // Blue grey for other
};

// Animal types with icons
const ANIMAL_TYPES: Record<string, { icon: string; name: string; category: string }> = {
  // Livestock (ماشية)
  cow: { icon: '🐄', name: 'بقرة', category: 'ماشية' },
  bull: { icon: '🐂', name: 'ثور', category: 'ماشية' },
  buffalo: { icon: '🦬', name: 'جاموس', category: 'ماشية' },
  sheep: { icon: '🐑', name: 'خروف', category: 'ماشية' },
  ram: { icon: '🐏', name: 'كبش', category: 'ماشية' },
  goat: { icon: '🐐', name: 'ماعز', category: 'ماشية' },
  camel: { icon: '🐪', name: 'جمل', category: 'ماشية' },
  horse: { icon: '🐎', name: 'حصان', category: 'ماشية' },
  donkey: { icon: '🦓', name: 'حمار', category: 'ماشية' },
  // Poultry (دواجن)
  chicken: { icon: '🐔', name: 'دجاج', category: 'دواجن' },
  rooster: { icon: '🐓', name: 'ديك', category: 'دواجن' },
  chick: { icon: '🐥', name: 'كتكوت', category: 'دواجن' },
  duck: { icon: '🦆', name: 'بط', category: 'دواجن' },
  turkey: { icon: '🦃', name: 'ديك رومي', category: 'دواجن' },
  // Fish (أسماك)
  fish: { icon: '🐟', name: 'أسماك', category: 'أسماك' },
  // Other (أخرى)
  other: { icon: '🔄', name: 'أخرى', category: 'أخرى' },
};

// Feed names based on categories with icons
const FEED_NAMES: Record<string, { icon: string; name: string; category: string }> = {
  // Livestock Feed (أعلاف الماشية)
  cattle_concentrate: { icon: '🌾', name: 'علف مركز للأبقار', category: 'أعلاف الماشية' },
  dairy_feed: { icon: '🥛', name: 'علف الألبان', category: 'أعلاف الماشية' },
  beef_feed: { icon: '🥩', name: 'علف التسمين', category: 'أعلاف الماشية' },
  calf_feed: { icon: '🐄', name: 'علف العجول', category: 'أعلاف الماشية' },
  sheep_concentrate: { icon: '🌿', name: 'علف الأغنام المركز', category: 'أعلاف الماشية' },
  lamb_feed: { icon: '🐑', name: 'علف الحملان', category: 'أعلاف الماشية' },
  camel_concentrate: { icon: '🐪', name: 'علف الإبل المركز', category: 'أعلاف الماشية' },
  horse_feed: { icon: '🐎', name: 'علف الخيول', category: 'أعلاف الماشية' },
  
  // Poultry Feed (أعلاف الدواجن)
  layer_feed: { icon: '🥚', name: 'علف الدجاج البياض', category: 'أعلاف الدواجن' },
  broiler_feed: { icon: '🍗', name: 'علف الدجاج اللاحم', category: 'أعلاف الدواجن' },
  starter_feed: { icon: '🐥', name: 'علف البادئ', category: 'أعلاف الدواجن' },
  grower_feed: { icon: '🐔', name: 'علف النمو', category: 'أعلاف الدواجن' },
  duck_feed: { icon: '🦆', name: 'علف البط', category: 'أعلاف الدواجن' },
  turkey_feed: { icon: '🦃', name: 'علف الديك الرومي', category: 'أعلاف الدواجن' },
  
  // Fish Feed (أعلاف الأسماك)
  floating_fish_feed: { icon: '🐟', name: 'علف الأسماك العائم', category: 'أعلاف الأسماك' },
  sinking_fish_feed: { icon: '🎣', name: 'علف الأسماك الغاطس', category: 'أعلاف الأسماك' },
  
  // Supplements (المكملات الغذائية)
  mineral_supplement: { icon: '🧂', name: 'مكملات معدنية', category: 'المكملات الغذائية' },
  vitamin_supplement: { icon: '💊', name: 'مكملات فيتامينات', category: 'المكملات الغذائية' },
  protein_supplement: { icon: '🥜', name: 'مكملات بروتين', category: 'المكملات الغذائية' },
  
  // Raw Materials (المواد الخام)
  corn: { icon: '🌽', name: 'ذرة', category: 'المواد الخام' },
  wheat: { icon: '🌾', name: 'قمح', category: 'المواد الخام' },
  barley: { icon: '🌾', name: 'شعير', category: 'المواد الخام' },
  soybean: { icon: '🫘', name: 'فول الصويا', category: 'المواد الخام' },
  hay: { icon: '🌿', name: 'دريس', category: 'المواد الخام' },
  
  // Other (أخرى)
  custom_feed: { icon: '🔄', name: 'علف مخصص', category: 'أخرى' },
};

// Feed categories with icons
const FEED_CATEGORIES = {
  'أعلاف الماشية': { icon: '🌾', color: '#4CAF50', label: 'أعلاف الماشية' },
  'أعلاف الدواجن': { icon: '🐔', color: '#FF9800', label: 'أعلاف الدواجن' },
  'أعلاف الأسماك': { icon: '🐟', color: '#03A9F4', label: 'أعلاف الأسماك' },
  'المكملات الغذائية': { icon: '💊', color: '#9C27B0', label: 'مكملات غذائية' },
  'المواد الخام': { icon: '🌽', color: '#795548', label: 'مواد خام' },
  'أخرى': { icon: '🔄', color: '#607D8B', label: 'أخرى' },
};

type FeedListScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'FeedList'>;
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
  
  const { feed: contextFeed, fetchFeed: contextFetchFeed } = useFeed();
  const [feed, setFeed] = useState<StockFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>('الكل');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        setError('يرجى تسجيل الدخول أولا');
        setLoading(false);
        return;
      }
      
      try {
        const response = await withRetry(async () => {
          return axios.get(
            `${API_URL}/stock/feed`,
            {
              headers: {
                'Authorization': `Bearer ${tokens.access}`
              }
            }
          );
        }, 3, 1500);
        
        if (response.data) {
          // Sort by updatedAt or createdAt date in descending order (newest first)
          const sortedFeed = [...response.data].sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt) : a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.updatedAt ? new Date(b.updatedAt) : b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
          setFeed(sortedFeed);
        }
      } catch (err) {
        console.error('Error fetching feed:', err);
        if (err.message && err.message.includes('فشل الاتصال بالخادم')) {
          setError(err.message);
        } else {
          setError('فشل في جلب قائمة الأعلاف');
        }
      }
    } catch (error) {
      console.error('General error:', error);
      setError('حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  // Use focus effect to reload data when screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          setRefreshing(true);
          await fetchFeed();
        } catch (error) {
          console.error('Error loading feed on focus:', error);
        } finally {
          setRefreshing(false);
        }
      };
      
      loadData();
      
      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [])
  );

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await fetchFeed();
      setCurrentPage(1);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحديث قائمة الأعلاف');
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (currentPage !== 1) {
      searchTimeoutRef.current = setTimeout(() => {
        setCurrentPage(1);
        searchTimeoutRef.current = null;
      }, 300);
    }
  }, [currentPage]);

  // Extract unique categories from feed items
  const categories = useMemo(() => {
    const uniqueCategories = new Set();
    feed.forEach(item => {
      // Extract category from feed name
      const feedInfo = Object.values(FEED_NAMES).find(f => f.name === item.name);
      if (feedInfo?.category) {
        uniqueCategories.add(feedInfo.category);
      }
    });
    return ['الكل', ...Array.from(uniqueCategories as Set<string>)];
  }, [feed]);

  const filteredFeed = useMemo(() => {
    return feed.filter(item => {
      const feedInfo = Object.values(FEED_NAMES).find(f => f.name === item.name);
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'الكل' || feedInfo?.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [feed, searchQuery, selectedCategory]);

  const paginatedFeed = useMemo(() => {
    return filteredFeed.slice(0, currentPage * ITEMS_PER_PAGE);
  }, [filteredFeed, currentPage]);

  const getAnimalTypeIcon = (animalType: string) => {
    // Use animal type info if available
    const animalTypeInfo = ANIMAL_TYPES[animalType] || Object.values(ANIMAL_TYPES).find(a => a.name === animalType);
    return animalTypeInfo?.icon || '🌿';
  };

  const getFeedCategoryInfo = (feedName: string) => {
    const feedInfo = Object.values(FEED_NAMES).find(f => f.name === feedName);
    return FEED_CATEGORIES[feedInfo?.category as keyof typeof FEED_CATEGORIES] || FEED_CATEGORIES['أخرى'];
  };

  const renderFeedCard = useCallback(({ item, index }: { item: StockFeed; index: number }) => {
    if (!item) return null;
    
    const isLowStock = item.quantity <= item.minQuantityAlert;
    const feedCategoryInfo = getFeedCategoryInfo(item.name);
    
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50).springify().damping(12)}
        style={[
          styles.card,
          { 
            backgroundColor: currentTheme.colors.neutral.surface,
            ...Platform.select({
              ios: {
                shadowColor: currentTheme.colors.neutral.textPrimary,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.12,
                shadowRadius: 6,
              },
              android: {
                elevation: 3,
              },
            }),
          }
        ]}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => navigation.navigate('FeedDetail', { feedId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: feedCategoryInfo.color + '20' }
            ]}>
              <Text style={[styles.feedIcon, { color: feedCategoryInfo.color }]}>
                {feedCategoryInfo.icon}
              </Text>
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={[styles.feedName, { color: currentTheme.colors.neutral.textPrimary }]}>
                {item.name || 'علف بدون اسم'}
              </Text>
              <View style={styles.subtitleContainer}>
                <Text style={[styles.feedCategory, { color: feedCategoryInfo.color }]}>
                  {feedCategoryInfo.label}
                </Text>
                
                {item.manufacturer && (
                  <View style={styles.manufacturerContainer}>
                    <MaterialCommunityIcons name="factory" size={14} color={currentTheme.colors.neutral.textSecondary} />
                    <Text style={[styles.manufacturerText, { color: currentTheme.colors.neutral.textSecondary }]}>
                      {item.manufacturer}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.animalTypeIcon}>
              {getAnimalTypeIcon(item.animalType)}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.quantityContainer}>
              <Text style={[styles.quantity, { 
                color: isLowStock ? currentTheme.colors.error : currentTheme.colors.neutral.textPrimary 
              }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.unit, { color: currentTheme.colors.neutral.textSecondary }]}>
                {item.unit}
              </Text>
            </View>

            {isLowStock && (
              <View style={[styles.statusBadge, { backgroundColor: currentTheme.colors.error + '20' }]}>
                <MaterialCommunityIcons 
                  name="alert" 
                  size={16} 
                  color={currentTheme.colors.error} 
                />
                <Text style={[styles.statusText, { color: currentTheme.colors.error }]}>
                  مخزون منخفض
                </Text>
              </View>
            )}
            
            {item.expiryDate && (
              <View style={styles.expiryContainer}>
                <MaterialCommunityIcons 
                  name="calendar" 
                  size={16} 
                  color={currentTheme.colors.neutral.textSecondary} 
                />
                <Text style={[styles.expiryText, { color: currentTheme.colors.neutral.textSecondary }]}>
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
      </Animated.View>
    );
  }, [currentTheme, navigation]);

  const renderCategoryChip = useCallback(({ item }: { item: string }) => {
    const categoryInfo = item === 'الكل' ? { 
      icon: '🌐', 
      color: currentTheme.colors.primary.base,
      label: 'كل الأعلاف'
    } : (FEED_CATEGORIES[item as keyof typeof FEED_CATEGORIES] || FEED_CATEGORIES['أخرى']);
    
    const isSelected = selectedCategory === item;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          { 
            backgroundColor: isSelected ? categoryInfo.color : currentTheme.colors.neutral.surface,
            borderColor: isSelected ? categoryInfo.color : currentTheme.colors.neutral.border,
            ...Platform.select({
              ios: isSelected ? {
                shadowColor: categoryInfo.color,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
              } : {},
              android: isSelected ? {
                elevation: 2,
              } : {},
            }),
          }
        ]}
        onPress={() => setSelectedCategory(isSelected ? null : item)}
      >
        <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
        <Text style={[
          styles.categoryText,
          { color: isSelected ? '#FFF' : currentTheme.colors.neutral.textSecondary }
        ]}>
          {item === 'الكل' ? 'كل الأعلاف' : categoryInfo.label}
        </Text>
        {isSelected && (
          <MaterialCommunityIcons 
            name="close-circle" 
            size={16} 
            color="#FFF" 
          />
        )}
      </TouchableOpacity>
    );
  }, [selectedCategory, currentTheme]);

  const renderFooter = useCallback(() => {
    if (paginatedFeed.length >= filteredFeed.length) return null;
    
    return (
      <TouchableOpacity
        style={[
          styles.seeMoreButton, 
          { 
            backgroundColor: currentTheme.colors.primary.base,
            ...Platform.select({
              ios: {
                shadowColor: currentTheme.colors.primary.base,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
              },
              android: {
                elevation: 3,
              },
            }),
          }
        ]}
        onPress={() => setCurrentPage(prev => prev + 1)}
      >
        <Text style={styles.seeMoreText}>عرض المزيد</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#FFF" />
      </TouchableOpacity>
    );
  }, [paginatedFeed.length, filteredFeed.length, currentTheme]);

  const renderHeader = useCallback(() => (
    <Animated.View entering={FadeIn.duration(300).springify()}>
      <View style={[styles.searchContainer, { 
        borderBottomWidth: 0,
        paddingBottom: currentTheme.spacing?.sm || 8,
      }]}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="ابحث عن الأعلاف..."
          style={[styles.searchBar, {
            backgroundColor: currentTheme.colors.neutral.background,
            ...Platform.select({
              ios: {
                shadowColor: currentTheme.colors.neutral.textPrimary,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              },
              android: {
                elevation: 2,
              },
            }),
          }]}
        />
      </View>
      <View style={{paddingBottom: currentTheme.spacing?.sm || 8}}>
        <FlatList
          data={categories}
          renderItem={renderCategoryChip}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesList}
          contentContainerStyle={styles.categoriesContent}
          keyExtractor={item => item}
          keyboardShouldPersistTaps="always"
        />
      </View>
    </Animated.View>
  ), [searchQuery, categories, renderCategoryChip, currentTheme, handleSearchChange]);

  // Create themed styles
  const styles = createThemedStyles((theme) => {
    // Define fallback values for typography to prevent undefined errors
    const getTypographySize = (typePath: string, fallback: number) => {
      try {
        const paths = typePath.split('.');
        let result: any = theme; // Type as any to avoid index signature errors
        for (const path of paths) {
          if (!result || result[path] === undefined) return fallback;
          result = result[path];
        }
        return result;
      } catch (e) {
        return fallback;
      }
    };

    return {
      container: {
        flex: 1,
        backgroundColor: theme.colors.neutral.background,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
        paddingHorizontal: theme.spacing?.md || 16,
        paddingBottom: theme.spacing?.md || 16,
        backgroundColor: theme.colors.neutral.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.neutral.border,
      },
      headerTitle: {
        fontSize: getTypographySize('typography.arabic.h2.fontSize', 32),
        fontWeight: '600',
        color: theme.colors.neutral.textPrimary,
      },
      searchContainer: {
        padding: theme.spacing?.md || 16,
        paddingBottom: theme.spacing?.xs || 4,
        backgroundColor: theme.colors.neutral.surface,
      },
      searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: theme.borderRadius?.pill || 20, 
        paddingHorizontal: theme.spacing?.md || 16,
        height: 40,
      },
      categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing?.md || 16,
        paddingVertical: theme.spacing?.xs || 4,
        borderRadius: theme.borderRadius?.pill || 20, 
        gap: theme.spacing?.xs || 4,
        borderWidth: 1,
        marginHorizontal: 4,
      },
      categoryIcon: {
        fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
      },
      categoryText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '500',
      },
      categoriesList: {
        maxHeight: 48,
      },
      categoriesContent: {
        paddingHorizontal: 16,
        gap: 8,
      },
      card: {
        borderRadius: theme.borderRadius?.medium || 12,
        overflow: 'hidden',
        marginBottom: theme.spacing?.sm || 8,
        borderWidth: 0.5,
        borderColor: theme.colors.neutral.border + '50',
      },
      cardContent: {
        padding: theme.spacing?.sm || 8,
      },
      cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: theme.spacing?.sm || 8,
        gap: theme.spacing?.xs || 4,
      },
      iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
      },
      feedIcon: {
        fontSize: getTypographySize('typography.arabic.h4.fontSize', 24),
      },
      headerInfo: {
        flex: 1,
        gap: 2,
      },
      feedName: {
        fontSize: getTypographySize('typography.arabic.h4.fontSize', 22),
        fontWeight: '600',
        color: theme.colors.neutral.textPrimary,
      },
      feedCategory: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        color: theme.colors.neutral.textSecondary,
      },
      subtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing?.sm || 8,
      },
      manufacturerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      },
      manufacturerText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
      },
      animalTypeIcon: {
        fontSize: 28,
      },
      cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: theme.spacing?.sm || 8,
        borderTopWidth: 1,
        borderTopColor: theme.colors.neutral.border,
      },
      quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      },
      quantity: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '600',
      },
      unit: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        color: theme.colors.neutral.textSecondary,
      },
      statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        borderRadius: 4,
        gap: 4,
      },
      statusText: {
        color: '#FFF',
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '500',
      },
      expiryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      },
      expiryText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '500',
      },
      seeMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing?.sm || 8,
        borderRadius: theme.borderRadius?.small || 4,
        marginTop: theme.spacing?.sm || 8,
        gap: theme.spacing?.xs || 4,
      },
      seeMoreText: {
        color: '#FFF',
        fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
        fontWeight: '600',
      },
      centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing?.lg || 24,
        gap: theme.spacing?.lg || 24,
      },
      emptyIcon: {
        fontSize: 48,
        color: theme.colors.neutral.textSecondary,
        marginBottom: theme.spacing?.md || 16,
      },
      emptyText: {
        fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
        color: theme.colors.neutral.textSecondary,
        textAlign: 'center',
      },
      emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing?.md || 16,
        paddingVertical: theme.spacing?.sm || 8,
        borderRadius: theme.borderRadius?.pill || 20,
        gap: theme.spacing?.sm || 8,
        marginTop: theme.spacing?.md || 16,
        ...Platform.select({
          ios: {
            shadowColor: theme.colors.primary.base,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
          },
          android: {
            elevation: 3,
          },
        }),
      },
      emptyButtonText: {
        color: '#FFF',
        fontSize: getTypographySize('typography.arabic.body.fontSize', 18),
        fontWeight: '600',
      },
    };
  });

  if (loading && !refreshing && feed.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary.base} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={currentTheme.colors.neutral.surface}
        barStyle="dark-content"
      />
      
      <FlatList
        data={paginatedFeed}
        renderItem={renderFeedCard}
        keyExtractor={item => item.id || Math.random().toString()}
        contentContainerStyle={[
          styles.categoriesContent,
          paginatedFeed.length === 0 && { flex: 1, justifyContent: 'center' }
        ]}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <Animated.View 
            entering={FadeIn.delay(300).duration(500)}
            style={styles.emptyContainer}
          >
            <Text style={styles.emptyIcon}>🌾</Text>
            <Text style={[styles.emptyText, { color: currentTheme.colors.neutral.textSecondary }]}>
              لا توجد أعلاف
            </Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: currentTheme.colors.primary.base }]}
              onPress={() => navigation.navigate('AddFeed', {})}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
              <Text style={styles.emptyButtonText}>إضافة علف</Text>
            </TouchableOpacity>
          </Animated.View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[currentTheme.colors.primary.base]}
            tintColor={currentTheme.colors.primary.base}
          />
        }
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        scrollEventThrottle={16}
      />
      
      <FAB
        icon="plus"
        onPress={() => navigation.navigate('AddFeed', {})}
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
          backgroundColor: currentTheme.colors.primary.base,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
            },
            android: {
              elevation: 6,
            },
          }),
        }}
      />
    </SafeAreaView>
  );
};

export default FeedListScreen; 