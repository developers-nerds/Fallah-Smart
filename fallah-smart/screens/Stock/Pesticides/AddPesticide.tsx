import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ViewStyle,
  Modal,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StockCategory, StockUnit, PesticideType } from '../types';
import { usePesticide } from '../../../context/PesticideContext';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { Button } from '../../../components/Button';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Yup from 'yup';
import { Pesticide } from '../types';
import { pesticideApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

type AddPesticideScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddPesticide'>;
};

const UNITS = [
  { label: 'كيلوغرام (kg)', value: 'kg' },
  { label: 'لتر (L)', value: 'L' },
  { label: 'مليلتر (mL)', value: 'mL' },
  { label: 'غرام (g)', value: 'g' },
];

interface FormPage {
  title: string;
  subtitle: string;
  icon: string;
  fields: string[];
}

const FORM_PAGES = [
  {
    title: 'المعلومات الأساسية',
    subtitle: 'أدخل المعلومات الأساسية للمبيد',
    icon: '🧪',
    fields: ['name', 'type', 'quantity', 'unit', 'minQuantityAlert', 'price'],
  },
  {
    title: 'التفاصيل الفنية',
    subtitle: 'أدخل التفاصيل الفنية للمبيد',
    icon: '⚗️',
    fields: ['activeIngredients', 'targetPests', 'applicationRate', 'safetyInterval'],
  },
  {
    title: 'معلومات السلامة',
    subtitle: 'أدخل معلومات السلامة والتخزين',
    icon: '⚠️',
    fields: ['manufacturer', 'registrationNumber', 'storageConditions', 'safetyPrecautions', 'emergencyProcedures'],
  },
  {
    title: 'معلومات إضافية',
    subtitle: 'أدخل أي معلومات إضافية',
    icon: '📝',
    fields: ['isNatural', 'supplier', 'expiryDate'],
  },
];

const categories: { value: StockCategory; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: 'seeds', label: 'البذور', icon: 'seed-outline' },
  { value: 'fertilizer', label: 'الأسمدة', icon: 'bottle-tonic-plus-outline' },
  { value: 'harvest', label: 'المحاصيل', icon: 'basket-outline' },
  { value: 'feed', label: 'الأعلاف', icon: 'food-outline' },
  { value: 'pesticide', label: 'المبيدات', icon: 'spray-bottle' },
  { value: 'equipment', label: 'المعدات', icon: 'tractor-variant' },
  { value: 'tools', label: 'الأدوات', icon: 'tools' }
];

const units: { value: StockUnit; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: 'kg', label: 'كيلوغرام', icon: 'scale' },
  { value: 'g', label: 'غرام', icon: 'scale' },
  { value: 'l', label: 'لتر', icon: 'bottle-soda' },
  { value: 'ml', label: 'مليلتر', icon: 'bottle-soda' },
  { value: 'units', label: 'وحدة', icon: 'package-variant' }
];

const qualityOptions: { value: 'good' | 'medium' | 'poor'; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }[] = [
  { value: 'good', label: 'جيد', icon: 'check-decagram', color: '#4CAF50' },
  { value: 'medium', label: 'متوسط', icon: 'alert-circle', color: '#FFC107' },
  { value: 'poor', label: 'سيء', icon: 'close-circle', color: '#F44336' }
];

const validationSchema = Yup.object().shape({
  name: Yup.string().required('اسم المنتج مطلوب'),
  quantity: Yup.number()
    .required('الكمية مطلوبة')
    .min(0, 'يجب أن تكون الكمية إيجابية'),
  unit: Yup.string().required('الوحدة مطلوبة'),
  category: Yup.string().required('الفئة مطلوبة'),
  lowStockThreshold: Yup.number()
    .required('الحد الأدنى للمخزون مطلوب')
    .min(0, 'يجب أن يكون الحد الأدنى إيجابياً'),
  location: Yup.string(),
  supplier: Yup.string(),
  price: Yup.number().nullable().min(0, 'يجب أن يكون السعر إيجابياً'),
  notes: Yup.string(),
  isNatural: Yup.boolean(),
  qualityStatus: Yup.string().oneOf(['good', 'medium', 'poor']).required('حالة الجودة مطلوبة'),
  batchNumber: Yup.string(),
  expiryDate: Yup.date().nullable()
});

interface FormData {
  name: string;
  type: PesticideType;
  activeIngredients: string;
  targetPests: string;
  applicationRate: string;
  safetyInterval: string;
  manufacturer: string;
  registrationNumber: string;
  storageConditions: string;
  safetyPrecautions: string;
  emergencyProcedures: string;
  quantity: string;
  unit: StockUnit;
  minQuantityAlert: string;
  price: string;
  isNatural: boolean;
  supplier: string;
  expiryDate?: string;
}

const initialFormData: FormData = {
  name: '',
  type: 'insecticide',
  activeIngredients: '',
  targetPests: '',
  applicationRate: '',
  safetyInterval: '',
  manufacturer: '',
  registrationNumber: '',
  storageConditions: '',
  safetyPrecautions: '',
  emergencyProcedures: '',
  quantity: '',
  unit: 'l',
  minQuantityAlert: '',
  price: '',
  isNatural: false,
  supplier: '',
};

