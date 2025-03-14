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
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useSeed } from '../../../context/SeedContext';
import { StockSeed } from '../types';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { TextInput } from '../../../components/TextInput';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { SEED_TYPES, SEED_CATEGORIES, UNIT_ICONS, SEASON_ICONS } from './constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';
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
  type: string;
  quantity: string;
  unit: string;
  price: string;
  minQuantityAlert: string;
  expiryDate: string;
  variety: string;
  manufacturer: string;
  batchNumber: string;
  purchaseDate: string;
  location: string;
  supplier: string;
  plantingInstructions: string;
  germinationTime: string;
  growingSeason: string;
  cropType: string;
  plantingSeasonStart: string;
  plantingSeasonEnd: string;
  germination: string;
  certificationInfo: string;
  notes: string;
  [key: string]: string; // Add index signature for dynamic access
}

type DateField = 'expiryDate' | 'purchaseDate' | 'plantingSeasonStart' | 'plantingSeasonEnd';

interface AddSeedScreenProps {
  navigation: StackNavigationProp<StockStackParamList, 'AddSeed'>;
  route: RouteProp<StockStackParamList, 'AddSeed'>;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required('اسم البذور مطلوب'),
  type: Yup.string().required('نوع البذور مطلوب'),
  quantity: Yup.string()
    .required('الكمية مطلوبة')
    .test('is-number', 'الكمية يجب أن تكون رقماً', value => !isNaN(parseFloat(value))),
  unit: Yup.string().required('وحدة القياس مطلوبة'),
  price: Yup.string()
    .required('السعر مطلوب')
    .test('is-number', 'السعر يجب أن يكون رقماً', value => !isNaN(parseFloat(value))),
  minQuantityAlert: Yup.string()
    .required('حد التنبيه مطلوب')
    .test('is-number', 'حد التنبيه يجب أن يكون رقماً', value => !isNaN(parseFloat(value))),
  expiryDate: Yup.string().required('تاريخ الصلاحية مطلوب'),
});

