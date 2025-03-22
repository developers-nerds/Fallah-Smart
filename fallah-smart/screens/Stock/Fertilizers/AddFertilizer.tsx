import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  StyleSheet,
  I18nManager,
  Dimensions,
  Modal,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useFertilizer } from '../../../context/FertilizerContext';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { TextInput } from '../../../components/TextInput';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Formik, FormikErrors, FormikTouched } from 'formik';
import * as Yup from 'yup';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { CustomButton } from '../../../components/CustomButton';
import axios from 'axios';
import { storage } from '../../../utils/storage';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

interface FormPage {
  title: string;
  subtitle: string;
  icon: string;
  fields: Array<keyof FormData>;
}

type FertilizerType = 'organic' | 'chemical' | 'mixed';
type FertilizerKey = keyof typeof FERTILIZER_TYPES;

interface FormData {
  name: string;
  type: FertilizerKey;
  quantity: string;
  unit: string;
  price: string;
  minQuantityAlert: string;
  expiryDate: string;
  npkRatio: string;
  applicationRate: string;
  supplier: string;
  safetyGuidelines: string;
}

type DateField = 'expiryDate';

interface StockFertilizer {
  id: number;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  price: number;
  minQuantityAlert: number;
  expiryDate: string;
  npkRatio?: string;
  applicationRate?: number;
  manufacturer?: string;
  batchNumber?: string;
  purchaseDate?: string;
  location?: string;
  supplier?: string;
  safetyGuidelines?: string;
  notes?: string;
}

type AddFertilizerScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddFertilizer'>;
  route: RouteProp<{ AddFertilizer: { fertilizerId?: number } }, 'AddFertilizer'>;
};

const FERTILIZER_CATEGORIES: Record<FertilizerType, { icon: string; label: string }> = {
  'chemical': { icon: '⚗️', label: 'أسمدة كيميائية' },
  'organic': { icon: '🌱', label: 'أسمدة عضوية' },
  'mixed': { icon: '🔬', label: 'أسمدة مختلطة' }
};

interface FertilizerTypeInfo {
  icon: string;
  name: string;
  category: FertilizerType;
  type: FertilizerType;
}

const FERTILIZER_TYPES: Record<string, FertilizerTypeInfo> = {
  // Chemical Fertilizers (أسمدة كيميائية)
  npk: { icon: '⚗️', name: 'NPK', category: 'chemical', type: 'chemical' },
  urea: { icon: '🧪', name: 'يوريا', category: 'chemical', type: 'chemical' },
  phosphate: { icon: '🔬', name: 'فوسفات', category: 'chemical', type: 'chemical' },
  potassium: { icon: '🧫', name: 'بوتاسيوم', category: 'chemical', type: 'chemical' },

  // Organic Fertilizers (أسمدة عضوية)
  compost: { icon: '🍂', name: 'سماد عضوي', category: 'organic', type: 'organic' },
  manure: { icon: '🌱', name: 'روث', category: 'organic', type: 'organic' },
  vermicompost: { icon: '🪱', name: 'سماد الديدان', category: 'organic', type: 'organic' },

  // Mixed Fertilizers (أسمدة مختلطة)
  rhizobium: { icon: '🦠', name: 'رايزوبيوم', category: 'mixed', type: 'mixed' },
  azotobacter: { icon: '🔋', name: 'أزوتوباكتر', category: 'mixed', type: 'mixed' },
  mycorrhiza: { icon: '🍄', name: 'فطريات جذرية', category: 'mixed', type: 'mixed' },
};

const UNITS = [
  { value: 'kg', label: 'كيلوغرام', icon: '⚖️' },
  { value: 'g', label: 'غرام', icon: '⚖️' },
  { value: 'l', label: 'لتر', icon: '💧' },
  { value: 'ml', label: 'مليلتر', icon: '💧' },
  { value: 'units', label: 'وحدة', icon: '📦' }
];

