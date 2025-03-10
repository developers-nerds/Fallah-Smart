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
  Modal
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

const { width } = Dimensions.get('window');

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
    case 'lactating':
      return theme.colors.info;
    case 'ready':
      return theme.colors.success;
    default:
      return theme.colors.neutral.border;
  }
};

const getBreedingStatusLabel = (status: BreedingStatus): string => {
  switch (status) {
    case 'pregnant':
      return 'حامل';
    case 'lactating':
      return 'مرضعة';
    case 'ready':
      return 'جاهز للتزاوج';
    case 'not_breeding':
      return 'غير متزاوج';
    case 'in_heat':
      return 'في فترة التزاوج';
    case 'nursing':
      return 'مرضعة';
    default:
      return 'غير معروف';
  }
};

const getBreedingStatusIcon = (status: BreedingStatus): string => {
  switch (status) {
    case 'pregnant':
      return '🤰';
    case 'lactating':
      return '🍼';
    case 'ready':
      return '❤️';
    case 'not_breeding':
      return '⚪';
    case 'in_heat':
      return '🔥';
    case 'nursing':
      return '👶';
    default:
      return '⚪';
  }
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
  breedingStatus: 'not_breeding',
  lastBreedingDate: '',
  expectedBirthDate: '',
  nextVaccinationDate: '',
  customType: ''
};

