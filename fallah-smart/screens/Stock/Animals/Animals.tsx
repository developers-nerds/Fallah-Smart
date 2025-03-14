import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useStock } from '../../../context/StockContext';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Animal, HealthStatus, BreedingStatus } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SearchBar } from '../../../components/SearchBar';
import { FAB } from '../../../components/FAB';

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 4;

type AnimalsScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'Animals'>;
};

const ANIMAL_TYPES = {
  cow: { icon: '🐄', name: 'بقرة', category: 'ماشية' },
  bull: { icon: '🐂', name: 'ثور', category: 'ماشية' },
  buffalo: { icon: '🦬', name: 'جاموس', category: 'ماشية' },
  sheep: { icon: '🐑', name: 'خروف', category: 'ماشية' },
  ram: { icon: '🐏', name: 'كبش', category: 'ماشية' },
  goat: { icon: '🐐', name: 'ماعز', category: 'ماشية' },
  camel: { icon: '🐪', name: 'جمل', category: 'ماشية' },
  horse: { icon: '🐎', name: 'حصان', category: 'ماشية' },
  donkey: { icon: '🦓', name: 'حمار', category: 'ماشية' },
  ox: { icon: '🐃', name: 'ثور الحراثة', category: 'ماشية' },
  llama: { icon: '🦙', name: 'لاما', category: 'ماشية' },
  
  // Poultry (دواجن)
  chicken: { icon: '🐔', name: 'دجاج', category: 'دواجن' },
  rooster: { icon: '🐓', name: 'ديك', category: 'دواجن' },
  chick: { icon: '🐥', name: 'كتكوت', category: 'دواجن' },
  duck: { icon: '🦆', name: 'بط', category: 'دواجن' },
  turkey: { icon: '🦃', name: 'ديك رومي', category: 'دواجن' },
  goose: { icon: '🦢', name: 'إوز', category: 'دواجن' },
  
  // Birds (طيور)
  pigeon: { icon: '🕊️', name: 'حمام', category: 'طيور' },
  dove: { icon: '🕊️', name: 'يمام', category: 'طيور' },
  peacock: { icon: '🦚', name: 'طاووس', category: 'طيور' },
  parrot: { icon: '🦜', name: 'ببغاء', category: 'طيور' },
  
  
  // Small Animals (حيوانات صغيرة)
  rabbit: { icon: '🐰', name: 'أرنب', category: 'حيوانات صغيرة' },

  
  // Guard/Working Animals (حيوانات الحراسة والعمل)
  dog: { icon: '🐕', name: 'كلب حراسة', category: 'حيوانات الحراسة والعمل' },
  shepherdDog: { icon: '🦮', name: 'كلب راعي', category: 'حيوانات الحراسة والعمل' },
  
  // Insects (حشرات)
  bee: { icon: '🐝', name: 'نحل', category: 'حشرات' },
};

const CATEGORY_ICONS = {
  'الكل': '🌐',
  'ماشية': '🐄',
  'دواجن': '🐔',
  'حيوانات صغيرة': '🐰',
  'طيور': '🦅',
  'حشرات': '🐝',
  'أسماك': '🐟',
  'حيوانات أليفة': '🐕',
  'حيوانات الحراسة والعمل': '🦮',
  'حيوانات نادرة': '🦒',
};

const HEALTH_STATUS_ICONS = {
  excellent: '🌟',
  good: '💚',
  fair: '💛',
  poor: '❤️‍🩹',
};

const BREEDING_STATUS_ICONS = {
  pregnant: '🐣',
  nursing: '🍼',
  in_heat: '💝',
  not_breeding: '⭕',
};

