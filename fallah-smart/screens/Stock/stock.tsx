import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../navigation/StockNavigator';
import { StockItemCard } from './components/StockItemCard';
import { Button } from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import { useStock } from '../../context/StockContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StockCategory, StockItem } from './types';
import { createThemedStyles } from '../../utils/createThemedStyles';
import type { FeatherNames, MaterialNames } from '../../types/icons';
import { BlurView } from 'expo-blur';
import Animated, { 
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeInDown
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 5;

type StockScreenNavigationProp = StackNavigationProp<StockStackParamList, 'StockList'>;

const categories: { value: StockCategory; label: string; iconType: 'feather' | 'material'; icon: string }[] = [
  { value: 'seeds', label: 'البذور', iconType: 'material', icon: 'seed' },
  { value: 'fertilizer', label: 'الأسمدة', iconType: 'material', icon: 'watering-can' },
  { value: 'harvest', label: 'المحاصيل', iconType: 'material', icon: 'sprout' },
  { value: 'feed', label: 'الأعلاف', iconType: 'material', icon: 'food-variant' },
  { value: 'pesticide', label: 'المبيدات', iconType: 'material', icon: 'bug' },
  { value: 'equipment', label: 'المعدات', iconType: 'material', icon: 'tractor' },
  { value: 'tools', label: 'الأدوات', iconType: 'material', icon: 'tools' },
  { value: 'animals', label: 'الحيوانات', iconType: 'material', icon: 'cow' }
];

interface StockStats {
  totalItems: number;
  lowStockItems: StockItem[];
  totalValue: number;
}

const StockScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<StockScreenNavigationProp>();
  const { stocks, loading, error, refreshStocks } = useStock();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StockCategory>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [stockStats, setStockStats] = useState<StockStats>({
    totalItems: 0,
    lowStockItems: [],
    totalValue: 0
  });
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.9],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      backgroundColor: theme.colors.neutral.surface,
      shadowColor: '#000000',
    };
  });

  // Calculate stats from stocks
  const calculateStats = useCallback((stockItems: StockItem[]): StockStats => {
    return {
      totalItems: stockItems.length,
      lowStockItems: stockItems.filter(s => s.quantity <= (s.lowStockThreshold || 0)),
      totalValue: stockItems.reduce((sum, stock) => sum + ((stock.price || 0) * (stock.quantity || 0)), 0)
    };
  }, []);

  React.useEffect(() => {
    setStockStats(calculateStats(stocks));
  }, [stocks, calculateStats]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshStocks();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategoryPress = useCallback((category: StockCategory) => {
    if (category === 'animals') {
      navigation.navigate('Animals');
    } else {
      setSelectedCategory(prev => prev === category ? 'all' : category);
      setCurrentPage(1); // Reset to first page when changing category
    }
  }, [navigation]);

  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      const matchesSearch = stock.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || stock.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [stocks, searchQuery, selectedCategory]);

  const paginatedStocks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStocks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStocks, currentPage]);

  const totalPages = Math.ceil(filteredStocks.length / ITEMS_PER_PAGE);

  const handleStockPress = useCallback((item: StockItem) => {
    navigation.navigate('StockDetail', { stockId: item.id });
  }, [navigation]);

  const handleAddStock = useCallback(() => {
    navigation.navigate('AddStock');
  }, [navigation]);

  const handleAddAnimal = useCallback(() => {
    navigation.navigate('Animals');
  }, [navigation]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="magnify-close" 
            size={64} 
            color={theme.colors.neutral.textSecondary} 
          />
          <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
            لا توجد نتائج
          </Text>
          <Text style={[styles.emptySubText, { color: theme.colors.neutral.textSecondary }]}>
            يرجى البحث بمصطلحات أخرى
          </Text>
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: theme.colors.primary.base }]}
            onPress={handleClearSearch}
          >
            <Text style={[styles.clearButtonText, { color: theme.colors.neutral.surface }]}>
              مسح البحث
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name="package-variant" 
          size={64} 
          color={theme.colors.neutral.textSecondary} 
        />
        <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
          لا توجد منتجات في المخزون
        </Text>
        <Text style={[styles.emptySubText, { color: theme.colors.neutral.textSecondary }]}>
          اضغط على زر الإضافة لإضافة منتج جديد
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary.base }]}
          onPress={handleAddStock}
        >
          <Feather name="plus" size={24} color={theme.colors.neutral.surface} />
          <Text style={[styles.addButtonText, { color: theme.colors.neutral.surface }]}>
            إضافة منتج جديد
          </Text>
        </TouchableOpacity>
      </View>
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
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral.border,
    },
    headerTitle: {
      fontSize: theme.fontSizes.h1,
      fontFamily: theme.fonts.bold,
    },
    headerButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    headerButton: {
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.neutral.surface,
      ...theme.shadows.small,
    },
    statsSection: {
      padding: theme.spacing.md,
    },
    statsContent: {
      gap: theme.spacing.md,
    },
    summaryItem: {
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
      minWidth: width * 0.4,
      alignItems: 'center',
      ...theme.shadows.medium,
    },
    summaryIconContainer: {
      marginBottom: theme.spacing.sm,
    },
    summaryNumber: {
      fontSize: theme.fontSizes.h2,
      fontFamily: theme.fonts.bold,
      color: theme.colors.neutral.surface,
    },
    summaryLabel: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fonts.medium,
      color: theme.colors.neutral.surface,
    },
    searchSection: {
      padding: theme.spacing.md,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.neutral.surface,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.md,
      ...theme.shadows.small,
    },
    searchIcon: {
      marginRight: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      height: 56,
      fontSize: theme.fontSizes.body,
      color: theme.colors.neutral.textPrimary,
    },
    categoriesContainer: {
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.neutral.surface,
      gap: theme.spacing.sm,
      ...theme.shadows.small,
    },
    categoryLabel: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fonts.medium,
      color: theme.colors.primary.base,
    },
    stockList: {
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    paginationButton: {
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.primary.base,
    },
    paginationButtonDisabled: {
      backgroundColor: theme.colors.primary.disabled,
    },
    paginationButtonText: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fonts.medium,
      color: theme.colors.neutral.surface,
    },
    paginationText: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fonts.medium,
      color: theme.colors.neutral.textPrimary,
    },
    errorText: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fonts.medium,
      marginTop: theme.spacing.md,
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: theme.fontSizes.h2,
      fontFamily: theme.fonts.bold,
      marginTop: theme.spacing.lg,
      textAlign: 'center',
    },
    emptySubText: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fonts.regular,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
      opacity: 0.8,
    },
    clearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
      marginTop: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    clearButtonText: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fonts.medium,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
      marginTop: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    addButtonText: {
      fontSize: theme.fontSizes.body,
      fontFamily: theme.fonts.medium,
    },
    clearSearchButton: {
      padding: theme.spacing.sm,
    },
    lowStockIndicator: {
      position: 'absolute',
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      backgroundColor: theme.colors.warning,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.small,
    },
    lowStockText: {
      color: theme.colors.neutral.surface,
      fontSize: theme.fontSizes.caption,
      fontFamily: theme.fonts.medium,
    },
  });

  if (loading && !stocks.length) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <Button 
          title="إعادة المحاولة" 
          onPress={refreshStocks}
          variant="primary"
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          المخزون
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, { padding: theme.spacing.sm }]}
            onPress={() => navigation.navigate('PesticideList')}
          >
            <MaterialCommunityIcons 
              name="flask-outline" 
              size={32} 
              color={theme.colors.primary.base} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { padding: theme.spacing.sm }]}
            onPress={() => navigation.navigate('Animals')}
          >
            <MaterialCommunityIcons 
              name="cow" 
              size={32} 
              color={theme.colors.primary.base} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { padding: theme.spacing.sm }]}
            onPress={() => navigation.navigate('AddStock')}
          >
            <Feather name="plus" size={32} color={theme.colors.primary.base} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.base]}
            tintColor={theme.colors.primary.base}
          />
        }
      >
        <View style={styles.statsSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsContent}
          >
            <View style={[styles.summaryItem, { backgroundColor: theme.colors.accent.base }]}>
              <View style={styles.summaryIconContainer}>
                <MaterialCommunityIcons 
                  name="warehouse" 
                  size={32} 
                  color={theme.colors.neutral.surface} 
                />
              </View>
              <Text style={styles.summaryNumber}>
                {(stockStats?.totalItems || stocks.length).toLocaleString('en-US')}
              </Text>
              <Text style={styles.summaryLabel}>إجمالي المخزون</Text>
            </View>

            <View style={[styles.summaryItem, { backgroundColor: theme.colors.warning }]}>
              <View style={styles.summaryIconContainer}>
                <MaterialCommunityIcons 
                  name="alert-circle" 
                  size={32} 
                  color={theme.colors.neutral.surface} 
                />
              </View>
              <Text style={styles.summaryNumber}>
                {stockStats.lowStockItems.length.toLocaleString('en-US')}
              </Text>
              <Text style={styles.summaryLabel}>مخزون منخفض</Text>
            </View>

            <View style={[styles.summaryItem, { backgroundColor: theme.colors.success }]}>
              <View style={styles.summaryIconContainer}>
                <MaterialCommunityIcons 
                  name="currency-usd" 
                  size={32} 
                  color={theme.colors.neutral.surface} 
                />
              </View>
              <Text style={styles.summaryNumber}>
                {stockStats.totalValue.toLocaleString('en-US')} DH
              </Text>
              <Text style={styles.summaryLabel}>القيمة الإجمالية</Text>
            </View>
          </ScrollView>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={24}
              color={theme.colors.neutral.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="البحث عن منتج..."
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={handleClearSearch}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={24}
                  color={theme.colors.neutral.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'all' && { backgroundColor: theme.colors.primary.base }
            ]}
            onPress={() => handleCategoryPress('all')}
          >
            <MaterialCommunityIcons
              name="view-grid"
              size={32}
              color={selectedCategory === 'all' ? theme.colors.neutral.surface : theme.colors.primary.base}
            />
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === 'all' && { color: theme.colors.neutral.surface }
              ]}
            >
              الكل
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryButton,
                selectedCategory === category.value && { backgroundColor: theme.colors.primary.base }
              ]}
              onPress={() => handleCategoryPress(category.value)}
            >
              {category.iconType === 'material' ? (
                <MaterialCommunityIcons
                  name={category.icon as MaterialNames}
                  size={32}
                  color={selectedCategory === category.value ? theme.colors.neutral.surface : theme.colors.primary.base}
                />
              ) : (
                <Feather
                  name={category.icon as FeatherNames}
                  size={32}
                  color={selectedCategory === category.value ? theme.colors.neutral.surface : theme.colors.primary.base}
                />
              )}
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.value && { color: theme.colors.neutral.surface }
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.stockList}>
          {paginatedStocks.length > 0 ? (
            paginatedStocks.map((item) => (
              <View key={item.id} style={{ position: 'relative' }}>
                {item.quantity <= (item.lowStockThreshold || 0) && (
                  <View style={styles.lowStockIndicator}>
                    <Text style={styles.lowStockText}>مخزون منخفض</Text>
                  </View>
                )}
                <StockItemCard
                  item={item}
                  onPress={() => handleStockPress(item)}
                />
              </View>
            ))
          ) : (
            renderEmptyState()
          )}
        </View>

        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === 1 && styles.paginationButtonDisabled
              ]}
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <Text style={styles.paginationButtonText}>السابق</Text>
            </TouchableOpacity>
            <Text style={styles.paginationText}>
              صفحة {currentPage.toLocaleString('en-US')} من {totalPages.toLocaleString('en-US')}
            </Text>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === totalPages && styles.paginationButtonDisabled
              ]}
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <Text style={styles.paginationButtonText}>التالي</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
};

export default StockScreen;
