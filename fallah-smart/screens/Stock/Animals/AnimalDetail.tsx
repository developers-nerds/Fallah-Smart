import React, { useCallback, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  Alert,
  Dimensions 
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useStock } from '../../../context/StockContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animal, HealthStatus, BreedingStatus } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { RouteProp } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type AnimalDetailScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AnimalDetail'>;
  route: RouteProp<StockStackParamList, 'AnimalDetail'>;
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
    case 'lactating':
      return theme.colors.info;
    case 'ready':
      return theme.colors.success;
    default:
      return theme.colors.neutral.border;
  }
};

const getBreedingStatusLabel = (status: BreedingStatus) => {
  switch (status) {
    case 'pregnant':
      return 'حامل';
    case 'lactating':
      return 'مرضعة';
    case 'ready':
      return 'جاهز للتزاوج';
    default:
      return 'غير معروف';
  }
};

const getBreedingStatusIcon = (status: BreedingStatus) => {
  switch (status) {
    case 'pregnant':
      return '🤰';
    case 'lactating':
      return '🍼';
    case 'ready':
      return '❤️';
    default:
      return '⚪';
  }
};

const getAnimalInfo = (type: string) => {
  const lowercaseType = type.toLowerCase();
  const animalType = Object.keys(ANIMAL_TYPES).find(key => 
    lowercaseType === key || 
    lowercaseType === ANIMAL_TYPES[key as keyof typeof ANIMAL_TYPES].name
  );
  return animalType ? ANIMAL_TYPES[animalType as keyof typeof ANIMAL_TYPES] : null;
};

export const AnimalDetailScreen = ({ navigation, route }: AnimalDetailScreenProps) => {
  const theme = useTheme();
  const { animals, deleteAnimal, addAnimalQuantity, removeAnimalQuantity } = useStock();
  const [isDeleting, setIsDeleting] = useState(false);

  const animal = animals.find(a => a.id === route.params.animalId);
  const animalInfo = animal ? getAnimalInfo(animal.type) : null;

  if (!animal) {
    return (
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
    );
  }

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
              await deleteAnimal(animal.id);
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
  }, [animal.id, deleteAnimal, navigation]);

  const handleQuantityChange = useCallback(async (action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        await addAnimalQuantity(animal.id, 1);
      } else {
        await removeAnimalQuantity(animal.id, 1);
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تعديل الكمية');
    }
  }, [animal.id, addAnimalQuantity, removeAnimalQuantity]);

  const handleEdit = useCallback(() => {
    // Navigate to AddAnimal screen with the animal data for editing
    navigation.navigate('AddAnimal', { 
      animalId: animal.id,
      mode: 'edit'
    });
  }, [animal.id, navigation]);

  const renderInfoSection = (title: string, icon: string, content: string | null) => {
    if (!content) return null;

    return (
      <Animated.View 
        entering={FadeInDown.springify()}
        style={[styles.infoSection, { backgroundColor: theme.colors.neutral.surface }]}
      >
        <View style={styles.infoHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary.base }]}>
            <Text style={styles.infoIcon}>{icon}</Text>
          </View>
          <Text style={[styles.infoTitle, { color: theme.colors.neutral.textPrimary }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.infoContent, { color: theme.colors.neutral.textSecondary }]}>
          {content}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <ScrollView style={styles.scrollView}>
        <Animated.View 
          entering={FadeInDown.springify()}
          style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}
        >
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary.base }]}>
              <Text style={styles.animalIcon}>{animalInfo?.icon || '🐾'}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.animalType, { color: theme.colors.neutral.textPrimary }]}>
                {animalInfo?.name || animal.type}
              </Text>
              <Text style={[styles.animalCategory, { color: theme.colors.neutral.textSecondary }]}>
                {animalInfo?.category}
              </Text>
              <Text style={[styles.animalGender, { color: theme.colors.neutral.textSecondary }]}>
                {animal.gender === 'male' ? 'ذكر' : 'أنثى'}
              </Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: theme.colors.primary.base }]}
                onPress={() => handleQuantityChange('remove')}
              >
                <MaterialCommunityIcons name="minus" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={[styles.quantityDisplay, { backgroundColor: theme.colors.primary.base }]}>
                <Text style={[styles.quantityText, { color: '#FFF' }]}>
                  {animal.count}
                </Text>
                <Text style={[styles.quantityLabel, { color: '#FFF' }]}>
                  حيوان
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: theme.colors.primary.base }]}
                onPress={() => handleQuantityChange('add')}
              >
                <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.statusContainer}>
              <View style={[
                styles.healthStatus,
                { backgroundColor: getHealthStatusColor(animal.healthStatus, theme) }
              ]}>
                <MaterialCommunityIcons name="heart-pulse" size={20} color="#FFF" />
                <Text style={styles.healthText}>
                  {getHealthStatusLabel(animal.healthStatus)}
                </Text>
              </View>

              <View style={[
                styles.breedingStatus,
                { backgroundColor: getBreedingStatusColor(animal.breedingStatus, theme) }
              ]}>
                <Text style={styles.breedingIcon}>
                  {getBreedingStatusIcon(animal.breedingStatus)}
                </Text>
                <Text style={styles.breedingText}>
                  {getBreedingStatusLabel(animal.breedingStatus)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.contentContainer}>
          {renderInfoSection('برنامج التغذية', '🍽️', animal.feedingSchedule)}
          {renderInfoSection('التغذية', '🌾', animal.feeding || null)}
          {animal.dailyFeedConsumption && renderInfoSection(
            'استهلاك العلف اليومي',
            '⚖️',
            `${animal.dailyFeedConsumption} كجم`
          )}
          {renderInfoSection('الصحة', '🏥', animal.health || null)}
          {renderInfoSection('الأمراض', '🦠', animal.diseases || null)}
          {renderInfoSection('الأدوية', '💊', animal.medications || null)}
          {renderInfoSection('التطعيم', '💉', animal.vaccination || null)}
          {animal.nextVaccinationDate && renderInfoSection(
            'موعد التطعيم القادم',
            '📅',
            new Date(animal.nextVaccinationDate).toLocaleDateString('ar-SA')
          )}
          {animal.birthDate && renderInfoSection(
            'تاريخ الميلاد',
            '🎂',
            new Date(animal.birthDate).toLocaleDateString('ar-SA')
          )}
          {animal.weight && renderInfoSection(
            'الوزن',
            '⚖️',
            `${animal.weight} كجم`
          )}
          {animal.lastBreedingDate && renderInfoSection(
            'تاريخ التكاثر الأخير',
            '❤️',
            new Date(animal.lastBreedingDate).toLocaleDateString('ar-SA')
          )}
          {animal.expectedBirthDate && renderInfoSection(
            'تاريخ الولادة المتوقع',
            '👶',
            new Date(animal.expectedBirthDate).toLocaleDateString('ar-SA')
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.neutral.surface }]}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.primary.base }]}
          onPress={handleEdit}
        >
          <MaterialCommunityIcons name="pencil" size={24} color="#FFF" />
          <Text style={styles.editButtonText}>تعديل</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          <MaterialCommunityIcons name="delete" size={24} color="#FFF" />
          <Text style={styles.deleteButtonText}>حذف</Text>
        </TouchableOpacity>
      </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  animalIcon: {
    fontSize: 32,
  },
  infoIcon: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
  },
  animalType: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  animalCategory: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'right',
  },
  animalGender: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '600',
  },
  quantityLabel: {
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  breedingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  healthText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  breedingText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  breedingIcon: {
    fontSize: 16,
  },
  contentContainer: {
    padding: 16,
  },
  infoSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
  },
}); 