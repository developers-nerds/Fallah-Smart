import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useStock } from '../../../context/StockContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animal, HealthStatus } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SearchBar } from '../../../components/SearchBar';
import { FAB } from '../../../components/FAB';

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 10;

type AnimalsScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'Animals'>;
};

const getHealthStatusColor = (status: HealthStatus, theme: any) => {
  switch (status) {
    case 'excellent':
      return theme.colors.success;
    case 'good':
      return theme.colors.primary.base;
    case 'fair':
      return theme.colors.warning;
    case 'poor':
      return theme.colors.error;
    default:
      return theme.colors.neutral.textSecondary;
  }
};

const getHealthStatusLabel = (status: HealthStatus): string => {
  switch (status) {
    case 'excellent':
      return 'ممتاز';
    case 'good':
      return 'جيد';
    case 'fair':
      return 'متوسط';
    case 'poor':
      return 'سيء';
    default:
      return status;
  }
};

const getAnimalIcon = (type: string): string => {
  const lowercaseType = type.toLowerCase();
  if (lowercaseType.includes('بقرة') || lowercaseType.includes('ثور')) return 'cow';
  if (lowercaseType.includes('خروف') || lowercaseType.includes('نعجة')) return 'sheep';
  if (lowercaseType.includes('دجاج') || lowercaseType.includes('ديك')) return 'bird';
  if (lowercaseType.includes('ماعز')) return 'goat';
  return 'paw';
};

export const AnimalsScreen = ({ navigation }: AnimalsScreenProps) => {
  const theme = useTheme();
  const { animals, loading, error, refreshAnimals } = useStock();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAnimals();
      setPage(1);
    } catch (error) {
      console.error('Error refreshing animals:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAnimals]);

  const filteredAnimals = useMemo(() => {
    return animals
      .filter(animal => 
        animal.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [animals, searchQuery]);

  const paginatedAnimals = useMemo(() => {
    return filteredAnimals.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredAnimals, page]);

  const handleLoadMore = useCallback(() => {
    if (paginatedAnimals.length < filteredAnimals.length) {
      setPage(prev => prev + 1);
    }
  }, [paginatedAnimals.length, filteredAnimals.length]);

  const renderAnimalCard = useCallback(({ item, index }: { item: Animal; index: number }) => {
    const animalIcon = getAnimalIcon(item.type);
    
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={[styles.card, { backgroundColor: theme.colors.neutral.surface }]}
      >
        <TouchableOpacity 
          style={styles.cardContent}
          onPress={() => navigation.navigate('AnimalDetail', { animalId: item.id })}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary.base }]}>
              <MaterialCommunityIcons 
                name={animalIcon as any} 
                size={24} 
                color="#FFF" 
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.animalType, { color: theme.colors.neutral.textPrimary }]}>
                {item.type}
              </Text>
              <Text style={[styles.animalGender, { color: theme.colors.neutral.textSecondary }]}>
                {item.gender === 'male' ? 'ذكر' : 'أنثى'}
              </Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: theme.colors.primary.base }]}>
              <Text style={[styles.countText, { color: '#FFF' }]}>
                {item.count}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={[
              styles.healthBadge, 
              { backgroundColor: getHealthStatusColor(item.healthStatus, theme) }
            ]}>
              <MaterialCommunityIcons 
                name="heart-pulse" 
                size={16} 
                color="#FFF" 
              />
              <Text style={styles.healthText}>
                {getHealthStatusLabel(item.healthStatus)}
              </Text>
            </View>
            <Text style={[styles.feedingText, { color: theme.colors.neutral.textSecondary }]}>
              {item.feedingSchedule || 'لا يوجد برنامج تغذية'}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [theme, navigation]);

  if (loading && !animals.length) {
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
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          حدث خطأ
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="بحث عن حيوان..."
      />

      <FlatList
        data={paginatedAnimals}
        renderItem={renderAnimalCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.base]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="paw" 
              size={64} 
              color={theme.colors.neutral.textSecondary} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
              لم يتم العثور على حيوانات
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        onPress={() => navigation.navigate('AddAnimal')}
        style={styles.fab}
      />
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
  list: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  animalType: {
    fontSize: 18,
    fontWeight: '600',
  },
  animalGender: {
    fontSize: 14,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  healthText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  feedingText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
}); 