export const AddSeedScreen = ({ navigation, route }: AddSeedScreenProps) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { seeds, addSeed, updateSeed, loading } = useSeed();
  const [currentPage, setCurrentPage] = useState(0);
  const [datePickerField, setDatePickerField] = useState<DateField | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<FormData>({
    name: '',
    type: Object.keys(SEED_TYPES)[0],
    quantity: '0',
    unit: 'kg',
    price: '0',
    minQuantityAlert: '50',
    expiryDate: new Date().toISOString(),
    variety: '',
    manufacturer: '',
    batchNumber: '',
    purchaseDate: new Date().toISOString(),
    location: '',
    supplier: '',
    plantingInstructions: '',
    germinationTime: '',
    growingSeason: '',
    cropType: '',
    plantingSeasonStart: new Date().toISOString(),
    plantingSeasonEnd: new Date().toISOString(),
    germination: '0',
    certificationInfo: '',
    notes: '',
  });

  const { seedId, mode } = route.params || {};
  
  const formPages: FormPage[] = [
    {
      title: 'المعلومات الأساسية',
      subtitle: 'أدخل المعلومات الأساسية للبذور',
      icon: '🌱',
      fields: ['name', 'type', 'quantity', 'unit', 'price', 'minQuantityAlert', 'expiryDate'],
    },
    {
      title: 'معلومات إضافية',
      subtitle: 'أدخل معلومات إضافية عن البذور',
      icon: '📦',
      fields: ['variety', 'manufacturer', 'batchNumber', 'purchaseDate', 'location', 'supplier'],
    },
    {
      title: 'معلومات الزراعة',
      subtitle: 'أدخل معلومات الزراعة',
      icon: '🌿',
      fields: ['plantingInstructions', 'germinationTime', 'growingSeason', 'cropType', 'plantingSeasonStart', 'plantingSeasonEnd', 'germination', 'certificationInfo'],
    },
    {
      title: 'ملاحظات',
      subtitle: 'أضف أي ملاحظات إضافية',
      icon: '📝',
      fields: ['notes'],
    },
  ];

  useEffect(() => {
    if (seedId) {
      const existingSeed = seeds.find(s => s.id === seedId);
      if (existingSeed) {
        setInitialFormValues({
          name: existingSeed.name || '',
          type: existingSeed.type || Object.keys(SEED_TYPES)[0],
          quantity: existingSeed.quantity?.toString() || '0',
          unit: existingSeed.unit || 'kg',
          price: existingSeed.price?.toString() || '0',
          minQuantityAlert: existingSeed.minQuantityAlert?.toString() || '50',
          expiryDate: existingSeed.expiryDate || new Date().toISOString(),
          variety: existingSeed.variety || '',
          manufacturer: existingSeed.manufacturer || '',
          batchNumber: existingSeed.batchNumber || '',
          purchaseDate: existingSeed.purchaseDate || new Date().toISOString(),
          location: existingSeed.location || '',
          supplier: existingSeed.supplier || '',
          plantingInstructions: existingSeed.plantingInstructions || '',
          germinationTime: existingSeed.germinationTime || '',
          growingSeason: existingSeed.growingSeason || '',
          cropType: existingSeed.cropType || '',
          plantingSeasonStart: existingSeed.plantingSeasonStart || new Date().toISOString(),
          plantingSeasonEnd: existingSeed.plantingSeasonEnd || new Date().toISOString(),
          germination: existingSeed.germination?.toString() || '0',
          certificationInfo: existingSeed.certificationInfo || '',
          notes: existingSeed.notes || '',
        });
      }
    }
  }, [seedId, seeds]);

  const validateCurrentPage = (values: FormData) => {
    let isValid = true;
    const currentFields = formPages[currentPage].fields;

    for (const field of currentFields) {
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
      
      // Make sure all required fields are present
      if (!values.cropType) {
        values.cropType = 'عام'; // Set a default value if empty
      }
      
      const seedData: Omit<StockSeed, 'id' | 'createdAt' | 'updatedAt'> = {
        name: values.name,
        type: values.type,
        quantity: parseFloat(values.quantity),
        unit: values.unit,
        price: parseFloat(values.price),
        minQuantityAlert: parseFloat(values.minQuantityAlert),
        expiryDate: values.expiryDate,
        variety: values.variety,
        manufacturer: values.manufacturer,
        batchNumber: values.batchNumber,
        purchaseDate: values.purchaseDate,
        location: values.location,
        notes: values.notes,
        supplier: values.supplier,
        plantingInstructions: values.plantingInstructions,
        germinationTime: values.germinationTime,
        growingSeason: values.growingSeason,
        cropType: values.cropType || 'عام',
        plantingSeasonStart: values.plantingSeasonStart,
        plantingSeasonEnd: values.plantingSeasonEnd,
        germination: values.germination ? parseFloat(values.germination) : undefined,
        certificationInfo: values.certificationInfo,
        userId: '1', // Keep as string to match the type but will be converted to number in API
      };

      console.log('Seed data to be sent:', seedData);

      // Try a direct API request to bypass the context
      try {
        // Get tokens for authorization
        const tokens = await storage.getTokens();
        console.log('Auth tokens:', tokens ? 'Available' : 'Not Available');
        
        // Get API URL from environment or use a fallback
        const API_URL = process.env.EXPO_PUBLIC_API_URL;
        if (!API_URL) {
          console.error('API_URL is not defined in environment variables');
          throw new Error('API_URL is not defined');
        }
        
        console.log('Using API URL:', API_URL);
        
        // Convert userId to number for the API call
        const directSeedData = {
          ...seedData,
          userId: parseInt(seedData.userId, 10)
        };
        
        const endpoint = `${API_URL}/stock/seeds`;
        console.log('API endpoint:', endpoint);
        
        const response = await axios.post(endpoint, directSeedData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': tokens?.accessToken ? `Bearer ${tokens.accessToken}` : ''
          },
          timeout: 10000
        });
        
        console.log('API call successful:', response.data);
        Alert.alert('نجاح', 'تمت إضافة البذور بنجاح');
        navigation.goBack();
        return;
      } catch (error: any) {
        console.error('API call failed:', error?.message || 'Unknown error');
        if (error.response) {
          console.error('API response status:', error.response.status);
          console.error('API response data:', error.response.data);
        } else if (error.request) {
          console.error('No response received from server');
        }
        
        // Fall back to the context method
        console.log('Falling back to context method');
      }

      // Original context-based attempt
      if (seedId) {
        console.log('Updating existing seed:', seedId);
        await updateSeed(seedId, seedData);
        Alert.alert('نجاح', 'تم تحديث البذور بنجاح');
      } else {
        console.log('Adding new seed');
        await addSeed(seedData);
        Alert.alert('نجاح', 'تمت إضافة البذور بنجاح');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error submitting seed:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      Alert.alert('خطأ', 'فشل في حفظ البذور');
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

  const renderField = (field: keyof FormData, values: FormData, errors: any, touched: any, handleChange: any, setFieldValue: any) => {
    const seedType = SEED_TYPES[values.type as keyof typeof SEED_TYPES];
    
    switch (field) {
      case 'name':
  return (
              <TextInput
            key={field}
                label="اسم البذور"
                value={values.name}
                onChangeText={handleChange('name')}
            error={touched.name && errors.name ? errors.name : undefined}
          />
        );
      case 'type':
        return (
          <View key={field} style={styles.fieldContainer}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  نوع البذور
                </Text>
            <View style={styles.seedTypeGrid}>
              {Object.entries(SEED_TYPES)
                .filter(([_, seed]) => !selectedCategory || seed.category === selectedCategory)
                .map(([key, seed]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.seedTypeButton,
                      { 
                        backgroundColor: values.type === key ? theme.colors.primary.base : theme.colors.neutral.surface,
                        borderColor: values.type === key ? theme.colors.primary.base : theme.colors.neutral.border,
                      }
                    ]}
                    onPress={() => setFieldValue('type', key)}
                  >
                    <Text style={styles.seedTypeIcon}>{seed.icon}</Text>
                    <Text style={[
                      styles.seedTypeText,
                      { color: values.type === key ? '#FFF' : theme.colors.neutral.textSecondary }
                    ]}>
                      {seed.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
            {touched.type && errors.type && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.type}</Text>
            )}
              </View>
        );
      case 'quantity':
        return (
          <View key={field} style={styles.rowContainer}>
            <View style={{ flex: 2 }}>
              <TextInput
                label="الكمية"
                value={values.quantity}
                onChangeText={handleChange('quantity')}
                keyboardType="numeric"
                error={touched.quantity && errors.quantity ? errors.quantity : undefined}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                الوحدة
              </Text>
              <View style={[styles.pickerContainer, { borderColor: theme.colors.neutral.border }]}>
                <Picker
                  selectedValue={values.unit}
                  onValueChange={itemValue => setFieldValue('unit', itemValue)}
                  style={{ color: theme.colors.neutral.textPrimary }}
                >
                  {Object.entries(UNIT_ICONS).map(([key, unit]) => (
                    <Picker.Item 
                      key={key} 
                      label={`${unit.icon} ${unit.label}`} 
                      value={key} 
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        );
      case 'price':
        return (
              <TextInput
            key={field}
            label="السعر"
            value={values.price}
            onChangeText={handleChange('price')}
            keyboardType="numeric"
            error={touched.price && errors.price ? errors.price : undefined}
          />
        );
      case 'minQuantityAlert':
        return (
              <TextInput
            key={field}
            label="حد التنبيه"
            value={values.minQuantityAlert}
            onChangeText={handleChange('minQuantityAlert')}
            keyboardType="numeric"
            error={touched.minQuantityAlert && errors.minQuantityAlert ? errors.minQuantityAlert : undefined}
          />
        );
      case 'expiryDate':
      case 'purchaseDate':
      case 'plantingSeasonStart':
      case 'plantingSeasonEnd':
        const dateLabel = {
          expiryDate: 'تاريخ الصلاحية',
          purchaseDate: 'تاريخ الشراء',
          plantingSeasonStart: 'بداية موسم الزراعة',
          plantingSeasonEnd: 'نهاية موسم الزراعة',
        }[field];
        
        return (
          <View key={field} style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              {dateLabel}
            </Text>
              <TouchableOpacity
              style={[
                styles.datePickerButton,
                { 
                  backgroundColor: theme.colors.neutral.surface,
                  borderColor: theme.colors.neutral.border,
                }
              ]}
              onPress={() => showDatePickerModal(field as DateField)}
            >
              <Text style={{ color: theme.colors.neutral.textPrimary }}>
                {new Date(values[field]).toLocaleDateString('ar')}
              </Text>
              <Feather name="calendar" size={20} color={theme.colors.neutral.textSecondary} />
            </TouchableOpacity>
            {touched[field] && errors[field] && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors[field]}</Text>
            )}
          </View>
        );
      case 'notes':
      case 'plantingInstructions':
        return (
              <TextInput
            key={field}
            label={field === 'notes' ? 'ملاحظات' : 'تعليمات الزراعة'}
            value={values[field]}
            onChangeText={handleChange(field)}
                multiline
            numberOfLines={4}
            error={touched[field] && errors[field] ? errors[field] : undefined}
          />
        );
      default:
        // For all other text fields
        const fieldLabels: { [K in keyof FormData]: string } = {
          name: 'اسم البذور',
          type: 'نوع البذور',
          quantity: 'الكمية',
          unit: 'الوحدة',
          price: 'السعر',
          minQuantityAlert: 'حد التنبيه',
          expiryDate: 'تاريخ الصلاحية',
          variety: 'الصنف',
          manufacturer: 'الشركة المصنعة',
          batchNumber: 'رقم الدفعة',
          purchaseDate: 'تاريخ الشراء',
          location: 'الموقع',
          supplier: 'المورد',
          plantingInstructions: 'تعليمات الزراعة',
          germinationTime: 'وقت الإنبات',
          growingSeason: 'موسم النمو',
          cropType: 'نوع المحصول',
          plantingSeasonStart: 'بداية موسم الزراعة',
          plantingSeasonEnd: 'نهاية موسم الزراعة',
          germination: 'نسبة الإنبات (%)',
          certificationInfo: 'معلومات الشهادة',
          notes: 'ملاحظات'
        };
        
        return (
              <TextInput
            key={field}
            label={fieldLabels[field as keyof FormData] || String(field)}
            value={values[field]}
            onChangeText={handleChange(field)}
            keyboardType={field === 'germination' ? 'numeric' : 'default'}
            error={touched[field] && errors[field] ? errors[field] : undefined}
          />
        );
    }
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {formPages.map((_, index) => (
          <React.Fragment key={index}>
            <View 
              style={[
                styles.progressDot, 
                { 
                  backgroundColor: index <= currentPage 
                    ? theme.colors.primary.base 
                    : theme.colors.neutral.border 
                }
              ]} 
            />
            {index < formPages.length - 1 && (
              <View 
                style={[
                  styles.progressLine, 
                  { 
                    backgroundColor: index < currentPage 
                      ? theme.colors.primary.base 
                      : theme.colors.neutral.border 
                  }
                ]} 
              />
            )}
          </React.Fragment>
        ))}
            </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
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
                <View style={styles.header}>
                  <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
                    {seedId ? 'تعديل البذور' : 'إضافة بذور جديدة'}
                  </Text>
                  {renderProgressBar()}
            </View>

                <View style={styles.pageContainer}>
                  <View style={[styles.pageHeader, { backgroundColor: theme.colors.primary.base }]}>
                    <Text style={styles.pageIcon}>{formPages[currentPage].icon}</Text>
                    <View>
                      <Text style={styles.pageTitle}>{formPages[currentPage].title}</Text>
                      <Text style={styles.pageSubtitle}>{formPages[currentPage].subtitle}</Text>
            </View>
          </View>

                  <Animated.View 
                    entering={FadeInRight}
                    style={[styles.formContainer, { backgroundColor: theme.colors.neutral.surface }]}
                  >
                    <View style={styles.categoryContainer}>
                      <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                        تصفية حسب الفئة
                      </Text>
                      <View style={styles.categoryChips}>
                        {Object.entries(SEED_CATEGORIES).map(([category, icon]) => (
                          <TouchableOpacity
                            key={category}
                            style={[
                              styles.categoryChip,
                              { 
                                backgroundColor: selectedCategory === category ? theme.colors.primary.base : theme.colors.neutral.surface,
                                borderColor: selectedCategory === category ? theme.colors.primary.base : theme.colors.neutral.border,
                              }
                            ]}
                            onPress={() => setSelectedCategory(selectedCategory === category ? null : category)}
                          >
                            <Text style={styles.categoryIcon}>{icon}</Text>
                            <Text style={[
                              styles.categoryText,
                              { color: selectedCategory === category ? '#FFF' : theme.colors.neutral.textSecondary }
                            ]}>
                              {category}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    
                    {formPages[currentPage].fields.map(field => 
                      renderField(field, values, errors, touched, handleChange, setFieldValue)
                    )}
                  </Animated.View>
                </View>

                {showDatePicker && datePickerField && (
            <DateTimePicker
                    value={new Date(values[datePickerField])}
              mode="date"
              display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate && datePickerField) {
                        setFieldValue(datePickerField, selectedDate.toISOString());
                }
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
                      style={{ flex: 1 }}
                    />
                  )}
                  
                  {currentPage < formPages.length - 1 ? (
                    <CustomButton
                      title="التالي"
                      onPress={nextPage}
                      type="primary"
                      disabled={!validateCurrentPage(values)}
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <CustomButton
                      title="حفظ"
                      onPress={() => handleSubmit()}
                      type="primary"
                      disabled={!isValid}
                      style={{ flex: 1 }}
                      loading={loading}
                    />
                  )}
                </View>
              </View>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    height: 2,
    width: 30,
  },
  pageContainer: {
    marginBottom: 16,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    gap: 12,
  },
  pageIcon: {
    fontSize: 32,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  formContainer: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 16,
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  seedTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  seedTypeButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  seedTypeIcon: {
    fontSize: 32,
  },
  seedTypeText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddSeedScreen; 