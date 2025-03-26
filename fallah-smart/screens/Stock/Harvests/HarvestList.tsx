import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../../context/ThemeContext';
import { StockHarvest } from '../types';
import { StockStackParamList } from '../../../navigation/types';
import { storage } from '../../../utils/storage';
import { useAuth } from '../../../context/AuthContext';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../../../config/api';
import { withRetry } from '../../../services/api';
import axios from 'axios';
import { SearchBar } from '../../../components/SearchBar';
import { FAB } from '../../../components/FAB';
import { createThemedStyles } from '../../../utils/createThemedStyles';

// Force RTL layout
import { I18nManager } from 'react-native';
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Define type for harvest types
interface HarvestType {
  icon: string;
  name: string;
  category: string;
}

// Define the constants with their types
const HARVEST_TYPES: Record<string, HarvestType> = {
  vegetable: { icon: '🥕', name: 'خضروات', category: 'vegetable' },
  fruit: { icon: '🍎', name: 'فواكه', category: 'fruit' },
  grain: { icon: '🌾', name: 'حبوب', category: 'grain' },
  herb: { icon: '🌿', name: 'أعشاب', category: 'herb' },
  tomato: { icon: '🍅', name: 'طماطم', category: 'vegetable' },
  cucumber: { icon: '🥒', name: 'خيار', category: 'vegetable' },
  potato: { icon: '🥔', name: 'بطاطا', category: 'vegetable' },
  carrot: { icon: '🥕', name: 'جزر', category: 'vegetable' },
  corn: { icon: '🌽', name: 'ذرة', category: 'vegetable' },
  onion: { icon: '🧅', name: 'بصل', category: 'vegetable' },
  garlic: { icon: '🧄', name: 'ثوم', category: 'vegetable' },
  lettuce: { icon: '🥬', name: 'خس', category: 'vegetable' },
  pepper: { icon: '🌶️', name: 'فلفل', category: 'vegetable' },
  eggplant: { icon: '🍆', name: 'باذنجان', category: 'vegetable' },
  broccoli: { icon: '🥦', name: 'بروكلي', category: 'vegetable' },
  spinach: { icon: '🍃', name: 'سبانخ', category: 'vegetable' },
  apple: { icon: '🍎', name: 'تفاح', category: 'fruit' },
  orange: { icon: '🍊', name: 'برتقال', category: 'fruit' },
  banana: { icon: '🍌', name: 'موز', category: 'fruit' },
  grape: { icon: '🍇', name: 'عنب', category: 'fruit' },
  watermelon: { icon: '🍉', name: 'بطيخ', category: 'fruit' },
  strawberry: { icon: '🍓', name: 'فراولة', category: 'fruit' },
  pear: { icon: '🍐', name: 'كمثرى', category: 'fruit' },
  peach: { icon: '🍑', name: 'خوخ', category: 'fruit' },
  wheat: { icon: '🌾', name: 'قمح', category: 'grain' },
  rice: { icon: '🍚', name: 'أرز', category: 'grain' },
  mint: { icon: '🌿', name: 'نعناع', category: 'herb' },
  parsley: { icon: '🌿', name: 'بقدونس', category: 'herb' },
  coriander: { icon: '🌿', name: 'كزبرة', category: 'herb' },
  other: { icon: '🧺', name: 'أخرى', category: 'other' },
};

// Simplify the category structure for more reliable filtering
const HARVEST_CATEGORIES = {
  'all': { icon: '🌱', name: 'الكل', category: 'all', color: '#4CAF50' },
  'vegetable': { icon: '🥕', name: 'خضروات', category: 'vegetable', color: '#2196F3' },
  'fruit': { icon: '🍎', name: 'فواكه', category: 'fruit', color: '#F44336' },
  'grain': { icon: '🌾', name: 'حبوب', category: 'grain', color: '#FF9800' },
  'herb': { icon: '🌿', name: 'أعشاب', category: 'herb', color: '#8BC34A' },
  'other': { icon: '🧺', name: 'أخرى', category: 'other', color: '#9E9E9E' },
};

const UNIT_TYPES = {
  kg: { icon: '⚖️', name: 'كيلوغرام', abbreviation: 'كغ' },
  g: { icon: '⚖️', name: 'غرام', abbreviation: 'غ' },
  ton: { icon: '⚖️', name: 'طن', abbreviation: 'طن' },
  box: { icon: '📦', name: 'صندوق', abbreviation: 'صندوق' },
  piece: { icon: '🔢', name: 'قطعة', abbreviation: 'قطعة' },
  bunch: { icon: '🏵️', name: 'حزمة', abbreviation: 'حزمة' },
};

type HarvestListScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'HarvestList'>;
};

const { width } = Dimensions.get('window');

const ITEMS_PER_PAGE = 4;

const HarvestListScreen: React.FC<HarvestListScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [harvests, setHarvests] = useState<StockHarvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchHarvests = useCallback(async (showRefresh = false) => {
    try {
      if (!showRefresh) {
        setLoading(true);
      }
      setError(null);
      
      const tokens = await storage.getTokens();
      if (!tokens?.access) {
        console.error('No authentication token available');
        setError('يرجى تسجيل الدخول أولا');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const response = await withRetry(async () => {
        return axios.get(`${API_URL}/stock/harvest`, {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        });
      }, 2, 1500);
      
      if (response.data) {
        // Sort by date (newest first)
        const sortedData = [...response.data].sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || a.harvestDate);
          const dateB = new Date(b.updatedAt || b.createdAt || b.harvestDate);
          return dateB.getTime() - dateA.getTime();
        });
        setHarvests(sortedData);
        setPage(1);
      }
    } catch (err) {
      console.error('Error fetching harvests:', err);
      if (err.message && err.message.includes('فشل الاتصال بالخادم')) {
        setError(err.message);
      } else {
        setError('فشل في جلب المحاصيل');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh harvests when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchHarvests();
      return () => {
        // Cleanup when screen is unfocused
      };
    }, [fetchHarvests])
  );

  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    fetchHarvests(true);
  }, [fetchHarvests, refreshing]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    setPage(1);
  }, []);

  const filteredHarvests = useMemo(() => {
    return harvests.filter(item => {
      const matchesSearch = item.cropName.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (selectedCategory === 'all') return matchesSearch;
      
      // Check for category match using our category definitions
      if (['vegetable', 'fruit', 'grain', 'herb', 'other'].includes(selectedCategory)) {
        // Check if the type matches a category directly
        if (item.type === selectedCategory) return matchesSearch;
        
        // Check if the type is in our mapping
        const itemType = HARVEST_TYPES[item.type];
        if (itemType && itemType.category === selectedCategory) return matchesSearch;
        
        // Fallback to crop name check
        const cropNameLower = item.cropName.toLowerCase();
        
        // Simple category-based text matching as fallback
        switch (selectedCategory) {
          case 'vegetable':
            return matchesSearch && (
              cropNameLower.includes('خضروات') || 
              cropNameLower.includes('طماطم') || 
              cropNameLower.includes('خيار') || 
              cropNameLower.includes('بطاطا')
            );
          case 'fruit':
            return matchesSearch && (
              cropNameLower.includes('فواكه') || 
              cropNameLower.includes('تفاح') || 
              cropNameLower.includes('برتقال')
            );
          case 'grain':
            return matchesSearch && (
              cropNameLower.includes('حبوب') || 
              cropNameLower.includes('قمح') || 
              cropNameLower.includes('أرز')
            );
          case 'herb':
            return matchesSearch && (
              cropNameLower.includes('أعشاب') || 
              cropNameLower.includes('نعناع')
            );
          case 'other':
            return matchesSearch;
          default:
            return false;
        }
      }
      
      // For specific types, check if the type matches
      return matchesSearch && item.type === selectedCategory;
    });
  }, [harvests, searchQuery, selectedCategory]);

  const paginatedHarvests = useMemo(() => {
    return filteredHarvests.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredHarvests, page]);

  const getTypeIcon = (item: StockHarvest) => {
    // Check if the item type matches any of our predefined types directly
    if (HARVEST_TYPES[item.type]) {
      return HARVEST_TYPES[item.type].icon;
    }
    
    // Find by exact crop name match
    for (const key in HARVEST_TYPES) {
      const type = HARVEST_TYPES[key];
      if (item.cropName === type.name) {
        return type.icon;
      }
    }
    
    // Find by partial crop name match
    for (const key in HARVEST_TYPES) {
      const type = HARVEST_TYPES[key];
      if (item.cropName.toLowerCase().includes(type.name.toLowerCase())) {
        return type.icon;
      }
    }
    
    // Find by category
    if (HARVEST_CATEGORIES[item.type]) {
      return HARVEST_CATEGORIES[item.type].icon;
    }
    
    // Final default
    return '🌱';
  };

  const getTypeColor = (item: StockHarvest): string => {
    // Try to get category from the type
    let category = item.type;
    
    // Check if the item type is a specific item type (like tomato)
    if (HARVEST_TYPES[item.type] && HARVEST_TYPES[item.type].category) {
      category = HARVEST_TYPES[item.type].category;
    }
    
    // Return the color for this category
    return HARVEST_CATEGORIES[category]?.color || HARVEST_CATEGORIES.other.color;
  };

  const getTypeName = (item: StockHarvest): string => {
    // First check if it's a direct category
    if (HARVEST_CATEGORIES[item.type]) {
      return HARVEST_CATEGORIES[item.type].name;
    }
    
    // Check if it's a specific type
    if (HARVEST_TYPES[item.type]) {
      return HARVEST_TYPES[item.type].name;
    }
    
    // Fallback to cropName
    return item.cropName;
  };

  const renderTypeChip = useCallback(({ item }: { item: string }) => {
    const category = HARVEST_CATEGORIES[item];
    const isSelected = selectedCategory === item;
    
    return (
      <TouchableOpacity
        style={[
          styles.typeChip,
          { 
            backgroundColor: isSelected ? category.color : theme.colors.neutral.surface,
            borderColor: isSelected ? category.color : theme.colors.neutral.border,
            ...Platform.select({
              ios: isSelected ? {
                shadowColor: category.color,
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
        onPress={() => setSelectedCategory(isSelected ? 'all' : item)}
      >
        <Text style={styles.typeIcon}>{category.icon}</Text>
        <Text style={[
          styles.typeText,
          { color: isSelected ? '#FFF' : theme.colors.neutral.textSecondary }
        ]}>
          {category.name}
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
  }, [selectedCategory, theme]);

  const renderHarvestCard = useCallback(({ item, index }: { item: StockHarvest; index: number }) => {
    const isLowStock = item.minQuantityAlert !== undefined && 
      item.minQuantityAlert > 0 && 
      item.quantity <= item.minQuantityAlert;

    const isExpired = item.expiryDate && new Date(item.expiryDate) <= new Date();
    const typeColor = getTypeColor(item);

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50).springify().damping(12)}
        style={[
          styles.card,
          { 
            backgroundColor: theme.colors.neutral.surface,
            ...Platform.select({
              ios: {
                shadowColor: theme.colors.neutral.textPrimary,
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
          onPress={() => navigation.navigate('HarvestDetail', { harvestId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: typeColor + '20' }
            ]}>
              <Text style={[styles.harvestIcon, { color: typeColor }]}>
                {getTypeIcon(item)}
              </Text>
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={[styles.harvestName, { color: theme.colors.neutral.textPrimary }]}>
                {item.cropName}
              </Text>
              <View style={styles.subtitleContainer}>
                <Text style={[styles.harvestType, { color: typeColor }]}>
                  {getTypeName(item)}
                </Text>
                
                {item.storageLocation && (
                  <View style={styles.locationContainer}>
                    <MaterialCommunityIcons name="warehouse" size={14} color={theme.colors.neutral.textSecondary} />
                    <Text style={[styles.locationText, { color: theme.colors.neutral.textSecondary }]}>
                      {item.storageLocation}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {item.quality === 'premium' && (
              <View style={[styles.qualityBadge, { backgroundColor: theme.colors.success + '90' }]}>
                <Text style={styles.qualityIcon}>⭐⭐⭐</Text>
                <Text style={styles.qualityText}>ممتاز</Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.quantityContainer}>
              <Text style={[styles.quantity, { 
                color: isLowStock ? theme.colors.error : theme.colors.neutral.textPrimary 
              }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.unit, { color: theme.colors.neutral.textSecondary }]}>
                {UNIT_TYPES[item.unit]?.abbreviation || item.unit}
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
            
            <View style={styles.dateContainer}>
              <MaterialCommunityIcons 
                name="calendar" 
                size={16} 
                color={theme.colors.neutral.textSecondary} 
              />
              <Text style={[styles.dateText, { color: theme.colors.neutral.textSecondary }]}>
                {new Date(item.harvestDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [theme, navigation]);

  const renderSeeMoreButton = useCallback(() => {
    if (paginatedHarvests.length >= filteredHarvests.length) {
      return null;
    }
    
    return (
      <TouchableOpacity 
        style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary.base }]}
        onPress={() => setPage(prev => prev + 1)}
      >
        <Text style={styles.seeMoreText}>عرض المزيد</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#FFF" />
      </TouchableOpacity>
    );
  }, [paginatedHarvests.length, filteredHarvests.length, theme, page]);

  const renderHeader = useCallback(() => (
    <Animated.View entering={FadeIn.duration(300).springify()}>
      <View style={[styles.searchContainer, { 
        borderBottomWidth: 0,
        paddingBottom: theme.spacing?.sm || 8,
      }]}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="ابحث عن المحاصيل..."
          style={[styles.searchBar, {
            backgroundColor: theme.colors.neutral.background,
            ...Platform.select({
              ios: {
                shadowColor: theme.colors.neutral.textPrimary,
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
      <View style={{paddingBottom: theme.spacing?.sm || 8}}>
        <FlatList
          data={Object.keys(HARVEST_CATEGORIES)}
          renderItem={renderTypeChip}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typesList}
          contentContainerStyle={styles.typesContent}
          keyExtractor={item => item}
          keyboardShouldPersistTaps="always"
        />
      </View>
    </Animated.View>
  ), [searchQuery, renderTypeChip, theme, handleSearchChange]);

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
        paddingBottom: theme.spacing?.xs || 8,
        backgroundColor: theme.colors.neutral.surface,
      },
      searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: theme.borderRadius?.pill || 50, // More rounded search bar
        paddingHorizontal: theme.spacing?.md || 16,
        height: 40,
      },
      searchInput: {
        flex: 1,
        fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
        color: theme.colors.neutral.textPrimary,
        textAlign: 'right',
        paddingHorizontal: theme.spacing?.sm || 8,
      },
      searchIcon: {
        fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
        color: theme.colors.neutral.textSecondary,
      },
      typeFilters: {
        flexDirection: 'row',
        gap: theme.spacing?.sm || 8,
      },
      typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing?.md || 16,
        paddingVertical: theme.spacing?.xs || 8,
        borderRadius: theme.borderRadius?.pill || 50, // More rounded for better appearance
        gap: theme.spacing?.xs || 4,
        borderWidth: 1,
        marginHorizontal: 4,
      },
      typeChipSelected: {
        ...theme.shadows?.small,
      },
      typeIcon: {
        fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
      },
      typeText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '500',
      },
      content: {
        flex: 1,
      },
      listContent: {
        padding: theme.spacing?.md || 16,
        gap: theme.spacing?.md || 16,
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
      harvestIcon: {
        fontSize: getTypographySize('typography.arabic.h4.fontSize', 24),
      },
      headerInfo: {
        flex: 1,
        gap: 2,
      },
      subtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing?.sm || 8,
      },
      locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      },
      locationText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
      },
      harvestName: {
        fontSize: getTypographySize('typography.arabic.h4.fontSize', 22),
        fontWeight: '600',
        color: theme.colors.neutral.textPrimary,
      },
      harvestType: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        color: theme.colors.neutral.textSecondary,
      },
      qualityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing?.xs || 4,
        paddingVertical: 2,
        borderRadius: theme.borderRadius?.small || 4,
        gap: 2,
      },
      qualityIcon: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        color: '#FFF',
      },
      qualityText: {
        color: '#FFF',
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '500',
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
      dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      },
      dateText: {
        fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
        fontWeight: '500',
      },
      typesList: {
        maxHeight: 48,
      },
      typesContent: {
        paddingHorizontal: 16,
        gap: 8,
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
      centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
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
      emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing?.md || 16,
        paddingVertical: theme.spacing?.sm || 8,
        borderRadius: theme.borderRadius?.pill || 50,
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
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      loadingText: {
        fontSize: 16,
        marginTop: 16,
      },
      errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      },
      errorIcon: {
        fontSize: 48,
        marginBottom: 16,
      },
      errorText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
      },
      retryButton: {
        marginTop: 8,
      },
    };
  });

  if (loading && !harvests.length) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
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
        <Text style={[styles.emptyText, { color: theme.colors.error }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={theme.colors.neutral.surface}
        barStyle="dark-content"
      />
      
      <FlatList
        data={paginatedHarvests}
        renderItem={renderHarvestCard}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          paginatedHarvests.length === 0 && { flex: 1, justifyContent: 'center' }
        ]}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderSeeMoreButton}
        ListEmptyComponent={
          <Animated.View 
            entering={FadeIn.delay(300).duration(500)}
            style={styles.emptyContainer}
          >
            <MaterialCommunityIcons 
              name="sprout-outline" 
              size={72} 
              color={theme.colors.neutral.textSecondary + '80'} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
              لا توجد محاصيل
            </Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: theme.colors.primary.base }]}
              onPress={() => navigation.navigate('AddHarvest')}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
              <Text style={styles.emptyButtonText}>إضافة محصول</Text>
            </TouchableOpacity>
          </Animated.View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.base]}
            tintColor={theme.colors.primary.base}
          />
        }
        keyboardShouldPersistTaps="always"
      />
      
      <FAB
        icon="plus"
        onPress={() => navigation.navigate('AddHarvest')}
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.primary.base,
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

export default HarvestListScreen; 