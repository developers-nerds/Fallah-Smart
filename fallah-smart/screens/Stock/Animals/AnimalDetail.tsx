import React, { useCallback, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  I18nManager,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useStock } from '../../../context/StockContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animal, HealthStatus, BreedingStatus } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { RouteProp } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

type AnimalDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AnimalDetail'>;
  route: RouteProp<StockStackParamList, 'AnimalDetail'>;
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

const getAnimalIcon = (type: string): string => {
  const lowercaseType = type.toLowerCase();
  if (lowercaseType.includes('بقرة') || lowercaseType.includes('ثور')) return '🐄';
  if (lowercaseType.includes('خروف') || lowercaseType.includes('نعجة')) return '🐑';
  if (lowercaseType.includes('دجاج') || lowercaseType.includes('ديك')) return '🐔';
  if (lowercaseType.includes('ماعز')) return '🐐';
  if (lowercaseType.includes('حصان')) return '🐎';
  if (lowercaseType.includes('حمار')) return '🦓';
  if (lowercaseType.includes('أرنب')) return '🐰';
  if (lowercaseType.includes('بطة')) return '🦆';
  if (lowercaseType.includes('ديك رومي')) return '🦃';
  if (lowercaseType.includes('جمل')) return '🐪';
  if (lowercaseType.includes('كتكوت')) return '🐥';
  if (lowercaseType.includes('كبش')) return '🐏';
  if (lowercaseType.includes('ثور الحراثة')) return '🐃';
  if (lowercaseType.includes('لاما')) return '🦙';
  if (lowercaseType.includes('نحل')) return '🐝';
  if (lowercaseType.includes('طاووس')) return '🦚';
  if (lowercaseType.includes('ببغاء')) return '🦜';
  if (lowercaseType.includes('حمام')) return '🕊️';
  if (lowercaseType.includes('يمام')) return '🕊️';
  if (lowercaseType.includes('إوز')) return '🦢';
  if (lowercaseType.includes('ثور')) return '🐂';
  if (lowercaseType.includes('جاموس')) return '🦬';
  if (lowercaseType.includes('ثور الحراثة')) return '🐃';
  if (lowercaseType.includes('لاما')) return '🦙';
  if (lowercaseType.includes('نحل')) return '🐝';
  if (lowercaseType.includes('طاووس')) return '🦚';
  if (lowercaseType.includes('ببغاء')) return '🦜';
  if (lowercaseType.includes('حمام')) return '🕊️';
  if (lowercaseType.includes('يمام')) return '🕊️';
  if (lowercaseType.includes('إوز')) return '🦢';
  if (lowercaseType.includes('ثور')) return '🐂';
  if (lowercaseType.includes('جاموس')) return '🦬';
  if (lowercaseType.includes('ثور الحراثة')) return '🐃';
  if (lowercaseType.includes('لاما')) return '🦙';
  if (lowercaseType.includes('كلب راعي')) return '🦮';
  if (lowercaseType.includes('كلب حراسة')) return '🐕';
  if (lowercaseType.includes('حشرة')) return '🐝';

  
  return '🐾';
};

const getHealthStatusColor = (status: HealthStatus, theme: any) => {
  switch (status) {
    case 'excellent':
      return theme.colors.success;
    case 'good':
      return theme.colors.success;
    case 'fair':
      return theme.colors.warning;
    case 'poor':
      return theme.colors.error;
    default:
      return theme.colors.neutral.border;
  }
};

const getHealthStatusLabel = (status: HealthStatus) => {
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
      return 'غير معروف';
  }
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

