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

const ANIMAL_TYPES = {
  cow: { icon: '🐄', name: 'بقرة', category: 'ماشية' },
  sheep: { icon: '🐑', name: 'خروف', category: 'ماشية' },
  goat: { icon: '🐐', name: 'ماعز', category: 'ماشية' },
  chicken: { icon: '🐔', name: 'دجاج', category: 'دواجن' },
  horse: { icon: '🐎', name: 'حصان', category: 'ماشية' },
  donkey: { icon: '🦓', name: 'حمار', category: 'ماشية' },
  rabbit: { icon: '🐰', name: 'أرنب', category: 'حيوانات صغيرة' },
  duck: { icon: '🦆', name: 'بطة', category: 'دواجن' },
  turkey: { icon: '🦃', name: 'ديك رومي', category: 'دواجن' },
  camel: { icon: '🐪', name: 'جمل', category: 'ماشية' },
  pigeon: { icon: '🕊️', name: 'حمام', category: 'طيور' },
  bee: { icon: '🐝', name: 'نحل', category: 'حشرات' },
  fish: { icon: '🐟', name: 'سمك', category: 'أسماك' },
  cat: { icon: '🐱', name: 'قط', category: 'حيوانات أليفة' },
  dog: { icon: '🐕', name: 'كلب', category: 'حيوانات أليفة' },
  pig: { icon: '🐷', name: 'خنزير', category: 'ماشية' },
  goose: { icon: '🦢', name: 'إوزة', category: 'دواجن' },
  rooster: { icon: '🐓', name: 'ديك', category: 'دواجن' },
  peacock: { icon: '🦚', name: 'طاووس', category: 'طيور' },
  parrot: { icon: '🦜', name: 'ببغاء', category: 'طيور' },
  owl: { icon: '🦉', name: 'بومة', category: 'طيور' },
  eagle: { icon: '🦅', name: 'نسر', category: 'طيور' },
  hawk: { icon: '🦆', name: 'صقر', category: 'طيور' },
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
  const animalType = Object.keys(ANIMAL_TYPES).find(key => 
    lowercaseType === key || 
    lowercaseType === ANIMAL_TYPES[key as keyof typeof ANIMAL_TYPES].name
  );
  return animalType ? ANIMAL_TYPES[animalType as keyof typeof ANIMAL_TYPES].icon : '🐾';
};

const getAnimalName = (type: string): string => {
  const lowercaseType = type.toLowerCase();
  const animalType = Object.keys(ANIMAL_TYPES).find(key => 
    lowercaseType === key || 
    lowercaseType === ANIMAL_TYPES[key as keyof typeof ANIMAL_TYPES].name
  );
  return animalType ? ANIMAL_TYPES[animalType as keyof typeof ANIMAL_TYPES].name : type;
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
    const isPoorHealth = item.healthStatus === 'poor';
    const animalType = Object.keys(ANIMAL_TYPES).find(key => 
      item.type.toLowerCase() === key || 
      item.type.toLowerCase() === ANIMAL_TYPES[key as keyof typeof ANIMAL_TYPES].name
    );
    const animalInfo = animalType ? ANIMAL_TYPES[animalType as keyof typeof ANIMAL_TYPES] : null;
    
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
              <Text style={styles.animalIcon}>{animalInfo?.icon || '🐾'}</Text>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.titleContainer}>
                <Text style={[styles.animalType, { color: theme.colors.neutral.textPrimary }]}>
                  {animalInfo?.name || item.type}
                </Text>
                <Text style={[styles.animalCategory, { color: theme.colors.neutral.textSecondary }]}>
                  {animalInfo?.category}
                </Text>
              </View>
              <View style={styles.subtitleContainer}>
                <Text style={[styles.animalGender, { color: theme.colors.neutral.textSecondary }]}>
                  {item.gender === 'male' ? 'ذكر' : 'أنثى'}
                </Text>
                <Text style={styles.breedingIcon}>
                  {item.breedingStatus === 'pregnant' ? '🤰' : 
                   item.breedingStatus === 'lactating' ? '🍼' : 
                   item.breedingStatus === 'ready' ? '❤️' : '⚪'}
                </Text>
              </View>
            </View>
            <View style={[styles.countBadge, { backgroundColor: theme.colors.primary.base }]}>
              <Text style={[styles.countText, { color: '#FFF' }]}>
                {item.count} {item.count === 1 ? 'حيوان' : 'حيوانات'}
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
            {item.birthDate && (
              <View style={styles.birthDateContainer}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={16}
                  color={theme.colors.neutral.textSecondary}
                />
                <Text style={[styles.birthDate, { color: theme.colors.neutral.textSecondary }]}>
                  {new Date(item.birthDate).toLocaleDateString('ar-SA')}
                </Text>
              </View>
            )}
          </View>

          {isPoorHealth && (
            <View style={[styles.alertContainer, { backgroundColor: theme.colors.error }]}>
              <MaterialCommunityIcons name="alert" size={16} color="#FFF" />
              <Text style={styles.alertText}>
                ⚠️ حالة صحية سيئة - يحتاج إلى رعاية فورية
              </Text>
            </View>
          )}
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
  titleContainer: {
    marginBottom: 4,
  },
  animalType: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
  animalCategory: {
    fontSize: 12,
    textAlign: 'right',
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
  animalIcon: {
    fontSize: 32,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breedingIcon: {
    fontSize: 16,
  },
  birthDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  birthDate: {
    fontSize: 14,
    textAlign: 'right',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
    marginTop: 8,
  },
  alertText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
}); 