import React, { useState, useEffect, useRef } from 'react';
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
  StatusBar,
  FlatList,
  Image
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { StockCategory, StockUnit } from '../types';
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
  FadeInDown,
  FadeIn,
  FadeOut
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
    fields: ['name', 'quantity', 'unit', 'minQuantityAlert', 'price'],
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
    fields: ['isNatural', 'supplier', 'expiryDate', 'lastApplicationDate'],
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
  quantity: string;
  unit: StockUnit;
  minQuantityAlert: string;
  price: string;
  isNatural: boolean;
  activeIngredients: string;
  targetPests: string;
  applicationRate: string;
  safetyInterval: string;
  expiryDate?: string;
  manufacturer: string;
  registrationNumber: string;
  storageConditions: string;
  safetyPrecautions: string;
  emergencyProcedures: string;
  lastApplicationDate?: string;
  supplier: string;
}

const initialFormData: FormData = {
  name: '',
  type: 'insecticide',
  quantity: '0',
  unit: 'l',
  minQuantityAlert: '10',
  price: '0',
  isNatural: false,
  activeIngredients: '',
  targetPests: '',
  applicationRate: '',
  safetyInterval: '',
  manufacturer: '',
  registrationNumber: '',
  storageConditions: '',
  safetyPrecautions: '',
  emergencyProcedures: '',
  supplier: '',
  lastApplicationDate: undefined,
  expiryDate: undefined,
};

// Define PesticideType to match backend enum exactly
type PesticideType = 'insecticide' | 'herbicide' | 'fungicide' | 'other';

// Update PESTICIDE_NAMES to use only the valid enum types
const PESTICIDE_NAMES = {
  // مبيدات حشرية (Insecticides)
  malathion: { icon: '🐜', name: 'ملاثيون', category: 'مبيدات حشرية', type: 'insecticide' },
  deltamethrin: { icon: '🐜', name: 'دلتامثرين', category: 'مبيدات حشرية', type: 'insecticide' },
  cypermethrin: { icon: '🐜', name: 'سايبرمثرين', category: 'مبيدات حشرية', type: 'insecticide' },
  lambda_cyhalothrin: { icon: '🐜', name: 'لامبدا سيهالوثرين', category: 'مبيدات حشرية', type: 'insecticide' },
  imidacloprid: { icon: '🐜', name: 'إميداكلوبريد', category: 'مبيدات حشرية', type: 'insecticide' },
  
  // مبيدات فطرية (Fungicides)
  chlorothalonil: { icon: '🍄', name: 'كلوروثالونيل', category: 'مبيدات فطرية', type: 'fungicide' },
  mancozeb: { icon: '🍄', name: 'مانكوزيب', category: 'مبيدات فطرية', type: 'fungicide' },
  azoxystrobin: { icon: '🍄', name: 'أزوكسيستروبين', category: 'مبيدات فطرية', type: 'fungicide' },
  thiophanate_methyl: { icon: '🍄', name: 'ثيوفانات ميثيل', category: 'مبيدات فطرية', type: 'fungicide' },
  
  // مبيدات أعشاب (Herbicides)
  glyphosate: { icon: '🌿', name: 'جلايفوسات', category: 'مبيدات أعشاب', type: 'herbicide' },
  paraquat: { icon: '🌿', name: 'باراكوات', category: 'مبيدات أعشاب', type: 'herbicide' },
  atrazine: { icon: '🌿', name: 'أترازين', category: 'مبيدات أعشاب', type: 'herbicide' },
  pendimethalin: { icon: '🌿', name: 'بنديميثالين', category: 'مبيدات أعشاب', type: 'herbicide' },
  
  // مبيدات قوارض (Rodenticides) - changed to 'other'
  bromadiolone: { icon: '🐁', name: 'بروماديولون', category: 'مبيدات قوارض', type: 'other' },
  difenacoum: { icon: '🐁', name: 'ديفيناكوم', category: 'مبيدات قوارض', type: 'other' },
  
  // مبيدات طبيعية (Natural/Organic) - changed to 'other'
  neem_oil: { icon: '🌳', name: 'زيت النيم', category: 'مبيدات طبيعية', type: 'other' },
  garlic_extract: { icon: '🌳', name: 'مستخلص الثوم', category: 'مبيدات طبيعية', type: 'other' },
  
  // مبيدات متنوعة (Miscellaneous) - changed to 'other'
  bacillus_thuringiensis: { icon: '🧪', name: 'باسيلس ثورينجينسيس', category: 'مبيدات متنوعة', type: 'other' },
  copper_sulfate: { icon: '🧪', name: 'كبريتات النحاس', category: 'مبيدات متنوعة', type: 'other' },
};

