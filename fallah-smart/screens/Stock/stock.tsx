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

type StockScreenNavigationProp = StackNavigationProp<StockStackParamList, 'StockList'>;

const categories: { value: StockCategory; label: string; iconType: 'feather' | 'material'; icon: string }[] = [
  { value: 'seeds', label: 'Semences', iconType: 'material', icon: 'seed' },
  { value: 'fertilizer', label: 'Engrais', iconType: 'material', icon: 'watering-can' },
  { value: 'harvest', label: 'Récoltes', iconType: 'material', icon: 'sprout' },
  { value: 'feed', label: 'Aliments', iconType: 'material', icon: 'food-variant' },
  { value: 'pesticide', label: 'Pesticides', iconType: 'material', icon: 'bug' },
  { value: 'equipment', label: 'Équipement', iconType: 'material', icon: 'tractor' },
  { value: 'tools', label: 'Outils', iconType: 'material', icon: 'tools' },
  { value: 'animals', label: 'Animaux', iconType: 'material', icon: 'cow' }
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
    }
  }, [navigation]);

  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      const matchesSearch = stock.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || stock.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [stocks, searchQuery, selectedCategory]);

  const handleStockPress = useCallback((item: StockItem) => {
    navigation.navigate('StockDetail', { stockId: item.id });
  }, [navigation]);

  const handleAddStock = useCallback(() => {
    navigation.navigate('AddStock');
  }, [navigation]);

  const handleAddAnimal = useCallback(() => {
    navigation.navigate('Animals');
  }, [navigation]);

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
          title="Réessayer" 
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
          Stock
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('PesticideList')}
          >
            <MaterialCommunityIcons 
              name="flask-outline" 
              size={24} 
              color={theme.colors.primary.base} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Animals')}
          >
            <MaterialCommunityIcons 
              name="cow" 
              size={24} 
              color={theme.colors.primary.base} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('AddStock')}
          >
            <Feather name="plus" size={24} color={theme.colors.primary.base} />
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
                  size={24} 
                  color={theme.colors.neutral.surface} 
                />
              </View>
              <Text style={styles.summaryNumber}>
                {stockStats?.totalItems || stocks.length}
              </Text>
              <Text style={styles.summaryLabel}>Total Stocks</Text>
            </View>

            <View style={[styles.summaryItem, { backgroundColor: theme.colors.warning }]}>
              <View style={styles.summaryIconContainer}>
                <MaterialCommunityIcons 
                  name="alert-circle" 
                  size={24} 
                  color={theme.colors.neutral.surface} 
                />
              </View>
              <Text style={styles.summaryNumber}>
                {stockStats?.lowStockItems?.length || 
                 stocks.filter(s => s.quantity <= s.lowStockThreshold).length}
              </Text>
              <Text style={styles.summaryLabel}>Stock Bas</Text>
            </View>

            <View style={[styles.summaryItem, { backgroundColor: theme.colors.success }]}>
              <View style={styles.summaryIconContainer}>
                <MaterialCommunityIcons 
                  name="cash" 
                  size={24} 
                  color={theme.colors.neutral.surface} 
                />
              </View>
              <Text style={styles.summaryNumber}>
                {stockStats?.totalValue?.toFixed(2) || '0.00'}€
              </Text>
              <Text style={styles.summaryLabel}>Valeur Totale</Text>
            </View>
          </ScrollView>
        </View>

        <View style={styles.categoriesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                { 
                  backgroundColor: selectedCategory === 'all' 
                    ? theme.colors.primary.base 
                    : theme.colors.neutral.surface,
                }
              ]}
              onPress={() => handleCategoryPress('all')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.categoryText,
                { 
                  color: selectedCategory === 'all'
                    ? theme.colors.neutral.surface 
                    : theme.colors.neutral.textPrimary 
                }
              ]}>
                Tous
              </Text>
            </TouchableOpacity>

            {categories.map((category) => {
              const isSelected = selectedCategory === category.value;
              return (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryChip,
                    { 
                      backgroundColor: isSelected 
                        ? theme.colors.primary.base 
                        : theme.colors.neutral.surface,
                    }
                  ]}
                  onPress={() => handleCategoryPress(category.value)}
                  activeOpacity={0.7}
                >
                  {category.iconType === 'feather' ? (
                    <Feather 
                      name={category.icon as FeatherNames} 
                      size={16} 
                      color={isSelected 
                        ? theme.colors.neutral.surface 
                        : theme.colors.neutral.textPrimary
                      } 
                    />
                  ) : (
                    <MaterialCommunityIcons 
                      name={category.icon as MaterialNames} 
                      size={16} 
                      color={isSelected 
                        ? theme.colors.neutral.surface 
                        : theme.colors.neutral.textPrimary
                      } 
                    />
                  )}
                  <Text style={[
                    styles.categoryText,
                    { 
                      color: isSelected 
                        ? theme.colors.neutral.surface 
                        : theme.colors.neutral.textPrimary
                    }
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.listContainer}>
          {filteredStocks.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 100).springify()}
              style={styles.cardContainer}
            >
              <StockItemCard
                item={item}
                onPress={() => navigation.navigate('StockDetail', { stockId: item.id })}
              />
            </Animated.View>
          ))}

          {filteredStocks.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="package-variant" 
                size={64} 
                color={theme.colors.neutral.textSecondary} 
              />
              <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
                Aucun stock trouvé
              </Text>
              <Text style={[styles.emptySubText, { color: theme.colors.neutral.textSecondary }]}>
                {searchQuery 
                  ? "Essayez d'autres termes de recherche"
                  : 'Ajoutez des produits pour commencer'}
              </Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 12,
    borderRadius: 12,
    elevation: 2,
  },
  statsSection: {
    paddingVertical: 16,
  },
  statsContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryItem: {
    width: width * 0.4,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#FFF',
    marginTop: 4,
    fontWeight: '500',
    opacity: 0.9,
  },
  searchSection: {
    padding: 16,
    paddingTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  cardContainer: {
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
}));

export default StockScreen;
