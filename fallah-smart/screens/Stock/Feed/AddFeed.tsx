import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  GestureResponderEvent,
  StatusBar,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useFeed } from '../../../context/FeedContext';
import { StockFeed } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { Formik, FormikProps } from 'formik';
import * as Yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TextInput } from '../../../components/TextInput';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import Animated, { FadeInDown, FadeInRight, FadeInLeft } from 'react-native-reanimated';
import { theme } from '../../../theme/theme';

type Theme = typeof theme;

const { width } = Dimensions.get('window');

type AddFeedScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddFeed'>;
  route: RouteProp<StockStackParamList, 'AddFeed'>;
};

const validationSchema = Yup.object().shape({
  name: Yup.string().required('الاسم مطلوب'),
  animalType: Yup.string().required('نوع الحيوان مطلوب'),
  quantity: Yup.number()
    .required('الكمية مطلوبة')
    .min(0, 'يجب أن تكون الكمية أكبر من 0'),
  unit: Yup.string().required('الوحدة مطلوبة'),
  price: Yup.number()
    .required('السعر مطلوب')
    .min(0, 'يجب أن يكون السعر أكبر من 0'),
  expiryDate: Yup.date().required('تاريخ الصلاحية مطلوب'),
  manufacturer: Yup.string(),
  batchNumber: Yup.string(),
  purchaseDate: Yup.date(),
  location: Yup.string(),
  supplier: Yup.string(),
  nutritionalInfo: Yup.string(),
  recommendedUsage: Yup.string(),
  targetAnimals: Yup.string(),
  notes: Yup.string(),
  dailyConsumptionRate: Yup.number().min(0),
  minQuantityAlert: Yup.number().min(0),
});

// Add these type definitions at the top of the file
interface AnimalTypeInfo {
  icon: string;
  name: string;
  category: string;
}

interface FeedNameInfo {
  icon: string;
  name: string;
  category: string;
}

interface UnitInfo {
  icon: string;
  name: string;
  category: string;
  abbreviation?: string;
}

// Feed names based on animal categories with icons
const FEED_NAMES: Record<string, FeedNameInfo> = {
  // Livestock Feed (أعلاف الماشية)
  cattle_concentrate: { icon: '🌾', name: 'علف مركز للأبقار', category: 'أعلاف الماشية' },
  dairy_feed: { icon: '🥛', name: 'علف الألبان', category: 'أعلاف الماشية' },
  beef_feed: { icon: '🥩', name: 'علف التسمين', category: 'أعلاف الماشية' },
  calf_feed: { icon: '🐄', name: 'علف العجول', category: 'أعلاف الماشية' },
  sheep_concentrate: { icon: '🌿', name: 'علف الأغنام المركز', category: 'أعلاف الماشية' },
  ewe_feed: { icon: '🐑', name: 'علف النعاج', category: 'أعلاف الماشية' },
  lamb_feed: { icon: '🐑', name: 'علف الحملان', category: 'أعلاف الماشية' },
  camel_concentrate: { icon: '🐪', name: 'علف الإبل المركز', category: 'أعلاف الماشية' },
  horse_feed: { icon: '🐎', name: 'علف الخيول', category: 'أعلاف الماشية' },
  
  // Poultry Feed (أعلاف الدواجن)
  layer_feed: { icon: '🥚', name: 'علف الدجاج البياض', category: 'أعلاف الدواجن' },
  broiler_feed: { icon: '🍗', name: 'علف الدجاج اللاحم', category: 'أعلاف الدواجن' },
  starter_feed: { icon: '🐥', name: 'علف البادئ', category: 'أعلاف الدواجن' },
  grower_feed: { icon: '🐔', name: 'علف النمو', category: 'أعلاف الدواجن' },
  duck_feed: { icon: '🦆', name: 'علف البط', category: 'أعلاف الدواجن' },
  turkey_feed: { icon: '🦃', name: 'علف الديك الرومي', category: 'أعلاف الدواجن' },
  
  // Fish Feed (أعلاف الأسماك)
  floating_fish_feed: { icon: '🐟', name: 'علف الأسماك العائم', category: 'أعلاف الأسماك' },
  sinking_fish_feed: { icon: '🎣', name: 'علف الأسماك الغاطس', category: 'أعلاف الأسماك' },
  
  // Supplements (المكملات الغذائية)
  mineral_supplement: { icon: '🧂', name: 'مكملات معدنية', category: 'المكملات الغذائية' },
  vitamin_supplement: { icon: '💊', name: 'مكملات فيتامينات', category: 'المكملات الغذائية' },
  protein_supplement: { icon: '🥜', name: 'مكملات بروتين', category: 'المكملات الغذائية' },
  
  // Raw Materials (المواد الخام)
  corn: { icon: '🌽', name: 'ذرة', category: 'المواد الخام' },
  wheat: { icon: '🌾', name: 'قمح', category: 'المواد الخام' },
  barley: { icon: '🌾', name: 'شعير', category: 'المواد الخام' },
  soybean: { icon: '🫘', name: 'فول الصويا', category: 'المواد الخام' },
  hay: { icon: '🌿', name: 'دريس', category: 'المواد الخام' },
  straw: { icon: '🌾', name: 'تبن', category: 'المواد الخام' },
  
  // Other (أخرى)
  custom_feed: { icon: '🔄', name: 'علف مخصص', category: 'أخرى' },
};

