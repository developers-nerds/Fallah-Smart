import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  I18nManager,
  Platform,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../../context/ThemeContext';
import { useHarvest } from '../../../context/HarvestContext';
import { StockHarvest } from '../types';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import { useAuth } from '../../../context/AuthContext';
import Animated, { FadeInDown, FadeIn, FadeInRight } from 'react-native-reanimated';

// Force RTL layout
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
  'all': { icon: '🌱', name: 'الكل', category: 'all' },
  'vegetable': { icon: '🥕', name: 'خضروات', category: 'vegetable' },
  'fruit': { icon: '🍎', name: 'فواكه', category: 'fruit' },
  'grain': { icon: '🌾', name: 'حبوب', category: 'grain' },
  'herb': { icon: '🌿', name: 'أعشاب', category: 'herb' },
  'other': { icon: '🧺', name: 'أخرى', category: 'other' },
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
  const [filteredHarvests, setFilteredHarvests] = useState<StockHarvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchHarvests = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/harvest`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        }
      );
      
      const fetchedHarvests = response.data;
      
      setHarvests(fetchedHarvests);
      setFilteredHarvests(fetchedHarvests);
    } catch (error) {
      console.error('Error fetching harvests:', error);
      setError('فشل في تحميل المحاصيل');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHarvests();
  }, [fetchHarvests]);

  useEffect(() => {
    // Always start with the full list of harvests
    let filtered = [...harvests];
    
    // Log for debugging
    console.log('Total harvests:', harvests.length, 'Selected category:', selectedCategory);
    if (harvests.length > 0) {
      console.log('Sample item:', JSON.stringify(harvests[0]));
    }
    
    // Apply search filter if there's a search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.cropName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter if not showing all
    if (selectedCategory !== 'all') {
      // More flexible filtering approach
      filtered = filtered.filter(item => {
        // First check exact type match
        if (item.type === selectedCategory) {
          return true;
        }
        
        // Check if it's a main category and the item belongs to it
        if (['vegetable', 'fruit', 'grain', 'herb', 'other'].includes(selectedCategory)) {
          // Check main category match (for backward compatibility)
          if (item.type === selectedCategory) {
            return true;
          }
          
          // Check against our mapping
          const itemType = HARVEST_TYPES[item.type];
          if (itemType && itemType.category === selectedCategory) {
            return true;
          }
          
          // Try to infer category from the crop name
          const cropNameLower = item.cropName.toLowerCase();
          
          // Vegetables
          if (selectedCategory === 'vegetable' && 
              (cropNameLower.includes('خضروات') || 
               cropNameLower.includes('طماطم') || 
               cropNameLower.includes('خيار') || 
               cropNameLower.includes('بطاطا') ||
               cropNameLower.includes('جزر') ||
               cropNameLower.includes('بصل') ||
               cropNameLower.includes('ثوم') ||
               cropNameLower.includes('فلفل') ||
               cropNameLower.includes('باذنجان'))) {
            return true;
          }
          
          // Fruits
          if (selectedCategory === 'fruit' && 
              (cropNameLower.includes('فواكه') || 
               cropNameLower.includes('تفاح') || 
               cropNameLower.includes('برتقال') ||
               cropNameLower.includes('موز') ||
               cropNameLower.includes('عنب') ||
               cropNameLower.includes('فراولة'))) {
            return true;
          }
          
          // Grains
          if (selectedCategory === 'grain' && 
              (cropNameLower.includes('حبوب') || 
               cropNameLower.includes('قمح') || 
               cropNameLower.includes('أرز') ||
               cropNameLower.includes('شعير'))) {
            return true;
          }
          
          // Herbs
          if (selectedCategory === 'herb' && 
              (cropNameLower.includes('أعشاب') || 
               cropNameLower.includes('نعناع') || 
               cropNameLower.includes('بقدونس') ||
               cropNameLower.includes('كزبرة'))) {
            return true;
          }
        } else {
          // For specific types (like tomato, apple), match by name as well
          const typeInfo = HARVEST_TYPES[selectedCategory];
          if (typeInfo && item.cropName.toLowerCase().includes(typeInfo.name.toLowerCase())) {
            return true;
          }
        }
        
        return false;
      });
    }
    
    console.log('Filtered results:', filtered.length);
    
    // Sort harvests by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.harvestDate);
      const dateB = new Date(b.harvestDate);
      return dateB.getTime() - dateA.getTime();
    });
    
    setFilteredHarvests(filtered);
    setVisibleItems(ITEMS_PER_PAGE);
  }, [harvests, searchQuery, selectedCategory]);

  const handleRefresh = () => {
    fetchHarvests(true);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const loadMoreItems = () => {
    setVisibleItems(prev => prev + ITEMS_PER_PAGE);
  };

  const renderCategoryButtons = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {Object.keys(HARVEST_CATEGORIES).map((key, index) => {
          const category = HARVEST_CATEGORIES[key];
          const isSelected = selectedCategory === key;
          
          return (
            <Animated.View 
              key={key} 
              entering={FadeInRight.delay(50 * index).springify()}
            >
      <TouchableOpacity
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: isSelected 
                      ? theme.colors.primary.base 
                      : theme.colors.neutral.surface,
                    borderColor: isSelected 
                      ? theme.colors.primary.base 
                      : theme.colors.neutral.border,
                  },
                ]}
                onPress={() => setSelectedCategory(key)}
              >
                <Text style={styles.categoryIcon}>
                  {category.icon}
                </Text>
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isSelected 
                        ? 'white' 
                        : theme.colors.neutral.textSecondary,
                      fontWeight: isSelected ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    );
  };

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
    
    // Default fallback icons based on common types
    if (item.type === 'vegetable') return '🥕';
    if (item.type === 'fruit') return '🍎';
    if (item.type === 'grain') return '🌾';
    if (item.type === 'herb') return '🌿';
    
    // Final default
    return '🌱';
  };

  const renderItem = ({ item, index }: { item: StockHarvest, index: number }) => {
    const isLowStock = item.minQuantityAlert !== undefined && 
      item.minQuantityAlert > 0 && 
      item.quantity <= item.minQuantityAlert;

    const isExpired = item.expiryDate && new Date(item.expiryDate) <= new Date();

    // Format date to English format (MM/DD/YYYY)
    const formatDate = (dateString: string | Date) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    };

    return (
      <Animated.View 
        entering={FadeInDown.delay(100 * Math.min(index % 10, 5)).springify()}
        style={styles.itemAnimatedContainer}
      >
        <TouchableOpacity
          style={[styles.itemContainer, { 
            backgroundColor: theme.colors.neutral.surface,
            borderLeftWidth: 6,
            borderLeftColor: isLowStock 
              ? theme.colors.warning 
              : isExpired
                ? theme.colors.error
                : theme.colors.success
          }]}
          onPress={() => navigation.navigate('HarvestDetail', { harvestId: item.id })}
        >
          <View style={styles.itemContent}>
            <View style={styles.itemIconContainer}>
              <Text style={styles.itemIconText}>{getTypeIcon(item)}</Text>
            </View>
            
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: theme.colors.neutral.textPrimary }]}>
                {item.cropName}
              </Text>
              
              <View style={styles.itemDetails}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="scale" size={20} color={theme.colors.neutral.textSecondary} />
                  <Text style={[styles.detailText, { color: theme.colors.neutral.textSecondary }]}>
                    {item.quantity} {UNIT_TYPES[item.unit]?.abbreviation || item.unit}
            </Text>
          </View>

                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="cash" size={20} color={theme.colors.neutral.textSecondary} />
                  <Text style={[styles.detailText, { color: theme.colors.neutral.textSecondary }]}>
              {item.price} د.أ
            </Text>
                </View>
          </View>

              <View style={styles.dateContainer}>
                <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.neutral.textSecondary} />
                <Text style={[styles.dateText, { color: theme.colors.neutral.textSecondary }]}>
                  {formatDate(item.harvestDate)}
            </Text>
          </View>
        </View>

            <View style={styles.itemActions}>
              {isLowStock && (
                <View style={[styles.alertBadge, { backgroundColor: theme.colors.warning + '20' }]}>
                  <Text style={[styles.alertText, { color: theme.colors.warning }]}>
                    ⚠️ المخزون منخفض
                  </Text>
                </View>
              )}
              {isExpired && (
                <View style={[styles.alertBadge, { backgroundColor: theme.colors.error + '20' }]}>
                  <Text style={[styles.alertText, { color: theme.colors.error }]}>
                    ⚠️ انتهت الصلاحية
            </Text>
          </View>
        )}
              <MaterialCommunityIcons
                name="chevron-left"
                size={28}
                color={theme.colors.neutral.textSecondary}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🌾</Text>
        <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
          لا توجد محاصيل متاحة
        </Text>
        <Text style={[styles.emptySubText, { color: theme.colors.neutral.textTertiary || '#9e9e9e' }]}>
          قم بإضافة محصول جديد للبدء
        </Text>
        <Button 
          title="إضافة محصول جديد" 
          onPress={() => navigation.navigate('AddHarvest')} 
          style={styles.addButton}
        />
      </View>
    );
  };

  const renderSeeMoreButton = () => {
    if (filteredHarvests.length <= visibleItems) {
      return null;
    }
    
    return (
      <TouchableOpacity 
        style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary.surface }]}
        onPress={loadMoreItems}
      >
        <Text style={[styles.seeMoreText, { color: theme.colors.primary.base }]}>
          عرض المزيد من المحاصيل
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.primary.base} />
      </TouchableOpacity>
    );
  };

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.neutral.background }]}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
          <Button
            title="إعادة المحاولة"
            onPress={() => fetchHarvests()}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
      <View style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          المحاصيل 🌾
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            navigation.navigate('AddHarvest');
            // Set a flag to refresh when returning to this screen
            navigation.addListener('focus', () => {
              handleRefresh();
            });
          }}
        >
          <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary.base} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.neutral.surface }]}>
        <MaterialCommunityIcons name="magnify" size={24} color={theme.colors.neutral.textTertiary || '#9e9e9e'} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.neutral.textPrimary }]}
          placeholder="ابحث عن محصول..."
          placeholderTextColor={theme.colors.neutral.textTertiary || '#9e9e9e'}
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.neutral.textTertiary || '#9e9e9e'} />
          </TouchableOpacity>
        )}
      </View>

      {renderCategoryButtons()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.base} />
          <Text style={[styles.loadingText, { color: theme.colors.neutral.textSecondary }]}>
            جاري تحميل المحاصيل...
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredHarvests.slice(0, visibleItems)}
            keyExtractor={(item, index) => `harvest-${item.id || index}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary.base]}
                tintColor={theme.colors.primary.base}
              />
            }
            ListFooterComponent={renderSeeMoreButton}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 16,
    textAlign: 'right',
  },
  categoriesContainer: {
    marginTop: 8,
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 50,
    borderWidth: 1,
  },
  categoryIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 16,
  },
  typesContainer: {
    marginTop: 4,
    maxHeight: 50,
  },
  typesContent: {
    paddingHorizontal: 16,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeIcon: {
    fontSize: 16,
    marginLeft: 6,
  },
  typeText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  itemAnimatedContainer: {
    width: '100%',
  },
  itemContainer: {
    margin: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  itemContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  itemIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  itemIconText: {
    fontSize: 28,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  alertText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 300,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  addButton: {
    marginVertical: 8,
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
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  seeMoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default HarvestListScreen; 