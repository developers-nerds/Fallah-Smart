import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  I18nManager,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../../context/ThemeContext';
import { useHarvest } from '../../../context/HarvestContext';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { Picker } from '../../../components/Picker';
import { DatePicker } from '../../../components/DatePicker';
import { StockHarvest } from '../types';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import { useAuth } from '../../../context/AuthContext';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Add type definitions for the constants
interface HarvestType {
  icon: string;
  name: string;
  category: string;
}

interface QualityType {
  icon: string;
  name: string;
}

interface UnitType {
  icon: string;
  name: string;
  abbreviation: string;
}

// Define the constants with their types
const HARVEST_TYPES: Record<string, HarvestType> = {
  vegetable: { icon: '🥕', name: 'خضروات', category: 'vegetable' },
  fruit: { icon: '🍎', name: 'فواكه', category: 'fruit' },
  grain: { icon: '🌾', name: 'حبوب', category: 'grain' },
  herb: { icon: '🌿', name: 'أعشاب', category: 'herb' },
  tomato: { icon: '🍅', name: 'طماطم', category: 'tomato' },
  cucumber: { icon: '🥒', name: 'خيار', category: 'cucumber' },
  potato: { icon: '🥔', name: 'بطاطا', category: 'potato' },
  carrot: { icon: '🥕', name: 'جزر', category: 'carrot' },
  corn: { icon: '🌽', name: 'ذرة', category: 'corn' },
  onion: { icon: '🧅', name: 'بصل', category: 'onion' },
  garlic: { icon: '🧄', name: 'ثوم', category: 'garlic' },
  lettuce: { icon: '🥬', name: 'خس', category: 'lettuce' },
  pepper: { icon: '🌶️', name: 'فلفل', category: 'pepper' },
  eggplant: { icon: '🍆', name: 'باذنجان', category: 'eggplant' },
  broccoli: { icon: '🥦', name: 'بروكلي', category: 'broccoli' },
  spinach: { icon: '🍃', name: 'سبانخ', category: 'spinach' },
  apple: { icon: '🍎', name: 'تفاح', category: 'apple' },
  orange: { icon: '🍊', name: 'برتقال', category: 'orange' },
  banana: { icon: '🍌', name: 'موز', category: 'banana' },
  grape: { icon: '🍇', name: 'عنب', category: 'grape' },
  watermelon: { icon: '🍉', name: 'بطيخ', category: 'watermelon' },
  strawberry: { icon: '🍓', name: 'فراولة', category: 'strawberry' },
  pear: { icon: '🍐', name: 'كمثرى', category: 'pear' },
  peach: { icon: '🍑', name: 'خوخ', category: 'peach' },
  wheat: { icon: '🌾', name: 'قمح', category: 'wheat' },
  rice: { icon: '🍚', name: 'أرز', category: 'rice' },
  mint: { icon: '🌿', name: 'نعناع', category: 'mint' },
  parsley: { icon: '🌿', name: 'بقدونس', category: 'parsley' },
  coriander: { icon: '🌿', name: 'كزبرة', category: 'coriander' },
  other: { icon: '🧺', name: 'أخرى', category: 'other' },
};

const QUALITY_TYPES: Record<string, QualityType> = {
  premium: { icon: '⭐⭐⭐', name: 'ممتاز' },
  standard: { icon: '⭐⭐', name: 'قياسي' },
  economy: { icon: '⭐', name: 'اقتصادي' },
};

const UNIT_TYPES: Record<string, UnitType> = {
  kg: { icon: '⚖️', name: 'كيلوغرام', abbreviation: 'كغ' },
  g: { icon: '⚖️', name: 'غرام', abbreviation: 'غ' },
  ton: { icon: '⚖️', name: 'طن', abbreviation: 'طن' },
  box: { icon: '📦', name: 'صندوق', abbreviation: 'صندوق' },
  piece: { icon: '🔢', name: 'قطعة', abbreviation: 'قطعة' },
  bunch: { icon: '🏵️', name: 'حزمة', abbreviation: 'حزمة' },
};