// Units with categories and icons
const UNITS: Record<string, UnitInfo> = {
  // Weight Units (وحدات الوزن)
  gram: { icon: '⚖️', name: 'جرام', category: 'وحدات الوزن', abbreviation: 'g' },
  kilogram: { icon: '⚖️', name: 'كيلوجرام', category: 'وحدات الوزن', abbreviation: 'kg' },
  ton: { icon: '🏗️', name: 'طن', category: 'وحدات الوزن', abbreviation: 't' },
  
  // Package Units (وحدات العبوات)
  bag: { icon: '💼', name: 'جوال', category: 'وحدات العبوات' },
  sack: { icon: '🛍️', name: 'كيس', category: 'وحدات العبوات' },
  box: { icon: '📦', name: 'صندوق', category: 'وحدات العبوات' },
  container: { icon: '🗄️', name: 'حاوية', category: 'وحدات العبوات' },
  
  // Volume Units (وحدات الحجم)
  liter: { icon: '🥛', name: 'لتر', category: 'وحدات الحجم', abbreviation: 'L' },
  milliliter: { icon: '💧', name: 'مليلتر', category: 'وحدات الحجم', abbreviation: 'mL' },
  
  // Bulk Units (وحدات السائب)
  bale: { icon: '🌾', name: 'بالة', category: 'وحدات السائب' },
  bundle: { icon: '🎋', name: 'حزمة', category: 'وحدات السائب' },
};