const FIELD_ICONS = {
  count: '🔢',
  birthDate: '🎂',
  weight: '⚖️',
  gender: {
    male: '♂️',
    female: '♀️'
  }
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

const getBreedingStatusColor = (status: BreedingStatus, theme: any) => {
  switch (status) {
    case 'pregnant':
      return theme.colors.primary.base;
    case 'nursing':
      return theme.colors.info;
    case 'in_heat':
      return theme.colors.warning;
    case 'not_breeding':
    default:
      return theme.colors.neutral.border;
  }
};

const getBreedingStatusLabel = (status: BreedingStatus): string => {
  switch (status) {
    case 'pregnant':
      return 'حامل';
    case 'nursing':
      return 'في فترة الرضاعة';
    case 'in_heat':
      return 'في فترة التزاوج';
    case 'not_breeding':
    default:
      return 'غير متزاوج';
  }
};

const getBreedingStatusIcon = (status: BreedingStatus): string => {
  switch (status) {
    case 'pregnant':
      return '🤰';
    case 'nursing':
      return '👶';
    case 'in_heat':
      return '🔥';
    case 'not_breeding':
    default:
      return '⚪';
  }
};

export const AnimalsScreen = ({ navigation }: AnimalsScreenProps) => {
  const theme = useTheme();
  const { animals, loading, error, refreshAnimals } = useStock();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Only log once during development, remove in production
  // console.log('AnimalsScreen render - Animals count:', animals?.length);
  // console.log('AnimalsScreen render - Loading state:', loading);
  // console.log('AnimalsScreen render - Error state:', error);

  useEffect(() => {
    console.log('AnimalsScreen mounted - fetching data');
    // Call refreshAnimals only once when component mounts
    let isMounted = true;
    const loadData = async () => {
      try {
        await refreshAnimals();
        // Only update state if component is still mounted
        if (!isMounted) return;
      } catch (err) {
        console.error('Error loading animals:', err);
      }
    };
    
    loadData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // console.log('Manual refresh triggered');
      await refreshAnimals();
      setPage(1);
      // console.log('Manual refresh completed');
    } catch (error) {
      console.error('Error refreshing animals:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAnimals]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      animals.map(animal => {
        const animalType = Object.keys(ANIMAL_TYPES).find(key => 
          animal.type.toLowerCase() === key || 
          animal.type.toLowerCase() === ANIMAL_TYPES[key as keyof typeof ANIMAL_TYPES].name
        );
        return animalType ? ANIMAL_TYPES[animalType as keyof typeof ANIMAL_TYPES].category : 'أخرى';
      })
    );
    return ['الكل', ...Array.from(uniqueCategories)];
  }, [animals]);

  const filteredAnimals = useMemo(() => {
    return animals
      .filter(animal => {
        const matchesSearch = animal.type.toLowerCase().includes(searchQuery.toLowerCase());
        if (!selectedCategory || selectedCategory === 'الكل') return matchesSearch;
        
        const animalType = Object.keys(ANIMAL_TYPES).find(key => 
          animal.type.toLowerCase() === key || 
          animal.type.toLowerCase() === ANIMAL_TYPES[key as keyof typeof ANIMAL_TYPES].name
        );
        const category = animalType ? ANIMAL_TYPES[animalType as keyof typeof ANIMAL_TYPES].category : 'أخرى';
        return matchesSearch && category === selectedCategory;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [animals, searchQuery, selectedCategory]);

  const paginatedAnimals = useMemo(() => {
    return filteredAnimals.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredAnimals, page]);

  const handleLoadMore = useCallback(() => {
    if (paginatedAnimals.length < filteredAnimals.length) {
      setPage(prev => prev + 1);
    }
  }, [paginatedAnimals.length, filteredAnimals.length]);

  const renderFooter = useCallback(() => {
    if (paginatedAnimals.length >= filteredAnimals.length) return null;
    
    // console.log('Rendering footer - more animals to show');
    return (
      <TouchableOpacity
        style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary.base }]}
        onPress={handleLoadMore}
      >
        <Text style={styles.seeMoreText}>عرض المزيد</Text>
        <MaterialCommunityIcons name="chevron-down" size={24} color="#FFF" />
      </TouchableOpacity>
    );
  }, [paginatedAnimals.length, filteredAnimals.length, handleLoadMore, theme]);

  const renderListEmptyComponent = useCallback(() => {
    // console.log('Rendering empty state - no animals found');
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
          لا توجد حيوانات
        </Text>
        <TouchableOpacity
          style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary.base }]}
          onPress={handleRefresh}
        >
          <Text style={styles.seeMoreText}>تحديث</Text>
          <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }, [theme, handleRefresh]);

  const renderCategoryChip = useCallback(({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        { 
          backgroundColor: selectedCategory === item ? theme.colors.primary.base : theme.colors.neutral.surface,
          borderColor: selectedCategory === item ? theme.colors.primary.base : theme.colors.neutral.border,
          opacity: item === 'الكل' ? (selectedCategory === item || !selectedCategory ? 1 : 0.7) : 1,
        }
      ]}
      onPress={() => setSelectedCategory(selectedCategory === item ? null : item)}
    >
      <Text style={[styles.categoryIcon, item === 'الكل' && styles.allCategoryIcon]}>
        {CATEGORY_ICONS[item as keyof typeof CATEGORY_ICONS] || '🐾'}
      </Text>
      <Text style={[
        styles.categoryText,
        { color: selectedCategory === item ? '#FFF' : theme.colors.neutral.textSecondary }
      ]}>
        {item}
      </Text>
      {selectedCategory === item && (
        <MaterialCommunityIcons name="close-circle" size={16} color="#FFF" />
      )}
    </TouchableOpacity>
  ), [selectedCategory, theme]);

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
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => navigation.navigate('AnimalDetail', { animalId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: isPoorHealth ? theme.colors.error : theme.colors.primary.base }
            ]}>
              <Text style={styles.animalIcon}>{animalInfo?.icon || '🐾'}</Text>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.titleContainer}>
                <Text style={[styles.animalType, { color: theme.colors.neutral.textPrimary }]}>
                  {animalInfo?.name || item.type}
                </Text>
                <View style={styles.categoryRow}>
                  <Text style={styles.categoryIcon}>
                    {CATEGORY_ICONS[animalInfo?.category as keyof typeof CATEGORY_ICONS] || '🐾'}
                  </Text>
                  <Text style={[styles.animalCategory, { color: theme.colors.neutral.textSecondary }]}>
                    {animalInfo?.category}
                  </Text>
                </View>
              </View>
              <View style={styles.subtitleContainer}>
                <View style={styles.genderContainer}>
                  <Text style={styles.genderIcon}>
                    {FIELD_ICONS.gender[item.gender]}
                  </Text>
                  <Text style={[styles.animalGender, { color: theme.colors.neutral.textSecondary }]}>
                    {item.gender === 'male' ? 'ذكر' : 'أنثى'}
                  </Text>
                </View>
                <View style={[
                  styles.breedingBadge,
                  { backgroundColor: getBreedingStatusColor(item.breedingStatus, theme) }
                ]}>
                  <Text style={styles.breedingIcon}>
                    {BREEDING_STATUS_ICONS[item.breedingStatus]}
                  </Text>
                  <Text style={styles.breedingText}>
                    {getBreedingStatusLabel(item.breedingStatus)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[
              styles.countBadge,
              { backgroundColor: theme.colors.primary.base }
            ]}>
              <Text style={styles.countIcon}>{FIELD_ICONS.count}</Text>
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
              <Text style={styles.healthIcon}>
                {HEALTH_STATUS_ICONS[item.healthStatus]}
              </Text>
              <Text style={styles.healthText}>
                {getHealthStatusLabel(item.healthStatus)}
              </Text>
            </View>
            {item.birthDate && (
              <View style={styles.birthDateContainer}>
                <Text style={styles.calendarIcon}>{FIELD_ICONS.birthDate}</Text>
                <Text style={[styles.birthDate, { color: theme.colors.neutral.textSecondary }]}>
                  {new Date(item.birthDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </Text>
              </View>
            )}
          </View>

          {isPoorHealth && (
            <View style={[styles.alertContainer, { backgroundColor: theme.colors.error }]}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <Text style={styles.alertText}>
                حالة صحية سيئة - يحتاج إلى رعاية فورية
              </Text>
            </View>
          )}

          {item.vaccination && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="needle" size={16} color={theme.colors.neutral.textSecondary} />
              <Text style={[styles.infoText, { color: theme.colors.neutral.textSecondary }]}>
                التلقيح: {item.vaccination}
              </Text>
            </View>
          )}
          {item.nextVaccinationDate && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.neutral.textSecondary} />
              <Text style={[styles.infoText, { color: theme.colors.neutral.textSecondary }]}>
                موعد التلقيح القادم: {new Date(item.nextVaccinationDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }, [theme, navigation]);

  const renderHeader = useCallback(() => (
    <Animated.View entering={FadeIn.springify()}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="ابحث عن الحيوانات..."
          style={styles.searchBar}
        />
      </View>
      <FlatList
        data={categories}
        renderItem={renderCategoryChip}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesList}
        contentContainerStyle={styles.categoriesContent}
        keyExtractor={item => item}
      />
    </Animated.View>
  ), [searchQuery, categories, renderCategoryChip]);

  if (loading && !animals.length) {
    // console.log('Showing loading indicator');
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
        <Text style={{ marginTop: 10, color: theme.colors.neutral.textSecondary }}>
          جاري تحميل الحيوانات...
        </Text>
      </View>
    );
  }

  if (error) {
    // console.log('Showing error state:', error);
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          حدث خطأ: {error}
        </Text>
        <TouchableOpacity
          style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary.base, marginTop: 20 }]}
          onPress={handleRefresh}
        >
          <Text style={styles.seeMoreText}>إعادة المحاولة</Text>
          <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar
        backgroundColor={theme.colors.neutral.surface}
        barStyle="dark-content"
      />
      <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        {animals.length > 0 ? (
          <>
            <FlatList
              data={paginatedAnimals}
              renderItem={renderAnimalCard}
              keyExtractor={item => item.id?.toString()}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={renderHeader}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderListEmptyComponent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[theme.colors.primary.base]}
                  tintColor={theme.colors.primary.base}
                />
              }
            />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🐄</Text>
            <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
              لم يتم العثور على حيوانات
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary, marginTop: 10 }]}>
              Number of animals: {animals.length}, Filtered: {filteredAnimals.length}, Paginated: {paginatedAnimals.length}
            </Text>
            <TouchableOpacity
              style={[styles.seeMoreButton, { backgroundColor: theme.colors.primary.base, marginTop: 20 }]}
              onPress={handleRefresh}
            >
              <Text style={styles.seeMoreText}>تحديث</Text>
              <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
        <FAB
          icon="plus"
          onPress={() => navigation.navigate('AddAnimal', {})}
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
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    marginBottom: 0,
  },
  categoriesList: {
    maxHeight: 48,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalIcon: {
    fontSize: 32,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  titleContainer: {
    gap: 2,
  },
  animalType: {
    fontSize: 18,
    fontWeight: '600',
  },
  animalCategory: {
    fontSize: 14,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  genderIcon: {
    fontSize: 16,
  },
  animalGender: {
    fontSize: 14,
  },
  breedingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  breedingIcon: {
    fontSize: 16,
  },
  breedingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
  },
  countIcon: {
    fontSize: 16,
    marginRight: 4,
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
    borderRadius: 12,
    gap: 6,
  },
  healthText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  healthIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  birthDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  birthDate: {
    fontSize: 14,
  },
  calendarIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  alertText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  alertIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  allCategoryIcon: {
    fontSize: 18,
    opacity: 0.9,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 14,
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
}); 