const initialValues: StockHarvest & { selectedCategory?: string } = {
  cropName: '',
  type: 'vegetable',
  selectedCategory: 'vegetable',
  quantity: 0,
  unit: 'kg',
  price: 0,
  harvestDate: new Date().toISOString(),
  quality: 'standard',
  minQuantityAlert: 0,
  storageLocation: '',
  batchNumber: '',
  expiryDate: '',
  moisture: 0,
  storageConditions: '',
  certifications: '',
  notes: '',
};

const validationSchema = Yup.object({
  cropName: Yup.string().required('يرجى إدخال اسم المحصول'),
  type: Yup.string().required('يرجى اختيار نوع المحصول'),
  quantity: Yup.number().min(0, 'يجب أن تكون الكمية أكبر من أو تساوي 0').required('يرجى إدخال الكمية'),
  unit: Yup.string().required('يرجى اختيار وحدة القياس'),
  price: Yup.number().min(0, 'يجب أن يكون السعر أكبر من أو يساوي 0').required('يرجى إدخال السعر'),
  harvestDate: Yup.date().required('يرجى إدخال تاريخ الحصاد'),
  minQuantityAlert: Yup.number().min(0, 'يجب أن يكون الحد الأدنى للتنبيه أكبر من أو يساوي 0'),
  moisture: Yup.number().min(0, 'يجب أن تكون نسبة الرطوبة أكبر من أو تساوي 0').max(100, 'يجب أن تكون نسبة الرطوبة أقل من أو تساوي 100'),
});

type AddHarvestScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddHarvest'>;
  route: RouteProp<StockStackParamList, 'AddHarvest'>;
};

// After the imports, add a new grouped HARVEST_TYPES_BY_CATEGORY constant to organize types by category
// Define a structure to organize harvest types by category
const HARVEST_TYPES_BY_CATEGORY: Record<string, Record<string, HarvestType>> = {
  vegetable: {},
  fruit: {},
  grain: {},
  herb: {},
  other: {}
};

// Group harvest types by their categories
Object.keys(HARVEST_TYPES).forEach(key => {
  const type = HARVEST_TYPES[key];
  
  // Skip the main category entries themselves
  if (['vegetable', 'fruit', 'grain', 'herb', 'other'].includes(key)) {
    return;
  }
  
  // Add this type to its category
  const category = type.category;
  if (HARVEST_TYPES_BY_CATEGORY[category]) {
    HARVEST_TYPES_BY_CATEGORY[category][key] = type;
  } else {
    // If it doesn't match any category, put it in 'other'
    HARVEST_TYPES_BY_CATEGORY.other[key] = type;
  }
});

// Define the type for the HARVEST_CATEGORIES constant
interface HarvestCategory {
  icon: string;
  name: string;
  category: string;
}

// Update the HARVEST_CATEGORIES constant with proper type
const HARVEST_CATEGORIES: Record<string, HarvestCategory> = {
  'vegetable': { icon: '🥕', name: 'خضروات', category: 'vegetable' },
  'fruit': { icon: '🍎', name: 'فواكه', category: 'fruit' },
  'grain': { icon: '🌾', name: 'حبوب', category: 'grain' },
  'herb': { icon: '🌿', name: 'أعشاب', category: 'herb' },
  'other': { icon: '🧺', name: 'أخرى', category: 'other' },
};