const formPages: FormPage[] = [
  {
    title: 'المعلومات الأساسية',
    subtitle: 'أدخل المعلومات الأساسية للحيوان',
    icon: '🐄',
    fields: ['type', 'gender', 'count', 'healthStatus', 'birthDate', 'weight'],
  },
  {
    title: 'التغذية والرعاية',
    subtitle: 'أدخل تفاصيل التغذية والرعاية',
    icon: '🌾',
    fields: ['feedingSchedule', 'feeding', 'dailyFeedConsumption'],
  },
  {
    title: 'الصحة والتطعيم',
    subtitle: 'أدخل معلومات الصحة والتطعيم',
    icon: '💉',
    fields: ['health', 'diseases', 'medications', 'vaccination', 'nextVaccinationDate'],
  },
  {
    title: 'التكاثر',
    subtitle: 'أدخل معلومات التكاثر',
    icon: '👶',
    fields: ['breedingStatus', 'lastBreedingDate', 'expectedBirthDate'],
  },
  {
    title: 'ملاحظات إضافية',
    subtitle: 'أدخل أي ملاحظات إضافية',
    icon: '📝',
    fields: ['notes'],
  },
];

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
  breedingStatus: Yup.string().oneOf(['not_breeding', 'in_heat', 'pregnant', 'nursing', 'lactating', 'ready']),
  lastBreedingDate: Yup.string(),
  expectedBirthDate: Yup.string(),
  nextVaccinationDate: Yup.string()
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
        userId: '1'
      };

      if (mode === 'edit' && animalId) {
        await updateAnimal(animalId, animalData);
      } else {
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

  const renderField = (field: string) => {
    switch (field) {
      case 'type':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              نوع الحيوان *
            </Text>
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
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              جنس الحيوان *
            </Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'male' && { backgroundColor: theme.colors.primary.base }
                ]}
                onPress={() => setFormData({ ...formData, gender: 'male' })}
              >
                <Text style={styles.genderIcon}>👨</Text>
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
                <Text style={styles.genderIcon}>👩</Text>
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
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              عدد الحيوانات *
            </Text>
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
            />
          </View>
        );

      case 'healthStatus':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الحالة الصحية *
            </Text>
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
                    {status === 'excellent' ? '🌟' : 
                     status === 'good' ? '👍' : 
                     status === 'fair' ? '😐' : '😢'}
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
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              برنامج التغذية *
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.feedingSchedule}
              onChangeText={(text) => setFormData({ ...formData, feedingSchedule: text })}
              placeholder="أدخل برنامج التغذية"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'feeding':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              التغذية
            </Text>
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
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الصحة
            </Text>
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
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الأمراض
            </Text>
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
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الأدوية
            </Text>
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
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              التطعيم
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.vaccination}
              onChangeText={(text) => setFormData({ ...formData, vaccination: text })}
              placeholder="أدخل تفاصيل التطعيم"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'breedingStatus':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              حالة التكاثر *
            </Text>
            <View style={styles.breedingStatusContainer}>
              {['not_breeding', 'in_heat', 'pregnant', 'nursing', 'lactating', 'ready'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.breedingStatusButton,
                    formData.breedingStatus === status && { backgroundColor: getBreedingStatusColor(status as BreedingStatus, theme) }
                  ]}
                  onPress={() => setFormData({ ...formData, breedingStatus: status as BreedingStatus })}
                >
                  <Text style={styles.breedingStatusIcon}>
                    {getBreedingStatusIcon(status as BreedingStatus)}
                  </Text>
                  <Text style={[
                    styles.breedingStatusText,
                    { color: formData.breedingStatus === status ? '#FFF' : theme.colors.neutral.textSecondary }
                  ]}>
                    {getBreedingStatusLabel(status as BreedingStatus)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'lastBreedingDate':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              تاريخ التكاثر الأخير
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.lastBreedingDate}
              onChangeText={(text) => setFormData({ ...formData, lastBreedingDate: text })}
              placeholder="أدخل تاريخ التكاثر الأخير"
              placeholderTextColor={theme.colors.neutral.textSecondary}
            />
          </View>
        );

      case 'expectedBirthDate':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              تاريخ الميلاد المتوقع
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.expectedBirthDate}
              onChangeText={(text) => setFormData({ ...formData, expectedBirthDate: text })}
              placeholder="أدخل تاريخ الميلاد المتوقع"
              placeholderTextColor={theme.colors.neutral.textSecondary}
            />
          </View>
        );

      case 'nextVaccinationDate':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              تاريخ التطعيم القادم
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.nextVaccinationDate}
              onChangeText={(text) => setFormData({ ...formData, nextVaccinationDate: text })}
              placeholder="أدخل تاريخ التطعيم القادم"
              placeholderTextColor={theme.colors.neutral.textSecondary}
            />
          </View>
        );

      case 'notes':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              ملاحظات
            </Text>
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

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          {mode === 'edit' ? 'تعديل الحيوان' : 'إضافة حيوان جديد'}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={theme.colors.neutral.textPrimary} />
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
            <Feather name="arrow-right" size={24} color={theme.colors.neutral.textPrimary} />
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
              <Feather name="arrow-left" size={24} color="#FFF" />
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
              <Text style={[styles.modalTitle, { color: theme.colors.neutral.textPrimary }]}>
                اختر نوع الحيوان
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTypeModal(false)}
              >
                <Feather name="x" size={24} color={theme.colors.neutral.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.animalGrid}>
                {Object.entries(ANIMAL_TYPES).map(([id, animal]) => (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.animalOption,
                      { 
                        backgroundColor: theme.colors.neutral.background,
                        borderWidth: 1,
                        borderColor: theme.colors.neutral.border,
                      }
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, type: id });
                      setShowTypeModal(false);
                    }}
                  >
                    <Text style={styles.animalIcon}>{animal.icon}</Text>
                    <View style={styles.animalInfo}>
                      <Text style={[styles.animalName, { color: theme.colors.neutral.textPrimary }]}>
                        {animal.name}
                      </Text>
                      <Text style={[styles.animalCategory, { color: theme.colors.neutral.textSecondary }]}>
                        {animal.category}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={[
                    styles.animalOption,
                    { 
                      backgroundColor: theme.colors.neutral.background,
                      borderWidth: 1,
                      borderColor: theme.colors.neutral.border,
                    }
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, type: 'other' });
                    setShowTypeModal(false);
                  }}
                >
                  <Text style={styles.animalIcon}>➕</Text>
                  <View style={styles.animalInfo}>
                    <Text style={[styles.animalName, { color: theme.colors.neutral.textPrimary }]}>
                      نوع آخر
                    </Text>
                    <Text style={[styles.animalCategory, { color: theme.colors.neutral.textSecondary }]}>
                      إضافة نوع مخصص
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 16,
  },
  backButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
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
    marginLeft: 16,
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
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  genderIcon: {
    fontSize: 24,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  healthStatusContainer: {
    flexDirection: 'row',
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
    fontSize: 20,
  },
  healthStatusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  breedingStatusContainer: {
    flexDirection: 'row',
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
    borderRadius: 8,
    gap: 8,
  },
  breedingStatusIcon: {
    fontSize: 20,
  },
  breedingStatusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
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
    flexDirection: 'row',
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
    maxHeight: '95%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  animalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 100,
  },
  animalOption: {
    width: (width - 56) / 3,
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  animalIcon: {
    fontSize: 40,
  },
  animalInfo: {
    alignItems: 'center',
    width: '100%',
  },
  animalName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  animalCategory: {
    fontSize: 12,
    textAlign: 'center',
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
}); 