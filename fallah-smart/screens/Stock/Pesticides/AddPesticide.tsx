import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  KeyboardAvoidingView,
  StatusBar
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
  FadeInDown
} from 'react-native-reanimated';
import * as Yup from 'yup';
import { Pesticide } from '../types';
import { pesticideApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { PESTICIDE_TYPE_ICONS, SAFETY_ICONS, UNIT_ICONS } from './constants';

type AddPesticideScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddPesticide'>;
  mode?: 'add' | 'edit';
  initialData?: Pesticide;
};

type MaterialIconName = keyof typeof MaterialCommunityIcons.glyphMap;

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
  customTypeName: string;
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
  customTypeName: '',
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

const convertPesticideToFormData = (pesticide: Pesticide): FormData => ({
  name: pesticide.name,
  type: pesticide.type,
  customTypeName: pesticide.type === 'other' ? (pesticide as any).customTypeName || '' : '',
  activeIngredients: pesticide.activeIngredients || '',
  targetPests: pesticide.targetPests || '',
  applicationRate: pesticide.applicationRate?.toString() || '',
  safetyInterval: pesticide.safetyInterval?.toString() || '',
  manufacturer: pesticide.manufacturer || '',
  registrationNumber: pesticide.registrationNumber || '',
  storageConditions: pesticide.storageConditions || '',
  safetyPrecautions: pesticide.safetyPrecautions || '',
  emergencyProcedures: pesticide.emergencyProcedures || '',
  quantity: pesticide.quantity.toString(),
  unit: pesticide.unit as StockUnit,
  minQuantityAlert: pesticide.minQuantityAlert.toString(),
  price: pesticide.price?.toString() || '',
  isNatural: pesticide.isNatural || false,
  supplier: pesticide.supplier || '',
  expiryDate: pesticide.expiryDate || undefined,
});