const AddHarvestScreen: React.FC<AddHarvestScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const isEditing = !!route.params?.harvestId;
  const [harvest, setHarvest] = useState<StockHarvest | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  useEffect(() => {
    if (isEditing) {
      fetchHarvestDetail();
    }
  }, [route.params?.harvestId]);

  const fetchHarvestDetail = async () => {
    try {
      setLoading(true);
      
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/stock/harvest/${route.params?.harvestId}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        }
      );
      
      // Format dates properly
      const harvestData = response.data;
      if (harvestData.harvestDate) {
        harvestData.harvestDate = new Date(harvestData.harvestDate).toISOString();
      }
      if (harvestData.expiryDate) {
        harvestData.expiryDate = new Date(harvestData.expiryDate).toISOString();
      }
      
      setHarvest(harvestData);
    } catch (error) {
      console.error('Error fetching harvest detail:', error);
      setError('فشل في تحميل تفاصيل المحصول');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: StockHarvest) => {
    try {
      setSubmitting(true);
      
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
        setSubmitting(false);
        return;
      }
      
      // Clean and format values
      const formattedValues = {
        ...values,
        quantity: Number(values.quantity),
        price: Number(values.price),
        minQuantityAlert: Number(values.minQuantityAlert) || 0,
        moisture: Number(values.moisture) || 0,
      };
      
      // Convert empty strings to null for optional fields in a type-safe way
      const safeFormattedValues = { ...formattedValues };
      (Object.keys(formattedValues) as Array<keyof typeof formattedValues>).forEach(key => {
        if (safeFormattedValues[key] === '') {
          // Type assertion is needed here since TypeScript can't infer that all properties might be strings
          (safeFormattedValues as any)[key] = null;
        }
      });

      // Remove ID when creating a new record
      if (!isEditing) {
        delete (safeFormattedValues as any).id;
      }

      if (isEditing) {
        await axios.put(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/harvest/${route.params?.harvestId}`,
          safeFormattedValues,
          {
            headers: {
              'Authorization': `Bearer ${tokens.access}`
            }
          }
        );
      } else {
        await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/harvest`,
          safeFormattedValues,
          {
            headers: {
              'Authorization': `Bearer ${tokens.access}`
            }
          }
        );
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving harvest:', error);
      Alert.alert('خطأ', 'فشل في حفظ المحصول');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.progressStep, 
              { 
                backgroundColor: index < currentStep 
                  ? theme.colors.primary.base 
                  : theme.colors.neutral.border 
              }
            ]}
          />
        ))}
      </View>
    );
  };

  const renderStepContent = (formikProps: any) => {
    const { values, errors, touched, handleChange, handleBlur, setFieldValue } = formikProps;

    switch (currentStep) {
      case 1:
        return (
          <Animated.View entering={FadeIn} style={styles.formStep}>
            <Text style={[styles.stepTitle, { color: theme.colors.neutral.textPrimary }]}>
              المعلومات الأساسية
            </Text>

            {/* Step 1: Show only categories if no category is selected yet */}
            {!values.selectedCategory && (
              <View style={styles.inputGroup}>
                <Text style={[styles.stepInstruction, { color: theme.colors.primary.base }]}>
                  الخطوة 1: اختر فئة المحصول
                </Text>
                
                <View style={styles.categoryGrid}>
                  {Object.keys(HARVEST_CATEGORIES).filter(key => key !== 'all').map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        {
                          backgroundColor: theme.colors.neutral.surface,
                          borderColor: theme.colors.neutral.border,
                        }
                      ]}
                      onPress={() => {
                        setFieldValue('selectedCategory', category);
                      }}
                    >
                      <Text style={styles.categoryIcon}>{HARVEST_CATEGORIES[category].icon}</Text>
                      <Text style={[
                        styles.categoryName,
                        { color: theme.colors.neutral.textSecondary }
                      ]}>
                        {HARVEST_CATEGORIES[category].name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Step 2: Show crop types for the selected category */}
            {values.selectedCategory && (
              <>
                <View style={styles.stepHeader}>
                  <Text style={[styles.stepInstruction, { color: theme.colors.primary.base }]}>
                    الخطوة 2: اختر نوع المحصول
                  </Text>
                  
                  <TouchableOpacity 
                    style={[
                      styles.backToCategories,
                      {
                        backgroundColor: theme.colors.neutral.surface,
                        borderColor: theme.colors.primary.base,
                        borderWidth: 1,
                        borderRadius: 20,
                      }
                    ]}
                    onPress={() => {
                      setFieldValue('selectedCategory', '');
                      setFieldValue('type', '');
                      setFieldValue('cropName', '');
                    }}
                  >
                    <MaterialCommunityIcons name="refresh" size={16} color={theme.colors.primary.base} style={{ marginLeft: 6 }} />
                    <Text style={{ color: theme.colors.primary.base, fontWeight: 'bold' }}>تغيير الفئة</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.selectedCategoryBadge}>
                  <Text style={styles.categoryIcon}>
                    {HARVEST_CATEGORIES[values.selectedCategory]?.icon}
                  </Text>
                  <Text style={[styles.selectedCategoryName, { color: theme.colors.primary.base }]}>
                    {HARVEST_CATEGORIES[values.selectedCategory]?.name}
                  </Text>
                </View>
                
                {values.selectedCategory === 'other' ? (
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.colors.neutral.surface,
                          borderColor: touched.cropName && errors.cropName
                            ? theme.colors.error
                            : theme.colors.neutral.border,
                          color: theme.colors.neutral.textPrimary,
                        },
                      ]}
                      value={values.cropName}
                      onChangeText={handleChange('cropName')}
                      onBlur={handleBlur('cropName')}
                      placeholder="أدخل اسم مخصص للمحصول"
                      placeholderTextColor="#9E9E9E"
                    />
                  </View>
                ) : (
                  <ScrollView
                    style={styles.cropTypeScrollView}
                    contentContainerStyle={styles.cropTypeScrollContent}
                    showsVerticalScrollIndicator={true}
                    persistentScrollbar={true}
                    nestedScrollEnabled={true}
                    alwaysBounceVertical={true}
                  >
                    <View style={styles.cropTypeGrid}>
                      {(() => {
                        // Get all crop types that belong to this category
                        const cropTypes = Object.keys(HARVEST_TYPES)
                          .filter(key => {
                            // Skip the main categories
                            if (['vegetable', 'fruit', 'grain', 'herb', 'other'].includes(key)) {
                              return false;
                            }
                            
                            return values.selectedCategory === 'vegetable' 
                              ? ['tomato', 'cucumber', 'potato', 'carrot', 'corn', 'onion', 'garlic', 'lettuce', 'pepper', 'eggplant', 'broccoli', 'spinach'].includes(key)
                              : values.selectedCategory === 'fruit'
                              ? ['apple', 'orange', 'banana', 'grape', 'watermelon', 'strawberry', 'pear', 'peach'].includes(key)
                              : values.selectedCategory === 'grain'
                              ? ['wheat', 'rice'].includes(key) 
                              : values.selectedCategory === 'herb'
                              ? ['mint', 'parsley', 'coriander'].includes(key)
                              : false;
                          })
                          .map(key => ({ key, ...HARVEST_TYPES[key] }));
                        
                        // If we have no specific types, show an input
                        if (cropTypes.length === 0) {
                          return (
                            <View style={styles.emptyTypesContainer}>
                              <Text style={[
                                styles.emptyTypesText, 
                                { color: theme.colors.neutral.textSecondary }
                              ]}>
                                لا توجد أنواع محددة لهذه الفئة، أدخل اسم المحصول
                              </Text>
                              <TextInput
                                style={[
                                  styles.textInput,
                                  {
                                    backgroundColor: theme.colors.neutral.surface,
                                    borderColor: touched.cropName && errors.cropName
                                      ? theme.colors.error
                                      : theme.colors.neutral.border,
                                    color: theme.colors.neutral.textPrimary,
                                    marginTop: 12
                                  },
                                ]}
                                value={values.cropName}
                                onChangeText={handleChange('cropName')}
                                onBlur={handleBlur('cropName')}
                                placeholder="أدخل اسم المحصول"
                                placeholderTextColor="#9E9E9E"
                              />
                            </View>
                          );
                        }
                        
                        // Otherwise show a grid of crops - use rows of 2 items for better visibility
                        // Group crops in rows of 2 for better display
                        const rows = [];
                        for (let i = 0; i < cropTypes.length; i += 2) {
                          const row = cropTypes.slice(i, i + 2);
                          rows.push(row);
                        }
                        
                        return rows.map((row, rowIndex) => (
                          <View key={`row-${rowIndex}`} style={styles.cropTypeRow}>
                            {row.map(cropType => {
                              // Check if this type is selected
                              const isSelected = values.type === cropType.key;

  return (
                                <TouchableOpacity
                                  key={cropType.key}
                                  style={[
                                    styles.cropTypeButton,
                                    {
                                      backgroundColor: isSelected
                                        ? theme.colors.primary.surface
                                        : theme.colors.neutral.surface,
                                      borderColor: isSelected
                                        ? theme.colors.primary.base
                                        : theme.colors.neutral.border,
                                    }
                                  ]}
                                  onPress={() => {
                                    setFieldValue('type', cropType.key);
                                    setFieldValue('cropName', cropType.name);
                                  }}
                                >
                                  <Text style={styles.cropTypeIcon}>{cropType.icon}</Text>
                                  <Text style={[
                                    styles.cropTypeName,
                                    {
                                      color: isSelected
                                        ? theme.colors.primary.base
                                        : theme.colors.neutral.textSecondary,
                                    }
                                  ]}>
                                    {cropType.name}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                            {/* Add a placeholder if we have an odd number of items in the last row */}
                            {row.length === 1 && <View style={styles.emptyButtonPlaceholder} />}
                          </View>
                        ));
                      })()}
                    </View>
                  </ScrollView>
                )}
                
                {touched.cropName && errors.cropName && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {errors.cropName}
                  </Text>
                )}
              </>
            )}
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.neutral.textSecondary }]}>
                تاريخ الحصاد *
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateButton, 
                  { 
                    borderColor: theme.colors.neutral.border,
                    shadowColor: theme.colors.neutral.textSecondary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2, 
                  }
                ]}
                onPress={() => {
                  showDatepicker('harvestDate');
                }}
              >
                <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary.base} style={{ marginLeft: 10 }} />
                <Text style={{ color: theme.colors.neutral.textPrimary }}>
                  {values.harvestDate ? new Date(values.harvestDate).toLocaleDateString('en-GB') : 'اختر تاريخ الحصاد'}
                </Text>
              </TouchableOpacity>
              {touched.harvestDate && errors.harvestDate && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.harvestDate}
                </Text>
              )}
            </View>
          </Animated.View>
        );
      
      case 2:
        return (
          <Animated.View entering={FadeIn} style={styles.formStep}>
            <Text style={[styles.stepTitle, { color: theme.colors.neutral.textPrimary }]}>
              الكمية والسعر
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.neutral.textSecondary }]}>
                الكمية *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.neutral.surface,
                    borderColor: touched.quantity && errors.quantity
                      ? theme.colors.error
                      : theme.colors.neutral.border,
                    color: theme.colors.neutral.textPrimary,
                  },
                ]}
                value={values.quantity.toString()}
                onChangeText={(value) => setFieldValue('quantity', value ? parseFloat(value) : '')}
                onBlur={handleBlur('quantity')}
                placeholder="أدخل الكمية"
                placeholderTextColor="#9E9E9E"
                keyboardType="numeric"
              />
              {touched.quantity && errors.quantity && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.quantity}
                </Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.neutral.textSecondary }]}>
                وحدة القياس *
              </Text>
              <Picker
                value={values.unit}
                onValueChange={(value) => setFieldValue('unit', value)}
                items={Object.keys(UNIT_TYPES).map(key => ({
                  label: `${UNIT_TYPES[key].icon} ${UNIT_TYPES[key].name}`,
                  value: key,
                }))}
                placeholder="اختر وحدة القياس"
              />
              {touched.unit && errors.unit && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.unit}
                </Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.neutral.textSecondary }]}>
                السعر (د.أ) *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.neutral.surface,
                    borderColor: touched.price && errors.price
                      ? theme.colors.error
                      : theme.colors.neutral.border,
                    color: theme.colors.neutral.textPrimary,
                  },
                ]}
                value={values.price.toString()}
                onChangeText={(value) => setFieldValue('price', value ? parseFloat(value) : '')}
                onBlur={handleBlur('price')}
                placeholder="أدخل السعر"
                placeholderTextColor="#9E9E9E"
                keyboardType="numeric"
              />
              {touched.price && errors.price && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.price}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.neutral.textSecondary }]}>
                الحد الأدنى للتنبيه
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.neutral.surface,
                    borderColor: touched.minQuantityAlert && errors.minQuantityAlert
                      ? theme.colors.error
                      : theme.colors.neutral.border,
                    color: theme.colors.neutral.textPrimary,
                  },
                ]}
                value={values.minQuantityAlert.toString()}
                onChangeText={(value) => setFieldValue('minQuantityAlert', value ? parseFloat(value) : 0)}
                onBlur={handleBlur('minQuantityAlert')}
                placeholder="أدخل الحد الأدنى للتنبيه"
                placeholderTextColor="#9E9E9E"
                keyboardType="numeric"
              />
              {touched.minQuantityAlert && errors.minQuantityAlert && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.minQuantityAlert}
                </Text>
              )}
            </View>
          </Animated.View>
        );
      
      case 3:
        return (
          <Animated.View entering={FadeIn} style={styles.formStep}>
            <Text style={[styles.stepTitle, { color: theme.colors.neutral.textPrimary }]}>
              معلومات الجودة والتخزين
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.neutral.textSecondary }]}>
                الجودة
              </Text>
              <Picker
                value={values.quality}
                onValueChange={(value) => setFieldValue('quality', value)}
                items={Object.keys(QUALITY_TYPES).map(key => ({
                  label: `${QUALITY_TYPES[key].icon} ${QUALITY_TYPES[key].name}`,
                  value: key,
                }))}
                placeholder="اختر مستوى الجودة"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.neutral.textSecondary }]}>
                نسبة الرطوبة (%)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.neutral.surface,
                    borderColor: touched.moisture && errors.moisture
                      ? theme.colors.error
                      : theme.colors.neutral.border,
                    color: theme.colors.neutral.textPrimary,
                  },
                ]}
                value={values.moisture.toString()}
                onChangeText={(value) => setFieldValue('moisture', value ? parseFloat(value) : 0)}
                onBlur={handleBlur('moisture')}
                placeholder="أدخل نسبة الرطوبة"
                placeholderTextColor="#9E9E9E"
                keyboardType="numeric"
              />
              {touched.moisture && errors.moisture && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.moisture}
                </Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.neutral.textSecondary }]}>
                موقع التخزين
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.neutral.surface,
                    borderColor: theme.colors.neutral.border,
                    color: theme.colors.neutral.textPrimary,
                  },
                ]}
                value={values.storageLocation}
                onChangeText={handleChange('storageLocation')}
                placeholder="أدخل موقع التخزين"
                placeholderTextColor="#9E9E9E"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.neutral.textSecondary }]}>
                رقم الدفعة
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.neutral.surface,
                    borderColor: theme.colors.neutral.border,
                    color: theme.colors.neutral.textPrimary,
                  },
                ]}
                value={values.batchNumber}
                onChangeText={handleChange('batchNumber')}
                placeholder="أدخل رقم الدفعة"
                placeholderTextColor="#9E9E9E"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.neutral.textSecondary }]}>
                تاريخ انتهاء الصلاحية
              </Text>
              <DatePicker
                value={values.expiryDate ? new Date(values.expiryDate) : null}
                onChange={(date) => setFieldValue('expiryDate', date ? date.toISOString() : '')}
                placeholder="اختر تاريخ انتهاء الصلاحية"
                optional
              />
            </View>
          </Animated.View>
        );
      
      case 4:
        return (
          <Animated.View entering={FadeIn} style={styles.formStep}>
            <Text style={[styles.stepTitle, { color: theme.colors.neutral.textPrimary }]}>
              معلومات إضافية
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.neutral.textSecondary }]}>
                ظروف التخزين
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.neutral.surface,
                    borderColor: theme.colors.neutral.border,
                    color: theme.colors.neutral.textPrimary,
                  },
                ]}
                value={values.storageConditions}
                onChangeText={handleChange('storageConditions')}
                placeholder="أدخل ظروف التخزين"
                placeholderTextColor="#9E9E9E"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.neutral.textSecondary }]}>
                الشهادات
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.neutral.surface,
                    borderColor: theme.colors.neutral.border,
                    color: theme.colors.neutral.textPrimary,
                  },
                ]}
                value={values.certifications}
                onChangeText={handleChange('certifications')}
                placeholder="أدخل الشهادات"
                placeholderTextColor="#9E9E9E"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.neutral.textSecondary }]}>
                ملاحظات
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.colors.neutral.surface,
                    borderColor: theme.colors.neutral.border,
                    color: theme.colors.neutral.textPrimary,
                  },
                ]}
                value={values.notes}
                onChangeText={handleChange('notes')}
                placeholder="أدخل ملاحظاتك"
                placeholderTextColor="#9E9E9E"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.summary}>
              <Text style={[styles.summaryTitle, { color: theme.colors.neutral.textPrimary }]}>
                ملخص المعلومات
              </Text>
              
              <View style={[styles.summaryCard, { backgroundColor: theme.colors.neutral.surface }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.neutral.textSecondary }]}>
                    اسم المحصول:
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.neutral.textPrimary }]}>
                    {values.cropName}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.neutral.textSecondary }]}>
                    النوع:
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.neutral.textPrimary }]}>
                    {HARVEST_TYPES[values.type]?.name || values.type}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.neutral.textSecondary }]}>
                    الكمية:
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.neutral.textPrimary }]}>
                    {values.quantity} {UNIT_TYPES[values.unit]?.name || values.unit}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.neutral.textSecondary }]}>
                    السعر:
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.neutral.textPrimary }]}>
                    {values.price} د.أ
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
        <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
        <View style={[styles.container, styles.centerContent]}>
          <Animated.View entering={FadeIn} style={styles.loadingContainer}>
            <Text style={styles.loadingIcon}>⚙️</Text>
            <ActivityIndicator size="large" color={theme.colors.primary.base} />
            <Text style={[styles.loadingText, { color: theme.colors.neutral.textSecondary }]}>
              {isEditing ? 'جاري تحميل تفاصيل المحصول...' : 'جاري التحميل...'}
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar backgroundColor={theme.colors.neutral.surface} barStyle="dark-content" />
      <View style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-right" size={24} color={theme.colors.neutral.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          {isEditing ? 'تعديل محصول' : 'إضافة محصول جديد'} 🌾
        </Text>
        <View style={styles.placeholder} />
          </View>

      {renderProgressBar()}
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Formik
            initialValues={harvest || initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {(formikProps) => (
              <View style={styles.formContainer}>
                {renderStepContent(formikProps)}
                
                <View style={styles.buttonsContainer}>
                  {currentStep > 1 && (
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.secondaryButton,
                        { 
                          backgroundColor: theme.colors.neutral.surface,
                          shadowColor: theme.colors.neutral.textSecondary,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 2,
                        },
                      ]}
                      onPress={prevStep}
                    >
                      <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.primary.base} />
                      <Text style={[styles.buttonText, { color: theme.colors.primary.base }]}>
                        السابق
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {currentStep < totalSteps ? (
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.primaryButton,
                        { 
                          backgroundColor: theme.colors.primary.base,
                          shadowColor: theme.colors.neutral.textSecondary,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                          elevation: 3,
                        },
                      ]}
                      onPress={nextStep}
                    >
                      <Text style={styles.buttonText}>
                        التالي
                      </Text>
                      <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.primaryButton,
                        { backgroundColor: theme.colors.primary.base },
                      ]}
                      onPress={() => formikProps.handleSubmit()}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Text style={styles.buttonText}>
                            {isEditing ? 'تحديث' : 'إضافة'}
                          </Text>
                          <MaterialCommunityIcons name="check" size={20} color="white" />
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </Formik>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingVertical: 12,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  formContainer: {
    flex: 1,
  },
  formStep: {
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'right',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlign: 'right',
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlign: 'right',
    fontSize: 16,
    minHeight: 100,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
  },
  primaryButton: {
    flex: 1,
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  summary: {
    marginTop: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryButton: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    padding: 8,
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
  },
  cropTypeScrollView: {
    height: 400,
    maxHeight: '60%',
    marginBottom: 20,
  },
  cropTypeScrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cropTypeGrid: {
    width: '100%',
  },
  cropTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  cropTypeButton: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    padding: 8,
  },
  cropTypeIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  cropTypeName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 6,
    color: '#000000',
  },
  emptyButtonPlaceholder: {
    width: '48%',
  },
  emptyTypesContainer: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
  },
  emptyTypesText: {
    fontSize: 14,
    textAlign: 'center',
  },
  stepInstruction: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backToCategories: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  selectedCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignSelf: 'center',
  },
  selectedCategoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AddHarvestScreen; 