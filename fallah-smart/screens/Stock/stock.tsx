import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, TextInput, TouchableOpacity, Text, ScrollView } from 'react-native';
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

const StockScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<StockScreenNavigationProp>();
  const { stocks } = useStock();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StockCategory>('all');

  const handleCategoryPress = (category: StockCategory) => {
    if (category === 'animals') {
      navigation.navigate('Animals');
    } else {
      setSelectedCategory(prev => prev === category ? 'all' : category);
    }
  };

  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      const matchesSearch = stock.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || stock.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [stocks, searchQuery, selectedCategory]);

  const handleStockPress = (item: StockItem) => {
    navigation.navigate('StockDetail', { stockId: item.id });
  };

  const handleAddStock = () => {
    // @ts-ignore
    navigation.navigate('AddStock');
  };

  const handleAddAnimal = () => {
    navigation.navigate('Animals');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={styles.topButtonsContainer}>
        <TouchableOpacity
          style={[styles.topButton, { backgroundColor: theme.colors.primary.base }]}
          onPress={() => navigation.navigate('AddStock')}
        >
          <MaterialCommunityIcons 
            name="plus" 
            size={20} 
            color={theme.colors.neutral.surface} 
          />
          <Text style={[styles.topButtonText, { color: theme.colors.neutral.surface }]}>
            Ajouter Stock
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topButton, { backgroundColor: theme.colors.accent.base }]}
          onPress={() => navigation.navigate('Animals')}
        >
          <MaterialCommunityIcons 
            name="cow" 
            size={20} 
            color={theme.colors.neutral.surface} 
          />
          <Text style={[styles.topButtonText, { color: theme.colors.neutral.surface }]}>
            Ajouter Animal
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryItem, { backgroundColor: theme.colors.accent.base }]}>
            <View style={styles.summaryIconContainer}>
              <MaterialCommunityIcons 
                name="warehouse" 
                size={24} 
                color={theme.colors.neutral.surface} 
              />
            </View>
            <Text style={styles.summaryNumber}>{stocks.length}</Text>
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
              {stocks.filter(s => s.quantity <= s.lowStockThreshold).length}
            </Text>
            <Text style={styles.summaryLabel}>Stock Bas</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={theme.colors.neutral.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.neutral.textPrimary }]}
            placeholder="Rechercher un produit..."
            placeholderTextColor={theme.colors.neutral.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color={theme.colors.neutral.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
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
                  ? theme.colors.primary.light 
                  : theme.colors.neutral.surface,
                borderColor: selectedCategory === 'all'
                  ? theme.colors.primary.base 
                  : theme.colors.secondary.light,
              }
            ]}
            onPress={() => handleCategoryPress('all')}
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
                      ? theme.colors.primary.light 
                      : theme.colors.neutral.surface,
                    borderColor: isSelected 
                      ? theme.colors.primary.base 
                      : theme.colors.secondary.light,
                  }
                ]}
                onPress={() => handleCategoryPress(category.value)}
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
                      : theme.colors.neutral.textPrimary,
                    fontWeight: isSelected ? '600' : '400'
                  }
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredStocks}
        renderItem={({ item }) => (
          <StockItemCard
            item={item}
            onPress={() => handleStockPress(item)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather 
              name="package" 
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
        }
      />

      <Button
        title="Voir les Animaux"
        onPress={() => navigation.navigate('AnimalList')}
        style={styles.viewAnimalsButton}
      />
    </View>
  );
};

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
  },
  topButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    paddingBottom: 8,
  },
  topButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  topButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsSection: {
    padding: 16,
    paddingBottom: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
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
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.neutral.surface,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.neutral.surface,
    marginTop: 4,
    fontWeight: '500',
    opacity: 0.9,
  },
  searchSection: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
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
  },
  viewAnimalsButton: {
    marginTop: 16,
    marginHorizontal: 16,
  },
}));

export default StockScreen;