const AddPesticideScreen = ({ navigation, mode = 'add', initialData }: AddPesticideScreenProps) => {
  const theme = useTheme();
  const { addPesticide, updatePesticide } = usePesticide();
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [formData, setFormData] = useState<FormData>(() => 
    initialData ? convertPesticideToFormData(initialData) : initialFormData
  );
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

    // Add validation for custom type name
    if (formData.type === 'other' && !formData.customTypeName.trim()) {
      errors.customTypeName = 'يرجى إدخال نوع المبيد المخصص';
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
      console.log('Starting form submission with data:', formData);

      if (!Object.keys(PESTICIDE_TYPE_ICONS).includes(formData.type)) {
        Alert.alert('خطأ', 'نوع المبيد غير صالح');
        return;
      }

      // Add validation for custom type
      if (formData.type === 'other' && !formData.customTypeName.trim()) {
        Alert.alert('خطأ', 'يرجى إدخال نوع المبيد المخصص');
        return;
      }

      const toNumber = (value: string) => {
        const num = Number(value);
        return isNaN(num) ? null : num;
      };

      const now = new Date().toISOString();
      const pesticideData = {
        name: formData.name.trim(),
        type: formData.type,
        customTypeName: formData.type === 'other' ? formData.customTypeName.trim() : null,
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
        userId: user?.id.toString() || '1',
        createdAt: mode === 'add' ? now : (initialData?.createdAt || now),
        updatedAt: now,
      } as const;

      try {
        if (mode === 'edit' && initialData) {
          await updatePesticide(initialData.id, pesticideData);
          Alert.alert('نجاح', 'تم تحديث المبيد بنجاح', [
            { text: 'حسناً', onPress: () => navigation.goBack() }
          ]);
        } else {
          await addPesticide(pesticideData);
          Alert.alert('نجاح', 'تمت إضافة المبيد بنجاح', [
            { text: 'حسناً', onPress: () => navigation.goBack() }
          ]);
        }
      } catch (apiError) {
        if (apiError instanceof Error) {
          Alert.alert('خطأ', `فشل في ${mode === 'edit' ? 'تحديث' : 'إضافة'} المبيد: ${apiError.message}`);
        } else {
          Alert.alert('خطأ', `فشل في ${mode === 'edit' ? 'تحديث' : 'إضافة'} المبيد: خطأ غير معروف`);
        }
      }
    } catch (error) {
      console.error('Error submitting pesticide:', error);
      Alert.alert('خطأ', `فشل في ${mode === 'edit' ? 'تحديث' : 'إضافة'} المبيد`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnitChange = (value: StockUnit) => {
    setFormData(prev => ({ ...prev, unit: value }));
  };

  const renderField = (field: keyof FormData) => {
    const typeInfo = PESTICIDE_TYPE_ICONS[formData.type as keyof typeof PESTICIDE_TYPE_ICONS];
    const unitInfo = UNIT_ICONS[formData.unit.toLowerCase() as keyof typeof UNIT_ICONS];

    switch (field) {
      case 'name':
        return (
          <Animated.View entering={FadeInDown.delay(100)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              اسم المبيد
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              placeholder="اسم المبيد"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </Animated.View>
        );
      case 'type':
        return (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              نوع المبيد
            </Text>
            <View style={styles.typeContainer}>
              {Object.entries(PESTICIDE_TYPE_ICONS).map(([type, info]) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    { backgroundColor: theme.colors.neutral.surface },
                    formData.type === type && { 
                      backgroundColor: info.color + '20',
                      borderColor: info.color 
                    },
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      type: type as PesticideType,
                      customTypeName: type === 'other' ? prev.customTypeName : ''
                    }));
                  }}
                >
                  <Text style={styles.typeIcon}>{info.icon}</Text>
                  <Text style={[
                    styles.typeButtonText,
                    { color: formData.type === type ? info.color : theme.colors.neutral.textPrimary }
                  ]}>
                    {info.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {formData.type === 'other' && (
              <Animated.View 
                entering={FadeInDown} 
                style={[styles.customTypeContainer, { backgroundColor: theme.colors.neutral.surface }]}
              >
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.neutral.surface,
                    color: theme.colors.neutral.textPrimary,
                    marginBottom: 0
                  }]}
                  placeholder="ادخل نوع المبيد"
                  placeholderTextColor={theme.colors.neutral.textSecondary}
                  value={formData.customTypeName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, customTypeName: text }))}
                />
              </Animated.View>
            )}
          </Animated.View>
        );
      case 'activeIngredients':
        return (
          <Animated.View entering={FadeInDown.delay(300)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              المكونات النشطة
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              placeholder="المكونات النشطة"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.activeIngredients}
              onChangeText={(text) => setFormData(prev => ({ ...prev, activeIngredients: text }))}
            />
          </Animated.View>
        );
      case 'targetPests':
        return (
          <Animated.View entering={FadeInDown.delay(400)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الآفات المستهدفة
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              placeholder="الآفات المستهدفة"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.targetPests}
              onChangeText={(text) => setFormData(prev => ({ ...prev, targetPests: text }))}
            />
          </Animated.View>
        );
      case 'applicationRate':
        return (
          <Animated.View entering={FadeInDown.delay(500)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              معدل التطبيق
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              placeholder="معدل التطبيق"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.applicationRate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, applicationRate: text }))}
            />
          </Animated.View>
        );
      case 'safetyInterval':
        return (
          <Animated.View entering={FadeInDown.delay(600)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              فترة الأمان
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              placeholder="فترة الأمان"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.safetyInterval}
              onChangeText={(text) => setFormData(prev => ({ ...prev, safetyInterval: text }))}
            />
          </Animated.View>
        );
      case 'manufacturer':
        return (
          <Animated.View entering={FadeInDown.delay(700)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الشركة المصنعة
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              placeholder="الشركة المصنعة"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.manufacturer}
              onChangeText={(text) => setFormData(prev => ({ ...prev, manufacturer: text }))}
            />
          </Animated.View>
        );
      case 'registrationNumber':
        return (
          <Animated.View entering={FadeInDown.delay(800)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              رقم التسجيل
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              placeholder="رقم التسجيل"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.registrationNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, registrationNumber: text }))}
            />
          </Animated.View>
        );
      case 'storageConditions':
        return (
          <Animated.View entering={FadeInDown.delay(900)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              ظروف التخزين
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              placeholder="ظروف التخزين"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.storageConditions}
              onChangeText={(text) => setFormData(prev => ({ ...prev, storageConditions: text }))}
            />
          </Animated.View>
        );
      case 'safetyPrecautions':
        return (
          <Animated.View entering={FadeInDown.delay(1000)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              احتياطات السلامة
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              placeholder="احتياطات السلامة"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.safetyPrecautions}
              onChangeText={(text) => setFormData(prev => ({ ...prev, safetyPrecautions: text }))}
            />
          </Animated.View>
        );
      case 'emergencyProcedures':
        return (
          <Animated.View entering={FadeInDown.delay(1100)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              إجراءات الطوارئ
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              placeholder="إجراءات الطوارئ"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.emergencyProcedures}
              onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyProcedures: text }))}
            />
          </Animated.View>
        );
      case 'quantity':
        return (
          <Animated.View entering={FadeInDown.delay(1200)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الكمية
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              placeholder="الكمية"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.quantity}
              onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: text }))}
              keyboardType="numeric"
            />
          </Animated.View>
        );
      case 'unit':
        return (
          <Animated.View entering={FadeInDown.delay(1300)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الوحدة
            </Text>
            <View style={styles.unitSelector}>
              {units.map((unit) => (
                <TouchableOpacity
                  key={unit.value}
                  style={[
                    styles.unitButton,
                    { backgroundColor: theme.colors.neutral.surface },
                    formData.unit === unit.value && { 
                      backgroundColor: unitInfo.color + '20',
                      borderColor: unitInfo.color 
                    },
                  ]}
                  onPress={() => handleUnitChange(unit.value as StockUnit)}
                >
                  <Text style={[
                    styles.unitButtonText,
                    { color: formData.unit === unit.value ? unitInfo.color : theme.colors.neutral.textPrimary }
                  ]}>
                    {unit.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );
      case 'minQuantityAlert':
        return (
          <Animated.View entering={FadeInDown.delay(1400)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الحد الأدنى للتنبيه
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              placeholder="الحد الأدنى للتنبيه"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.minQuantityAlert}
              onChangeText={(text) => setFormData(prev => ({ ...prev, minQuantityAlert: text }))}
              keyboardType="numeric"
            />
          </Animated.View>
        );
      case 'price':
        return (
          <Animated.View entering={FadeInDown.delay(1500)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              السعر
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              placeholder="السعر"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.price}
              onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
              keyboardType="numeric"
            />
          </Animated.View>
        );
      case 'isNatural':
        return (
          <Animated.View entering={FadeInDown.delay(1600)} style={styles.checkboxContainer}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              مبيد طبيعي
            </Text>
            <TouchableOpacity
              style={[
                styles.checkbox,
                { backgroundColor: theme.colors.neutral.surface },
                formData.isNatural && { backgroundColor: theme.colors.success },
              ]}
              onPress={() => setFormData(prev => ({ ...prev, isNatural: !prev.isNatural }))}
            />
          </Animated.View>
        );
      case 'supplier':
        return (
          <Animated.View entering={FadeInDown.delay(1700)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              المورد
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              placeholder="المورد"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.supplier}
              onChangeText={(text) => setFormData(prev => ({ ...prev, supplier: text }))}
            />
          </Animated.View>
        );
      case 'expiryDate':
        return (
          <Animated.View entering={FadeInDown.delay(1800)}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              تاريخ انتهاء الصلاحية
            </Text>
            <TouchableOpacity
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary 
              }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[
                styles.inputText,
                { color: formData.expiryDate ? theme.colors.success : theme.colors.neutral.textSecondary }
              ]}>
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
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          <Text>{FORM_PAGES[currentPage].icon}</Text> {mode === 'edit' ? 'تعديل المبيد' : 'إضافة مبيد جديد'}
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
          style={[
            styles.button, 
            styles.nextButton, 
            { backgroundColor: theme.colors.primary.base },
            isSubmitting && { opacity: 0.7 }
          ]}
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
    </KeyboardAvoidingView>
  );
};

const styles = createThemedStyles((theme) => {
  // Define fallback values for typography to prevent undefined errors
  const getTypographySize = (typePath: string, fallback: number) => {
    try {
      const paths = typePath.split('.');
      let result: any = theme; // Type as any to avoid index signature errors
      for (const path of paths) {
        if (!result || result[path] === undefined) return fallback;
        result = result[path];
      }
      return result;
    } catch (e) {
      return fallback;
    }
  };

  return {
    container: {
      flex: 1,
      backgroundColor: theme.colors.neutral.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      backgroundColor: theme.colors.neutral.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral.border,
    },
    backButton: {
      padding: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: getTypographySize('typography.arabic.h3.fontSize', 28),
      fontWeight: '600',
      color: theme.colors.neutral.textPrimary,
    },
    progressContainer: {
      padding: theme.spacing.md,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
      backgroundColor: theme.colors.neutral.border,
      marginBottom: theme.spacing.sm,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: theme.colors.primary.base,
    },
    progressText: {
      fontSize: theme.fontSizes.caption,
      textAlign: 'center',
      color: theme.colors.neutral.textSecondary,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    form: {
      padding: theme.spacing.md,
    },
    inputGroup: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: getTypographySize('typography.arabic.caption.fontSize', 18),
      marginBottom: theme.spacing.xs,
      fontWeight: '500',
      color: theme.colors.neutral.textPrimary,
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.neutral.border,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
      fontSize: theme.fontSizes.body,
      backgroundColor: theme.colors.neutral.surface,
      color: theme.colors.neutral.textPrimary,
    },
    textArea: {
      borderWidth: 1,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      fontSize: theme.fontSizes.body,
      minHeight: 120,
      textAlignVertical: 'top',
      backgroundColor: theme.colors.neutral.surface,
      color: theme.colors.neutral.textPrimary,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.neutral.surface,
      borderColor: theme.colors.neutral.border,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 1,
      borderRadius: 4,
      marginLeft: theme.spacing.sm,
      backgroundColor: theme.colors.neutral.surface,
      borderColor: theme.colors.neutral.border,
    },
    checkboxChecked: {
      backgroundColor: theme.colors.success,
    },
    footer: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.neutral.border,
    },
    errorText: {
      fontSize: theme.fontSizes.caption,
      marginTop: -theme.spacing.sm,
      marginBottom: theme.spacing.md,
      marginRight: theme.spacing.xs,
      color: theme.colors.error,
    },
    button: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.small,
    },
    previousButton: {
      borderWidth: 1,
      borderColor: theme.colors.neutral.border,
      backgroundColor: theme.colors.neutral.surface,
    },
    nextButton: {
      backgroundColor: theme.colors.primary.base,
    },
    buttonText: {
      color: theme.colors.neutral.surface,
      fontSize: theme.fontSizes.button,
      fontWeight: '600',
    },
    typeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    typeIcon: {
      fontSize: 24,
    },
    typeButton: {
      flex: 1,
      minWidth: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.neutral.border,
      backgroundColor: theme.colors.neutral.surface,
      gap: theme.spacing.sm,
    },
    typeButtonText: {
      fontSize: theme.fontSizes.body,
      fontWeight: '500',
    },
    unitSelector: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    unitButton: {
      padding: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.neutral.border,
      borderRadius: theme.borderRadius.small,
      backgroundColor: theme.colors.neutral.surface,
    },
    unitButtonText: {
      fontSize: theme.fontSizes.body,
      fontWeight: '500',
    },
    inputText: {
      fontSize: theme.fontSizes.body,
    },
    sectionIcon: {
      fontSize: 24,
    },
    customTypeContainer: {
      marginTop: theme.spacing.sm,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.neutral.border,
      backgroundColor: theme.colors.neutral.surface,
    },
    submitButtonText: {
      fontSize: getTypographySize('typography.arabic.body.fontSize', 20),
      fontWeight: '600',
      color: '#FFF',
    },
  };
});

export default AddPesticideScreen; 