const getBreedingStatusLabel = (status: BreedingStatus) => {
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

const getBreedingStatusIcon = (status: BreedingStatus) => {
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

const calculateExpectedBirthDate = (breedingDate: string, animalType: string): string => {
  if (!breedingDate) return '';
  
  const date = new Date(breedingDate);
  const lowercaseType = animalType.toLowerCase();
  
  // Gestation periods in days for different animals
  const gestationPeriods: Record<string, number> = {
    cow: 280, // ~9 months
    sheep: 150, // ~5 months
    goat: 150, // ~5 months
    camel: 390, // ~13 months
    horse: 340, // ~11 months
    donkey: 365, // ~12 months
    rabbit: 31, // ~1 month
    pig: 114, // ~4 months
    default: 0
  };

  let gestationDays = 0;
  
  // Find matching animal type
  Object.entries(gestationPeriods).forEach(([key, days]) => {
    if (lowercaseType.includes(key)) {
      gestationDays = days;
    }
  });

  if (gestationDays === 0) return '';

  date.setDate(date.getDate() + gestationDays);
  return date.toISOString().split('T')[0];
};

const getAnimalInfo = (type: string) => {
  const lowercaseType = type.toLowerCase();
  const animalType = Object.keys(ANIMAL_TYPES).find(key => 
    lowercaseType === key || 
    lowercaseType === ANIMAL_TYPES[key as keyof typeof ANIMAL_TYPES].name
  );
  return animalType ? ANIMAL_TYPES[animalType as keyof typeof ANIMAL_TYPES] : null;
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
  birthDate: '🎂',
  weight: '⚖️',
  feedingSchedule: '🕒',
  feeding: '🥩',
  dailyFeedConsumption: '📊',
  health: '🏥',
  diseases: '🤒',
  medications: '💊',
  vaccination: '💉',
  nextVaccinationDate: '📅',
  notes: '📝',
};

export const AnimalDetailScreen = ({ navigation, route }: AnimalDetailScreenProps) => {
  const theme = useTheme();
  const { animals, deleteAnimal, addAnimalQuantity, removeAnimalQuantity } = useStock();
  const [isDeleting, setIsDeleting] = useState(false);

  const animal = animals.find(a => a.id === route.params.animalId);
  const animalInfo = animal ? getAnimalInfo(animal.type) : null;

  const handleDelete = useCallback(() => {
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
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAnimal(animal?.id || '');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting animal:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء الحذف');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [animal?.id, deleteAnimal, navigation]);

  const handleQuantityChange = useCallback(async (action: 'add' | 'remove') => {
    if (!animal) return;
    try {
      if (action === 'add') {
        await addAnimalQuantity(animal.id, 1);
      } else {
        await removeAnimalQuantity(animal.id, 1);
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تعديل الكمية');
    }
  }, [animal, addAnimalQuantity, removeAnimalQuantity]);

  const handleEdit = useCallback(() => {
    if (!animal) return;
    navigation.navigate('AddAnimal', { 
      animalId: animal.id,
      mode: 'edit'
    });
  }, [animal, navigation]);

  const renderField = useCallback((label: string, value: string | undefined | null, icon: string) => {
    if (!value) return null;
    
    return (
      <Animated.View 
        entering={FadeInDown.delay(100).springify()}
        style={[styles.infoCard, { backgroundColor: theme.colors.neutral.surface }]}
      >
        <View style={styles.infoHeader}>
          <Text style={styles.fieldIcon}>{icon}</Text>
          <Text style={[styles.infoTitle, { color: theme.colors.neutral.textPrimary }]}>
            {label}
          </Text>
        </View>
        <Text style={[styles.infoContent, { color: theme.colors.neutral.textSecondary }]}>
          {value}
        </Text>
      </Animated.View>
    );
  }, [theme.colors.neutral.surface, theme.colors.neutral.textPrimary, theme.colors.neutral.textSecondary]);

  if (!animal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar
          backgroundColor={theme.colors.neutral.surface}
          barStyle="dark-content"
        />
        <View style={[styles.container, styles.centerContent]}>
          <MaterialCommunityIcons 
            name="alert-circle-outline" 
            size={64} 
            color={theme.colors.error} 
          />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            لم يتم العثور على الحيوان
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar
        backgroundColor={theme.colors.neutral.surface}
        barStyle="dark-content"
      />
      <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <ScrollView style={styles.scrollView}>
          <Animated.View 
            entering={FadeInDown.springify()}
            style={[
              styles.header,
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
            <View style={styles.headerContent}>
              <View style={[
                styles.iconContainer,
                { backgroundColor: animal.healthStatus === 'poor' ? theme.colors.error : theme.colors.primary.base }
              ]}>
                <Text style={styles.animalIcon}>{animalInfo?.icon || '🐾'}</Text>
              </View>
              <View style={styles.headerInfo}>
                <View style={styles.titleContainer}>
                  <Text style={[styles.animalName, { color: theme.colors.neutral.textPrimary }]}>
                    {animalInfo?.name || animal.type}
                  </Text>
                  <Text style={[styles.animalCategory, { color: theme.colors.neutral.textSecondary }]}>
                    {animalInfo?.category}
                  </Text>
                </View>
                <View style={styles.subtitleContainer}>
                  <View style={styles.genderContainer}>
                    <Text style={styles.genderIcon}>
                      {animal.gender === 'male' ? '♂️' : '♀️'}
                    </Text>
                    <Text style={[styles.genderText, { color: theme.colors.neutral.textSecondary }]}>
                      {animal.gender === 'male' ? 'ذكر' : 'أنثى'}
                    </Text>
                  </View>
                  <Text style={styles.breedingIcon}>
                    {getBreedingStatusIcon(animal.breedingStatus)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.primary.base }]}
                onPress={handleEdit}
              >
                <MaterialCommunityIcons name="pencil" size={24} color="#FFF" />
                <Text style={styles.actionButtonText}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="delete" size={24} color="#FFF" />
                    <Text style={styles.actionButtonText}>حذف</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
                <Text style={[styles.statValue, { color: theme.colors.neutral.textPrimary }]}>
                  {animal.count}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                  {animal.count === 1 ? 'حيوان' : 'حيوانات'}
                </Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={[styles.quantityButton, { backgroundColor: theme.colors.primary.base }]}
                    onPress={() => handleQuantityChange('add')}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quantityButton, { backgroundColor: theme.colors.error }]}
                    onPress={() => handleQuantityChange('remove')}
                    disabled={animal.count <= 1}
                  >
                    <MaterialCommunityIcons name="minus" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
                <View style={[
                  styles.healthIndicator,
                  { backgroundColor: getHealthStatusColor(animal.healthStatus, theme) }
                ]}>
                  <Text style={styles.healthIcon}>
                    {HEALTH_STATUS_ICONS[animal.healthStatus]}
                  </Text>
                </View>
                <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                  الحالة الصحية
                </Text>
                <Text style={[styles.healthStatus, { color: theme.colors.neutral.textPrimary }]}>
                  {getHealthStatusLabel(animal.healthStatus)}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.colors.neutral.background }]}>
                <View style={[
                  styles.breedingIndicator,
                  { backgroundColor: getBreedingStatusColor(animal.breedingStatus, theme) }
                ]}>
                  <Text style={styles.breedingStatusIcon}>
                    {getBreedingStatusIcon(animal.breedingStatus)}
                  </Text>
                </View>
                <Text style={[styles.statLabel, { color: theme.colors.neutral.textSecondary }]}>
                  حالة التكاثر
                </Text>
                <Text style={[styles.breedingStatus, { color: theme.colors.neutral.textPrimary }]}>
                  {getBreedingStatusLabel(animal.breedingStatus)}
                </Text>
                {animal.lastBreedingDate && (
                  <View style={styles.breedingDateContainer}>
                    <Text style={styles.calendarIcon}>📅</Text>
                    <Text style={[styles.breedingDate, { color: theme.colors.neutral.textSecondary }]}>
                      آخر تكاثر: {new Date(animal.lastBreedingDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </Text>
                  </View>
                )}
                {animal.breedingStatus === 'pregnant' && animal.expectedBirthDate && (
                  <View style={styles.breedingDateContainer}>
                    <Text style={styles.calendarIcon}>📅</Text>
                    <Text style={[styles.breedingDate, { color: theme.colors.warning }]}>
                      الولادة المتوقعة: {new Date(animal.expectedBirthDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          <View style={styles.content}>
            {renderField('تاريخ الميلاد', animal.birthDate ? 
              new Date(animal.birthDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              }) : null, 
              FIELD_ICONS.birthDate
            )}
            
            {renderField('الوزن', animal.weight ? 
              `${animal.weight} كجم` : null,
              FIELD_ICONS.weight
            )}
            
            {renderField('برنامج التغذية', animal.feedingSchedule,
              FIELD_ICONS.feedingSchedule
            )}
            
            {renderField('التغذية', animal.feeding,
              '🍽️'
            )}
            
            {renderField('كمية العلف اليومي', animal.dailyFeedConsumption ? 
              `${animal.dailyFeedConsumption} كجم` : null,
              '🥘'
            )}
            
            {renderField('الحالة الصحية', animal.health,
              '🏥'
            )}
            
            {renderField('الأمراض', animal.diseases,
              '🤒'
            )}
            
            {renderField('الأدوية', animal.medications,
              '💊'
            )}
            
            {renderField('التلقيح', animal.vaccination,
              '💉'
            )}
            
            {animal.nextVaccinationDate && renderField('موعد التلقيح القادم',
              new Date(animal.nextVaccinationDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              }),
              '📅'
            )}
            
            {renderField('ملاحظات', animal.notes,
              '📝'
            )}
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    gap: 24,
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalIcon: {
    fontSize: 40,
  },
  headerInfo: {
    flex: 1,
    gap: 8,
  },
  titleContainer: {
    gap: 4,
  },
  animalName: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'right',
  },
  animalCategory: {
    fontSize: 16,
    textAlign: 'right',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genderIcon: {
    fontSize: 20,
  },
  genderText: {
    fontSize: 16,
  },
  breedingIcon: {
    fontSize: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 14,
  },
  quantityControls: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthStatus: {
    fontSize: 16,
    fontWeight: '500',
  },
  breedingIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breedingStatusIcon: {
    fontSize: 24,
  },
  breedingStatus: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    padding: 24,
    gap: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
  infoContent: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
  },
  fieldIcon: {
    fontSize: 24,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  breedingDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  breedingDate: {
    fontSize: 12,
  },
  calendarIcon: {
    fontSize: 24,
  },
  healthIcon: {
    fontSize: 24,
    color: '#FFF',
  },
}); 