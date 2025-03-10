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

export const AnimalDetailScreen = ({ navigation, route }: AnimalDetailScreenProps) => {
  const theme = useTheme();
  const { animals, deleteAnimal, addAnimalQuantity, removeAnimalQuantity } = useStock();
  const [isDeleting, setIsDeleting] = useState(false);

  const animal = animals.find(a => a.id === route.params.animalId);

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

  const renderInfoSection = (title: string, icon: keyof typeof MaterialCommunityIcons.glyphMap, content: string | null) => {
    if (!content) return null;

    return (
      <View style={[styles.infoSection, { backgroundColor: theme.colors.neutral.surface }]}>
        <View style={styles.infoHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary.base }]}>
            <MaterialCommunityIcons
              name={icon}
              size={24}
              color="#FFF"
            />
          </View>
          <Text style={[styles.infoTitle, { color: theme.colors.neutral.textPrimary }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.infoContent, { color: theme.colors.neutral.textSecondary }]}>
          {content}
        </Text>
      </View>
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
              <MaterialCommunityIcons
                name={getAnimalIcon(animal.type)}
                size={32}
                color="#FFF"
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.animalType, { color: theme.colors.neutral.textPrimary }]}>
                {animal.type}
              </Text>
              <Text style={[styles.animalGender, { color: theme.colors.neutral.textSecondary }]}>
                {animal.gender === 'male' ? 'ذكر' : 'أنثى'}
              </Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: theme.colors.error }]}
                onPress={() => handleQuantityChange('remove')}
                disabled={animal.count === 0 || isDeleting}
              >
                <MaterialCommunityIcons name={'minus' as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color="#FFF" />
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
                style={[styles.quantityButton, { backgroundColor: theme.colors.success }]}
                onPress={() => handleQuantityChange('add')}
                disabled={isDeleting}
              >
                <MaterialCommunityIcons name={'plus' as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.statusContainer}>
              <View style={[
                styles.healthStatus,
                { backgroundColor: getHealthStatusColor(animal.healthStatus, theme) }
              ]}>
                <MaterialCommunityIcons name={'heart-pulse' as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color="#FFF" />
                <Text style={styles.healthText}>
                  {getHealthStatusLabel(animal.healthStatus)}
                </Text>
              </View>

              <View style={[
                styles.breedingStatus,
                { backgroundColor: getBreedingStatusColor(animal.breedingStatus, theme) }
              ]}>
                <MaterialCommunityIcons name={'baby-carriage' as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color="#FFF" />
                <Text style={styles.breedingText}>
                  {getBreedingStatusLabel(animal.breedingStatus)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.content}>
          {renderInfoSection('برنامج التغذية', 'food-apple', animal.feedingSchedule)}
          {renderInfoSection('التغذية', 'food', animal.feeding || null)}
          {animal.dailyFeedConsumption && renderInfoSection(
            'استهلاك العلف اليومي',
            'food-variant',
            `${animal.dailyFeedConsumption} كجم`
          )}
          {renderInfoSection('الصحة', 'heart-pulse', animal.health || null)}
          {renderInfoSection('الأمراض', 'virus', animal.diseases || null)}
          {renderInfoSection('الأدوية', 'pill', animal.medications || null)}
          {renderInfoSection('التطعيم', 'needle', animal.vaccination || null)}
          {animal.nextVaccinationDate && renderInfoSection(
            'موعد التطعيم القادم',
            'calendar',
            new Date(animal.nextVaccinationDate).toLocaleDateString('ar-SA')
          )}
          {animal.birthDate && renderInfoSection(
            'تاريخ الميلاد',
            'cake-variant',
            new Date(animal.birthDate).toLocaleDateString('ar-SA')
          )}
          {animal.weight && renderInfoSection(
            'الوزن',
            'weight',
            `${animal.weight} كجم`
          )}
          {animal.lastBreedingDate && renderInfoSection(
            'تاريخ التكاثر الأخير',
            'calendar-clock',
            new Date(animal.lastBreedingDate).toLocaleDateString('ar-SA')
          )}
          {animal.expectedBirthDate && renderInfoSection(
            'تاريخ الولادة المتوقع',
            'calendar-star',
            new Date(animal.expectedBirthDate).toLocaleDateString('ar-SA')
          )}
          {animal.offspringCount > 0 && renderInfoSection(
            'عدد النسل',
            'baby-face-outline',
            animal.offspringCount.toString()
          )}
          {renderInfoSection('ملاحظات', 'note-text', animal.notes || null)}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.neutral.surface }]}>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          <MaterialCommunityIcons name={'trash-can' as keyof typeof MaterialCommunityIcons.glyphMap} size={24} color="#FFF" />
          <Text style={styles.deleteButtonText}>
            {isDeleting ? 'جاري الحذف...' : 'حذف'}
          </Text>
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
  headerInfo: {
    flex: 1,
  },
  animalType: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
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
  content: {
    padding: 16,
    gap: 16,
  },
  infoSection: {
    borderRadius: 12,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  infoContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    marginTop: 8,
  },
}); 