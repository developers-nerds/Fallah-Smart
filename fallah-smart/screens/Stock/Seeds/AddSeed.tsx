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
  type: Yup.string().required('نوع البذور مطلوب'),
  quantity: Yup.string()
    .required('الكمية مطلوبة')
    .test('is-number', 'الكمية يجب أن تكون رقماً', value => !isNaN(parseFloat(value))),
  unit: Yup.string().required('وحدة القياس مطلوبة'),
  // Les autres champs ne sont plus obligatoires
  name: Yup.string(),
  price: Yup.string()
    .test('is-number', 'السعر يجب أن يكون رقماً', value => !value || !isNaN(parseFloat(value))),
  minQuantityAlert: Yup.string()
    .test('is-number', 'حد التنبيه يجب أن يكون رقماً', value => !value || !isNaN(parseFloat(value))),
  expiryDate: Yup.string(),
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
      fields: ['type', 'name', 'quantity', 'unit', 'price', 'minQuantityAlert', 'expiryDate'],
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
    
    // Liste des champs obligatoires par page
    const requiredFieldsByPage: { [key: number]: Array<keyof FormData> } = {
      0: ['type', 'quantity', 'unit'], // Première page: seulement type, quantité et unité sont obligatoires
      1: [], // Deuxième page: aucun champ obligatoire
      2: [], // Troisième page: aucun champ obligatoire 
      3: []  // Quatrième page: aucun champ obligatoire
    };
    
    const requiredFields = requiredFieldsByPage[currentPage] || [];
    
    // Ne vérifier que les champs obligatoires pour cette page
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
            'Authorization': tokens?.access ? `Bearer ${tokens.access}` : ''
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

  const handleCategorySelect = (category: string, values: FormData, setFieldValue: any) => {
    // Définir la catégorie sélectionnée
    setSelectedCategory(category);
    
    // Trouver le premier type de semence de cette catégorie
    const seedTypesOfCategory = Object.entries(SEED_TYPES)
      .filter(([_, seed]) => seed.category === category);
    
    if (seedTypesOfCategory.length > 0) {
      // Définir automatiquement le type sur le premier élément de cette catégorie
      setFieldValue('type', seedTypesOfCategory[0][0]);
    }
  };

  const renderField = (field: keyof FormData, values: FormData, errors: any, touched: any, handleChange: any, setFieldValue: any) => {
    const seedType = SEED_TYPES[values.type as keyof typeof SEED_TYPES];
    
    switch (field) {
      case 'name':
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
              <Text style={[styles.fieldIcon, { fontSize: 30 }]}>{seedType?.icon || '🌱'}</Text>
              <Text style={[styles.label, { 
                color: theme.colors.neutral.textPrimary,
                fontSize: 18,
                fontWeight: 'bold',
              }]}>
                اسم البذور
            </Text>
            </View>
              <TextInput
                value={values.name}
                onChangeText={handleChange('name')}
              error={touched.name && errors.name ? errors.name : undefined}
              placeholder={seedType?.name || 'أدخل اسم البذور'}
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8 }}
            />
            <Text style={[styles.helperText, { 
              color: 'rgba(150, 90, 30, 0.8)',
              fontSize: 14,
              fontStyle: 'italic',
              marginTop: 8,
              textAlign: 'center',
            }]}>
              تم اختيار الاسم تلقائيًا بناءً على نوع البذور المحدد
                </Text>
          </Animated.View>
        );
      case 'type':
        return (
          <Animated.View
            key={field}
            entering={FadeInRight.delay(50).springify()}
            style={[styles.fieldContainer, {
              backgroundColor: 'rgba(240, 250, 240, 0.5)',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: 'rgba(144, 238, 144, 0.4)',
            }]}
          >
            {selectedCategory && (
              <View style={styles.categoriesContainer}>
                <Text style={styles.sectionTitle}>اختر نوع البذور</Text>
                <View style={styles.seedTypeGrid}>
                  {Object.entries(SEED_TYPES)
                    .filter(([_, seed]) => seed.category === selectedCategory && seed.name !== 'الكل' && !seed.name.includes('الكل'))
                    .map(([key, seed], index) => {
                      const typeColors = [
                        '#8BC34A',
                        '#4CAF50',
                        '#009688',
                        '#CDDC39',
                        '#FFC107',
                        '#FF9800',
                      ];
                      
                      const colorIndex = index % typeColors.length;
                      const backgroundColor = values.type === key ? theme.colors.primary.base : typeColors[colorIndex];
                      const isSelected = values.type === key;

                      return (
                        <Animated.View
                          key={key}
                          entering={FadeInRight.delay(50 * index).springify()}
                        >
                          <TouchableOpacity
                            style={[
                              styles.seedTypeTile,
                              { 
                                backgroundColor: isSelected ? theme.colors.primary.base : '#FFFFFF',
                                borderColor: isSelected ? theme.colors.primary.base : typeColors[colorIndex],
                                borderWidth: 1.5,
                                elevation: isSelected ? 4 : 2,
                                shadowOpacity: isSelected ? 0.2 : 0.1,
                                shadowRadius: isSelected ? 4 : 2,
                                shadowOffset: { width: 0, height: isSelected ? 2 : 1 },
                                transform: [{ scale: isSelected ? 1.03 : 1 }],
                              }
                            ]}
                            onPress={() => {
                              setFieldValue('type', key);
                              setFieldValue('name', seed.name);
                            }}
                          >
                            <Text style={[styles.seedTypeIcon, {
                              color: isSelected ? '#FFFFFF' : typeColors[colorIndex],
                              fontSize: 38,
                              marginBottom: 8
                            }]}>{seed.icon}</Text>
                            
                            <Text style={[
                              styles.seedTypeName,
                              { 
                                color: isSelected ? '#FFFFFF' : '#333333',
                                fontWeight: isSelected ? '700' : '600',
                                fontSize: 15
                              }
                            ]}>
                              {seed.name}
                            </Text>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    })}
                </View>
              </View>
            )}
            
            {touched.type && errors.type && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.type}</Text>
            )}
          </Animated.View>
        );
      case 'quantity':
        return (
          <Animated.View 
            key={field} 
            entering={FadeInRight.delay(150).springify()}
            style={styles.rowContainer}
          >
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
              <View style={[styles.pickerContainer, { 
                borderColor: theme.colors.neutral.border,
                backgroundColor: theme.colors.neutral.surface,
                elevation: 1,
                shadowOpacity: 0.1,
                shadowRadius: 2,
                shadowOffset: { width: 0, height: 1 },
              }]}>
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
          </Animated.View>
        );
      case 'price':
        return (
          <Animated.View
            key={field}
            entering={FadeInRight.delay(200).springify()}
          >
              <TextInput
                label="السعر"
              value={values.price}
                onChangeText={handleChange('price')}
                keyboardType="numeric"
              error={touched.price && errors.price ? errors.price : undefined}
            />
          </Animated.View>
        );
      case 'minQuantityAlert':
        return (
          <Animated.View
            key={field}
            entering={FadeInRight.delay(250).springify()}
          >
            <TextInput
              label="حد التنبيه"
              value={values.minQuantityAlert}
              onChangeText={handleChange('minQuantityAlert')}
              keyboardType="numeric"
              error={touched.minQuantityAlert && errors.minQuantityAlert ? errors.minQuantityAlert : undefined}
            />
          </Animated.View>
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
          <Animated.View 
            key={field} 
            entering={FadeInRight.delay(300).springify()}
            style={styles.fieldContainer}
          >
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              {dateLabel}
            </Text>
              <TouchableOpacity
              style={[
                styles.datePickerButton,
                { 
                  backgroundColor: theme.colors.neutral.surface,
                  borderColor: theme.colors.neutral.border,
                  elevation: 2,
                  shadowColor: theme.colors.neutral.textSecondary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }
              ]}
              onPress={() => showDatePickerModal(field as DateField)}
            >
              <Text style={{ color: theme.colors.neutral.textPrimary, fontWeight: '500' }}>
                {values[field] ? new Date(values[field]).toLocaleDateString('en-GB') : 'غير محدد'}
              </Text>
              <Feather name="calendar" size={20} color={theme.colors.primary.base} />
              </TouchableOpacity>
            {touched[field] && errors[field] && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors[field]}</Text>
            )}
          </Animated.View>
        );
      case 'notes':
      case 'plantingInstructions':
        return (
          <Animated.View
            key={field}
            entering={FadeInRight.delay(350).springify()}
          >
              <TextInput
              label={field === 'notes' ? 'ملاحظات' : 'تعليمات الزراعة'}
              value={values[field]}
              onChangeText={handleChange(field)}
              multiline
              numberOfLines={4}
              error={touched[field] && errors[field] ? errors[field] : undefined}
            />
          </Animated.View>
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
        
        // Get icon based on field name
        const getFieldIcon = (fieldName: string) => {
          const icons: {[key: string]: string} = {
            variety: '🔍',
            manufacturer: '🏭',
            batchNumber: '🔢',
            location: '📍',
            supplier: '🚚',
            germinationTime: '⏱️',
            growingSeason: '🌱',
            cropType: '🌿',
            germination: '📈',
            certificationInfo: '📜',
          };
          return icons[fieldName] || '📋';
        };
        
        return (
          <Animated.View
            key={field}
            entering={FadeInRight.delay(200).springify()}
            style={styles.fieldContainer}
          >
            <View style={styles.fieldLabelContainer}>
              <Text style={styles.fieldIcon}>{getFieldIcon(String(field))}</Text>
              <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                {fieldLabels[field as keyof FormData] || String(field)}
              </Text>
            </View>
              <TextInput
              value={values[field]}
              onChangeText={handleChange(field)}
              keyboardType={field === 'germination' ? 'numeric' : 'default'}
              error={touched[field] && errors[field] ? errors[field] : undefined}
            />
          </Animated.View>
        );
    }
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {formPages.map((page, index) => (
          <React.Fragment key={index}>
              <TouchableOpacity
              onPress={() => {
                if (index <= currentPage) {
                  setCurrentPage(index);
                }
              }}
            >
              <Animated.View 
                style={[
                  styles.progressDot, 
                  { 
                    backgroundColor: index <= currentPage 
                      ? theme.colors.primary.base 
                      : theme.colors.neutral.border,
                    transform: [{ scale: index === currentPage ? 1.3 : 1 }],
                    elevation: index === currentPage ? 5 : 0,
                    shadowOpacity: index === currentPage ? 0.3 : 0,
                    shadowRadius: 5,
                    shadowOffset: { width: 0, height: 3 },
                  }
                ]} 
              >
                {index < currentPage && (
                  <Feather name="check" size={16} color="#FFFFFF" />
                )}
              </Animated.View>
              <Animated.Text 
                style={[
                  styles.progressLabel,
                  {
                    color: index <= currentPage 
                      ? theme.colors.primary.base 
                      : theme.colors.neutral.textSecondary,
                    opacity: index === currentPage ? 1 : 0.7,
                    fontSize: index === currentPage ? 14 : 12,
                    fontWeight: index === currentPage ? 'bold' : 'normal',
                  }
                ]}
              >
                {page.title}
              </Animated.Text>
              </TouchableOpacity>
            {index < formPages.length - 1 && (
              <View 
                style={[
                  styles.progressLine, 
                  { 
                    backgroundColor: index < currentPage 
                      ? theme.colors.primary.base 
                      : theme.colors.neutral.border,
                    height: index === currentPage ? 4 : 2,
                  }
                ]} 
              />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  // Rendu de l'en-tête de la page
  const renderPageHeader = () => (
    <View style={styles.pageHeader}>
      <Animated.View 
        style={[styles.pageIconContainer, {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 6,
        }]}
        entering={ZoomIn.delay(100).springify()}
      >
        <Text style={styles.pageIcon}>🌾</Text>
      </Animated.View>
      <Animated.Text 
        style={[styles.pageTitle, {
          textShadowColor: 'rgba(0, 0, 0, 0.1)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
        }]}
        entering={FadeInDown.delay(200).springify()}
      >
        إضافة بذور جديدة
      </Animated.Text>
      <Animated.Text 
        style={[styles.pageSubtitle, {
          backgroundColor: 'rgba(144, 238, 144, 0.1)',
          paddingVertical: 10,
          paddingHorizontal: 15,
          borderRadius: 20,
          maxWidth: '90%',
          textAlign: 'center',
          marginTop: 10,
        }]}
        entering={FadeInDown.delay(300).springify()}
      >
        أضف بذور جديدة إلى المخزون لتتبع الكميات والحالة
      </Animated.Text>
            </View>
  );

  // Rendu des catégories avec les props correctes
  const renderCategoryButtons = (values: any, setFieldValue: (field: string, value: any) => void) => (
    <View style={styles.categoriesContainer}>
      <Text style={styles.sectionTitle}>اختر فئة البذور</Text>
      <View style={styles.categoriesGrid}>
        {Object.entries(SEED_CATEGORIES)
          .filter(([key]) => key !== 'الكل' && !key.includes('الكل'))
          .map(([key, categoryIcon], index) => {
          return (
            <Animated.View
              key={key}
              entering={FadeInDown.delay(100 * index).springify()}
            >
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  { 
                    backgroundColor: selectedCategory === key ? theme.colors.primary.base : '#ffffff',
                    borderColor: selectedCategory === key ? theme.colors.primary.base : theme.colors.neutral.border,
                    transform: [{ scale: selectedCategory === key ? 1.05 : 1 }]
                  }
                ]}
                onPress={() => {
                  setSelectedCategory(key);
                  setFieldValue('category', key);
                }}
              >
                <Text style={styles.categoryIcon}>{categoryIcon}</Text>
                <Text 
                  style={[
                    styles.categoryName,
                    { color: selectedCategory === key ? '#ffffff' : theme.colors.neutral.textPrimary }
                  ]}
                >
                  {key}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );

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
                  <Animated.Text 
                    entering={FadeInRight.delay(50).springify()}
                    style={[styles.headerTitle, { color: theme.colors.primary.base }]}
                  >
                    {seedId ? 'تعديل البذور' : 'إضافة بذور جديدة'}
                  </Animated.Text>
                  {renderProgressBar()}
            </View>

                <View style={[styles.pageContainer, {
                  backgroundColor: theme.colors.neutral.surface,
                  shadowColor: "#000000",
                }]}>
                  {renderPageHeader()}
                  
                  <Animated.View 
                    style={[styles.formContainer, {
                      backgroundColor: '#ffffff',
                    }]}
                    entering={FadeInRight.delay(200).springify()}
                  >
                    {/* Catégories - Visible sur la première page seulement */}
                    {currentPage === 0 && renderCategoryButtons(values, setFieldValue)}

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

              <View style={[styles.footer, { 
                backgroundColor: theme.colors.neutral.surface,
                borderTopColor: theme.colors.neutral.border,
                paddingVertical: 20,
              }]}>
                <View style={styles.buttonContainer}>
                  {currentPage > 0 && (
                    <CustomButton
                      title="السابق ←"
                      onPress={prevPage}
                      type="secondary"
                      style={{ 
                        flex: 1, 
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: theme.colors.primary.base,
                        shadowColor: theme.colors.neutral.textSecondary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    />
                  )}
                  
                  {currentPage < formPages.length - 1 ? (
                    <CustomButton
                      title="→ التالي"
                      onPress={nextPage}
                      type="primary"
                      disabled={!validateCurrentPage(values)}
                      style={{ 
                        flex: 1,
                        borderRadius: 10,
                        elevation: 5,
                        shadowColor: theme.colors.neutral.textSecondary,
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                      }}
                    />
                  ) : (
                    <CustomButton
                      title="✓ حفظ"
                      onPress={() => handleSubmit()}
                      type="primary"
                      disabled={!isValid}
                      style={{ 
                        flex: 1, 
                        borderRadius: 10,
                        elevation: 5,
                        shadowColor: theme.colors.neutral.textSecondary,
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                      }}
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  progressLine: {
    width: 30,
    marginHorizontal: 5,
  },
  progressLabel: {
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 70,
  },
  pageContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  pageHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 12,
  },
  pageIconContainer: {
    width: 85,
    height: 85,
    backgroundColor: '#f0f9e8',
    borderRadius: 42.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  pageIcon: {
    fontSize: 40,
    textAlign: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  formContainer: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 20,
    gap: 20,
    backgroundColor: '#fff',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
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
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  categoryChip: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 3,
    minWidth: 120,
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  seedNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  seedIconLarge: {
    fontSize: 40,
    marginRight: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
    color: '#666',
    fontStyle: 'italic',
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  seedTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  seedTypeTile: {
    width: width / 4.5,
    height: 100,
    margin: 1,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  seedTypeIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  seedTypeIcon: {
    fontSize: 32,
  },
  seedTypeName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    elevation: 8,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldIcon: {
    fontSize: 26,
  },
  fieldHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  seedTypeIconFallback: {
    fontSize: 30,
    color: '#000000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'right',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  categoryButton: {
    width: 90,
    height: 90,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AddSeedScreen; 