const pesticideTypes: { value: PesticideType; label: string }[] = [
  { value: 'insecticide', label: 'مبيد حشري' },
  { value: 'herbicide', label: 'مبيد أعشاب' },
  { value: 'fungicide', label: 'مبيد فطري' },
  { value: 'other', label: 'أخرى' }
];

const AddPesticideScreen = ({ navigation }: AddPesticideScreenProps) => {
  const theme = useTheme();
  const { addPesticide } = usePesticide();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const progress = useSharedValue(0);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    progress.value = withSpring(currentPage / (FORM_PAGES.length - 1));
  }, [currentPage]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const validateCurrentPage = () => {
    const currentFields = FORM_PAGES[currentPage].fields;
    const errors: Record<string, string> = {};
    const requiredFields: Record<string, string> = {
      name: 'اسم المبيد',
      type: 'نوع المبيد',
      quantity: 'الكمية',
      unit: 'الوحدة',
      minQuantityAlert: 'الحد الأدنى للتنبيه',
      price: 'السعر'
    };

    for (const field of currentFields) {
      if (field in requiredFields && !formData[field as keyof FormData]) {
        errors[field] = `يرجى إدخال ${requiredFields[field]}`;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentPage()) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentPage(prev => prev - 1);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        expiryDate: selectedDate.toISOString().split('T')[0],
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentPage()) return;

    try {
      setIsSubmitting(true);
      if (!user) {
        Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
        return;
      }

      // Validate pesticide type
      if (!pesticideTypes.map(t => t.value).includes(formData.type as PesticideType)) {
        Alert.alert('خطأ', 'نوع المبيد غير صالح');
        return;
      }

      // Helper function to convert string to number or null
      const toNumber = (value: string) => {
        const num = Number(value);
        return isNaN(num) ? null : num;
      };

      const now = new Date().toISOString();
      const pesticide = {
        name: formData.name.trim(),
        type: formData.type,
        quantity: toNumber(formData.quantity) || 0,
        unit: formData.unit,
        minQuantityAlert: toNumber(formData.minQuantityAlert) || 10,
        price: toNumber(formData.price) || 0,
        isNatural: formData.isNatural,
        activeIngredients: formData.activeIngredients || null,
        targetPests: formData.targetPests || null,
        applicationRate: toNumber(formData.applicationRate),
        safetyInterval: toNumber(formData.safetyInterval),
        manufacturer: formData.manufacturer || null,
        registrationNumber: formData.registrationNumber || null,
        storageConditions: formData.storageConditions || null,
        safetyPrecautions: formData.safetyPrecautions || null,
        emergencyProcedures: formData.emergencyProcedures || null,
        supplier: formData.supplier.trim() || null,
        expiryDate: formData.expiryDate || null,
        userId: user.id.toString(),
        createdAt: now,
        updatedAt: now
      };

      console.log('Submitting pesticide:', JSON.stringify(pesticide, null, 2));

      try {
        await addPesticide(pesticide);
        console.log('Pesticide added successfully');
        Alert.alert('نجاح', 'تمت إضافة المبيد بنجاح', [
          { text: 'حسناً', onPress: () => navigation.goBack() }
        ]);
      } catch (apiError) {
        console.error('API Error:', apiError);
        if (apiError instanceof Error) {
          Alert.alert('خطأ', `فشل في إضافة المبيد: ${apiError.message}`);
        } else {
          Alert.alert('خطأ', 'فشل في إضافة المبيد: خطأ غير معروف');
        }
        throw apiError;
      }
    } catch (error) {
      console.error('Error submitting pesticide:', error);
      Alert.alert('خطأ', 'فشل في إضافة المبيد');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnitChange = (value: StockUnit) => {
    setFormData(prev => ({ ...prev, unit: value }));
  };

  const renderField = (field: keyof FormData) => {
    switch (field) {
      case 'name':
        return (
          <TextInput
            style={styles.input}
            placeholder="اسم المبيد"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          />
        );
      case 'type':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              نوع المبيد
            </Text>
            <View style={styles.typeContainer}>
              {pesticideTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    formData.type === type.value && styles.selectedTypeButton,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: type.value }))}
                >
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === type.value && styles.selectedTypeButtonText
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 'activeIngredients':
        return (
          <TextInput
            style={styles.input}
            placeholder="المكونات النشطة"
            value={formData.activeIngredients}
            onChangeText={(text) => setFormData(prev => ({ ...prev, activeIngredients: text }))}
          />
        );
      case 'targetPests':
        return (
          <TextInput
            style={styles.input}
            placeholder="الآفات المستهدفة"
            value={formData.targetPests}
            onChangeText={(text) => setFormData(prev => ({ ...prev, targetPests: text }))}
          />
        );
      case 'applicationRate':
        return (
          <TextInput
            style={styles.input}
            placeholder="معدل التطبيق"
            value={formData.applicationRate}
            onChangeText={(text) => setFormData(prev => ({ ...prev, applicationRate: text }))}
          />
        );
      case 'safetyInterval':
        return (
          <TextInput
            style={styles.input}
            placeholder="فترة الأمان"
            value={formData.safetyInterval}
            onChangeText={(text) => setFormData(prev => ({ ...prev, safetyInterval: text }))}
          />
        );
      case 'manufacturer':
        return (
          <TextInput
            style={styles.input}
            placeholder="الشركة المصنعة"
            value={formData.manufacturer}
            onChangeText={(text) => setFormData(prev => ({ ...prev, manufacturer: text }))}
          />
        );
      case 'registrationNumber':
        return (
          <TextInput
            style={styles.input}
            placeholder="رقم التسجيل"
            value={formData.registrationNumber}
            onChangeText={(text) => setFormData(prev => ({ ...prev, registrationNumber: text }))}
          />
        );
      case 'storageConditions':
        return (
          <TextInput
            style={styles.input}
            placeholder="ظروف التخزين"
            value={formData.storageConditions}
            onChangeText={(text) => setFormData(prev => ({ ...prev, storageConditions: text }))}
          />
        );
      case 'safetyPrecautions':
        return (
          <TextInput
            style={styles.input}
            placeholder="احتياطات السلامة"
            value={formData.safetyPrecautions}
            onChangeText={(text) => setFormData(prev => ({ ...prev, safetyPrecautions: text }))}
          />
        );
      case 'emergencyProcedures':
        return (
          <TextInput
            style={styles.input}
            placeholder="إجراءات الطوارئ"
            value={formData.emergencyProcedures}
            onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyProcedures: text }))}
          />
        );
      case 'quantity':
        return (
          <TextInput
            style={styles.input}
            placeholder="الكمية"
            value={formData.quantity}
            onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: text }))}
            keyboardType="numeric"
          />
        );
      case 'unit':
        return (
          <View>
            <Text>الوحدة</Text>
            <View style={styles.unitSelector}>
              {units.map((unit) => (
                <TouchableOpacity
                  key={unit.value}
                  style={[
                    styles.unitButton,
                    formData.unit === unit.value && styles.selectedUnitButton,
                  ]}
                  onPress={() => handleUnitChange(unit.value as StockUnit)}
                >
                  <Text>{unit.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 'minQuantityAlert':
        return (
          <TextInput
            style={styles.input}
            placeholder="الحد الأدنى للتنبيه"
            value={formData.minQuantityAlert}
            onChangeText={(text) => setFormData(prev => ({ ...prev, minQuantityAlert: text }))}
            keyboardType="numeric"
          />
        );
      case 'price':
        return (
          <TextInput
            style={styles.input}
            placeholder="السعر"
            value={formData.price}
            onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
            keyboardType="numeric"
          />
        );
      case 'isNatural':
        return (
          <View style={styles.checkboxContainer}>
            <Text>مبيد طبيعي</Text>
            <TouchableOpacity
              style={[styles.checkbox, formData.isNatural && styles.checkboxChecked]}
              onPress={() => setFormData(prev => ({ ...prev, isNatural: !prev.isNatural }))}
            />
          </View>
        );
      case 'supplier':
        return (
          <TextInput
            style={styles.input}
            placeholder="المورد"
            value={formData.supplier}
            onChangeText={(text) => setFormData(prev => ({ ...prev, supplier: text }))}
          />
        );
      case 'expiryDate':
        return (
          <View>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text>
                {formData.expiryDate
                  ? new Date(formData.expiryDate).toLocaleDateString()
                  : 'تاريخ انتهاء الصلاحية'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.expiryDate ? new Date(formData.expiryDate) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setFormData(prev => ({ ...prev, expiryDate: selectedDate.toISOString() }));
                  }
                }}
              />
            )}
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
          {FORM_PAGES[currentPage].icon} {FORM_PAGES[currentPage].title}
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
          الخطوة {currentPage + 1} من {FORM_PAGES.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {FORM_PAGES[currentPage].fields.map((field) => (
            <View key={field}>
              {renderField(field as keyof FormData)}
              {validationErrors[field] && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {validationErrors[field]}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {currentPage > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.previousButton, { backgroundColor: theme.colors.neutral.surface }]}
            onPress={handlePrevious}
            disabled={isSubmitting}
          >
            <Text style={[styles.buttonText, { color: theme.colors.neutral.textPrimary }]}>
              السابق
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.nextButton, { backgroundColor: theme.colors.primary.base }]}
          onPress={currentPage === FORM_PAGES.length - 1 ? handleSubmit : handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {currentPage === FORM_PAGES.length - 1 ? 'إضافة' : 'التالي'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  } as ViewStyle,
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  progressContainer: {
    padding: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 4,
    marginLeft: 8,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.success,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginRight: 4,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  previousButton: {
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
  },
  nextButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.background,
  },
  selectedTypeButton: {
    backgroundColor: theme.colors.primary.base,
    borderColor: theme.colors.primary.base,
  },
  typeButtonText: {
    color: theme.colors.neutral.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedTypeButtonText: {
    color: '#FFFFFF',
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: 8,
  },
  selectedUnitButton: {
    backgroundColor: theme.colors.primary.base,
  },
}));

export default AddPesticideScreen; 