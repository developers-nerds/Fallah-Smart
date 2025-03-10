import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Text, 
  Alert, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useStock } from '../../../context/StockContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { Animal, HealthStatus, BreedingStatus } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import Animated, { FadeInDown } from 'react-native-reanimated';

type AnimalListProps = {
  navigation: StackNavigationProp<StockStackParamList, 'Animals'>;
};

const getHealthStatusColor = (status: HealthStatus, theme: any) => {
  switch (status) {
    case 'excellent':
      return theme.colors.success;
    case 'good':
      return theme.colors.primary.base;
    case 'fair':
      return theme.colors.accent.base;
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

const getBreedingStatusLabel = (status: BreedingStatus): string => {
  switch (status) {
    case 'not_breeding':
      return 'غير متكاثر';
    case 'in_heat':
      return 'في فترة التزاوج';
    case 'pregnant':
      return 'حامل';
    case 'nursing':
      return 'مرضعة';
    default:
      return status;
  }
};

const getBreedingStatusColor = (status: BreedingStatus, theme: any) => {
  switch (status) {
    case 'not_breeding':
      return theme.colors.neutral.textSecondary;
    case 'in_heat':
      return theme.colors.warning;
    case 'pregnant':
      return theme.colors.primary.base;
    case 'nursing':
      return theme.colors.success;
    default:
      return theme.colors.neutral.textSecondary;
  }
};

const getAnimalIcon = (type: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const lowercaseType = type.toLowerCase();
  if (lowercaseType.includes('بقرة') || lowercaseType.includes('ثور')) return 'cow';
  if (lowercaseType.includes('خروف') || lowercaseType.includes('نعجة')) return 'sheep';
  if (lowercaseType.includes('دجاج') || lowercaseType.includes('ديك')) return 'bird';
  if (lowercaseType.includes('ماعز')) return 'sheep';
  return 'paw';
};

export const AnimalList = ({ navigation }: AnimalListProps) => {
  const theme = useTheme();
  const { animals, deleteAnimal, addAnimalQuantity, removeAnimalQuantity, loading, error, refreshAnimals } = useStock();
  const [expandedAnimal, setExpandedAnimal] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAnimals();
    } catch (error) {
      console.error('Error refreshing animals:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAnimals]);

  const handleDeleteAnimal = useCallback((id: string) => {
    Alert.alert(
      'حذف الحيوان',
      'هل أنت متأكد من حذف هذا الحيوان؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          onPress: () => deleteAnimal(id),
          style: 'destructive',
        },
      ]
    );
  }, [deleteAnimal]);

  const handleQuantityChange = useCallback(async (id: string, action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        await addAnimalQuantity(id, 1);
      } else {
        await removeAnimalQuantity(id, 1);
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تعديل الكمية');
    }
  }, [addAnimalQuantity, removeAnimalQuantity]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedAnimal(prev => prev === id ? null : id);
  }, []);

  const filteredAnimals = useMemo(() => {
    return animals.filter(animal =>
      animal.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [animals, searchQuery]);

  const renderDetailItem = useCallback((label: string, value: string | null) => {
    if (!value) return null;
    return (
      <View style={styles.detailItem}>
        <Text style={[styles.detailLabel, { color: theme.colors.neutral.textSecondary }]}>
          {label}:
        </Text>
        <Text style={[styles.detailValue, { color: theme.colors.neutral.textPrimary }]}>
          {value}
        </Text>
      </View>
    );
  }, [theme]);

  const renderAnimalItem = useCallback(({ item, index }: { item: Animal; index: number }) => {
    const isExpanded = expandedAnimal === item.id;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
      >
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.neutral.surface }]}
          onPress={() => toggleExpand(item.id)}
        >
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons 
              name={getAnimalIcon(item.type) as keyof typeof MaterialCommunityIcons.glyphMap} 
              size={24} 
              color={theme.colors.primary.base} 
            />
            <View style={styles.animalInfo}>
              <Text style={[styles.animalType, { color: theme.colors.neutral.textPrimary }]}>
                {item.type} ({item.gender === 'male' ? 'ذكر' : 'أنثى'})
              </Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  onPress={() => handleQuantityChange(item.id, 'remove')}
                  style={[styles.quantityButton, { 
                    backgroundColor: theme.colors.error,
                    opacity: item.count > 0 ? 1 : 0.5 
                  }]}
                  disabled={item.count === 0 || loading}
                >
                  <MaterialCommunityIcons 
                    name={'minus' as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={16} 
                    color={theme.colors.neutral.surface} 
                  />
                </TouchableOpacity>
                <Text style={[styles.quantityText, { color: theme.colors.neutral.textPrimary }]}>
                  {item.count}
                </Text>
                <TouchableOpacity
                  onPress={() => handleQuantityChange(item.id, 'add')}
                  style={[styles.quantityButton, { backgroundColor: theme.colors.success }]}
                  disabled={loading}
                >
                  <MaterialCommunityIcons 
                    name={'plus' as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={16} 
                    color={theme.colors.neutral.surface} 
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteAnimal(item.id)}
                style={styles.deleteButton}
                disabled={loading}
              >
                <MaterialCommunityIcons 
                  name={'trash-can-outline' as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={20} 
                  color={theme.colors.error} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getHealthStatusColor(item.healthStatus, theme) }]}>
                <MaterialCommunityIcons 
                  name={'heart-pulse' as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={16} 
                  color="#FFF" 
                />
                <Text style={styles.statusText}>
                  {getHealthStatusLabel(item.healthStatus)}
                </Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: getBreedingStatusColor(item.breedingStatus, theme) }]}>
                <MaterialCommunityIcons 
                  name={'baby-carriage' as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={16} 
                  color="#FFF" 
                />
                <Text style={styles.statusText}>
                  {getBreedingStatusLabel(item.breedingStatus)}
                </Text>
              </View>
            </View>

            <Text style={[styles.infoText, { color: theme.colors.neutral.textPrimary }]}>
              التغذية: {item.feedingSchedule}
            </Text>

            {isExpanded && (
              <View style={styles.expandedDetails}>
                {renderDetailItem('تفاصيل التغذية', item.feeding || null)}
                {item.dailyFeedConsumption && renderDetailItem('استهلاك العلف اليومي', `${item.dailyFeedConsumption} كجم`)}
                {renderDetailItem('الصحة', item.health || null)}
                {renderDetailItem('الأمراض', item.diseases || null)}
                {renderDetailItem('الأدوية', item.medications || null)}
                {renderDetailItem('التطعيم', item.vaccination || null)}
                {item.nextVaccinationDate && renderDetailItem(
                  'موعد التطعيم القادم',
                  new Date(item.nextVaccinationDate).toLocaleDateString('ar-SA')
                )}
                {item.birthDate && renderDetailItem(
                  'تاريخ الميلاد',
                  new Date(item.birthDate).toLocaleDateString('ar-SA')
                )}
                {item.weight && renderDetailItem('الوزن', `${item.weight} كجم`)}
                {item.lastBreedingDate && renderDetailItem(
                  'تاريخ التكاثر الأخير',
                  new Date(item.lastBreedingDate).toLocaleDateString('ar-SA')
                )}
                {item.expectedBirthDate && renderDetailItem(
                  'تاريخ الولادة المتوقع',
                  new Date(item.expectedBirthDate).toLocaleDateString('ar-SA')
                )}
                {item.offspringCount > 0 && renderDetailItem('عدد النسل', item.offspringCount.toString())}
                {renderDetailItem('ملاحظات', item.notes || null)}
              </View>
            )}

            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => toggleExpand(item.id)}
            >
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-up' : 'chevron-down' as keyof typeof MaterialCommunityIcons.glyphMap}
                size={24}
                color={theme.colors.neutral.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [theme, expandedAnimal, loading, handleQuantityChange, handleDeleteAnimal, toggleExpand, renderDetailItem]);

  if (loading && !animals.length) {
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
          name={'cow-off' as keyof typeof MaterialCommunityIcons.glyphMap}
          size={64} 
          color={theme.colors.error} 
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          حدث خطأ أثناء تحميل الحيوانات
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary.base }]}
          onPress={handleRefresh}
        >
          <MaterialCommunityIcons 
            name={'refresh' as keyof typeof MaterialCommunityIcons.glyphMap}
            size={20} 
            color="#FFF" 
          />
          <Text style={styles.retryButtonText}>
            إعادة المحاولة
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <FlatList
        data={filteredAnimals}
        renderItem={renderAnimalItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.base]}
            tintColor={theme.colors.primary.base}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="cow" 
              size={64} 
              color={theme.colors.neutral.textSecondary} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.neutral.textSecondary }]}>
              {searchQuery ? 'لم يتم العثور على حيوانات' : 'لا توجد حيوانات مسجلة'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  animalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  animalType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    minWidth: 24,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 4,
  },
  cardContent: {
    marginTop: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
  },
  expandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  expandButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
}));

export default AnimalList; 