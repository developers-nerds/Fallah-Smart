import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useEquipment } from '../../../context/EquipmentContext';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUS, OPERATIONAL_STATUS, FUEL_TYPES, EquipmentType, EquipmentStatus, OperationalStatus, FuelType } from './constants';
import { formatDate } from '../../../utils/date';
import { Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { StockStackParamList } from '../../../navigation/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import { useTheme } from '../../../context/ThemeContext';
import { theme as appTheme } from '../../../theme/theme';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInput } from '../../../components/TextInput';
import { Picker } from '@react-native-picker/picker';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

type AddEquipmentScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddEquipment'>;
  route: RouteProp<StockStackParamList, 'AddEquipment'>;
};

interface FormPage {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  fields: Array<keyof FormData>;
}

interface FormData {
  name: string;
  type: EquipmentType;
  status: EquipmentStatus;
  operationalStatus: OperationalStatus;
  quantity: string;
  purchaseDate: Date;
  warrantyExpiryDate: Date | null;
  serialNumber: string;
  manufacturer: string;
  model: string;
  yearOfManufacture: string;
  purchasePrice: string;
  price: string;
  fuelType: FuelType;
  fuelCapacity: string;
  powerOutput: string;
  dimensions: string;
  weight: string;
  location: string;
  assignedOperator: string;
  notes: string;
  operatingInstructions: string;
  safetyGuidelines: string;
}

type DateField = 'purchaseDate' | 'warrantyExpiryDate';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('اسم المعدة مطلوب'),
  type: Yup.string().required('نوع المعدة مطلوب'),
  quantity: Yup.string()
    .required('الكمية مطلوبة')
    .test('is-number', 'الكمية يجب أن تكون رقماً', value => !isNaN(parseFloat(value))),
  // Other fields are optional
  price: Yup.string()
    .test('is-number', 'السعر يجب أن يكون رقماً', value => !value || !isNaN(parseFloat(value))),
  purchasePrice: Yup.string()
    .test('is-number', 'سعر الشراء يجب أن يكون رقماً', value => !value || !isNaN(parseFloat(value))),
});