const validationSchema = Yup.object().shape({
  name: Yup.string().required('الاسم مطلوب'),
  type: Yup.string()
    .required('النوع مطلوب'),
  quantity: Yup.number().min(0, 'الكمية يجب أن تكون أكبر من 0').required('الكمية مطلوبة'),
  unit: Yup.string().required('الوحدة مطلوبة'),
  price: Yup.number().min(0, 'السعر يجب أن يكون أكبر من 0').required('السعر مطلوب'),
  minQuantityAlert: Yup.number().min(0, 'الحد الأدنى للتنبيه يجب أن يكون أكبر من 0').required('الحد الأدنى للتنبيه مطلوب'),
  expiryDate: Yup.string().nullable(),
  npkRatio: Yup.string().nullable(),
  applicationRate: Yup.string().nullable(),
  supplier: Yup.string().nullable(),
  safetyGuidelines: Yup.string().nullable(),
});

export const AddFertilizerScreen = ({ navigation, route }: AddFertilizerScreenProps) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { fertilizers, addFertilizer, updateFertilizer, loading } = useFertilizer();
  const [currentPage, setCurrentPage] = useState(0);
  const [datePickerField, setDatePickerField] = useState<DateField | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<FormData>({
    name: '',
    type: 'npk',
    quantity: '0',
    unit: 'kg',
    price: '0',
    minQuantityAlert: '50',
    expiryDate: new Date().toISOString(),
    npkRatio: '',
    applicationRate: '',
    supplier: '',
    safetyGuidelines: '',
  });

  const { fertilizerId } = route.params || {};

  const formPages: FormPage[] = [
    {
      title: 'المعلومات الأساسية',
      subtitle: 'أدخل المعلومات الأساسية للسماد',
      icon: '⚗️',
      fields: ['type', 'name', 'quantity', 'unit', 'price', 'minQuantityAlert'],
    },
    {
      title: 'معلومات إضافية',
      subtitle: 'أدخل معلومات إضافية عن السماد',
      icon: '📦',
      fields: ['npkRatio', 'applicationRate', 'supplier', 'expiryDate'],
    },
    {
      title: 'تعليمات السلامة',
      subtitle: 'أدخل تعليمات السلامة',
      icon: '⚠️',
      fields: ['safetyGuidelines'],
    },
  ];

  useEffect(() => {
    if (fertilizerId) {
      const existingFertilizer = fertilizers.find(f => f.id === fertilizerId);
      if (existingFertilizer) {
        setInitialFormValues({
          name: existingFertilizer.name || '',
          type: (existingFertilizer.type as string in FERTILIZER_TYPES) 
            ? (existingFertilizer.type as FertilizerKey)
            : 'npk',
          quantity: existingFertilizer.quantity?.toString() || '0',
          unit: existingFertilizer.unit || 'kg',
          price: existingFertilizer.price?.toString() || '0',
          minQuantityAlert: existingFertilizer.minQuantityAlert?.toString() || '50',
          expiryDate: existingFertilizer.expiryDate || new Date().toISOString(),
          npkRatio: existingFertilizer.npkRatio || '',
          applicationRate: existingFertilizer.applicationRate?.toString() || '',
          supplier: existingFertilizer.supplier || '',
          safetyGuidelines: existingFertilizer.safetyGuidelines || '',
        });
      }
    }
  }, [fertilizerId, fertilizers]);

  const validateCurrentPage = (values: FormData) => {
    let isValid = true;
    const currentFields = formPages[currentPage].fields;
    
    const requiredFieldsByPage: { [key: number]: Array<keyof FormData> } = {
      0: ['type', 'quantity', 'unit'],
      1: [],
      2: [],
    };
    
    const requiredFields = requiredFieldsByPage[currentPage] || [];
    
    for (const field of requiredFields) {
      if (!values[field]) {
        isValid = false;
        break;
      }
    }
    
    return isValid;
  };

  const handleSubmit = async (values: FormData) => {
    try {
      console.log('Form values:', values);
      console.log('Current user:', user);
      
      const fertilizerData = {
        name: values.name.trim(),
        type: values.type,
        quantity: parseFloat(values.quantity),
        unit: values.unit,
        price: parseFloat(values.price),
        minQuantityAlert: parseFloat(values.minQuantityAlert),
        expiryDate: values.expiryDate || null,
        npkRatio: values.npkRatio?.trim() || null,
        applicationRate: values.applicationRate ? parseFloat(values.applicationRate) : null,
        supplier: values.supplier?.trim() || null,
        safetyGuidelines: values.safetyGuidelines?.trim() || null,
        userId: user?.id ? parseInt(String(user.id), 10) : 1,
      };

      console.log('Fertilizer data to be sent:', fertilizerData);

      try {
        const tokens = await storage.getTokens();
        console.log('Auth tokens:', tokens ? 'Available' : 'Not Available');
        
        const API_URL = process.env.EXPO_PUBLIC_API_URL;
        if (!API_URL) {
          throw new Error('API_URL is not defined');
        }
        
        const endpoint = `${API_URL}/stock/fertilizer`;
        console.log('Full API URL:', endpoint);

        const response = await axios.post(endpoint, fertilizerData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
          },
          timeout: 10000
        });
        
        console.log('API call successful:', response.data);
        Alert.alert('نجاح', 'تمت إضافة السماد بنجاح');
        navigation.goBack();
      } catch (error: any) {
        console.error('API call failed:', error);
        if (error.response) {
          console.error('API response status:', error.response.status);
          console.error('API response data:', error.response.data);
        }
        Alert.alert(
          'خطأ',
          `فشل في حفظ السماد: ${error?.response?.data?.message || error?.message || 'خطأ في الاتصال'}`
        );
        throw error;
      }
    } catch (error) {
      console.error('Error submitting fertilizer:', error);
      Alert.alert('خطأ', 'فشل في حفظ السماد');
    }
  };

  const nextPage = () => {
    if (currentPage < formPages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && datePickerField) {
      return {
        [datePickerField]: selectedDate.toISOString(),
      };
    }
    return {};
  };

  const showDatePickerModal = (field: DateField) => {
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  const handleCategorySelect = (category: string, setFieldValue: any) => {
    setSelectedCategory(category);
    
    const fertilizerTypesOfCategory = Object.entries(FERTILIZER_TYPES)
      .filter(([_, fertilizer]) => fertilizer.category === category);
    
    if (fertilizerTypesOfCategory.length > 0) {
      setFieldValue('type', fertilizerTypesOfCategory[0][0]);
    }
  };

  const renderField = (
    field: keyof FormData,
    values: FormData,
    errors: FormikErrors<FormData>,
    touched: FormikTouched<FormData>,
    handleChange: {
      (e: React.ChangeEvent<any>): void;
      <T = string | React.ChangeEvent<any>>(field: T): T extends React.ChangeEvent<any>
        ? void
        : (e: string | React.ChangeEvent<any>) => void;
    },
    handleBlur: {
      (e: React.FocusEvent<any>): void;
      <T = any>(fieldOrEvent: T): T extends string ? (e: any) => void : void;
    },
    setFieldValue: (field: string, value: any) => void
  ) => {
    switch (field) {
      case 'type':
        const selectedFertilizer = FERTILIZER_TYPES[values.type];
        return (
          <Animated.View 
            style={[styles.fieldContainer, { 
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              shadowColor: theme.colors.neutral.textSecondary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }]}
          >
            <Text style={[styles.fieldTitle, { color: theme.colors.neutral.textPrimary }]}>
              نوع السماد <Text style={{color: 'red'}}>*</Text>
            </Text>
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
              {selectedFertilizer ? (
                <View style={styles.selectedType}>
                  <Text style={styles.selectedTypeIcon}>
                    {selectedFertilizer.icon}
                  </Text>
                  <View style={styles.selectedTypeInfo}>
                    <Text style={[styles.selectedTypeText, { color: theme.colors.neutral.textPrimary }]}>
                      {selectedFertilizer.name}
                    </Text>
                    <Text style={[styles.selectedTypeCategory, { color: theme.colors.neutral.textSecondary }]}>
                      {FERTILIZER_CATEGORIES[selectedFertilizer.category].label}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.typePlaceholder, { color: theme.colors.neutral.textSecondary }]}>
                  اختر نوع السماد
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        );
      
      case 'name':
        const fertilizerType = FERTILIZER_TYPES[values.type as keyof typeof FERTILIZER_TYPES];
        return (
          <Animated.View
            key={field}
            style={[styles.fieldContainer, { 
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 12,
              shadowColor: theme.colors.neutral.textSecondary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }]}
          >
            <Text style={[styles.fieldTitle, { 
              color: theme.colors.neutral.textPrimary,
              marginBottom: 8
            }]}>
              اسم السماد <Text style={{color: 'red'}}>*</Text>
            </Text>
            <TextInput
              value={values.name}
              onChangeText={(text: string) => handleChange(field)(text)}
              onBlur={() => handleBlur(field)}
              error={touched.name && errors.name ? errors.name : undefined}
              placeholder={fertilizerType?.name || 'أدخل اسم السماد'}
              style={{ backgroundColor: theme.colors.neutral.surface, borderWidth: 1, borderColor: theme.colors.neutral.border, borderRadius: 8, textAlign: 'right' }}
            />
          </Animated.View>
        );
      
      case 'expiryDate':
        return (
          <Animated.View style={[styles.fieldContainer, { 
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            shadowColor: theme.colors.neutral.textSecondary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }]}>
            <Text style={[styles.fieldTitle, { color: theme.colors.neutral.textPrimary }]}>
              تاريخ الصلاحية
            </Text>
            <TouchableOpacity
              style={[
                styles.dateButton, 
                { 
                  borderColor: field === 'expiryDate' && touched[field] && errors[field] ? theme.colors.error : theme.colors.neutral.border,
                  height: 50,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  backgroundColor: theme.colors.neutral.surface,
                }
              ]}
              onPress={() => showDatePickerModal('expiryDate')}
            >
              <Feather name="calendar" size={20} color={theme.colors.primary.base} style={{ marginLeft: 10 }} />
              <Text style={[
                { 
                  fontSize: 16,
                  flex: 1,
                  textAlign: 'right',
                  color: values[field] ? theme.colors.neutral.textPrimary : theme.colors.neutral.textSecondary 
                }
              ]}>
                {values[field]
                  ? new Date(values[field]).toLocaleDateString('en-GB')
                  : field === 'expiryDate' ? 'حدد تاريخ انتهاء الصلاحية' : 'حدد التاريخ'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      
      case 'safetyGuidelines':
        return (
          <Animated.View style={[styles.fieldContainer, { 
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            shadowColor: theme.colors.neutral.textSecondary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }]}>
            <Text style={[styles.fieldTitle, { color: theme.colors.neutral.textPrimary }]}>
              تعليمات السلامة
            </Text>
            <TextInput
              value={values[field]}
              onChangeText={(text: string) => handleChange(field)(text)}
              onBlur={() => handleBlur(field)}
              multiline
              numberOfLines={4}
              style={[{ 
                borderWidth: 1, 
                borderRadius: 8, 
                padding: 12, 
                textAlignVertical: 'top', 
                borderColor: theme.colors.neutral.border,
                textAlign: 'right', 
                backgroundColor: theme.colors.neutral.surface
              }]}
              placeholder="أضف تعليمات السلامة..."
            />
          </Animated.View>
        );
      
      case 'unit':
        return (
          <Animated.View style={[styles.fieldContainer, { 
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            shadowColor: theme.colors.neutral.textSecondary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }]}>
            <Text style={[styles.fieldTitle, { color: theme.colors.neutral.textPrimary }]}>
              الوحدة <Text style={{color: 'red'}}>*</Text>
            </Text>
            <View style={styles.unitSelectorContainer}>
              {UNITS.map((unit) => (
                <TouchableOpacity
                  key={unit.value}
                  style={[
                    styles.unitOption,
                    { 
                      backgroundColor: values.unit === unit.value 
                        ? theme.colors.primary.base + '20' 
                        : theme.colors.neutral.surface,
                      borderColor: values.unit === unit.value 
                        ? theme.colors.primary.base 
                        : theme.colors.neutral.border,
                    }
                  ]}
                  onPress={() => setFieldValue('unit', unit.value)}
                >
                  <View style={[
                    styles.unitIconContainer, 
                    { 
                      backgroundColor: values.unit === unit.value 
                        ? theme.colors.primary.base 
                        : theme.colors.neutral.background
                    }
                  ]}>
                    <Text style={styles.unitIcon}>{unit.icon}</Text>
                  </View>
                  <Text style={[
                    styles.unitLabel, 
                    { 
                      color: values.unit === unit.value 
                        ? theme.colors.primary.base 
                        : theme.colors.neutral.textPrimary,
                      fontWeight: values.unit === unit.value ? '600' : 'normal'
                    }
                  ]}>
                    {unit.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );
      
      default:
        return (
          <Animated.View style={[styles.fieldContainer, { 
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            shadowColor: theme.colors.neutral.textSecondary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }]}>
            <Text style={[styles.fieldTitle, { color: theme.colors.neutral.textPrimary }]}>
              {getFieldLabel(field)}
              {['quantity', 'unit'].includes(field) && <Text style={{color: 'red'}}> *</Text>}
            </Text>
            <TextInput
              value={values[field]}
              onChangeText={(text: string) => handleChange(field)(text)}
              onBlur={() => handleBlur(field)}
              keyboardType={getFieldKeyboardType(field)}
              style={[{ 
                borderWidth: 1, 
                borderRadius: 8, 
                height: 48, 
                paddingHorizontal: 16, 
                borderColor: theme.colors.neutral.border,
                textAlign: 'right',
                backgroundColor: theme.colors.neutral.surface
              }]}
              placeholder={getFieldPlaceholder(field)}
            />
            {touched[field] && errors[field] && (
              <Text style={[{ fontSize: 12, color: theme.colors.error, textAlign: 'right', marginTop: 4 }]}>
                {errors[field]}
              </Text>
            )}
          </Animated.View>
        );
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: { [key: string]: string } = {
      name: 'اسم السماد',
      quantity: 'الكمية',
      unit: 'الوحدة',
      price: 'السعر',
      minQuantityAlert: 'حد التنبيه',
      npkRatio: 'نسبة NPK',
      applicationRate: 'معدل الاستخدام',
      supplier: 'المورد',
    };
    return labels[field] || field;
  };

  const getFieldKeyboardType = (field: string): 'default' | 'numeric' => {
    return ['quantity', 'price', 'minQuantityAlert', 'applicationRate'].includes(field) 
      ? 'numeric' 
      : 'default';
  };

  const getFieldPlaceholder = (field: string): string => {
    const placeholders: { [key: string]: string } = {
      name: 'أدخل اسم السماد...',
      quantity: 'أدخل الكمية...',
      price: 'أدخل السعر...',
      minQuantityAlert: 'أدخل حد التنبيه...',
      npkRatio: 'مثال: 20-20-20',
      applicationRate: 'أدخل معدل الاستخدام...',
      supplier: 'أدخل اسم المورد...',
    };
    return placeholders[field] || '';
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.stepIndicatorContainer}>
        {formPages.map((page, index) => (
          <View key={index} style={styles.stepItem}>
            <TouchableOpacity
              onPress={() => {
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
            
            {index < formPages.length - 1 && (
              <View 
                style={[
                  styles.stepLine, 
                  { 
                    backgroundColor: index < currentPage 
                      ? theme.colors.primary.base
                      : theme.colors.neutral.border,
                    marginHorizontal: 4
                  }
                ]} 
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderPageHeader = () => (
    <View style={styles.formHeaderContainer}>
      <Text style={styles.formTitle}>
        {formPages[currentPage].title}
      </Text>
      <Text style={styles.formSubtitle}>
        {formPages[currentPage].subtitle}
      </Text>
    </View>
  );

  const renderFooterButtons = ({ handleSubmit, isValid, values }: any) => (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[
          styles.button, 
          { 
            backgroundColor: theme.colors.primary.base,
            flex: 1,
            height: 48,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            marginHorizontal: 6,
          }, 
          !validateCurrentPage(values) && { opacity: 0.7 }
        ]}
        onPress={currentPage === formPages.length - 1 ? handleSubmit : nextPage}
        disabled={!validateCurrentPage(values)}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Text style={[styles.buttonText, {color: 'white'}]}>
              {currentPage === formPages.length - 1 ? 'إضافة' : 'التالي →'}
            </Text>
          </>
        )}
      </TouchableOpacity>
      
      {currentPage > 0 && (
        <TouchableOpacity
          style={[
            styles.button, 
            {
              backgroundColor: theme.colors.neutral.surface,
              borderWidth: 1,
              borderColor: theme.colors.primary.base,
              flex: 1,
              height: 48,
              borderRadius: 24,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              marginHorizontal: 6,
            }
          ]}
          onPress={prevPage}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: theme.colors.primary.base }]}>
            {' ←السابق'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { 
        justifyContent: 'center' as const,
        alignItems: 'center' as const
      }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
      <StatusBar
        backgroundColor={theme.colors.neutral.surface}
        barStyle="dark-content"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Formik
          initialValues={initialFormValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {(formikProps) => (
            <>
              {renderProgressBar()}
              {renderPageHeader()}
              
              <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.form}>
                  {formPages[currentPage].fields.map(field => (
                    <View key={field}>
                      {renderField(
                        field as keyof FormData, 
                        formikProps.values,
                        formikProps.errors,
                        formikProps.touched,
                        formikProps.handleChange,
                        formikProps.handleBlur,
                        formikProps.setFieldValue
                      )}
                    </View>
                  ))}
                </View>

                {showDatePicker && datePickerField && (
                  <DateTimePicker
                    value={new Date(formikProps.values[datePickerField])}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      const dateChanges = handleDateChange(event, selectedDate);
                      Object.entries(dateChanges).forEach(([field, value]) => {
                        formikProps.setFieldValue(field, value);
                      });
                    }}
                  />
                )}
              </ScrollView>

              {renderFooterButtons(formikProps)}

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
                          اختر نوع السماد
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: theme.colors.neutral.textSecondary }]}>
                          اختر من القائمة المتاحة
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
                          Object.entries(FERTILIZER_TYPES).reduce((acc, [id, fertilizer]) => {
                            if (!acc[fertilizer.category]) {
                              acc[fertilizer.category] = [];
                            }
                            acc[fertilizer.category].push({ id, ...fertilizer });
                            return acc;
                          }, {} as Record<FertilizerType, Array<{ id: string } & FertilizerTypeInfo>>)
                        ).map(([category, fertilizers]) => (
                          <View key={category} style={styles.categoryGroup}>
                            <Text style={[styles.categoryTitle, { color: theme.colors.neutral.textPrimary }]}>
                              {FERTILIZER_CATEGORIES[category as FertilizerType].label}
                            </Text>
                            <View style={styles.fertilizerGrid}>
                              {fertilizers.map(({ id, icon, name }) => (
                                <TouchableOpacity
                                  key={id}
                                  style={[
                                    styles.fertilizerOption,
                                    { 
                                      backgroundColor: formikProps.values.type === id as keyof typeof FERTILIZER_TYPES ? theme.colors.primary.base : theme.colors.neutral.background,
                                      borderColor: formikProps.values.type === id as keyof typeof FERTILIZER_TYPES ? theme.colors.primary.base : theme.colors.neutral.border,
                                    }
                                  ]}
                                  onPress={() => {
                                    const fertInfo = FERTILIZER_TYPES[id as keyof typeof FERTILIZER_TYPES];
                                    formikProps.setFieldValue('type', fertInfo.type);
                                    formikProps.setFieldValue('name', name);
                                    setShowTypeModal(false);
                                  }}
                                >
                                  <View style={[
                                    styles.fertilizerIconContainer,
                                    {
                                      backgroundColor: formikProps.values.type === id as keyof typeof FERTILIZER_TYPES ? 'rgba(255, 255, 255, 0.2)' : theme.colors.neutral.surface,
                                    }
                                  ]}>
                                    <Text style={styles.fertilizerIcon}>{icon}</Text>
                                  </View>
                                  <View style={styles.fertilizerInfo}>
                                    <Text style={[
                                      styles.fertilizerName,
                                      { 
                                        color: formikProps.values.type === id as keyof typeof FERTILIZER_TYPES ? '#FFF' : theme.colors.neutral.textPrimary,
                                        fontWeight: formikProps.values.type === id as keyof typeof FERTILIZER_TYPES ? '600' : '400'
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
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </>
          )}
        </Formik>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  form: {
    gap: 16,
  },
  stepIndicatorContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stepItem: {
    flexDirection: 'row-reverse',
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
  formHeaderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'right',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
  },
  fieldContainer: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  fieldTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
    textAlign: 'right',
  },
  dateButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  dateIcon: {
    marginLeft: 10,
  },
  dateButtonText: {
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row-reverse',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: 6,
  },
  previousButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  nextButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
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
  fertilizerGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  fertilizerOption: {
    width: (width - 64) / 3,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    alignItems: 'center',
  },
  fertilizerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fertilizerIcon: {
    fontSize: 32,
  },
  fertilizerInfo: {
    alignItems: 'center',
  },
  fertilizerName: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    gap: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  unitSelectorContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  unitOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    width: '48%',
    marginBottom: 8,
  },
  unitIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unitIcon: {
    fontSize: 16,
  },
  unitLabel: {
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
  },
});

export default AddFertilizerScreen; 