// Make sure we're only using the valid backend enum pesticide types
const pesticideTypes: { value: PesticideType; label: string }[] = [
  { value: 'insecticide', label: 'مبيد حشري' },
  { value: 'herbicide', label: 'مبيد أعشاب' },
  { value: 'fungicide', label: 'مبيد فطري' },
  { value: 'other', label: 'أخرى' }
];

const convertPesticideToFormData = (pesticide: Pesticide): FormData => ({
  name: pesticide.name,
  type: pesticide.type,
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
  lastApplicationDate: pesticide.lastApplicationDate || undefined,
});

// Interface for pesticide names
interface PesticideNameInfo {
  icon: string;
  name: string;
  category: string;
  type: PesticideType;
}

const AddPesticideScreen = ({ navigation, mode = 'add', initialData }: AddPesticideScreenProps) => {
  const theme = useTheme();
  const { addPesticide, updatePesticide, pesticides } = usePesticide();
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showLastAppDatePicker, setShowLastAppDatePicker] = useState(false);
  const [formData, setFormData] = useState<FormData>(() => 
    initialData ? convertPesticideToFormData(initialData) : initialFormData
  );
  const [error, setError] = useState<string | null>(null);
  const progress = useSharedValue(0);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Set the default pesticide category to 'all'
  const [selectedPesticideCategory, setSelectedPesticideCategory] = useState<string>('الكل');
  
  const nameInputRef = useRef<TextInput>(null);

  React.useEffect(() => {
    progress.value = withSpring(currentPage / (FORM_PAGES.length - 1));
  }, [currentPage]);

  // Get unique pesticide categories
  const pesticideCategories = React.useMemo(() => {
    const categories = Object.values(PESTICIDE_NAMES).map(p => p.category);
    return ['الكل', ...new Set(categories)];
  }, []);

  // Filter pesticides by selected category
  const filteredPesticides = React.useMemo(() => {
    if (selectedPesticideCategory === 'الكل') {
      return Object.entries(PESTICIDE_NAMES);
    }
    return Object.entries(PESTICIDE_NAMES).filter(
      ([_, pesticide]) => pesticide.category === selectedPesticideCategory
    );
  }, [selectedPesticideCategory]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const validateCurrentPage = () => {
    const currentFields = FORM_PAGES[currentPage].fields;
    const errors: Record<string, string> = {};
    const requiredFields: Record<string, string> = {
      name: 'اسم المبيد',
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
      console.log('Starting form submission with data:', formData);

      // Validate that the type is one of the allowed enum values
      const validTypes: PesticideType[] = ['insecticide', 'herbicide', 'fungicide', 'other'];
      if (!validTypes.includes(formData.type)) {
        Alert.alert('خطأ', 'نوع المبيد غير صالح');
        setIsSubmitting(false);
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
        lastApplicationDate: formData.lastApplicationDate || null,
        userId: user?.id.toString() || '1',
        createdAt: mode === 'add' ? now : (initialData?.createdAt || now),
        updatedAt: now,
      } as const;

      try {
        if (mode === 'edit' && initialData) {
          await updatePesticide(initialData.id, pesticideData);
          
          // Show success message and navigate back
          Alert.alert(
            'نجاح', 
            'تم تحديث المبيد بنجاح', 
            [{ 
              text: 'حسناً', 
              onPress: () => {
                // Navigate back immediately
                navigation.goBack();
              }
            }]
          );
        } else {
          await addPesticide(pesticideData);
          
          // Show success message and navigate back
          Alert.alert(
            'نجاح', 
            'تمت إضافة المبيد بنجاح', 
            [{ 
              text: 'حسناً', 
              onPress: () => {
                // Navigate back immediately
                navigation.goBack();
              }
            }]
          );
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

  // Enhance handlePesticideNameSelect to automatically set the type based on name
  const handlePesticideNameSelect = (name: string) => {
    // Find the selected pesticide to get its type
    const selectedPesticide = Object.values(PESTICIDE_NAMES).find(p => p.name === name);
    
    if (selectedPesticide) {
      // Update both name and type with proper type casting
      setFormData(prev => ({ 
        ...prev, 
        name: selectedPesticide.name,
        type: selectedPesticide.type as PesticideType, // Type is automatically set
      }));
    } else {
      // Just update the name if not found in our predefined list
      setFormData(prev => ({ ...prev, name }));
    }
  };

  // Helper functions to get type icon and label - update to accept any string and validate internally
  const getTypeIcon = (type: string): string => {
    switch(type) {
      case 'insecticide': return '🐜';
      case 'herbicide': return '🌿';
      case 'fungicide': return '🍄';
      default: return '🧪';
    }
  };

  const getTypeLabel = (type: string): string => {
    switch(type) {
      case 'insecticide': return 'مبيد حشري';
      case 'herbicide': return 'مبيد أعشاب';
      case 'fungicide': return 'مبيد فطري';
      default: return 'مبيد آخر';
    }
  };

  const getUnitLabel = (unitValue: StockUnit): string => {
    const unit = units.find(u => u.value === unitValue);
    return unit ? unit.label : '';
  };

  // Update renderField for enhanced UI
  const renderField = (field: keyof FormData) => {
    const unitInfo = UNIT_ICONS[formData.unit.toLowerCase() as keyof typeof UNIT_ICONS];

    switch (field) {
      case 'name':
        return (
          <Animated.View 
            entering={FadeInDown.delay(100)}
            style={styles.fieldContainer}
          >
            <Text style={[styles.fieldTitle, { color: theme.colors.neutral.textPrimary }]}>
              اسم المبيد
            </Text>

            {/* Category Pills */}
            <View style={styles.categorySelectorContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.categoryScrollContent}
              >
                {pesticideCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryPill,
                      { 
                        backgroundColor: selectedPesticideCategory === category 
                          ? theme.colors.primary.base 
                          : theme.colors.neutral.surface,
                        borderColor: selectedPesticideCategory === category
                          ? theme.colors.primary.base
                          : theme.colors.neutral.border,
                        shadowColor: theme.colors.neutral.textSecondary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: selectedPesticideCategory === category ? 3 : 1
                      }
                    ]}
                    onPress={() => setSelectedPesticideCategory(category)}
                  >
                    {category === 'مبيدات حشرية' && <Text style={styles.categoryIcon}>🐜</Text>}
                    {category === 'مبيدات فطرية' && <Text style={styles.categoryIcon}>🍄</Text>}
                    {category === 'مبيدات أعشاب' && <Text style={styles.categoryIcon}>🌿</Text>}
                    {category === 'مبيدات قوارض' && <Text style={styles.categoryIcon}>🐁</Text>}
                    {category === 'مبيدات طبيعية' && <Text style={styles.categoryIcon}>🌳</Text>}
                    {category === 'مبيدات متنوعة' && <Text style={styles.categoryIcon}>🧪</Text>}
                    {category === 'الكل' && <Text style={styles.categoryIcon}>📋</Text>}
                    <Text style={[
                      styles.categoryPillText,
                      { 
                        color: selectedPesticideCategory === category 
                          ? 'white' 
                          : theme.colors.neutral.textPrimary 
                      }
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Pesticide Selection */}
            <View style={styles.pickerWrapper}>
              <View style={[
                styles.enhancedPicker,
                { 
                backgroundColor: theme.colors.neutral.surface,
                  borderColor: validationErrors.name 
                    ? theme.colors.error 
                    : theme.colors.neutral.border,
                }
              ]}>
                <Picker
                  selectedValue={formData.name}
                  onValueChange={(itemValue) => {
                    handlePesticideNameSelect(itemValue);
                  }}
                  style={{ direction: 'rtl' }}
                >
                  <Picker.Item label="اختر اسم المبيد من القائمة" value="" />
                  {filteredPesticides.map(([id, pesticide]) => (
                    <Picker.Item 
                      key={id} 
                      label={`${pesticide.icon} ${pesticide.name}`} 
                      value={pesticide.name} 
                    />
                  ))}
                </Picker>
              </View>
              
              {validationErrors.name && (
                <Text style={styles.errorMessage}>
                  {validationErrors.name}
                </Text>
              )}
            </View>
          </Animated.View>
        );

      case 'quantity':
        return (
          <Animated.View 
            entering={FadeInDown.delay(200)}
            style={styles.fieldContainer}
          >
            <View style={styles.rowContainer}>
              <View style={{flex: 2}}>
                <Text style={styles.fieldTitle}>
                  الكمية
                </Text>
                <TextInput
                  style={[styles.enhancedInput, { 
                    borderColor: validationErrors.quantity ? theme.colors.error : theme.colors.neutral.border,
                  }]}
                  placeholder="أدخل الكمية"
                  placeholderTextColor={theme.colors.neutral.textSecondary}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: text }))}
                  keyboardType="numeric"
                />
                {validationErrors.quantity && (
                  <Text style={styles.errorMessage}>
                    {validationErrors.quantity}
                  </Text>
                )}
              </View>
              
              <View style={{flex: 1, marginRight: 10}}>
                <Text style={styles.fieldTitle}>
                  الوحدة
                </Text>
                <TouchableOpacity
                  style={[styles.unitDropdownButton, {
                    borderColor: theme.colors.primary.base,
                    backgroundColor: theme.colors.neutral.background,
                  }]}
                  onPress={() => setShowUnitPicker(true)}
                >
                  <Text style={[styles.unitButtonText, { color: theme.colors.neutral.textPrimary }]}>
                    {getUnitLabel(formData.unit)}
                  </Text>
                  <Feather name="chevron-down" size={16} color={theme.colors.primary.base} />
                </TouchableOpacity>
              </View>
            </View>

            <Modal
              visible={showUnitPicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowUnitPicker(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowUnitPicker(false)}
              >
                <View style={[styles.unitPickerModal, {
                  backgroundColor: theme.colors.neutral.surface,
                  borderColor: theme.colors.neutral.border,
                  shadowColor: theme.colors.neutral.textSecondary,
                }]}>
                  <Text style={[styles.modalTitle, { color: theme.colors.neutral.textPrimary }]}>
                    اختر الوحدة
                  </Text>
                  
                  <View style={styles.unitList}>
                    {units.map((unit) => (
                      <TouchableOpacity
                        key={unit.value}
                        style={[
                          styles.unitPickerItem,
                          formData.unit === unit.value && {
                            backgroundColor: theme.colors.primary.base + '20',
                            borderColor: theme.colors.primary.base,
                          },
                        ]}
                        onPress={() => {
                          handleUnitChange(unit.value as StockUnit);
                          setShowUnitPicker(false);
                        }}
                      >
                        <MaterialCommunityIcons 
                          name={unit.icon} 
                          size={20} 
                          color={formData.unit === unit.value ? theme.colors.primary.base : theme.colors.neutral.textSecondary} 
                        />
                        <Text style={[
                          styles.unitPickerItemText,
                          { color: formData.unit === unit.value ? theme.colors.primary.base : theme.colors.neutral.textPrimary }
                        ]}>
                          {unit.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.closeButton, { borderTopColor: theme.colors.neutral.border }]}
                    onPress={() => setShowUnitPicker(false)}
                  >
                    <Text style={[styles.closeButtonText, { color: theme.colors.primary.base }]}>
                      إغلاق
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          </Animated.View>
        );

      case 'minQuantityAlert':
        return (
              <Animated.View 
            entering={FadeInDown.delay(300)}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldTitle}>
              الحد الأدنى للتنبيه
            </Text>
            <View style={styles.inputWithIcon}>
              <Feather 
                name="alert-circle" 
                size={20} 
                color={theme.colors.primary.base} 
                style={styles.inputIcon} 
              />
                <TextInput
                style={[styles.enhancedInput, styles.inputWithIconPadding, { 
                  borderColor: validationErrors.minQuantityAlert ? theme.colors.error : theme.colors.neutral.border,
                }]}
                placeholder="متى يجب أن يتم تنبيهك عن انخفاض المخزون"
                  placeholderTextColor={theme.colors.neutral.textSecondary}
                value={formData.minQuantityAlert}
                onChangeText={(text) => setFormData(prev => ({ ...prev, minQuantityAlert: text }))}
                keyboardType="numeric"
              />
            </View>
            {validationErrors.minQuantityAlert && (
              <Text style={styles.errorMessage}>
                {validationErrors.minQuantityAlert}
              </Text>
            )}
              </Animated.View>
        );

      case 'price':
        return (
          <Animated.View 
            entering={FadeInDown.delay(400)}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldTitle}>
              السعر
            </Text>
            <View style={styles.inputWithIcon}>
              <Feather 
                name="dollar-sign" 
                size={20} 
                color={theme.colors.primary.base} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={[styles.enhancedInput, styles.inputWithIconPadding, { 
                  borderColor: validationErrors.price ? theme.colors.error : theme.colors.neutral.border,
                }]}
                placeholder="سعر المبيد"
                placeholderTextColor={theme.colors.neutral.textSecondary}
                value={formData.price}
                onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                keyboardType="numeric"
              />
            </View>
            {validationErrors.price && (
              <Text style={styles.errorMessage}>
                {validationErrors.price}
              </Text>
            )}
          </Animated.View>
        );

      case 'activeIngredients':
        return (
          <Animated.View 
            entering={FadeInDown.delay(100)}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldTitle}>
              المكونات النشطة
            </Text>
            <TextInput
              style={[styles.enhancedTextArea, { 
                borderColor: validationErrors.activeIngredients ? theme.colors.error : theme.colors.neutral.border,
              }]}
              placeholder="أدخل المكونات النشطة في المبيد"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.activeIngredients}
              onChangeText={(text) => setFormData(prev => ({ ...prev, activeIngredients: text }))}
              multiline={true}
              numberOfLines={3}
            />
          </Animated.View>
        );
        
      case 'targetPests':
        return (
          <Animated.View 
            entering={FadeInDown.delay(200)}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldTitle}>
              الآفات المستهدفة
            </Text>
            <TextInput
              style={[styles.enhancedTextArea, { 
                borderColor: validationErrors.targetPests ? theme.colors.error : theme.colors.neutral.border,
              }]}
              placeholder="أدخل الآفات التي يستهدفها هذا المبيد"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.targetPests}
              onChangeText={(text) => setFormData(prev => ({ ...prev, targetPests: text }))}
              multiline={true}
              numberOfLines={3}
            />
          </Animated.View>
        );
        
      case 'isNatural':
        return (
          <Animated.View 
            entering={FadeInDown.delay(100)}
            style={[styles.fieldContainer, styles.switchContainer]}
          >
            <View style={styles.switchRow}>
              <Text style={[styles.fieldTitle, {flex: 1}]}>
                هل هذا مبيد طبيعي؟
              </Text>
              <Switch
                value={formData.isNatural}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isNatural: value }))}
                trackColor={{ 
                  false: theme.colors.neutral.border, 
                  true: theme.colors.success + '80' 
                }}
                thumbColor={
                  formData.isNatural 
                    ? theme.colors.success
                    : theme.colors.neutral.surface
                }
              />
            </View>
            <Text style={styles.switchDescription}>
              المبيدات الطبيعية أكثر أماناً للبيئة والمحاصيل
            </Text>
          </Animated.View>
        );
        
      case 'expiryDate':
        return (
          <Animated.View 
            entering={FadeInDown.delay(200)}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldTitle}>
              تاريخ انتهاء الصلاحية
            </Text>
            <TouchableOpacity
              style={[styles.dateButton, { 
                borderColor: validationErrors.expiryDate ? theme.colors.error : theme.colors.neutral.border,
              }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Feather name="calendar" size={20} color={theme.colors.primary.base} style={styles.dateIcon} />
              <Text style={[
                styles.dateButtonText,
                { 
                  color: formData.expiryDate 
                    ? theme.colors.neutral.textPrimary
                    : theme.colors.neutral.textSecondary 
                }
              ]}>
                {formData.expiryDate
                  ? new Date(formData.expiryDate).toLocaleDateString('en-GB')
                  : 'حدد تاريخ انتهاء الصلاحية'}
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

      case 'applicationRate':
        return (
          <Animated.View 
            entering={FadeInDown.delay(300)}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldTitle}>
              معدل التطبيق
            </Text>
            <View style={styles.inputWithIcon}>
              <Feather 
                name="droplet" 
                size={20} 
                color={theme.colors.primary.base} 
                style={styles.inputIcon} 
              />
            <TextInput
                style={[styles.enhancedInput, styles.inputWithIconPadding, { 
                  borderColor: validationErrors.applicationRate ? theme.colors.error : theme.colors.neutral.border,
              }]}
                placeholder="أدخل معدل التطبيق المناسب"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.applicationRate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, applicationRate: text }))}
            />
            </View>
          </Animated.View>
        );

      case 'safetyInterval':
        return (
          <Animated.View 
            entering={FadeInDown.delay(400)}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldTitle}>
              فترة الأمان
            </Text>
            <View style={styles.inputWithIcon}>
              <Feather 
                name="shield" 
                size={20} 
                color={theme.colors.primary.base} 
                style={styles.inputIcon} 
              />
            <TextInput
                style={[styles.enhancedInput, styles.inputWithIconPadding, { 
                  borderColor: validationErrors.safetyInterval ? theme.colors.error : theme.colors.neutral.border,
              }]}
                placeholder="فترة الأمان قبل الحصاد (بالأيام)"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.safetyInterval}
              onChangeText={(text) => setFormData(prev => ({ ...prev, safetyInterval: text }))}
                keyboardType="numeric"
            />
            </View>
          </Animated.View>
        );

      case 'manufacturer':
        return (
          <Animated.View 
            entering={FadeInDown.delay(100)}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldTitle}>
              الشركة المصنعة
            </Text>
            <View style={styles.inputWithIcon}>
              <Feather 
                name="home" 
                size={20} 
                color={theme.colors.primary.base} 
                style={styles.inputIcon} 
              />
            <TextInput
                style={[styles.enhancedInput, styles.inputWithIconPadding, { 
                  borderColor: validationErrors.manufacturer ? theme.colors.error : theme.colors.neutral.border,
              }]}
                placeholder="اسم الشركة المصنعة"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.manufacturer}
              onChangeText={(text) => setFormData(prev => ({ ...prev, manufacturer: text }))}
            />
            </View>
          </Animated.View>
        );

      case 'registrationNumber':
        return (
          <Animated.View 
            entering={FadeInDown.delay(200)}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldTitle}>
              رقم التسجيل
            </Text>
            <View style={styles.inputWithIcon}>
              <Feather 
                name="hash" 
                size={20} 
                color={theme.colors.primary.base} 
                style={styles.inputIcon} 
              />
            <TextInput
                style={[styles.enhancedInput, styles.inputWithIconPadding, { 
                  borderColor: validationErrors.registrationNumber ? theme.colors.error : theme.colors.neutral.border,
              }]}
                placeholder="رقم تسجيل المبيد"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.registrationNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, registrationNumber: text }))}
            />
            </View>
          </Animated.View>
        );

      case 'storageConditions':
        return (
          <Animated.View 
            entering={FadeInDown.delay(300)}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldTitle}>
              ظروف التخزين
            </Text>
            <TextInput
              style={[styles.enhancedTextArea, { 
                borderColor: validationErrors.storageConditions ? theme.colors.error : theme.colors.neutral.border,
              }]}
              placeholder="أدخل شروط تخزين المبيد (درجة الحرارة، الرطوبة، الخ)"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.storageConditions}
              onChangeText={(text) => setFormData(prev => ({ ...prev, storageConditions: text }))}
              multiline={true}
              numberOfLines={3}
            />
          </Animated.View>
        );

      case 'safetyPrecautions':
        return (
          <Animated.View 
            entering={FadeInDown.delay(400)}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldTitle}>
              احتياطات السلامة
            </Text>
            <TextInput
              style={[styles.enhancedTextArea, { 
                borderColor: validationErrors.safetyPrecautions ? theme.colors.error : theme.colors.neutral.border,
              }]}
              placeholder="أدخل احتياطات السلامة عند استخدام المبيد"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.safetyPrecautions}
              onChangeText={(text) => setFormData(prev => ({ ...prev, safetyPrecautions: text }))}
              multiline={true}
              numberOfLines={3}
            />
          </Animated.View>
        );

      case 'emergencyProcedures':
        return (
          <Animated.View 
            entering={FadeInDown.delay(500)}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldTitle}>
              إجراءات الطوارئ
            </Text>
            <TextInput
              style={[styles.enhancedTextArea, { 
                borderColor: validationErrors.emergencyProcedures ? theme.colors.error : theme.colors.neutral.border,
              }]}
              placeholder="أدخل إجراءات الطوارئ في حالة التعرض للمبيد"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.emergencyProcedures}
              onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyProcedures: text }))}
              multiline={true}
              numberOfLines={3}
            />
          </Animated.View>
        );

      case 'supplier':
        return (
          <Animated.View 
            entering={FadeInDown.delay(100)}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldTitle}>
              المورد
                  </Text>
            <View style={styles.inputWithIcon}>
              <Feather 
                name="truck" 
                size={20} 
                color={theme.colors.primary.base} 
                style={styles.inputIcon} 
              />
            <TextInput
                style={[styles.enhancedInput, styles.inputWithIconPadding, { 
                  borderColor: validationErrors.supplier ? theme.colors.error : theme.colors.neutral.border,
                }]}
                placeholder="اسم مورد المبيد"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              value={formData.supplier}
              onChangeText={(text) => setFormData(prev => ({ ...prev, supplier: text }))}
            />
            </View>
          </Animated.View>
        );

      case 'lastApplicationDate':
        return (
          <Animated.View 
            entering={FadeInDown.delay(200)}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldTitle}>
              تاريخ آخر استخدام
            </Text>
            <TouchableOpacity
              style={[styles.dateButton, { 
                borderColor: validationErrors.lastApplicationDate ? theme.colors.error : theme.colors.neutral.border,
              }]}
              onPress={() => setShowLastAppDatePicker(true)}
            >
              <Feather name="calendar" size={20} color={theme.colors.primary.base} style={styles.dateIcon} />
              <Text style={[
                styles.dateButtonText,
                { 
                  color: formData.lastApplicationDate 
                    ? theme.colors.neutral.textPrimary
                    : theme.colors.neutral.textSecondary 
                }
              ]}>
                {formData.lastApplicationDate
                  ? new Date(formData.lastApplicationDate).toLocaleDateString('en-GB')
                  : 'حدد تاريخ آخر استخدام للمبيد'}
              </Text>
            </TouchableOpacity>
            {showLastAppDatePicker && (
              <DateTimePicker
                value={formData.lastApplicationDate ? new Date(formData.lastApplicationDate) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowLastAppDatePicker(false);
                  if (selectedDate) {
                    setFormData(prev => ({ ...prev, lastApplicationDate: selectedDate.toISOString() }));
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

  // Remove text labels from step indicator and fix button positioning
  const renderStepIndicator = () => {
  return (
      <View style={styles.stepIndicatorContainer}>
        {FORM_PAGES.map((page, index) => (
          <View key={index} style={styles.stepItem}>
            {/* Circle for the step */}
        <TouchableOpacity
              onPress={() => {
                // Allow jumping to previous steps only
                if (index <= currentPage) {
                  setCurrentPage(index);
                }
              }}
              style={[
                styles.stepCircle,
                {
                  backgroundColor: index < currentPage 
                    ? theme.colors.primary.base 
                    : index === currentPage 
                      ? theme.colors.primary.base + '20'
                      : theme.colors.neutral.surface,
                  borderColor: index <= currentPage 
                    ? theme.colors.primary.base 
                    : theme.colors.neutral.border,
                }
              ]}
            >
              {index < currentPage ? (
                <Feather name="check" size={14} color="#FFF" />
              ) : (
                <Text style={[
                  styles.stepNumber, 
                  { 
                    color: index === currentPage 
                      ? theme.colors.primary.base 
                      : theme.colors.neutral.textSecondary 
                  }
                ]}>
                  {index + 1}
                </Text>
              )}
        </TouchableOpacity>
            
            {/* Line between steps - Right to left for Arabic */}
            {index < FORM_PAGES.length - 1 && (
              <View 
            style={[
                  styles.stepLine, 
                  { 
                    backgroundColor: index < currentPage 
                      ? theme.colors.primary.base 
                      : theme.colors.neutral.border 
                  }
                ]} 
              />
              )}
            </View>
          ))}
        </View>
    );
  };

  // Fix footer buttons - Next on right, Previous on left for Arabic UI
  const FooterButtons = () => (
      <View style={styles.footer}>
        {currentPage > 0 && (
          <TouchableOpacity
          style={[styles.button, styles.previousButton]}
            onPress={handlePrevious}
            disabled={isSubmitting}
          >
          <Text style={[styles.buttonText, { color: theme.colors.primary.base }]}>
              السابق
            </Text>
          <Feather name="arrow-left" size={20} color={theme.colors.primary.base} style={{marginRight: 8}} />
          </TouchableOpacity>
        )}
      
        <TouchableOpacity
          style={[
            styles.button, 
            styles.nextButton, 
            isSubmitting && { opacity: 0.7 }
          ]}
          onPress={currentPage === FORM_PAGES.length - 1 ? handleSubmit : handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            {currentPage < FORM_PAGES.length - 1 && (
              <Feather name="arrow-right" size={20} color="white" style={{marginLeft: 8}} />
            )}
            <Text style={[styles.buttonText, {color: 'white'}]}>
              {currentPage === FORM_PAGES.length - 1 ? 'إضافة' : 'التالي'}
            </Text>
          </>
          )}
        </TouchableOpacity>
      </View>
  );

  // Update the main UI layout
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}
    >
      {renderStepIndicator()}

      {/* Form description */}
      <View style={styles.formHeaderContainer}>
        <Text style={styles.formTitle}>
          {FORM_PAGES[currentPage].title}
        </Text>
        <Text style={styles.formSubtitle}>
          {FORM_PAGES[currentPage].subtitle}
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          {FORM_PAGES[currentPage].fields.map((field) => (
            <View key={field}>
              {renderField(field as keyof FormData)}
            </View>
          ))}
        </View>
      </ScrollView>

      <FooterButtons />
    </KeyboardAvoidingView>
  );
};

