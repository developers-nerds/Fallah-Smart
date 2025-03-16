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

interface FormData {
  name: string;
  type: FertilizerType;
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

type FertilizerType = 'organic' | 'chemical' | 'mixed';

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

const validationSchema = Yup.object().shape({
  name: Yup.string().required('الاسم مطلوب'),
  type: Yup.mixed<FertilizerType>()
    .oneOf(Object.keys(FERTILIZER_CATEGORIES) as FertilizerType[], 'نوع السماد غير صالح')
    .required('النوع مطلوب') as Yup.StringSchema<FertilizerType>,
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
    type: 'chemical',
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
          type: existingFertilizer.type as keyof typeof FERTILIZER_TYPES,
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
            'Authorization': tokens?.accessToken ? `Bearer ${tokens.accessToken}` : ''
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
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.fieldIcon}>⚗️</Text>
              <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
                نوع السماد *
              </Text>
            </View>
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
          </View>
        );
      
      case 'name':
        const fertilizerType = FERTILIZER_TYPES[values.type as keyof typeof FERTILIZER_TYPES];
        return (
          <Animated.View
            key={field}
            entering={FadeInRight.delay(100).springify()}
            style={[styles.fieldContainer, { 
              backgroundColor: 'rgba(255, 248, 220, 0.5)',
              borderRadius: 12,
              padding: 10,
              borderWidth: 1,
              borderColor: 'rgba(222, 184, 135, 0.3)',
            }]}
          >
            <View style={[styles.fieldHeaderContainer, {
              backgroundColor: 'rgba(255, 248, 220, 0.7)',
              borderColor: 'rgba(222, 184, 135, 0.5)',
            }]}>
              <Text style={[styles.fieldIcon, { fontSize: 30 }]}>
                {fertilizerType?.icon || '⚗️'}
              </Text>
              <Text style={[styles.label, { 
                color: theme.colors.neutral.textPrimary,
                fontSize: 18,
                fontWeight: 'bold',
              }]}>
                اسم السماد
              </Text>
            </View>
            <TextInput
              value={values.name}
              onChangeText={(text: string) => handleChange(field)(text)}
              onBlur={() => handleBlur(field)}
              error={touched.name && errors.name ? errors.name : undefined}
              placeholder={fertilizerType?.name || 'أدخل اسم السماد'}
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8 }}
            />
          </Animated.View>
        );
      
      case 'expiryDate':
        return (
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              تاريخ الصلاحية
            </Text>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: theme.colors.neutral.border }]}
              onPress={() => showDatePickerModal('expiryDate')}
            >
              <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                {new Date(values.expiryDate).toLocaleDateString('en')}
              </Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'safetyGuidelines':
        return (
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              تعليمات السلامة
            </Text>
            <TextInput
              value={values[field]}
              onChangeText={(text: string) => handleChange(field)(text)}
              onBlur={() => handleBlur(field)}
              multiline
              numberOfLines={4}
              style={[styles.textArea, { borderColor: theme.colors.neutral.border }]}
              placeholder="أضف تعليمات السلامة..."
            />
          </View>
        );
      
      default:
        return (
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              {getFieldLabel(field)}
            </Text>
            <TextInput
              value={values[field]}
              onChangeText={(text: string) => handleChange(field)(text)}
              onBlur={() => handleBlur(field)}
              keyboardType={getFieldKeyboardType(field)}
              style={[styles.input, { borderColor: theme.colors.neutral.border }]}
              placeholder={getFieldPlaceholder(field)}
            />
            {touched[field] && errors[field] && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors[field]}</Text>
            )}
          </View>
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
      <View style={styles.progressContainer}>
        {formPages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressBar,
              {
                backgroundColor: index <= currentPage 
                  ? theme.colors.primary.base 
                  : theme.colors.neutral.border,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderPageHeader = () => (
    <View style={styles.pageHeader}>
      <Text style={[styles.pageIcon]}>{formPages[currentPage].icon}</Text>
      <View>
        <Text style={[styles.pageTitle, { color: theme.colors.neutral.textPrimary }]}>
          {formPages[currentPage].title}
        </Text>
        <Text style={[styles.pageSubtitle, { color: theme.colors.neutral.textSecondary }]}>
          {formPages[currentPage].subtitle}
        </Text>
      </View>
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
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
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue, isValid }) => (
            <>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
              >
                {renderProgressBar()}
                {renderPageHeader()}
                
                <View style={styles.formContainer}>
                  {formPages[currentPage].fields.map(field => (
                    <View key={field}>
                      {renderField(field, values, errors, touched, handleChange, handleBlur, setFieldValue)}
                    </View>
                  ))}
                </View>

                {showDatePicker && datePickerField && (
                  <DateTimePicker
                    value={new Date(values[datePickerField])}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      const dateChanges = handleDateChange(event, selectedDate);
                      Object.entries(dateChanges).forEach(([field, value]) => {
                        setFieldValue(field, value);
                      });
                    }}
                  />
                )}
              </ScrollView>

              <View style={[styles.footer, { backgroundColor: theme.colors.neutral.surface }]}>
                <View style={styles.buttonContainer}>
                  {currentPage > 0 && (
                    <CustomButton
                      title="السابق"
                      onPress={prevPage}
                      type="secondary"
                      style={styles.button}
                    />
                  )}
                  
                  {currentPage < formPages.length - 1 ? (
                    <CustomButton
                      title="التالي"
                      onPress={nextPage}
                      type="primary"
                      disabled={!validateCurrentPage(values)}
                      style={styles.button}
                    />
                  ) : (
                    <CustomButton
                      title="حفظ"
                      onPress={() => handleSubmit()}
                      type="primary"
                      disabled={!isValid}
                      style={styles.button}
                    />
                  )}
                </View>
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
                                      backgroundColor: values.type === id ? theme.colors.primary.base : theme.colors.neutral.background,
                                      borderColor: values.type === id ? theme.colors.primary.base : theme.colors.neutral.border,
                                    }
                                  ]}
                                  onPress={() => {
                                    const fertInfo = FERTILIZER_TYPES[id];
                                    setFieldValue('type', fertInfo.type);
                                    setFieldValue('name', name);
                                    setShowTypeModal(false);
                                  }}
                                >
                                  <View style={[
                                    styles.fertilizerIconContainer,
                                    {
                                      backgroundColor: values.type === id ? 'rgba(255, 255, 255, 0.2)' : theme.colors.neutral.surface,
                                    }
                                  ]}>
                                    <Text style={styles.fertilizerIcon}>{icon}</Text>
                                  </View>
                                  <View style={styles.fertilizerInfo}>
                                    <Text style={[
                                      styles.fertilizerName,
                                      { 
                                        color: values.type === id ? '#FFF' : theme.colors.neutral.textPrimary,
                                        fontWeight: values.type === id ? '600' : '400'
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
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  pageIcon: {
    fontSize: 32,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
  },
  formContainer: {
    gap: 16,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  picker: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
  },
  dateButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  seedTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  seedTypeTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  seedTypeIcon: {
    fontSize: 38,
  },
  seedTypeName: {
    fontSize: 15,
    fontWeight: '600',
  },
  fieldHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fieldIcon: {
    fontSize: 30,
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
});

export default AddFertilizerScreen; 