const ANIMAL_TYPES: Record<string, AnimalTypeInfo> = {
  // Livestock (ماشية)
  cow: { icon: '🐄', name: 'بقرة', category: 'ماشية' },
  bull: { icon: '🐂', name: 'ثور', category: 'ماشية' },
  buffalo: { icon: '🦬', name: 'جاموس', category: 'ماشية' },
  sheep: { icon: '🐑', name: 'خروف', category: 'ماشية' },
  ram: { icon: '🐏', name: 'كبش', category: 'ماشية' },
  goat: { icon: '🐐', name: 'ماعز', category: 'ماشية' },
  camel: { icon: '🐪', name: 'جمل', category: 'ماشية' },
  horse: { icon: '🐎', name: 'حصان', category: 'ماشية' },
  donkey: { icon: '🦓', name: 'حمار', category: 'ماشية' },
  ox: { icon: '🐃', name: 'ثور الحراثة', category: 'ماشية' },
  llama: { icon: '🦙', name: 'لاما', category: 'ماشية' },
  
  // Poultry (دواجن)
  chicken: { icon: '🐔', name: 'دجاج', category: 'دواجن' },
  rooster: { icon: '🐓', name: 'ديك', category: 'دواجن' },
  chick: { icon: '🐥', name: 'كتكوت', category: 'دواجن' },
  duck: { icon: '🦆', name: 'بط', category: 'دواجن' },
  turkey: { icon: '🦃', name: 'ديك رومي', category: 'دواجن' },
  goose: { icon: '🦢', name: 'إوز', category: 'دواجن' },
  
  // Birds (طيور)
  pigeon: { icon: '🕊️', name: 'حمام', category: 'طيور' },
  dove: { icon: '🕊️', name: 'يمام', category: 'طيور' },
  peacock: { icon: '🦚', name: 'طاووس', category: 'طيور' },
  parrot: { icon: '🦜', name: 'ببغاء', category: 'طيور' },
  
  // Small Animals (حيوانات صغيرة)
  rabbit: { icon: '🐰', name: 'أرنب', category: 'حيوانات صغيرة' },
  
  // Guard/Working Animals (حيوانات الحراسة والعمل)
  dog: { icon: '🐕', name: 'كلب حراسة', category: 'حيوانات الحراسة والعمل' },
  
  // Insects (حشرات)
  bee: { icon: '🐝', name: 'نحل', category: 'حشرات' },
  
  // Fish (أسماك)
  fish: { icon: '🐟', name: 'أسماك', category: 'أسماك' },
  
  // Other (أخرى)
  other: { icon: '🔄', name: 'أخرى', category: 'أخرى' },
};