export const AddEquipment: React.FC<AddEquipmentScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { addEquipment, equipment, updateEquipment, fetchEquipment } = useEquipment();
  const { user } = useAuth();
  const equipmentId = route.params?.equipmentId;
  const isEditing = !!equipmentId;
  const equipmentToEdit = isEditing && equipmentId ? equipment.find(item => 
    item.id && equipmentId && item.id.toString() === equipmentId.toString()
  ) : null;

  const [currentPage, setCurrentPage] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState<DateField>('purchaseDate');
  
  const [initialFormValues, setInitialFormValues] = useState<FormData>({
    name: '',
    type: 'tractor' as EquipmentType,
    status: 'operational' as EquipmentStatus,
    operationalStatus: 'good' as OperationalStatus,
    quantity: '1',
    purchaseDate: new Date(),
    warrantyExpiryDate: null,
    serialNumber: '',
    manufacturer: '',
    model: '',
    yearOfManufacture: '',
    purchasePrice: '',
    price: '',
    fuelType: 'diesel' as FuelType,
    fuelCapacity: '',
    powerOutput: '',
    dimensions: '',
    weight: '',
    location: '',
    assignedOperator: '',
    notes: '',
    operatingInstructions: '',
    safetyGuidelines: '',
  });

  const [loading, setLoading] = useState(false);

  // Add user check effect
  useEffect(() => {
    const checkUser = async () => {
      const storedUser = await storage.getUser();
      if (!storedUser) {
        Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
        navigation.goBack();
      }
    };
    checkUser();
  }, []);

  // Load existing equipment data if editing
  useEffect(() => {
    if (isEditing && equipmentToEdit) {
      setInitialFormValues({
        name: equipmentToEdit.name || '',
        type: (equipmentToEdit.type as EquipmentType) || 'tractor',
        status: (equipmentToEdit.status as EquipmentStatus) || 'operational',
        operationalStatus: (equipmentToEdit.operationalStatus as OperationalStatus) || 'good',
        quantity: equipmentToEdit.quantity?.toString() || '1',
        purchaseDate: equipmentToEdit.purchaseDate ? new Date(equipmentToEdit.purchaseDate) : new Date(),
        warrantyExpiryDate: equipmentToEdit.warrantyExpiryDate ? new Date(equipmentToEdit.warrantyExpiryDate) : null,
        serialNumber: equipmentToEdit.serialNumber || '',
        manufacturer: equipmentToEdit.manufacturer || '',
        model: equipmentToEdit.model || '',
        yearOfManufacture: typeof equipmentToEdit.yearOfManufacture === 'number' 
          ? equipmentToEdit.yearOfManufacture.toString() 
          : equipmentToEdit.yearOfManufacture || '',
        purchasePrice: equipmentToEdit.purchasePrice?.toString() || '',
        // Handle the price property safely
        price: (equipmentToEdit as any)?.price?.toString() || '',
        fuelType: (equipmentToEdit.fuelType as FuelType) || 'diesel',
        fuelCapacity: typeof equipmentToEdit.fuelCapacity === 'number' 
          ? equipmentToEdit.fuelCapacity.toString() 
          : equipmentToEdit.fuelCapacity || '',
        powerOutput: equipmentToEdit.powerOutput || '',
        dimensions: equipmentToEdit.dimensions || '',
        weight: typeof equipmentToEdit.weight === 'number' 
          ? equipmentToEdit.weight.toString() 
          : equipmentToEdit.weight || '',
        location: equipmentToEdit.location || '',
        assignedOperator: equipmentToEdit.assignedOperator || '',
        notes: equipmentToEdit.notes || '',
        operatingInstructions: equipmentToEdit.operatingInstructions || '',
        safetyGuidelines: equipmentToEdit.safetyGuidelines || ''
      });
    }
  }, [isEditing, equipmentToEdit]);

  // Define form pages with Arabic titles and subtitles
  const formPages: FormPage[] = [
    {
      title: 'معلومات أساسية',
      subtitle: 'أدخل المعلومات الأساسية للمعدة',
      icon: 'tractor',
      fields: ['name', 'type', 'quantity', 'model', 'manufacturer'],
    },
    {
      title: 'معلومات تقنية',
      subtitle: 'أدخل المواصفات التقنية للمعدة',
      icon: 'wrench',
      fields: ['powerOutput', 'fuelType', 'operationalStatus'],
    },
    {
      title: 'معلومات الشراء',
      subtitle: 'أدخل معلومات شراء المعدة',
      icon: 'cash',
      fields: ['purchaseDate', 'warrantyExpiryDate', 'purchasePrice', 'price'],
    },
    {
      title: 'ملاحظات إضافية',
      subtitle: 'أدخل أي ملاحظات إضافية عن المعدة',
      icon: 'text',
      fields: ['notes'],
    },
  ];

  const validateCurrentPage = (values: FormData) => {
    let isValid = true;
    const currentFields = formPages[currentPage].fields;
    
    // Only first page fields are required
    const requiredFieldsByPage: { [key: number]: Array<keyof FormData> } = {
      0: ['name', 'type', 'quantity'], // First page: only name, type and quantity are required
      1: [], // Second page: no required fields
      2: [], // Third page: no required fields 
      3: []  // Fourth page: no required fields
    };
    
    const requiredFields = requiredFieldsByPage[currentPage] || [];
    
    // Only check required fields for this page
    for (const field of requiredFields) {
      if (!values[field]) {
        isValid = false;
        break;
      }
      }

    return isValid;
  };

  const refreshEquipmentList = async () => {
    try {
      // Instead of calling useEquipment() inside (which causes the hook error),
      // use the equipment methods we already have from the context
      if (typeof updateEquipment === 'function') {
        // If we're in the context of editing, we've already loaded the equipment
        // Just refetch the equipment data
        console.log('Refreshing equipment list');
      }
    } catch (error) {
      console.error('Error refreshing equipment list:', error);
    }
  };

  const handleSubmit = async (values: FormData) => {
    try {
      setLoading(true);

      // Get stored user data
      const storedUser = await storage.getUser();
      if (!storedUser?.id) {
        Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
        navigation.goBack();
        return;
      }

      const equipmentData = {
        name: values.name,
        type: values.type,
        status: values.status,
        operationalStatus: values.operationalStatus,
        quantity: parseInt(values.quantity, 10),
        purchaseDate: values.purchaseDate.toISOString(),
        warrantyExpiryDate: values.warrantyExpiryDate ? values.warrantyExpiryDate.toISOString() : null,
        serialNumber: values.serialNumber,
        manufacturer: values.manufacturer,
        model: values.model,
        yearOfManufacture: values.yearOfManufacture ? parseInt(values.yearOfManufacture, 10) : undefined,
        purchasePrice: values.purchasePrice ? parseFloat(values.purchasePrice) : undefined,
        price: values.price ? parseFloat(values.price) : undefined,
        fuelType: values.fuelType,
        fuelCapacity: values.fuelCapacity ? parseFloat(values.fuelCapacity) : undefined,
        powerOutput: values.powerOutput,
        dimensions: values.dimensions,
        weight: values.weight ? parseFloat(values.weight) : undefined,
        location: values.location,
        assignedOperator: values.assignedOperator,
        notes: values.notes,
        operatingInstructions: values.operatingInstructions,
        safetyGuidelines: values.safetyGuidelines,
        userId: storedUser.id,
      };

      console.log('Equipment data to be sent:', equipmentData);

      // Try direct API request with proper type conversion
      try {
        const tokens = await storage.getTokens();
        if (!tokens?.access) {
          Alert.alert('خطأ', 'الرجاء تسجيل الدخول مرة أخرى');
          navigation.goBack();
          return;
        }
        
        const API_URL = process.env.EXPO_PUBLIC_API_URL;
        if (!API_URL) {
          throw new Error('API_URL is not defined');
        }
        
        const endpoint = `${API_URL}/stock/equipment${isEditing && equipmentId ? `/${equipmentId}` : ''}`;
        console.log('Full API URL:', endpoint);

        const response = await axios({
          method: isEditing ? 'PUT' : 'POST',
          url: endpoint,
          data: equipmentData,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.access}`
          },
          timeout: 10000
        });
        
        console.log('API call successful:', response.data);
        
        // Force refresh equipment context if possible
        if (typeof fetchEquipment === 'function') {
          try {
            await fetchEquipment();
          } catch (error) {
            console.error('Failed to refresh equipment context', error);
          }
        }
        
        Alert.alert(
          'نجاح', 
          isEditing ? 'تم تحديث المعدة بنجاح' : 'تمت إضافة المعدة بنجاح',
          [{ text: 'حسناً', onPress: () => navigation.goBack() }]
        );
        return;
      } catch (apiError: any) {
        console.error('Direct API call failed:', apiError);
        // Fall back to context methods
      }

      if (isEditing && equipmentId) {
        await updateEquipment(equipmentId, equipmentData as any);
        Alert.alert(
          'نجاح', 
          'تم تحديث المعدة بنجاح',
          [{ text: 'حسناً', onPress: () => navigation.goBack() }]
        );
      } else {
        await addEquipment(equipmentData as any);
        Alert.alert(
          'نجاح', 
          'تمت إضافة المعدة بنجاح',
          [{ text: 'حسناً', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error submitting equipment:', error);
      Alert.alert('خطأ', 'فشل في حفظ المعدة');
    } finally {
      setLoading(false);
    }
  };

  const nextPage = (values: FormData) => {
    if (validateCurrentPage(values) && currentPage < formPages.length - 1) {
        setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && dateField) {
      return {
        [dateField]: selectedDate,
      };
    }
    return {};
  };

  const showDatePickerModal = (field: DateField) => {
    setDateField(field);
    setShowDatePicker(true);
  };

  const handleTypeSelect = (type: EquipmentType, setFieldValue: (field: string, value: any) => void) => {
    setFieldValue('type', type);
  };

  const handleStatusSelect = (status: EquipmentStatus, setFieldValue: (field: string, value: any) => void) => {
    setFieldValue('status', status);
  };

  const handleOperationalStatusSelect = (status: OperationalStatus, setFieldValue: (field: string, value: any) => void) => {
    setFieldValue('operationalStatus', status);
  };

  const handleFuelTypeSelect = (type: FuelType, setFieldValue: (field: string, value: any) => void) => {
    setFieldValue('fuelType', type);
  };

  const renderField = (field: keyof FormData, values: FormData, errors: any, touched: any, handleChange: any, setFieldValue: any) => {
    switch (field) {
      case 'name':
        return (
          <Animated.View
            key={field}
            entering={FadeInRight.delay(100).springify()}
          >
      <TextInput
              label="اسم المعدة"
              value={values.name}
              onChangeText={handleChange('name')}
              error={touched.name && errors.name ? errors.name : undefined}
            />
          </Animated.View>
        );
      case 'type':
    return (
      <Animated.View 
            key={field}
            entering={FadeInRight.delay(150).springify()}
            style={styles.fieldContainer}
          >
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              نوع المعدة
          </Text>
            <View style={[styles.pickerContainer, { 
              borderColor: theme.colors.neutral.border,
                backgroundColor: theme.colors.neutral.surface,
              borderRadius: 8,
              borderWidth: 1,
              elevation: 1,
              marginBottom: 8,
            }]}>
              <Picker
                selectedValue={values.type}
                onValueChange={(itemValue) => setFieldValue('type', itemValue)}
                style={{ color: theme.colors.neutral.textPrimary }}
                dropdownIconColor={theme.colors.primary.base}
                mode="dropdown"
              >
                {Object.entries(EQUIPMENT_TYPES).map(([key, { icon, name }]) => (
                  <Picker.Item 
                    key={key} 
                    label={`${icon} ${name}`} 
                    value={key as EquipmentType} 
                  />
                ))}
              </Picker>
      </View>
            {touched.type && errors.type && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.type}</Text>
            )}
          </Animated.View>
        );
      case 'quantity':
        return (
          <Animated.View
            key={field}
            entering={FadeInRight.delay(200).springify()}
          >
            <TextInput
              label="الكمية"
              value={values.quantity}
              onChangeText={handleChange('quantity')}
              keyboardType="numeric"
              error={touched.quantity && errors.quantity ? errors.quantity : undefined}
            />
      </Animated.View>
    );
      case 'purchaseDate':
      case 'warrantyExpiryDate':
        const dateLabel = {
          purchaseDate: 'تاريخ الشراء',
          warrantyExpiryDate: 'تاريخ انتهاء الضمان',
        }[field];
        
        return (
          <Animated.View 
            key={field} 
            entering={FadeInRight.delay(250).springify()}
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
                }
              ]}
              onPress={() => showDatePickerModal(field as DateField)}
            >
              <Text style={{ color: theme.colors.neutral.textPrimary }}>
                {values[field] instanceof Date 
                  ? values[field].toLocaleDateString() 
                  : values[field] 
                    ? new Date(values[field]).toLocaleDateString() 
                    : 'اختر التاريخ'
                }
        </Text>
              <Feather name="calendar" size={20} color={theme.colors.primary.base} />
      </TouchableOpacity>
            {touched[field] && errors[field] && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors[field]}</Text>
        )}
      </Animated.View>
    );
      case 'notes':
      case 'operatingInstructions':
      case 'safetyGuidelines':
        const multilineLabels = {
          notes: 'ملاحظات',
          operatingInstructions: 'تعليمات التشغيل',
          safetyGuidelines: 'إرشادات السلامة',
        };
    
    return (
          <Animated.View
                  key={field}
            entering={FadeInRight.delay(300).springify()}
          >
            <TextInput
              label={multilineLabels[field]}
              value={values[field] as string}
              onChangeText={handleChange(field)}
              multiline={true}
              numberOfLines={4}
              error={touched[field] && errors[field] ? errors[field] : undefined}
            />
          </Animated.View>
              );
            case 'status':
              return (
          <Animated.View
                  key={field}
            entering={FadeInRight.delay(150).springify()}
            style={styles.fieldContainer}
          >
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              حالة المعدة
            </Text>
            <View style={[styles.pickerContainer, { 
              borderColor: theme.colors.neutral.border,
              backgroundColor: theme.colors.neutral.surface,
              borderRadius: 8,
              borderWidth: 1,
              elevation: 1,
              marginBottom: 8,
            }]}>
              <Picker
                selectedValue={values.status}
                onValueChange={(itemValue) => setFieldValue('status', itemValue)}
                style={{ color: theme.colors.neutral.textPrimary }}
                dropdownIconColor={theme.colors.primary.base}
                mode="dropdown"
              >
                {Object.entries(EQUIPMENT_STATUS).map(([key, { icon, name }]) => (
                  <Picker.Item 
                    key={key} 
                    label={`${icon} ${name}`} 
                    value={key as EquipmentStatus} 
                  />
                ))}
              </Picker>
            </View>
            {touched.status && errors.status && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.status}</Text>
            )}
          </Animated.View>
              );
            case 'operationalStatus':
              return (
          <Animated.View
                  key={field}
            entering={FadeInRight.delay(150).springify()}
            style={styles.fieldContainer}
          >
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              الحالة التشغيلية
            </Text>
            <View style={[styles.pickerContainer, { 
              borderColor: theme.colors.neutral.border,
              backgroundColor: theme.colors.neutral.surface,
              borderRadius: 8,
              borderWidth: 1,
              elevation: 1,
              marginBottom: 8,
            }]}>
              <Picker
                selectedValue={values.operationalStatus}
                onValueChange={(itemValue) => setFieldValue('operationalStatus', itemValue)}
                style={{ color: theme.colors.neutral.textPrimary }}
                dropdownIconColor={theme.colors.primary.base}
                mode="dropdown"
              >
                {Object.entries(OPERATIONAL_STATUS).map(([key, { icon, name }]) => (
                  <Picker.Item 
                    key={key} 
                    label={`${icon} ${name}`} 
                    value={key as OperationalStatus} 
                  />
                ))}
              </Picker>
            </View>
            {touched.operationalStatus && errors.operationalStatus && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.operationalStatus}</Text>
            )}
          </Animated.View>
              );
            case 'fuelType':
              return (
          <Animated.View
                  key={field}
            entering={FadeInRight.delay(150).springify()}
            style={styles.fieldContainer}
          >
            <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
              نوع الوقود
            </Text>
            <View style={[styles.pickerContainer, { 
              borderColor: theme.colors.neutral.border,
              backgroundColor: theme.colors.neutral.surface,
              borderRadius: 8,
              borderWidth: 1,
              elevation: 1,
              marginBottom: 8,
            }]}>
              <Picker
                selectedValue={values.fuelType}
                onValueChange={(itemValue) => setFieldValue('fuelType', itemValue)}
                style={{ color: theme.colors.neutral.textPrimary }}
                dropdownIconColor={theme.colors.primary.base}
                mode="dropdown"
              >
                {Object.entries(FUEL_TYPES).map(([key, { icon, name }]) => (
                  <Picker.Item 
                    key={key} 
                    label={`${icon} ${name}`} 
                    value={key as FuelType} 
                  />
                ))}
              </Picker>
            </View>
            {touched.fuelType && errors.fuelType && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.fuelType}</Text>
            )}
          </Animated.View>
        );
      default:
        // For all other text fields
        const fieldLabels: { [K in keyof FormData]?: string } = {
          manufacturer: 'الشركة المصنعة',
          model: 'الطراز',
          yearOfManufacture: 'سنة الصنع',
          serialNumber: 'الرقم التسلسلي',
          purchasePrice: 'سعر الشراء',
          price: 'السعر الحالي',
          fuelCapacity: 'سعة الوقود',
          powerOutput: 'قدرة المحرك',
          dimensions: 'الأبعاد',
          weight: 'الوزن',
          location: 'الموقع',
          assignedOperator: 'المشغل المسؤول',
        };
    
              return (
          <Animated.View
                  key={field}
            entering={FadeInRight.delay(150).springify()}
          >
            <TextInput
              label={fieldLabels[field] || String(field)}
              value={values[field] as string}
              onChangeText={handleChange(field)}
              keyboardType={['purchasePrice', 'price', 'fuelCapacity', 'powerOutput', 'weight'].includes(field as string) ? 'numeric' : 'default'}
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

  const renderPageHeader = () => (
      <View style={styles.pageHeader}>
      <Animated.Text 
        style={[styles.pageTitle, { color: theme.colors.neutral.textPrimary }]}
        entering={FadeInDown.delay(200).springify()}
      >
        {formPages[currentPage].title}
      </Animated.Text>
      <Animated.Text 
        style={[styles.pageSubtitle, { color: theme.colors.neutral.textSecondary }]}
        entering={FadeInDown.delay(300).springify()}
      >
        {formPages[currentPage].subtitle}
      </Animated.Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar
        backgroundColor={theme.colors.neutral.background}
        barStyle={theme.colors.neutral.textPrimary === '#1A2F2B' ? 'dark-content' : 'light-content'}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                keyboardShouldPersistTaps="always"
              >
                <View style={styles.header}>
                  {renderProgressBar()}
            </View>

                <View style={[styles.pageContainer, {
                  backgroundColor: theme.colors.neutral.surface,
                }]}>
                  {renderPageHeader()}
                  
                  <Animated.View 
                    style={styles.formContainer}
                    entering={FadeInRight.delay(200).springify()}
                  >
                    {formPages[currentPage].fields.map(field => 
                      renderField(field, values, errors, touched, handleChange, setFieldValue)
                    )}
                  </Animated.View>
                </View>

                {showDatePicker && dateField && (
                  <DateTimePicker
                    value={values[dateField] instanceof Date 
                      ? values[dateField] 
                      : values[dateField] 
                        ? new Date(values[dateField]) 
                        : new Date()
                    }
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate && dateField) {
                        setFieldValue(dateField, selectedDate);
                      }
                    }}
                  />
                )}
              </ScrollView>

              <View style={[styles.footer, { 
                backgroundColor: theme.colors.neutral.surface,
                borderTopColor: theme.colors.neutral.border,
              }]}>
                <View style={styles.buttonContainer}>
                  <Button
                    mode="outlined"
                    onPress={prevPage}
                    style={[
                      styles.button, 
                      { 
                        borderColor: theme.colors.primary.base,
                        marginRight: 8,
                      }
                    ]}
                    labelStyle={{ color: theme.colors.primary.base }}
                    disabled={loading}
                  >
                    {currentPage === 0 ? 'إلغاء' : 'السابق ←'}
                  </Button>
                  
                  {currentPage < formPages.length - 1 ? (
                    <Button
                      mode="contained"
                      onPress={() => nextPage(values)}
                      style={[
                        styles.button, 
                        { 
                          backgroundColor: theme.colors.primary.base,
                        }
                      ]}
                      labelStyle={{ color: theme.colors.neutral.surface }}
                      disabled={!validateCurrentPage(values)}
                    >
                      → التالي
                    </Button>
                  ) : (
                    <Button
                      mode="contained"
                      onPress={() => handleSubmit()}
                      style={[
                        styles.button, 
                        { 
                          backgroundColor: theme.colors.primary.base,
                        }
                      ]}
                      labelStyle={{ color: theme.colors.neutral.surface }}
                      loading={loading}
                      disabled={!isValid || loading}
                    >
                      {isEditing ? 'تحديث ✓' : 'حفظ ✓'}
                    </Button>
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
    paddingBottom: 160, // Add more padding at bottom to ensure form is visible with keyboard
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
      elevation: 2,
      shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pageHeader: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  pageIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
      textAlign: 'center',
  },
  formContainer: {
      padding: 16,
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
      marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 5,
  },
  datePickerButton: {
    flexDirection: 'row',
      justifyContent: 'space-between',
    alignItems: 'center',
      paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    borderRadius: 8,
    },
  });

export default AddEquipment;