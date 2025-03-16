import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  I18nManager,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useStock } from '../../../context/StockContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animal, HealthStatus, Gender, BreedingStatus } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { RouteProp } from '@react-navigation/native';
import Animated, { FadeInRight, useAnimatedStyle } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Yup from 'yup';
import { CustomButton } from '../../../components/CustomButton';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const ANIMAL_TYPES = {
  // Livestock (ماشية)
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
  // Insects (حشرات)
  bee: { icon: '🐝', name: 'نحل', category: 'حشرات' },
  
  // Fish (أسماك)

  
  // Exotic Animals (حيوانات نادرة)

};

const GENDER_ICONS = {
  male: '♂️',
  female: '♀️'
};

const BREEDING_STATUS_ICONS = {
  pregnant: '🤰 → 🐣',
  nursing: '🍼',
  in_heat: '💝',
  not_breeding: '⭕',
};

const HEALTH_STATUS_ICONS = {
  excellent: '🌟',
  good: '💚',
  fair: '💛',
  poor: '❤️‍🩹',
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
      return 'غير معروف';
  }
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

const getBreedingStatusColor = (status: BreedingStatus, theme: any) => {
  switch (status) {
    case 'pregnant':
      return theme.colors.primary.base;
    case 'in_heat':
      return theme.colors.warning;
    case 'nursing':
      return theme.colors.info;
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

type AddAnimalScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddAnimal'>;
  route: RouteProp<StockStackParamList, 'AddAnimal'>;
};

interface FormPage {
  title: string;
  subtitle: string;
  icon: string;
  fields: string[];
}

interface FormData {
  type: string;
  count: string;
  healthStatus: HealthStatus;
  feedingSchedule: string;
  gender: Gender;
  feeding: string;
  health: string;
  diseases: string;
  medications: string;
  vaccination: string;
  notes: string;
  birthDate: string;
  weight: string;
  dailyFeedConsumption: string;
  breedingStatus: BreedingStatus;
  lastBreedingDate: string;
  expectedBirthDate: string;
  nextVaccinationDate: string;
  customType: string;
}

const initialFormData: FormData = {
  type: '',
  count: '',
  healthStatus: 'good',
  feedingSchedule: '',
  gender: 'male',
  feeding: '',
  health: '',
  diseases: '',
  medications: '',
  vaccination: '',
  notes: '',
  birthDate: '',
  weight: '',
  dailyFeedConsumption: '',
  breedingStatus: 'not_breeding' as BreedingStatus,
  lastBreedingDate: '',
  expectedBirthDate: '',
  nextVaccinationDate: '',
  customType: ''
};

const formPages: FormPage[] = [
  {
    title: 'المعلومات الأساسية',
    subtitle: 'أدخل المعلومات الأساسية للحيوان',
    icon: '🐾',
    fields: ['type', 'gender', 'count', 'healthStatus', 'birthDate', 'weight'],
  },
  {
    title: 'التغذية والرعاية',
    subtitle: 'أدخل تفاصيل التغذية والرعاية',
    icon: '🌾',
    fields: ['feedingSchedule', 'feeding', 'dailyFeedConsumption'],
  },
  {
    title: 'الصحة والتلقيح',
    subtitle: 'أدخل معلومات الصحة والتلقيح',
    icon: '💉',
    fields: ['health', 'diseases', 'medications', 'vaccination', 'nextVaccinationDate'],
  },
  {
    title: 'التكاثر',
    subtitle: 'أدخل معلومات التكاثر',
    icon: '🐣',
    fields: ['breedingStatus', 'lastBreedingDate', 'expectedBirthDate'],
  },
  {
    title: 'ملاحظات إضافية',
    subtitle: 'أدخل أي ملاحظات إضافية',
    icon: '📝',
    fields: ['notes'],
  },
];

// Add field icons mapping
const FIELD_ICONS = {
  type: '🐾',
  gender: '⚥',
  count: '🔢',
  healthStatus: '❤️',
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
  breedingStatus: '🐣',
  lastBreedingDate: '📆',
  expectedBirthDate: '👶',
  notes: '📝',
};

const validationSchema = Yup.object().shape({
  type: Yup.string().required('نوع الحيوان مطلوب'),
  gender: Yup.string().oneOf(['male', 'female']).required('جنس الحيوان مطلوب'),
  count: Yup.number()
    .required('العدد مطلوب')
    .min(1, 'يجب أن يكون العدد 1 على الأقل'),
  healthStatus: Yup.string()
    .oneOf(['excellent', 'good', 'fair', 'poor'])
    .required('الحالة الصحية مطلوبة'),
  feedingSchedule: Yup.string().required('برنامج التغذية مطلوب'),
  feeding: Yup.string(),
  health: Yup.string(),
  diseases: Yup.string(),
  medications: Yup.string(),
  vaccination: Yup.string(),
  notes: Yup.string(),
  birthDate: Yup.string(),
  weight: Yup.number().min(0, 'الوزن يجب أن يكون أكبر من 0'),
  dailyFeedConsumption: Yup.number().min(0, 'كمية العلف اليومي يجب أن تكون أكبر من 0'),
  breedingStatus: Yup.string()
    .oneOf(['not_breeding', 'in_heat', 'pregnant', 'nursing'])
    .required('حالة التكاثر مطلوبة'),
  lastBreedingDate: Yup.string()
    .nullable()
    .test('conditional-required', 'تاريخ التكاثر الأخير مطلوب', function(value) {
      const { breedingStatus } = this.parent;
      return ['pregnant', 'nursing'].includes(breedingStatus) ? !!value : true;
    }),
  expectedBirthDate: Yup.string()
    .nullable()
    .test('conditional-required', 'تاريخ الولادة المتوقع مطلوب', function(value) {
      const { breedingStatus } = this.parent;
      return breedingStatus === 'pregnant' ? !!value : true;
    }),
  nextVaccinationDate: Yup.string().nullable(),
});

export const AddAnimalScreen = ({ navigation, route }: AddAnimalScreenProps) => {
  const theme = useTheme();
  const { createAnimal, updateAnimal, animals } = useStock();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentPage, setCurrentPage] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'lastBreedingDate' | 'expectedBirthDate' | 'nextVaccinationDate' | null>(null);

  const { animalId, mode } = route.params || {};

  useEffect(() => {
    if (mode === 'edit' && animalId) {
      const animal = animals.find(a => a.id === animalId);
      if (animal) {
        setFormData({
          type: animal.type,
          count: animal.count.toString(),
          healthStatus: animal.healthStatus,
          feedingSchedule: animal.feedingSchedule || '',
          gender: animal.gender,
          feeding: animal.feeding || '',
          health: animal.health || '',
          diseases: animal.diseases || '',
          medications: animal.medications || '',
          vaccination: animal.vaccination || '',
          notes: animal.notes || '',
          birthDate: animal.birthDate || '',
          weight: animal.weight?.toString() || '',
          dailyFeedConsumption: animal.dailyFeedConsumption?.toString() || '',
          breedingStatus: animal.breedingStatus,
          lastBreedingDate: animal.lastBreedingDate || '',
          expectedBirthDate: animal.expectedBirthDate || '',
          nextVaccinationDate: animal.nextVaccinationDate || '',
          customType: ''
        });
      }
    }
  }, [animalId, mode, animals]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${((currentPage + 1) / formPages.length) * 100}%`,
    };
  });

  const validateCurrentPage = () => {
    const currentFields = formPages[currentPage].fields;
    const errors: Record<string, string> = {};
    const requiredFields: Record<string, string> = {
      type: 'نوع الحيوان',
      gender: 'جنس الحيوان',
      count: 'العدد',
      healthStatus: 'الحالة الصحية',
      feedingSchedule: 'برنامج التغذية'
    };

    for (const field of currentFields) {
      if (field in requiredFields && !formData[field as keyof FormData]) {
        errors[field] = `يرجى إدخال ${requiredFields[field]}`;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCurrentPage()) return;

    try {
      setIsSubmitting(true);
      console.log('Starting form submission with data:', formData);

      const animalData = {
        ...formData,
        name: formData.type === 'other' ? formData.customType.trim() : formData.type,
        quantity: Number(formData.count),
        location: 'الحظيرة',
        count: Number(formData.count),
        type: formData.type === 'other' ? formData.customType.trim() : formData.type,
        feedingSchedule: formData.feedingSchedule.trim(),
        feeding: formData.feeding.trim() || null,
        health: formData.health.trim() || null,
        diseases: formData.diseases.trim() || null,
        medications: formData.medications.trim() || null,
        vaccination: formData.vaccination.trim() || null,
        notes: formData.notes.trim() || null,
        birthDate: formData.birthDate || null,
        weight: formData.weight ? Number(formData.weight) : null,
        dailyFeedConsumption: formData.dailyFeedConsumption ? Number(formData.dailyFeedConsumption) : null,
        breedingStatus: formData.breedingStatus,
        lastBreedingDate: formData.lastBreedingDate || null,
        expectedBirthDate: formData.expectedBirthDate || null,
        nextVaccinationDate: formData.nextVaccinationDate || null,
        vaccinationHistory: [],
        offspringCount: 0,
        userId: '1',
        gender: formData.gender
      };

      console.log('Submitting animal data:', JSON.stringify(animalData, null, 2));

      if (mode === 'edit' && animalId) {
        console.log('Updating animal with ID:', animalId);
        await updateAnimal(animalId, animalData);
      } else {
        console.log('Creating new animal');
        await createAnimal(animalData);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving animal:', error);
      Alert.alert('خطأ', mode === 'edit' ? 'فشل في تحديث الحيوان' : 'فشل في إضافة الحيوان');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextPage = () => {
    if (currentPage < formPages.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && activeDateField) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        [activeDateField]: formattedDate
      }));

      // If this is lastBreedingDate and status is pregnant, calculate expected birth date
      if (activeDateField === 'lastBreedingDate' && formData.breedingStatus === 'pregnant') {
        const expectedDate = calculateExpectedBirthDate(formattedDate, formData.type);
        setFormData(prev => ({
          ...prev,
          expectedBirthDate: expectedDate
        }));
      }
    }
  };

  const showDatePickerModal = (field: 'lastBreedingDate' | 'expectedBirthDate' | 'nextVaccinationDate') => {
    setActiveDateField(field);
    setShowDatePicker(true);
  };

  const renderField = (field: string) => {
    const fieldIcon = FIELD_ICONS[field as keyof typeof FIELD_ICONS] || '📋';
    
    switch (field) {
      case 'type':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              نوع الحيوان *
            </Text>
            </View>
            {formData.type === 'other' ? (
              <View style={styles.otherTypeContainer}>
            <TextInput
                  style={[
                    styles.input,
                    { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
                    }
                  ]}
                  value={formData.customType}
                  onChangeText={(text) => setFormData({ ...formData, customType: text })}
              placeholder="أدخل نوع الحيوان"
              placeholderTextColor={theme.colors.neutral.textSecondary}
                  textAlign="right"
                  textAlignVertical="center"
                />
                <TouchableOpacity
                  style={styles.changeTypeButton}
                  onPress={() => setShowTypeModal(true)}
                >
                  <Text style={[styles.changeTypeText, { color: theme.colors.primary.base }]}>
                    تغيير النوع
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.typeSelector,
                  { 
                    backgroundColor: theme.colors.neutral.surface,
                    borderColor: theme.colors.neutral.border,
                  }
                ]}
                onPress={() => setShowTypeModal(true)}
              >
                {formData.type ? (
                  <View style={styles.selectedType}>
                    <Text style={styles.selectedTypeIcon}>
                      {ANIMAL_TYPES[formData.type as keyof typeof ANIMAL_TYPES]?.icon || '🐾'}
                    </Text>
                    <View style={styles.selectedTypeInfo}>
                      <Text style={[styles.selectedTypeText, { color: theme.colors.neutral.textPrimary }]}>
                        {ANIMAL_TYPES[formData.type as keyof typeof ANIMAL_TYPES]?.name || formData.type}
                      </Text>
                      <Text style={[styles.selectedTypeCategory, { color: theme.colors.neutral.textSecondary }]}>
                        {ANIMAL_TYPES[formData.type as keyof typeof ANIMAL_TYPES]?.category}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.typePlaceholder, { color: theme.colors.neutral.textSecondary }]}>
                    اختر نوع الحيوان
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        );

      case 'gender':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              جنس الحيوان *
            </Text>
            </View>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'male' && { backgroundColor: theme.colors.primary.base }
                ]}
                onPress={() => setFormData({ ...formData, gender: 'male' })}
              >
                <Text style={styles.genderIcon}>{GENDER_ICONS.male}</Text>
                <Text style={[
                  styles.genderText,
                  { color: formData.gender === 'male' ? '#FFF' : theme.colors.neutral.textSecondary }
                ]}>
                  ذكر
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'female' && { backgroundColor: theme.colors.primary.base }
                ]}
                onPress={() => setFormData({ ...formData, gender: 'female' })}
              >
                <Text style={styles.genderIcon}>{GENDER_ICONS.female}</Text>
                <Text style={[
                  styles.genderText,
                  { color: formData.gender === 'female' ? '#FFF' : theme.colors.neutral.textSecondary }
                ]}>
                  أنثى
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'count':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              عدد الحيوانات *
            </Text>
            </View>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.count}
              onChangeText={(text) => setFormData({ ...formData, count: text })}
              placeholder="أدخل عدد الحيوانات"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              keyboardType="numeric"
              textAlign="right"
              textAlignVertical="center"
            />
          </View>
        );

      case 'healthStatus':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الحالة الصحية *
            </Text>
            </View>
            <View style={styles.healthStatusContainer}>
              {['excellent', 'good', 'fair', 'poor'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.healthStatusButton,
                    formData.healthStatus === status && { backgroundColor: getHealthStatusColor(status as HealthStatus, theme) }
                  ]}
                  onPress={() => setFormData({ ...formData, healthStatus: status as HealthStatus })}
                >
                  <Text style={styles.healthStatusIcon}>
                    {HEALTH_STATUS_ICONS[status as keyof typeof HEALTH_STATUS_ICONS]}
                  </Text>
                  <Text style={[
                    styles.healthStatusText,
                    { color: formData.healthStatus === status ? '#FFF' : theme.colors.neutral.textSecondary }
                  ]}>
                    {getHealthStatusLabel(status as HealthStatus)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'feedingSchedule':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              برنامج التغذية *
            </Text>
            </View>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right',
                height: 120,
                paddingTop: 12
              }]}
              value={formData.feedingSchedule}
              onChangeText={(text) => setFormData({ ...formData, feedingSchedule: text })}
              placeholder="أدخل برنامج التغذية"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
              textAlign="right"
              textAlignVertical="top"
            />
          </View>
        );

      case 'feeding':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              التغذية
            </Text>
            </View>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.feeding}
              onChangeText={(text) => setFormData({ ...formData, feeding: text })}
              placeholder="أدخل تفاصيل التغذية"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'health':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الصحة
            </Text>
            </View>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.health}
              onChangeText={(text) => setFormData({ ...formData, health: text })}
              placeholder="أدخل تفاصيل الحالة الصحية"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'diseases':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الأمراض
            </Text>
            </View>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.diseases}
              onChangeText={(text) => setFormData({ ...formData, diseases: text })}
              placeholder="أدخل تفاصيل الأمراض"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'medications':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الأدوية
            </Text>
            </View>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.medications}
              onChangeText={(text) => setFormData({ ...formData, medications: text })}
              placeholder="أدخل تفاصيل الأدوية"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'vaccination':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                التلقيح
            </Text>
            </View>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.vaccination}
              onChangeText={(text) => setFormData({ ...formData, vaccination: text })}
              placeholder="أدخل تفاصيل التلقيح"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'breedingStatus':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                حالة التكاثر *
            </Text>
            </View>
            <View style={styles.breedingStatusContainer}>
              {['not_breeding', 'in_heat', 'pregnant', 'nursing'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.breedingStatusButton,
                    { 
                      backgroundColor: formData.breedingStatus === status 
                        ? getBreedingStatusColor(status as BreedingStatus, theme)
                        : theme.colors.neutral.surface,
                      borderColor: formData.breedingStatus === status
                        ? getBreedingStatusColor(status as BreedingStatus, theme)
                        : theme.colors.neutral.border,
                    }
                  ]}
                  onPress={() => {
                    const statusValue = status as BreedingStatus;
                    console.log('Setting breeding status to:', statusValue);
                    
                    setFormData((prevData) => {
                      const newData = {
                        ...prevData,
                        breedingStatus: statusValue,
                        lastBreedingDate: !['pregnant', 'nursing'].includes(statusValue) ? '' : prevData.lastBreedingDate,
                        expectedBirthDate: statusValue !== 'pregnant' ? '' : prevData.expectedBirthDate
                      };
                      console.log('Updated form data:', newData);
                      return newData;
                    });
                  }}
                >
                  <Text style={styles.breedingStatusIcon}>
                    {BREEDING_STATUS_ICONS[status as keyof typeof BREEDING_STATUS_ICONS]}
                  </Text>
                  <Text style={[
                    styles.breedingStatusText,
                    { 
                      color: formData.breedingStatus === status 
                        ? '#FFF' 
                        : theme.colors.neutral.textSecondary 
                    }
                  ]}>
                    {getBreedingStatusLabel(status as BreedingStatus)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {validationErrors.breedingStatus && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {validationErrors.breedingStatus}
              </Text>
            )}
          </View>
        );

      case 'lastBreedingDate':
        if (!['pregnant', 'nursing'].includes(formData.breedingStatus)) {
          return null;
        }
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                تاريخ التكاثر الأخير {['pregnant', 'nursing'].includes(formData.breedingStatus) ? '*' : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dateInput,
                { 
                  backgroundColor: theme.colors.neutral.surface,
                  borderColor: validationErrors.lastBreedingDate 
                    ? theme.colors.error 
                    : theme.colors.neutral.border
                }
              ]}
              onPress={() => showDatePickerModal('lastBreedingDate')}
            >
              <MaterialCommunityIcons
                name="calendar"
                size={24}
                color={theme.colors.neutral.textSecondary}
              />
              <Text style={[
                styles.dateText,
                { color: formData.lastBreedingDate ? theme.colors.neutral.textPrimary : theme.colors.neutral.textSecondary }
              ]}>
                {formData.lastBreedingDate 
                  ? new Date(formData.lastBreedingDate).toLocaleDateString('ar-SA')
                  : 'اختر التاريخ'}
              </Text>
            </TouchableOpacity>
            {validationErrors.lastBreedingDate && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {validationErrors.lastBreedingDate}
              </Text>
            )}
          </View>
        );

      case 'expectedBirthDate':
        if (formData.breedingStatus !== 'pregnant') {
          return null;
        }
        
        const calculatedDate = calculateExpectedBirthDate(formData.lastBreedingDate, formData.type);
        
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                تاريخ الولادة المتوقع *
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dateInput,
                { 
                  backgroundColor: theme.colors.neutral.surface,
                  borderColor: theme.colors.neutral.border
                }
              ]}
              onPress={() => showDatePickerModal('expectedBirthDate')}
            >
              <MaterialCommunityIcons
                name="calendar-clock"
                size={24}
                color={theme.colors.primary.base}
              />
              <Text style={[styles.dateText, { color: theme.colors.neutral.textPrimary }]}>
                {calculatedDate 
                  ? new Date(calculatedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })
                  : 'سيتم الحساب تلقائياً بعد تحديد تاريخ التكاثر'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'nextVaccinationDate':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                موعد التلقيح القادم
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                borderColor: theme.colors.neutral.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
              }]}
              onPress={() => showDatePickerModal('nextVaccinationDate')}
            >
              <MaterialCommunityIcons 
                name="calendar" 
                size={24} 
                color={theme.colors.neutral.textSecondary} 
              />
              <Text style={[
                styles.dateText,
                { 
                  color: formData.nextVaccinationDate 
                    ? theme.colors.neutral.textPrimary 
                    : theme.colors.neutral.textSecondary,
                  textAlign: 'right',
                  flex: 1,
                  marginLeft: 12
                }
              ]}>
                {formData.nextVaccinationDate 
                  ? new Date(formData.nextVaccinationDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })
                  : 'اختر موعد التلقيح القادم'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'notes':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                ملاحظات
            </Text>
            </View>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="أدخل ملاحظات إضافية"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'birthDate':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                تاريخ الميلاد
            </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dateInput,
                { 
                  backgroundColor: theme.colors.neutral.surface,
                  borderColor: theme.colors.neutral.border
                }
              ]}
              onPress={() => showDatePickerModal('birthDate' as any)}
            >
              <MaterialCommunityIcons
                name="calendar"
                size={24}
                color={theme.colors.neutral.textSecondary}
              />
              <Text style={[
                styles.dateText,
                { color: formData.birthDate ? theme.colors.neutral.textPrimary : theme.colors.neutral.textSecondary }
              ]}>
                {formData.birthDate 
                  ? new Date(formData.birthDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })
                  : 'اختر تاريخ الميلاد'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'weight':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                الوزن (كجم)
              </Text>
            </View>
            <View style={styles.inputWithUnit}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                  textAlign: 'right',
                  flex: 1
                }]}
                value={formData.weight}
                onChangeText={(text) => setFormData({ ...formData, weight: text })}
                placeholder="أدخل الوزن"
              placeholderTextColor={theme.colors.neutral.textSecondary}
                keyboardType="numeric"
                textAlign="right"
            />
              <Text style={[styles.unitText, { color: theme.colors.neutral.textSecondary }]}>
                كجم
              </Text>
            </View>
          </View>
        );

      case 'dailyFeedConsumption':
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                كمية العلف اليومي (كجم)
            </Text>
            </View>
            <View style={styles.inputWithUnit}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                  textAlign: 'right',
                  flex: 1
                }]}
                value={formData.dailyFeedConsumption}
                onChangeText={(text) => setFormData({ ...formData, dailyFeedConsumption: text })}
                placeholder="أدخل كمية العلف اليومي"
              placeholderTextColor={theme.colors.neutral.textSecondary}
                keyboardType="numeric"
                textAlign="right"
            />
              <Text style={[styles.unitText, { color: theme.colors.neutral.textSecondary }]}>
                كجم
              </Text>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>{fieldIcon}</Text>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                {field}
              </Text>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar
        backgroundColor={theme.colors.neutral.surface}
        barStyle="dark-content"
      />
      <View style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          {mode === 'edit' ? 'تعديل الحيوان' : 'إضافة حيوان جديد'}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-right" size={24} color={theme.colors.neutral.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.neutral.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: theme.colors.primary.base },
              progressStyle,
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.neutral.textSecondary }]}>
          الخطوة {currentPage + 1} من {formPages.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {formPages[currentPage].fields.map((field) => (
            <View key={field}>
              {renderField(field)}
              {validationErrors[field] && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {validationErrors[field]}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.neutral.surface }]}>
        {currentPage > 0 && (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.colors.neutral.border }]}
            onPress={prevPage}
          >
            <Feather name="arrow-left" size={24} color={theme.colors.neutral.textPrimary} />
            <Text style={[styles.navButtonText, { color: theme.colors.neutral.textPrimary }]}>
              السابق
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: theme.colors.primary.base }]}
          onPress={nextPage}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.navButtonText}>
                {currentPage === formPages.length - 1 ? 'حفظ' : 'التالي'}
              </Text>
              <Feather name="arrow-right" size={24} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.neutral.surface }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={[styles.modalTitle, { color: theme.colors.neutral.textPrimary }]}>
                  اختر نوع الحيوان
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.neutral.textSecondary }]}>
                  اختر من القائمة أو أضف نوعًا جديدًا
                </Text>
    </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.colors.neutral.background }]}
                onPress={() => setShowTypeModal(false)}
              >
                <Feather name="x" size={24} color={theme.colors.neutral.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.categorySection}>
                {Object.entries(
                  Object.entries(ANIMAL_TYPES).reduce((acc, [id, animal]) => {
                    if (!acc[animal.category]) {
                      acc[animal.category] = [];
                    }
                    acc[animal.category].push({ id, ...animal });
                    return acc;
                  }, {} as Record<string, Array<{ id: string } & typeof ANIMAL_TYPES[keyof typeof ANIMAL_TYPES]>>)
                ).map(([category, animals]) => (
                  <View key={category} style={styles.categoryGroup}>
                    <Text style={[styles.categoryTitle, { color: theme.colors.neutral.textPrimary }]}>
                      {category}
                    </Text>
                    <View style={styles.animalGrid}>
                      {animals.map(({ id, icon, name }) => (
                        <TouchableOpacity
                          key={id}
                          style={[
                            styles.animalOption,
                            { 
                              backgroundColor: formData.type === id ? theme.colors.primary.base : theme.colors.neutral.background,
                              borderColor: formData.type === id ? theme.colors.primary.base : theme.colors.neutral.border,
                            }
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, type: id });
                            setShowTypeModal(false);
                          }}
                        >
                          <View style={[
                            styles.animalIconContainer,
                            {
                              backgroundColor: formData.type === id ? 'rgba(255, 255, 255, 0.2)' : theme.colors.neutral.surface,
                            }
                          ]}>
                            <Text style={styles.animalIcon}>{icon}</Text>
                          </View>
                          <View style={styles.animalInfo}>
                            <Text style={[
                              styles.animalName,
                              { 
                                color: formData.type === id ? '#FFF' : theme.colors.neutral.textPrimary,
                                fontWeight: formData.type === id ? '600' : '400'
                              }
                            ]}>
                              {name}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.addCustomTypeButton,
                  { 
                    backgroundColor: theme.colors.neutral.background,
                    borderColor: theme.colors.primary.base,
                  }
                ]}
                onPress={() => {
                  setFormData({ ...formData, type: 'other' });
                  setShowTypeModal(false);
                }}
              >
                <View style={[styles.addIconContainer, { backgroundColor: theme.colors.primary.base }]}>
                  <Feather name="plus" size={24} color="#FFF" />
                </View>
                <View style={styles.addCustomTypeInfo}>
                  <Text style={[styles.addCustomTypeTitle, { color: theme.colors.neutral.textPrimary }]}>
                    إضافة نوع جديد
                  </Text>
                  <Text style={[styles.addCustomTypeSubtitle, { color: theme.colors.neutral.textSecondary }]}>
                    أدخل نوع حيوان غير موجود في القائمة
                  </Text>
                </View>
                <Feather name="chevron-left" size={24} color={theme.colors.neutral.textSecondary} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={activeDateField ? new Date(formData[activeDateField] || new Date()) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date(2000, 0, 1)}
          maximumDate={new Date(2100, 11, 31)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight,
      },
    }),
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 16,
  },
  backButton: {
    padding: 8,
    transform: [{ scaleX: -1 }],
  },
  progressContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
  },
  progressBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    marginRight: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
    gap: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  fieldIcon: {
    fontSize: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'right',
    textAlignVertical: 'center',
  },
  genderContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  genderIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  genderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  healthStatusContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  healthStatusButton: {
    flex: 1,
    minWidth: (width - 48) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  healthStatusIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  healthStatusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  breedingStatusContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  breedingStatusButton: {
    flex: 1,
    minWidth: (width - 48) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  breedingStatusIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  breedingStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row-reverse',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  navButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  typeSelector: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  selectedType: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  selectedTypeIcon: {
    fontSize: 24,
  },
  selectedTypeInfo: {
    flex: 1,
  },
  selectedTypeText: {
    fontSize: 16,
    textAlign: 'right',
  },
  selectedTypeCategory: {
    fontSize: 12,
    textAlign: 'right',
  },
  typePlaceholder: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'right',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'right',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 16,
  },
  modalBody: {
    padding: 16,
  },
  categorySection: {
    gap: 24,
  },
  categoryGroup: {
    gap: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  animalGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  animalOption: {
    width: (width - 64) / 3,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    alignItems: 'center',
  },
  animalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalIcon: {
    fontSize: 32,
  },
  animalInfo: {
    alignItems: 'center',
  },
  animalName: {
    fontSize: 14,
    textAlign: 'center',
  },
  addCustomTypeButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 24,
    marginBottom: 32,
  },
  addIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  addCustomTypeInfo: {
    flex: 1,
  },
  addCustomTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addCustomTypeSubtitle: {
    fontSize: 12,
  },
  otherTypeContainer: {
    gap: 8,
    width: '100%',
  },
  changeTypeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  changeTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateInput: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    paddingHorizontal: 12,
  },
  inputWithUnit: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  unitText: {
    fontSize: 16,
    marginRight: 8,
  },
}); 