import React, { useState, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Platform,
  Dimensions 
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useStock } from '../../../context/StockContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animal, HealthStatus, Gender, BreedingStatus } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import Animated, { FadeInRight, useAnimatedStyle } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Yup from 'yup';
import { CustomButton } from '../../../components/CustomButton';

const { width } = Dimensions.get('window');

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

const getHealthStatusColor = (status: HealthStatus, theme: any): string => {
  switch (status) {
    case 'excellent':
      return theme.colors.success.base;
    case 'good':
      return theme.colors.success.light;
    case 'fair':
      return theme.colors.warning.base;
    case 'poor':
      return theme.colors.error.base;
    default:
      return theme.colors.neutral.border;
  }
};

type AddAnimalScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddAnimal'>;
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
  nextVaccinationDate: ''
};

const formPages: FormPage[] = [
  {
    title: 'المعلومات الأساسية',
    subtitle: 'أدخل المعلومات الأساسية للحيوان',
    icon: 'information',
    fields: ['type', 'gender', 'count', 'healthStatus', 'birthDate', 'weight'],
  },
  {
    title: 'التغذية والرعاية',
    subtitle: 'أدخل تفاصيل التغذية والرعاية',
    icon: 'heart-pulse',
    fields: ['feedingSchedule', 'feeding', 'dailyFeedConsumption'],
  },
  {
    title: 'الصحة والتطعيم',
    subtitle: 'أدخل معلومات الصحة والتطعيم',
    icon: 'medical-bag',
    fields: ['health', 'diseases', 'medications', 'vaccination', 'nextVaccinationDate'],
  },
  {
    title: 'التكاثر',
    subtitle: 'أدخل معلومات التكاثر',
    icon: 'baby-carriage',
    fields: ['breedingStatus', 'lastBreedingDate', 'expectedBirthDate'],
  },
  {
    title: 'ملاحظات إضافية',
    subtitle: 'أدخل أي ملاحظات إضافية',
    icon: 'text-box',
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
  breedingStatus: Yup.string().oneOf(['not_breeding', 'in_heat', 'pregnant', 'nursing']),
  lastBreedingDate: Yup.string(),
  expectedBirthDate: Yup.string(),
  nextVaccinationDate: Yup.string()
});

export const AddAnimalScreen = ({ navigation }: AddAnimalScreenProps) => {
  const theme = useTheme();
  const { createAnimal } = useStock();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentPage, setCurrentPage] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${((currentPage + 1) / formPages.length) * 100}%`,
    };
  });

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.type.trim()) {
      newErrors.type = 'نوع الحيوان مطلوب';
    }

    const count = Number(formData.count);
    if (isNaN(count) || count <= 0) {
      newErrors.count = 'يجب أن يكون العدد رقمًا موجبًا';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await createAnimal({
        ...formData,
        count: Number(formData.count),
        type: formData.type.trim(),
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
        userId: '1' // TODO: Get the actual user ID from authentication context
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error creating animal:', error);
      // Handle error
    } finally {
      setLoading(false);
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
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.type}
              onChangeText={(text) => setFormData({ ...formData, type: text })}
              placeholder="أدخل نوع الحيوان"
              placeholderTextColor={theme.colors.neutral.textSecondary}
            />
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
                <MaterialCommunityIcons
                  name="gender-male"
                  size={24}
                  color={formData.gender === 'male' ? '#FFF' : theme.colors.neutral.textSecondary}
                />
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
                <MaterialCommunityIcons
                  name="gender-female"
                  size={24}
                  color={formData.gender === 'female' ? '#FFF' : theme.colors.neutral.textSecondary}
                />
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
              placeholder="1"
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
                    formData.healthStatus === status && { backgroundColor: getHealthStatusColor(status, theme) }
                  ]}
                  onPress={() => setFormData({ ...formData, healthStatus: status as HealthStatus })}
                >
                  <MaterialCommunityIcons
                    name="heart-pulse"
                    size={20}
                    color={formData.healthStatus === status ? '#FFF' : theme.colors.neutral.textSecondary}
                  />
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
              {['not_breeding', 'in_heat', 'pregnant', 'nursing'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.breedingStatusButton,
                    formData.breedingStatus === status && { backgroundColor: getHealthStatusColor(status as HealthStatus, theme) }
                  ]}
                  onPress={() => setFormData({ ...formData, breedingStatus: status as BreedingStatus })}
                >
                  <MaterialCommunityIcons
                    name="baby-carriage"
                    size={20}
                    color={formData.breedingStatus === status ? '#FFF' : theme.colors.neutral.textSecondary}
                  />
                  <Text style={[
                    styles.breedingStatusText,
                    { color: formData.breedingStatus === status ? '#FFF' : theme.colors.neutral.textSecondary }
                  ]}>
                    {status.replace('_', ' ')}
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
          {formPages[currentPage].title}
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
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <CustomButton
          title={currentPage === formPages.length - 1 ? 'إنهاء' : 'التالي'}
          onPress={nextPage}
          variant="primary"
          loading={loading}
          style={{ flex: 1, marginLeft: currentPage > 0 ? 8 : 0 }}
        />
        {currentPage > 0 && (
          <CustomButton
            title="السابق"
            onPress={prevPage}
            variant="secondary"
            style={{ flex: 1, marginRight: 8 }}
          />
        )}
      </View>
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
  healthStatusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
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
  breedingStatusText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 