// Update styles for RTL layout
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
      paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    },
    formHeaderContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.neutral.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral.border,
    },
    formTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.neutral.textPrimary,
      textAlign: 'right',
      marginBottom: 4,
    },
    formSubtitle: {
      fontSize: 14,
      color: theme.colors.neutral.textSecondary,
      textAlign: 'right',
    },
    stepIndicatorContainer: {
      flexDirection: 'row-reverse', // RTL for Arabic
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
      backgroundColor: theme.colors.neutral.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral.border,
    },
    stepItem: {
      flexDirection: 'row-reverse', // RTL for Arabic
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
      ...theme.shadows.small,
    },
    stepLine: {
      height: 2,
      flex: 1,
      maxWidth: '80%',
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
    },
    form: {
      padding: theme.spacing.md,
    },
    fieldContainer: {
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.neutral.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.md,
      ...theme.shadows.small,
    },
    fieldTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: theme.spacing.sm,
      color: theme.colors.neutral.textPrimary,
      textAlign: 'right',
    },
    enhancedInput: {
      height: 50,
      borderWidth: 1,
      borderColor: theme.colors.neutral.border,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.md,
      fontSize: 16,
      backgroundColor: theme.colors.neutral.background,
      color: theme.colors.neutral.textPrimary,
      textAlign: 'right',
    },
    enhancedTextArea: {
      borderWidth: 1,
      borderColor: theme.colors.neutral.border,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: 16,
      minHeight: 100,
      textAlignVertical: 'top',
      backgroundColor: theme.colors.neutral.background,
      color: theme.colors.neutral.textPrimary,
      textAlign: 'right',
    },
    pickerWrapper: {
      marginBottom: theme.spacing.sm,
    },
    enhancedPicker: {
      borderWidth: 1,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.neutral.background,
      marginBottom: 4,
    },
    errorMessage: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: 4,
      marginRight: 4,
      textAlign: 'right',
    },
    categorySelectorContainer: {
      marginBottom: theme.spacing.md,
    },
    categoryScrollContent: {
      paddingVertical: theme.spacing.xs,
      flexDirection: 'row-reverse', // RTL for Arabic
    },
    categoryPill: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: 20,
      marginHorizontal: theme.spacing.xs,
      minWidth: 100,
      alignItems: 'center',
      flexDirection: 'row-reverse', // RTL for Arabic
    },
    categoryPillText: {
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 6, // Changed from marginRight for RTL
    },
    categoryIcon: {
      fontSize: 16,
    },
    rowContainer: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    unitDropdownButton: {
      height: 44,
      borderWidth: 1,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.neutral.background,
      shadowColor: theme.colors.neutral.textSecondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    unitPickerModal: {
      width: '90%',
      maxWidth: 360,
      borderRadius: theme.borderRadius.large,
      borderWidth: 1,
      overflow: 'hidden',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      textAlign: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral.border,
    },
    unitList: {
      maxHeight: 300,
      paddingVertical: theme.spacing.sm,
    },
    unitPickerItem: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral.border,
    },
    unitPickerItemText: {
      fontSize: 16,
      marginRight: 10,
      textAlign: 'right',
    },
    closeButton: {
      padding: theme.spacing.md,
      alignItems: 'center',
      borderTopWidth: 1,
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    inputWithIcon: {
      position: 'relative',
      flexDirection: 'row-reverse',
      alignItems: 'center',
    },
    inputIcon: {
      position: 'absolute',
      right: 12,
      zIndex: 1,
    },
    inputWithIconPadding: {
      paddingRight: 40,
    },
    dateButton: {
      height: 50,
      borderWidth: 1,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.md,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: theme.colors.neutral.background,
    },
    dateIcon: {
      marginLeft: 10,
    },
    dateButtonText: {
      fontSize: 16,
      flex: 1,
      textAlign: 'right',
    },
    switchContainer: {
      backgroundColor: theme.colors.neutral.background,
    },
    switchRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    switchDescription: {
      fontSize: 12,
      color: theme.colors.neutral.textSecondary,
      marginTop: 4,
      textAlign: 'right',
    },
    footer: {
      flexDirection: 'row-reverse', // RTL for Arabic - buttons reversed
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.neutral.border,
      backgroundColor: theme.colors.neutral.surface,
    },
    button: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      marginHorizontal: 6,
      ...theme.shadows.small,
    },
    previousButton: {
      backgroundColor: theme.colors.neutral.background,
      borderWidth: 1,
      borderColor: theme.colors.primary.base,
    },
    nextButton: {
      backgroundColor: theme.colors.primary.base,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  };
});

export default AddPesticideScreen; 