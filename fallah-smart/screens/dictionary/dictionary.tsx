import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  TextInput,
  RefreshControl,
  Animated,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { Animal, Crop } from './types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type RootStackParamList = {
  DictionaryMain: undefined;
  CropDetails: { id: number };
  AnimalDetails: { id: number };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

// Define standard categories to normalize data
const CATEGORY_MAPPING: Record<string, string> = {
  // Arabic category names with potential variations
  'الفواكه': 'الفواكه',
  'فواكه': 'الفواكه',
  'فاكهة': 'الفواكه',
  'الخضروات': 'الخضروات',
  'خضروات': 'الخضروات',
  'خضار': 'الخضروات',
  'الأعشاب': 'الأعشاب والتوابل',
  'أعشاب': 'الأعشاب والتوابل',
  'التوابل': 'الأعشاب والتوابل',
  'توابل': 'الأعشاب والتوابل',
  'الأعشاب والتوابل': 'الأعشاب والتوابل',
  'اعشاب وتوابل': 'الأعشاب والتوابل',
  'الحبوب': 'الحبوب',
  'حبوب': 'الحبوب',
  'المحاصيل السكرية': 'المحاصيل السكرية',
  'محاصيل سكرية': 'المحاصيل السكرية',
  'البقوليات': 'البقوليات',
  'بقوليات': 'البقوليات',
  'الماشية': 'الماشية',
  'ماشية': 'الماشية',
  'الدواجن': 'الدواجن',
  'دواجن': 'الدواجن',
};

// Category order priority
const CATEGORY_ORDER = [
  'الفواكه',
  'الخضروات',
  'الحبوب', 
  'البقوليات',
  'المحاصيل السكرية',
  'الأعشاب والتوابل',
  'الماشية',
  'الدواجن',
];