const AddFeedScreen: React.FC<AddFeedScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { feed, addFeed, updateFeed, loading } = useFeed();
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [existingFeed, setExistingFeed] = useState<StockFeed | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'expiry' | 'purchase' | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // For direct access to form ref
  const formikRef = React.useRef<FormikProps<any>>(null);

  // Define form steps
  const formSteps = [
    { title: 'المعلومات الأساسية', icon: 'information-outline' },
    { title: 'معلومات إضافية', icon: 'card-bulleted-outline' },
    { title: 'معلومات التغذية', icon: 'food-apple-outline' },
    { title: 'ملاحظات', icon: 'note-text-outline' }
  ];

  useEffect(() => {
    if (route.params?.feedId) {
      const foundFeed = feed.find(f => f.id === route.params.feedId);
      if (foundFeed) {
        setExistingFeed(foundFeed);
      }
    }
  }, [feed, route.params?.feedId]);

  const initialValues: Partial<StockFeed> = {
    name: existingFeed?.name || '',
    animalType: existingFeed?.animalType || '',
    quantity: existingFeed?.quantity || 0,
    unit: existingFeed?.unit || '',
    price: existingFeed?.price || 0,
    expiryDate: existingFeed?.expiryDate ? new Date(existingFeed.expiryDate).toISOString() : new Date().toISOString(),
    manufacturer: existingFeed?.manufacturer || '',
    batchNumber: existingFeed?.batchNumber || '',
    purchaseDate: existingFeed?.purchaseDate ? new Date(existingFeed.purchaseDate).toISOString() : new Date().toISOString(),
    location: existingFeed?.location || '',
    supplier: existingFeed?.supplier || '',
    nutritionalInfo: existingFeed?.nutritionalInfo || '',
    recommendedUsage: existingFeed?.recommendedUsage || '',
    targetAnimals: existingFeed?.targetAnimals || '',
    notes: existingFeed?.notes || '',
    dailyConsumptionRate: existingFeed?.dailyConsumptionRate || 0,
    minQuantityAlert: existingFeed?.minQuantityAlert || 100,
  };

  // Handlers for form steps navigation
  const handleNextStep = () => {
    // Validate current step fields before proceeding
    if (formikRef.current) {
      const errors = formikRef.current.errors;
      const touched = formikRef.current.touched;
      const values = formikRef.current.values;
      
      // Validate essential fields in first step before proceeding
      if (currentStep === 0) {
        // Touch all fields in the first step to trigger validation
        formikRef.current.setFieldTouched('animalType', true);
        formikRef.current.setFieldTouched('name', true);
        formikRef.current.setFieldTouched('quantity', true);
        formikRef.current.setFieldTouched('unit', true);
        formikRef.current.setFieldTouched('price', true);
        formikRef.current.setFieldTouched('expiryDate', true);
        
        // Check if there are any errors in the essential fields
        if (
          !values.animalType || 
          !values.name || 
          !values.quantity || 
          !values.unit || 
          !values.price ||
          !values.expiryDate ||
          errors.animalType || 
          errors.name || 
          errors.quantity || 
          errors.unit || 
          errors.price ||
          errors.expiryDate
        ) {
          Alert.alert('تحقق من البيانات', 'يرجى إدخال جميع المعلومات الأساسية بشكل صحيح');
          return;
        }
      }
      
      if (currentStep < formSteps.length - 1) {
        setCurrentStep(prevStep => prevStep + 1);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };

  // Handlers for selecting items in dropdowns
  const handleAnimalTypeSelect = (name: string) => {
    if (formikRef.current) {
      formikRef.current.setFieldValue('animalType', name);
      console.log(`Selected animal type (direct): ${name}`);
    }
    setShowTypeModal(false);
  };

  const handleFeedNameSelect = (name: string) => {
    if (formikRef.current) {
      formikRef.current.setFieldValue('name', name);
      console.log(`Selected feed name (direct): ${name}`);
    }
    setShowNameModal(false);
  };

  const handleUnitSelect = (name: string) => {
    if (formikRef.current) {
      formikRef.current.setFieldValue('unit', name);
      console.log(`Selected unit (direct): ${name}`);
    }
    setShowUnitModal(false);
  };

  const handleSubmit = async (values: Partial<StockFeed>) => {
    try {
      setIsSubmitting(true);
      
      // Format the dates properly for API submission
      const formattedValues = {
        ...values,
        expiryDate: new Date(values.expiryDate || '').toISOString(),
        purchaseDate: values.purchaseDate ? new Date(values.purchaseDate).toISOString() : undefined,
        // Ensure numbers are properly typed
        quantity: Number(values.quantity),
        price: Number(values.price),
        minQuantityAlert: Number(values.minQuantityAlert),
        dailyConsumptionRate: Number(values.dailyConsumptionRate),
      };

      // Get token for authentication
      const tokens = await storage.getTokens();
      
      if (!tokens?.access) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولا');
        return;
      }
      
      if (existingFeed) {
        await axios.put(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/feed/${existingFeed.id}`,
          formattedValues,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokens.access}`
            }
          }
        );
      } else {
        await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/stock/feed`,
          formattedValues,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokens.access}`
            }
          }
        );
      }
        
          // Navigate back after successful submission
          navigation.goBack();
    } catch (error) {
      console.error('Error saving feed:', error);
      Alert.alert('خطأ', 'فشل في حفظ العلف');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get date value
  const getDateValue = (dateString: string | undefined): Date => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  if (loading || isSubmitting) {
    return (
      <View style={[styles(theme).container, styles(theme).centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  const renderStepIndicator = () => {
    return (
      <View style={styles(theme).stepIndicatorContainer}>
        {formSteps.map((step, index) => (
          <View key={index} style={styles(theme).stepIndicatorItem}>
            <View 
              style={[
                styles(theme).stepDot, 
                currentStep === index ? 
                  { backgroundColor: theme.colors.primary.base } : 
                  currentStep > index ? 
                    { backgroundColor: theme.colors.success } : 
                    { backgroundColor: theme.colors.neutral.border }
              ]}
            >
              <MaterialCommunityIcons 
                name={
                  currentStep > index ? 
                    "check" : 
                    step.icon as any
                } 
                size={currentStep > index ? 16 : 14} 
                color={currentStep > index ? "white" : currentStep === index ? "white" : theme.colors.neutral.textSecondary} 
              />
            </View>
            {index < formSteps.length - 1 && (
              <View 
                style={[
                  styles(theme).stepLine, 
                  { backgroundColor: currentStep > index ? theme.colors.success : theme.colors.neutral.border }
                ]} 
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar 
        backgroundColor={theme.colors.neutral.surface}
        barStyle="dark-content"
      />
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        innerRef={formikRef}
        enableReinitialize
      >
        {({ handleChange, handleBlur, handleSubmit: formikSubmit, values, errors, touched, setFieldValue }) => (
          <View style={styles(theme).formContainer}>
            {renderStepIndicator()}
            
            <View style={styles(theme).stepTitleContainer}>
              <Text style={styles(theme).stepTitle}>{formSteps[currentStep].title}</Text>
              <Text style={styles(theme).stepProgress}>
                {currentStep + 1}/{formSteps.length}
              </Text>
            </View>
            
            <ScrollView 
              style={styles(theme).container}
              contentContainerStyle={styles(theme).scrollContent}
              showsVerticalScrollIndicator={false}
            >
            <View style={styles(theme).content}>
                {/* Step 1: Basic Information */}
                {currentStep === 0 && (
                  <Animated.View 
                    entering={FadeInRight.duration(300)} 
                    style={[styles(theme).section, { backgroundColor: theme.colors.neutral.surface }]}
                  >
                    {/* Animal Type Selection */}
                    <View style={styles(theme).inputGroup}>
                  <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
                        نوع الحيوان *
                  </Text>
                      <View
                        style={[
                          styles(theme).pickerContainer,
                          { 
                            backgroundColor: theme.colors.neutral.surface,
                            borderColor: theme.colors.neutral.border,
                            borderWidth: 1,
                            borderRadius: 8,
                            marginBottom: 12
                          }
                        ]}
                      >
                  <Picker
                    selectedValue={values.animalType}
                          onValueChange={(itemValue) => {
                            setFieldValue('animalType', itemValue);
                            console.log(`Direct picker selected: ${itemValue}`);
                          }}
                          style={{ direction: 'rtl' }}
                        >
                          <Picker.Item label="اختر نوع الحيوان" value="" />
                          {Object.entries(ANIMAL_TYPES).map(([id, animal]) => (
                            <Picker.Item key={id} label={`${animal.icon} ${animal.name}`} value={animal.name} />
                          ))}
                        </Picker>
                      </View>
                      {touched.animalType && errors.animalType && (
                        <Text style={{ color: theme.colors.error, fontSize: 12, marginTop: 4 }}>
                          {errors.animalType}
                        </Text>
                      )}
                    </View>

                    {/* Feed Name Selection */}
                    <View style={styles(theme).inputGroup}>
                      <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
                        اسم العلف *
                      </Text>
                      <View
                        style={[
                          styles(theme).pickerContainer,
                          { 
                            backgroundColor: theme.colors.neutral.surface,
                            borderColor: theme.colors.neutral.border,
                            borderWidth: 1,
                            borderRadius: 8,
                            marginBottom: 12
                          }
                        ]}
                      >
                        <Picker
                          selectedValue={values.name}
                          onValueChange={(itemValue) => {
                            setFieldValue('name', itemValue);
                            console.log(`Direct picker selected feed: ${itemValue}`);
                          }}
                          style={{ direction: 'rtl' }}
                        >
                          <Picker.Item label="اختر نوع العلف" value="" />
                          {Object.entries(FEED_NAMES).map(([id, feed]) => (
                            <Picker.Item key={id} label={`${feed.icon} ${feed.name}`} value={feed.name} />
                          ))}
                        </Picker>
                      </View>
                      {touched.name && errors.name && (
                        <Text style={{ color: theme.colors.error, fontSize: 12, marginTop: 4 }}>
                          {errors.name}
                        </Text>
                      )}
                    </View>

                    {/* Unit Selection */}
                    <View style={styles(theme).inputGroup}>
                      <Text style={[styles(theme).label, { color: theme.colors.neutral.textSecondary }]}>
                        الوحدة *
                      </Text>
                      <View
                        style={[
                          styles(theme).pickerContainer,
                          { 
                            backgroundColor: theme.colors.neutral.surface,
                            borderColor: theme.colors.neutral.border,
                            borderWidth: 1,
                            borderRadius: 8,
                            marginBottom: 12
                          }
                        ]}
                      >
                        <Picker
                          selectedValue={values.unit}
                          onValueChange={(itemValue) => {
                            setFieldValue('unit', itemValue);
                            console.log(`Direct picker selected unit: ${itemValue}`);
                          }}
                          style={{ direction: 'rtl' }}
                        >
                          <Picker.Item label="اختر الوحدة" value="" />
                          {Object.entries(UNITS).map(([id, unit]) => (
                            <Picker.Item key={id} label={`${unit.icon} ${unit.name}`} value={unit.name} />
                    ))}
                  </Picker>
                </View>
                      {touched.unit && errors.unit && (
                        <Text style={{ color: theme.colors.error, fontSize: 12, marginTop: 4 }}>
                          {errors.unit}
                        </Text>
                      )}
                    </View>

                <TextInput
                  label="الكمية"
                  value={values.quantity?.toString()}
                  onChangeText={text => setFieldValue('quantity', Number(text))}
                  onBlur={handleBlur('quantity')}
                  error={touched.quantity && errors.quantity ? errors.quantity : undefined}
                  keyboardType="numeric"
                />

                <TextInput
                  label="السعر"
                  value={values.price?.toString()}
                  onChangeText={text => setFieldValue('price', Number(text))}
                  onBlur={handleBlur('price')}
                  error={touched.price && errors.price ? errors.price : undefined}
                  keyboardType="numeric"
                />

                    {/* Date Selection */}
                    <View style={styles(theme).dateSection}>
                      <TouchableOpacity
                        style={[
                          styles(theme).dateButton,
                          { borderColor: theme.colors.neutral.border }
                        ]}
                        onPress={() => setShowDatePicker('expiry')}
                      >
                        <MaterialCommunityIcons
                          name="calendar"
                          size={24}
                          color={theme.colors.primary.base}
                        />
                        <Text style={[
                          styles(theme).dateButtonText,
                          { color: theme.colors.neutral.textPrimary }
                        ]}>
                          تاريخ الصلاحية: {new Date(values.expiryDate || new Date()).toLocaleDateString('ar-SA')}
                        </Text>
                      </TouchableOpacity>

                <TouchableOpacity
                        style={[
                          styles(theme).dateButton,
                          { borderColor: theme.colors.neutral.border }
                        ]}
                        onPress={() => setShowDatePicker('purchase')}
                      >
                        <MaterialCommunityIcons
                          name="calendar-clock"
                          size={24}
                          color={theme.colors.primary.base}
                        />
                        <Text style={[
                          styles(theme).dateButtonText,
                          { color: theme.colors.neutral.textPrimary }
                        ]}>
                          تاريخ الشراء: {new Date(values.purchaseDate || new Date()).toLocaleDateString('ar-SA')}
                  </Text>
                </TouchableOpacity>
              </View>
                  </Animated.View>
                )}

                {/* Step 2: Additional Information */}
                {currentStep === 1 && (
                  <Animated.View 
                    entering={FadeInRight.duration(300)}
                    style={[styles(theme).section, { backgroundColor: theme.colors.neutral.surface }]}
                  >
                <TextInput
                  label="الشركة المصنعة"
                  value={values.manufacturer}
                  onChangeText={handleChange('manufacturer')}
                  onBlur={handleBlur('manufacturer')}
                />
                <TextInput
                  label="رقم الدفعة"
                  value={values.batchNumber}
                  onChangeText={handleChange('batchNumber')}
                  onBlur={handleBlur('batchNumber')}
                />
                <TextInput
                  label="الموقع"
                  value={values.location}
                  onChangeText={handleChange('location')}
                  onBlur={handleBlur('location')}
                />
                <TextInput
                  label="المورد"
                  value={values.supplier}
                  onChangeText={handleChange('supplier')}
                  onBlur={handleBlur('supplier')}
                />
                    <TextInput
                      label="الحد الأدنى للتنبيه"
                      value={values.minQuantityAlert?.toString()}
                      onChangeText={text => setFieldValue('minQuantityAlert', Number(text))}
                      onBlur={handleBlur('minQuantityAlert')}
                      error={touched.minQuantityAlert && errors.minQuantityAlert ? errors.minQuantityAlert : undefined}
                      keyboardType="numeric"
                      placeholder="الكمية التي سيتم التنبيه عندما ينخفض المخزون عنها"
                    />
                    <TextInput
                      label="معدل الاستهلاك اليومي"
                      value={values.dailyConsumptionRate?.toString()}
                      onChangeText={text => setFieldValue('dailyConsumptionRate', Number(text))}
                      onBlur={handleBlur('dailyConsumptionRate')}
                      error={touched.dailyConsumptionRate && errors.dailyConsumptionRate ? errors.dailyConsumptionRate : undefined}
                      keyboardType="numeric"
                      placeholder="معدل استهلاك العلف يومياً"
                    />
                  </Animated.View>
                )}

                {/* Step 3: Nutrition Information */}
                {currentStep === 2 && (
                  <Animated.View 
                    entering={FadeInRight.duration(300)}
                    style={[styles(theme).section, { backgroundColor: theme.colors.neutral.surface }]}
                  >
                <TextInput
                  label="المعلومات الغذائية"
                  value={values.nutritionalInfo}
                  onChangeText={handleChange('nutritionalInfo')}
                  onBlur={handleBlur('nutritionalInfo')}
                  multiline
                  numberOfLines={3}
                      placeholder="البروتين، الكربوهيدرات، الدهون، الفيتامينات، المعادن، إلخ."
                />
                <TextInput
                  label="الاستخدام الموصى به"
                  value={values.recommendedUsage}
                  onChangeText={handleChange('recommendedUsage')}
                  onBlur={handleBlur('recommendedUsage')}
                  multiline
                  numberOfLines={3}
                      placeholder="كيفية استخدام العلف والكميات الموصى بها"
                />
                <TextInput
                  label="الحيوانات المستهدفة"
                  value={values.targetAnimals}
                  onChangeText={handleChange('targetAnimals')}
                  onBlur={handleBlur('targetAnimals')}
                  multiline
                  numberOfLines={2}
                      placeholder="الحيوانات المناسبة لهذا العلف"
                    />
                  </Animated.View>
                )}

                {/* Step 4: Notes */}
                {currentStep === 3 && (
                  <Animated.View 
                    entering={FadeInRight.duration(300)}
                    style={[styles(theme).section, { backgroundColor: theme.colors.neutral.surface }]}
                  >
                <TextInput
                  value={values.notes}
                  onChangeText={handleChange('notes')}
                  onBlur={handleBlur('notes')}
                  multiline
                  numberOfLines={4}
                  placeholder="أضف ملاحظات هنا..."
                  placeholderTextColor={theme.colors.neutral.textSecondary}
                />
                  </Animated.View>
                )}
              </View>
            </ScrollView>

            <View style={styles(theme).navigationContainer}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={[styles(theme).navigationButton, styles(theme).prevButton]}
                  onPress={handlePrevStep}
                >
                  <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.primary.base} />
                  <Text style={[styles(theme).navigationButtonText, { color: theme.colors.primary.base }]}>السابق</Text>
                </TouchableOpacity>
              )}
              
              {currentStep < formSteps.length - 1 ? (
                <TouchableOpacity
                  style={[styles(theme).navigationButton, styles(theme).nextButton]}
                  onPress={handleNextStep}
                >
                  <Text style={[styles(theme).navigationButtonText, { color: "white" }]}>التالي</Text>
                  <MaterialCommunityIcons name="chevron-left" size={24} color="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles(theme).navigationButton, styles(theme).submitButton]}
                  onPress={(e: GestureResponderEvent) => formikSubmit()}
                  disabled={isSubmitting}
                >
                  <Text style={[styles(theme).navigationButtonText, { color: "white" }]}>
                    {isSubmitting ? "جاري الحفظ..." : "حفظ"}
                  </Text>
                  <MaterialCommunityIcons name="check" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>

            {/* Date Picker Modal */}
            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={getDateValue(showDatePicker === 'expiry' ? values.expiryDate : values.purchaseDate)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(null);
                  if (selectedDate) {
                    setFieldValue(
                      showDatePicker === 'expiry' ? 'expiryDate' : 'purchaseDate',
                      selectedDate.toISOString()
                    );
                  }
                }}
              />
            )}

            {showDatePicker && Platform.OS === 'ios' && (
              <Modal
                visible={true}
                transparent
                animationType="slide"
              >
                <View style={styles(theme).modalOverlay}>
                  <View style={[
                    styles(theme).modalContent,
                    { backgroundColor: theme.colors.neutral.surface }
                  ]}>
              <DateTimePicker
                      value={getDateValue(showDatePicker === 'expiry' ? values.expiryDate : values.purchaseDate)}
                mode="date"
                      display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                          setFieldValue(
                            showDatePicker === 'expiry' ? 'expiryDate' : 'purchaseDate',
                            selectedDate.toISOString()
                          );
                  }
                }}
              />
                    <Button
                      title="تم"
                      onPress={() => setShowDatePicker(null)}
                      variant="primary"
                    />
                  </View>
                </View>
              </Modal>
            )}
          </View>
        )}
      </Formik>
    </View>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.background,
  },
  formContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: theme.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  stepIndicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  stepLine: {
    height: 2,
    width: 40,
    backgroundColor: theme.colors.neutral.border,
  },
  stepTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.neutral.surface,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral.textPrimary,
    textAlign: 'right',
  },
  stepProgress: {
    fontSize: 14,
    color: theme.colors.neutral.textSecondary,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  picker: {
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: 8,
  },
  dateButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: 8,
    backgroundColor: theme.colors.neutral.background,
  },
  dateButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  navigationButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  prevButton: {
    backgroundColor: theme.colors.neutral.background,
    borderWidth: 1,
    borderColor: theme.colors.primary.base,
  },
  nextButton: {
    backgroundColor: theme.colors.primary.base,
    ...theme.shadows.small,
  },
  submitButton: {
    backgroundColor: theme.colors.success,
    ...theme.shadows.small,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  typeSelector: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  selectedType: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  selectedTypeIcon: {
    fontSize: 24,
  },
  selectedTypeInfo: {
    flex: 1,
  },
  selectedTypeText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
  },
  selectedTypeCategory: {
    fontSize: 12,
    textAlign: 'right',
  },
  typePlaceholder: {
    fontSize: 16,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
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
  animalGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  animalOption: {
    width: (width - 64) / 3,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    alignItems: 'center',
  },
  animalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalIcon: {
    fontSize: 28,
  },
  animalInfo: {
    alignItems: 'center',
  },
  animalName: {
    fontSize: 14,
    textAlign: 'center',
  },
  unitAbbreviation: {
    fontSize: 12,
    marginTop: 2,
  },
  dateSection: {
    marginTop: 16,
    gap: 8,
  },
});

export default AddFeedScreen; 