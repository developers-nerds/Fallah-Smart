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
import { Animal, HealthStatus, Gender } from '../types';
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
  care: string;
  health: string;
  housing: string;
  breeding: string;
  diseases: string;
  medications: string;
  behavior: string;
  economics: string;
  vaccination: string;
  notes: string;
}

const initialFormData: FormData = {
  type: '',
  count: '',
  healthStatus: 'good',
  feedingSchedule: '',
  gender: 'male',
  feeding: '',
  care: '',
  health: '',
  housing: '',
  breeding: '',
  diseases: '',
  medications: '',
  behavior: '',
  economics: '',
  vaccination: '',
  notes: ''
};

const formPages: FormPage[] = [
  {
    title: 'المعلومات الأساسية',
    subtitle: 'أدخل المعلومات الأساسية للحيوان',
    icon: 'information',
    fields: ['type', 'gender', 'count', 'healthStatus'],
  },
  {
    title: 'التغذية والرعاية',
    subtitle: 'أدخل تفاصيل التغذية والرعاية',
    icon: 'heart-pulse',
    fields: ['feedingSchedule', 'feeding', 'care', 'housing'],
  },
  {
    title: 'الصحة والطب',
    subtitle: 'أدخل معلومات الصحة والعلاج',
    icon: 'cog',
    fields: ['health', 'diseases', 'medications', 'vaccination'],
  },
  {
    title: 'معلومات إضافية',
    subtitle: 'أدخل معلومات إضافية',
    icon: 'text-box',
    fields: ['breeding', 'behavior', 'economics', 'notes'],
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
  care: Yup.string(),
  housing: Yup.string(),
  health: Yup.string(),
  diseases: Yup.string(),
  medications: Yup.string(),
  breeding: Yup.string(),
  behavior: Yup.string(),
  economics: Yup.string(),
  vaccination: Yup.string(),
  notes: Yup.string(),
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
        care: formData.care.trim() || null,
        health: formData.health.trim() || null,
        housing: formData.housing.trim() || null,
        breeding: formData.breeding.trim() || null,
        diseases: formData.diseases.trim() || null,
        medications: formData.medications.trim() || null,
        behavior: formData.behavior.trim() || null,
        economics: formData.economics.trim() || null,
        vaccination: formData.vaccination.trim() || null,
        notes: formData.notes.trim() || null
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

      case 'care':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الرعاية
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.care}
              onChangeText={(text) => setFormData({ ...formData, care: text })}
              placeholder="أدخل تفاصيل الرعاية"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'housing':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              السكن
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.housing}
              onChangeText={(text) => setFormData({ ...formData, housing: text })}
              placeholder="أدخل تفاصيل السكن"
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

      case 'breeding':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              التكاثر
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.breeding}
              onChangeText={(text) => setFormData({ ...formData, breeding: text })}
              placeholder="أدخل تفاصيل التكاثر"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'behavior':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              السلوك
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.behavior}
              onChangeText={(text) => setFormData({ ...formData, behavior: text })}
              placeholder="أدخل تفاصيل السلوك"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'economics':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الجوانب الاقتصادية
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.economics}
              onChangeText={(text) => setFormData({ ...formData, economics: text })}
              placeholder="أدخل تفاصيل الجوانب الاقتصادية"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
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
}); 