const Dictionary = () => {
  const [selectedTab, setSelectedTab] = useState<'crops' | 'animals'>('crops');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<{[key: string]: boolean}>({});
  const navigation = useNavigation<NavigationProp>();
  const searchAnimation = new Animated.Value(0);

  useEffect(() => {
    fetchData();
    // Load favorites from storage if available
    // This would be implemented with AsyncStorage
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cropsResponse, animalsResponse] = await Promise.all([
        axios.get('http://192.168.1.137:5000/api/crops'),
        axios.get('http://192.168.1.137:5000/api/animal/get')
      ]);
      setCrops(cropsResponse.data);
      setAnimals(animalsResponse.data);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const toggleFavorite = (id: number, type: 'crop' | 'animal') => {
    const key = `${type}_${id}`;
    setFavorites(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      // Save to AsyncStorage would be implemented here
      return updated;
    });
  };

  const isFavorite = (id: number, type: 'crop' | 'animal') => {
    const key = `${type}_${id}`;
    return favorites[key] || false;
  };

  // Normalize a category name
  const normalizeCategory = (category: string): string => {
    // Trim and standardize
    const trimmed = category.trim();
    
    // Return the mapped standard category name or the original if not found
    return CATEGORY_MAPPING[trimmed] || trimmed;
  };

  // Group items by their normalized category
  const groupByCategory = (items: (Crop | Animal)[]): Record<string, (Crop | Animal)[]> => {
    const groupedItems: Record<string, (Crop | Animal)[]> = {};
    
    items.forEach(item => {
      // Normalize the category
      const normalizedCategory = normalizeCategory(item.category);
      
      if (!groupedItems[normalizedCategory]) {
        groupedItems[normalizedCategory] = [];
      }
      
      groupedItems[normalizedCategory].push(item);
    });
    
    return groupedItems;
  };

  // Sort categories based on the predefined order
  const sortCategories = (categories: string[]): string[] => {
    return categories.sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a);
      const indexB = CATEGORY_ORDER.indexOf(b);
      
      // If both categories are in the priority list
      if (indexA >= 0 && indexB >= 0) {
        return indexA - indexB;
      }
      
      // If only one category is in the priority list
      if (indexA >= 0) return -1;
      if (indexB >= 0) return 1;
      
      // If neither is in the priority list, sort alphabetically
      return a.localeCompare(b, 'ar');
    });
  };

  // Filter items based on search query
  const filterItems = (items: (Crop | Animal)[]) => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase().trim();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.category.toLowerCase().includes(query)
    );
  };

  // Memoize the filtered, grouped and sorted data
  const organizedCropData = useMemo(() => {
    const filtered = filterItems(crops);
    const grouped = groupByCategory(filtered);
    const sortedCategories = sortCategories(Object.keys(grouped));
    return { grouped, sortedCategories };
  }, [crops, searchQuery]);

  const organizedAnimalData = useMemo(() => {
    const filtered = filterItems(animals);
    const grouped = groupByCategory(filtered);
    const sortedCategories = sortCategories(Object.keys(grouped));
    return { grouped, sortedCategories };
  }, [animals, searchQuery]);

  const renderCategorySection = (title: string, items: (Crop | Animal)[], type: 'crops' | 'animals') => (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{title}</Text>
      <View style={styles.itemsGrid}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemCard}
            onPress={() => navigation.navigate(type === 'crops' ? 'CropDetails' : 'AnimalDetails', { id: item.id })}
          >
            <TouchableOpacity 
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(item.id, type === 'crops' ? 'crop' : 'animal')}
            >
              <MaterialCommunityIcons 
                name={isFavorite(item.id, type === 'crops' ? 'crop' : 'animal') ? "star" : "star-outline"} 
                size={18} 
                color={isFavorite(item.id, type === 'crops' ? 'crop' : 'animal') ? theme.colors.warning : theme.colors.neutral.textSecondary} 
              />
            </TouchableOpacity>
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <Text style={styles.itemName}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons 
        name="magnify-close" 
        size={48} 
        color={theme.colors.neutral.textSecondary} 
      />
      <Text style={styles.emptyText}>لم يتم العثور على نتائج</Text>
      <Text style={styles.emptySubtext}>حاول بكلمة أخرى أو تصفح جميع العناصر</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث..."
          placeholderTextColor={theme.colors.neutral.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearSearch} 
            onPress={() => setSearchQuery('')}
          >
            <MaterialCommunityIcons name="close" size={20} color={theme.colors.neutral.textSecondary} />
          </TouchableOpacity>
        )}
        <MaterialCommunityIcons 
          name="magnify" 
          size={20} 
          color={theme.colors.neutral.textSecondary}
          style={styles.searchIcon}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'crops' && styles.activeTab]}
          onPress={() => setSelectedTab('crops')}
        >
          <Text style={[styles.tabText, selectedTab === 'crops' && styles.activeTabText]}>معلومات عن المحاصيل</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'animals' && styles.activeTab]}
          onPress={() => setSelectedTab('animals')}
        >
          <Text style={[styles.tabText, selectedTab === 'animals' && styles.activeTabText]}>الثروة الحيوانية</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.base]}
            tintColor={theme.colors.primary.base}
          />
        }
      >
        {selectedTab === 'crops' && (
          organizedCropData.sortedCategories.length > 0 ? (
            organizedCropData.sortedCategories.map(category => (
              <View key={category}>
                {renderCategorySection(category, organizedCropData.grouped[category], 'crops')}
              </View>
            ))
          ) : (
            searchQuery.length > 0 && renderEmptyState()
          )
        )}
        {selectedTab === 'animals' && (
          organizedAnimalData.sortedCategories.length > 0 ? (
            organizedAnimalData.sortedCategories.map(category => (
              <View key={category}>
                {renderCategorySection(category, organizedAnimalData.grouped[category], 'animals')}
              </View>
            ))
          ) : (
            searchQuery.length > 0 && renderEmptyState()
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.surface,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    ...theme.shadows.small,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
  },
  searchIcon: {
    paddingRight: theme.spacing.md,
  },
  clearSearch: {
    padding: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary.base,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
  },
  retryButtonText: {
    color: theme.colors.neutral.surface,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.neutral.surface,
    ...theme.shadows.small,
  },
  tab: {
    flex: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.medium,
    marginHorizontal: theme.spacing.xs,
  },
  activeTab: {
    backgroundColor: theme.colors.primary.base,
  },
  tabText: {
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: theme.colors.neutral.surface,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  categorySection: {
    marginBottom: theme.spacing.lg,
  },
  categoryTitle: {
    fontSize: theme.fontSizes.h2,
    color: theme.colors.primary.base,
    marginBottom: theme.spacing.md,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  itemCard: {
    backgroundColor: theme.colors.neutral.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    alignItems: 'center',
    width: '30%',
    ...theme.shadows.small,
    position: 'relative',
  },
  favoriteButton: {
    position: 'absolute',
    top: 5,
    left: 5,
    zIndex: 1,
  },
  itemIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  itemName: {
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textPrimary,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSizes.h2,
    color: theme.colors.neutral.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: theme.fontSizes.body,
    color: theme.colors.neutral.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default Dictionary; 