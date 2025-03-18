import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Platform, StatusBar, Alert, I18nManager, KeyboardAvoidingView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEquipment } from '../../../context/EquipmentContext';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUS, OPERATIONAL_STATUS, FUEL_TYPES, EquipmentType, EquipmentStatus, OperationalStatus, FuelType } from './constants';
import { formatDate } from '../../../utils/date';
import { Button, Divider, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { StockStackParamList } from '../../../navigation/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { storage } from '../../../utils/storage';
import { useTheme } from '../../../context/ThemeContext';
import { theme as appTheme } from '../../../theme/theme';

type Theme = typeof appTheme;

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

type AddEquipmentScreenProps = {
  navigation: any;
  route: RouteProp<StockStackParamList, 'AddEquipment'>;
};

interface FormPage {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  fields: string[];
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

interface CustomTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
  error?: string;
  icon: string;
}

interface CustomSelectProps {
  label: string;
  value: string;
  items: Array<{ label: string; value: string; icon: string }>;
  required?: boolean;
  error?: string;
  horizontal?: boolean;
  icon: string;
}

interface CustomDatePickerProps {
  label: string;
  value: Date | null;
  required?: boolean;
  error?: string;
  icon: string;
}

type DateField = 'purchaseDate' | 'warrantyExpiryDate';

export const AddEquipment: React.FC<AddEquipmentScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { addEquipment, equipment, updateEquipment } = useEquipment();
  const { user } = useAuth();
  const equipmentId = route.params?.equipmentId;
  const isEditing = !!equipmentId;
  const equipmentToEdit = isEditing && equipmentId ? equipment.find(item => 
    item.id && equipmentId && item.id.toString() === equipmentId.toString()
  ) : null;

  const [currentPage, setCurrentPage] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState<DateField>('purchaseDate');
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  
  const [formData, setFormData] = useState<FormData>({
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
  const [error, setError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

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

  // Define form pages with Arabic titles and subtitles
  const formPages: FormPage[] = [
    {
      title: 'معلومات أساسية',
      subtitle: 'أدخل المعلومات الأساسية للمعدة',
      icon: 'tractor',
      fields: ['name', 'type', 'model', 'manufacturer'],
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
      fields: ['purchaseDate', 'warrantyExpiryDate', 'purchasePrice'],
    },
    {
      title: 'ملاحظات إضافية',
      subtitle: 'أدخل أي ملاحظات إضافية عن المعدة',
      icon: 'text',
      fields: ['notes'],
    },
  ];

  useEffect(() => {
    if (isEditing && equipmentToEdit) {
      setFormData({
        name: equipmentToEdit.name,
        type: equipmentToEdit.type as EquipmentType,
        status: equipmentToEdit.status as EquipmentStatus,
        operationalStatus: equipmentToEdit.operationalStatus as OperationalStatus,
        quantity: equipmentToEdit.quantity.toString(),
        purchaseDate: new Date(equipmentToEdit.purchaseDate),
        warrantyExpiryDate: equipmentToEdit.warrantyExpiryDate ? new Date(equipmentToEdit.warrantyExpiryDate) : null,
        serialNumber: equipmentToEdit.serialNumber || '',
        manufacturer: equipmentToEdit.manufacturer || '',
        model: equipmentToEdit.model || '',
        yearOfManufacture: equipmentToEdit.yearOfManufacture ? equipmentToEdit.yearOfManufacture.toString() : '',
        purchasePrice: equipmentToEdit.purchasePrice ? equipmentToEdit.purchasePrice.toString() : '',
        fuelType: equipmentToEdit.fuelType as FuelType || 'diesel' as FuelType,
        fuelCapacity: equipmentToEdit.fuelCapacity ? equipmentToEdit.fuelCapacity.toString() : '',
        powerOutput: equipmentToEdit.powerOutput || '',
        dimensions: equipmentToEdit.dimensions || '',
        weight: equipmentToEdit.weight ? equipmentToEdit.weight.toString() : '',
        location: equipmentToEdit.location || '',
        assignedOperator: equipmentToEdit.assignedOperator || '',
        notes: equipmentToEdit.notes || '',
        operatingInstructions: equipmentToEdit.operatingInstructions || '',
        safetyGuidelines: equipmentToEdit.safetyGuidelines || '',
      });
    }
  }, [isEditing, equipmentToEdit]);

  const validateCurrentPage = () => {
    const currentFields = formPages[currentPage].fields;
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    let isValid = true;

    currentFields.forEach(field => {
      if (field === 'name' && !formData.name) {
        newErrors.name = 'هذا الحقل مطلوب';
        isValid = false;
      }
      if (field === 'type' && !formData.type) {
        newErrors.type = 'هذا الحقل مطلوب';
        isValid = false;
      }
      if (field === 'quantity' && (!formData.quantity || parseInt(formData.quantity) <= 0)) {
        newErrors.quantity = 'يجب أن تكون الكمية رقماً موجباً';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    try {
      if (!validateCurrentPage()) {
        return;
      }

      setLoading(true);
      setError(null);
      setFormSubmitting(true);

      // Get stored user data
      const storedUser = await storage.getUser();
      if (!storedUser?.id) {
        Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
        navigation.goBack();
        return;
      }

      const equipmentData = {
        ...formData,
        quantity: parseInt(formData.quantity, 10),
        yearOfManufacture: formData.yearOfManufacture ? parseInt(formData.yearOfManufacture, 10) : null,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
        fuelCapacity: formData.fuelCapacity ? parseFloat(formData.fuelCapacity) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        purchaseDate: formData.purchaseDate.toISOString(),
        warrantyExpiryDate: formData.warrantyExpiryDate?.toISOString() || null,
        type: formData.type || 'tractor',
        status: formData.status || 'operational',
        operationalStatus: formData.operationalStatus || 'good',
        fuelType: formData.fuelType || 'diesel',
        serialNumber: formData.serialNumber || null,
        manufacturer: formData.manufacturer || null,
        model: formData.model || null,
        powerOutput: formData.powerOutput || null,
        dimensions: formData.dimensions || null,
        location: formData.location || null,
        assignedOperator: formData.assignedOperator || null,
        notes: formData.notes || null,
        operatingInstructions: formData.operatingInstructions || null,
        safetyGuidelines: formData.safetyGuidelines || null,
        userId: storedUser.id,
      };

      console.log('Equipment data to be sent:', equipmentData);

      try {
        const tokens = await storage.getTokens();
        console.log('Auth tokens:', tokens ? 'Available' : 'Not Available');
        
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
        Alert.alert('نجاح', isEditing ? 'تم تحديث المعدة بنجاح' : 'تمت إضافة المعدة بنجاح');
        navigation.goBack();
      } catch (error: any) {
        console.error('API call failed:', error);
        if (error.response) {
          console.error('API response status:', error.response.status);
          console.error('API response data:', error.response.data);
          
          if (error.response.status === 401) {
            Alert.alert('خطأ', 'انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مرة أخرى');
            navigation.goBack();
            return;
          }
        }
        Alert.alert(
          'خطأ',
          `فشل في ${isEditing ? 'تحديث' : 'حفظ'} المعدة: ${error?.response?.data?.message || error?.message || 'خطأ في الاتصال'}`
        );
      }
    } catch (error) {
      console.error('Error submitting equipment:', error);
      Alert.alert('خطأ', `فشل في ${isEditing ? 'تحديث' : 'حفظ'} المعدة`);
    } finally {
      setLoading(false);
      setFormSubmitting(false);
    }
  };

  const updateFormField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const nextPage = () => {
    if (validateCurrentPage()) {
      if (currentPage < formPages.length - 1) {
        setCurrentPage(currentPage + 1);
      } else {
        handleSubmit();
      }
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
    if (selectedDate) {
      updateFormField(dateField, selectedDate);
    }
  };

  const showDatePickerModal = (field: DateField) => {
    setDateField(field);
    setShowDatePicker(true);
  };

  const handleTypeSelect = (type: EquipmentType) => {
    updateFormField('type', type);
  };

  const handleStatusSelect = (status: EquipmentStatus) => {
    updateFormField('status', status);
  };

  const handleOperationalStatusSelect = (status: OperationalStatus) => {
    updateFormField('operationalStatus', status);
  };

  const handleFuelTypeSelect = (type: FuelType) => {
    updateFormField('fuelType', type);
  };

  // Custom components with improved styling
  const CustomTextInput: React.FC<CustomTextInputProps> = ({ 
    label, 
    value, 
    onChangeText, 
    keyboardType = 'default', 
    multiline = false, 
    numberOfLines = 1, 
    required = false, 
    error, 
    icon 
  }) => (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.inputIcon}>{icon}</Text>
        <Text style={[styles.inputLabel, { color: theme.colors.neutral.textPrimary }]}>
          {label} {required && <Text style={{ color: theme.colors.error }}>*</Text>}
        </Text>
      </View>
      <TextInput
        style={[
          multiline ? styles.textInputMultiline : styles.textInput,
          { backgroundColor: theme.colors.neutral.surface }
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        placeholder={label}
        placeholderTextColor={theme.colors.neutral.textSecondary}
        error={!!error}
        mode="outlined"
        right={<TextInput.Icon icon="pencil" />}
        theme={{ 
          colors: { 
            primary: theme.colors.primary.base,
            text: theme.colors.neutral.textPrimary,
            error: theme.colors.error,
            placeholder: theme.colors.neutral.textSecondary,
            surface: theme.colors.neutral.surface,
            background: theme.colors.neutral.background,
          } 
        }}
        outlineColor={theme.colors.neutral.border}
        activeOutlineColor={theme.colors.primary.base}
        textAlign="right"
        textAlignVertical={multiline ? "top" : "center"}
        dense
      />
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );

  const CustomSelect: React.FC<CustomSelectProps> = ({ 
    label, 
    value, 
    items, 
    required = false, 
    error, 
    horizontal = false, 
    icon 
  }) => {
    const [showOptions, setShowOptions] = useState(false);
    const selectedItem = items.find(item => item.value === value);

    const handlePress = (item: { value: string; label: string; icon: string }) => {
              if (label === 'نوع المعدة') {
                handleTypeSelect(item.value as EquipmentType);
              } else if (label === 'حالة المعدة') {
                handleStatusSelect(item.value as EquipmentStatus);
              } else if (label === 'الحالة التشغيلية') {
                handleOperationalStatusSelect(item.value as OperationalStatus);
              } else if (label === 'نوع الوقود') {
                handleFuelTypeSelect(item.value as FuelType);
              }
      setShowOptions(false);
    };

    return (
      <Animated.View 
        entering={FadeInDown.duration(400)}
        style={styles.inputContainer}
      >
        <View style={styles.labelContainer}>
          <Text style={styles.inputIcon}>{icon}</Text>
          <Text style={[styles.inputLabel, { color: theme.colors.neutral.textPrimary }]}>
            {label} {required && <Text style={{ color: theme.colors.error }}>*</Text>}
          </Text>
        </View>

        {!showOptions && value ? (
          <Button
            mode="outlined"
            onPress={() => setShowOptions(true)}
            style={[
              styles.selectedButton,
              { 
                borderColor: theme.colors.primary.base,
                backgroundColor: theme.colors.neutral.surface,
                borderWidth: 2,
              }
            ]}
            contentStyle={{
              height: 56,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <View style={styles.selectedItemContent}>
              <Text style={[
                styles.selectedItemIcon,
                { color: theme.colors.primary.base }
              ]}>
                {selectedItem?.icon}
              </Text>
              <Text 
                style={[
                  styles.selectedItemText,
                  { color: theme.colors.primary.base }
                ]}
              >
                {selectedItem?.label}
              </Text>
            </View>
          </Button>
        ) : showOptions ? (
          <View style={[styles.selectContainer, horizontal && styles.horizontalSelect]}>
            {items.map((item) => (
              <Button
                key={item.value}
                mode={value === item.value ? "contained" : "outlined"}
                onPress={() => handlePress(item)}
            style={[
              styles.selectButton,
                  { 
                    borderColor: value === item.value ? theme.colors.primary.base : theme.colors.neutral.border,
                    backgroundColor: value === item.value ? theme.colors.primary.base : theme.colors.neutral.surface,
                    borderWidth: 2,
                  }
                ]}
                contentStyle={{
                  minHeight: 72,
                  paddingVertical: 8,
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={styles.selectButtonContent}>
                  <Text style={[
                    styles.selectButtonIcon,
                    { color: value === item.value ? theme.colors.neutral.surface : theme.colors.primary.base }
                  ]}>
                    {item.icon}
                  </Text>
                  <Text 
                    style={[
              styles.selectButtonText,
                      { 
                        color: value === item.value ? theme.colors.neutral.surface : theme.colors.primary.base,
                      }
            ]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
          >
                    {item.label}
                  </Text>
                </View>
          </Button>
        ))}
      </View>
        ) : (
          <Button
            mode="outlined"
            onPress={() => setShowOptions(true)}
            style={[
              styles.selectButton,
              { 
                borderColor: theme.colors.neutral.border,
                backgroundColor: theme.colors.neutral.surface,
                borderWidth: 2,
                width: '100%',
              }
            ]}
            contentStyle={{
              height: 56,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[styles.selectButtonText, { color: theme.colors.neutral.textSecondary }]}>
              اختر {label}
            </Text>
          </Button>
        )}

      {error && (
          <Animated.Text 
            entering={FadeIn.duration(300)}
            style={[styles.errorText, { color: theme.colors.error }]}
          >
          {error}
          </Animated.Text>
        )}
      </Animated.View>
    );
  };

  const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ 
    label, 
    value, 
    required = false, 
    error, 
    icon 
  }) => (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.inputIcon}>{icon}</Text>
        <Text style={[styles.inputLabel, { color: theme.colors.neutral.textPrimary }]}>
          {label} {required && <Text style={{ color: theme.colors.error }}>*</Text>}
        </Text>
      </View>
      <Button
        mode="outlined"
        onPress={() => showDatePickerModal(label === 'تاريخ الشراء' ? 'purchaseDate' : 'warrantyExpiryDate')}
        style={[
          styles.datePickerButton, 
          { 
            borderColor: theme.colors.neutral.border,
            backgroundColor: theme.colors.neutral.surface
          },
          error && [styles.inputError, { borderColor: theme.colors.error }]
        ]}
        labelStyle={[styles.datePickerButtonText, { color: theme.colors.neutral.textPrimary }]}
      >
        {value ? formatDate(value) : 'اختر تاريخ'}
      </Button>
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );

  const renderCurrentPageFields = () => {
    const currentFields = formPages[currentPage].fields;
    
    return (
      <View style={styles.fieldsContainer}>
        {currentFields.map((field) => {
          switch (field) {
            case 'name':
              return (
                <CustomTextInput
                  key={field}
                  label="اسم المعدة"
                  value={formData.name}
                  onChangeText={(value: string) => updateFormField('name', value)}
                  required={true}
                  error={errors.name}
                  icon="🏷️"
                  keyboardType="default"
                  multiline={false}
                  numberOfLines={1}
                />
              );
            case 'type':
              return (
                <CustomSelect
                  key={field}
                  label="نوع المعدة"
                  value={formData.type}
                  items={Object.entries(EQUIPMENT_TYPES).map(([value, { icon, name }]) => ({
                    label: name,
                    value,
                    icon,
                  }))}
                  required={true}
                  error={errors.type}
                  icon="🔧"
                />
              );
            case 'status':
              return (
                <CustomSelect
                  key={field}
                  label="حالة المعدة"
                  value={formData.status}
                  items={Object.entries(EQUIPMENT_STATUS).map(([value, { icon, name }]) => ({
                    label: name,
                    value,
                    icon,
                  }))}
                  required
                  horizontal
                  error={errors.status}
                  icon="🔄"
                />
              );
            case 'operationalStatus':
              return (
                <CustomSelect
                  key={field}
                  label="الحالة التشغيلية"
                  value={formData.operationalStatus}
                  items={Object.entries(OPERATIONAL_STATUS).map(([value, { icon, name }]) => ({
                    label: name,
                    value,
                    icon,
                  }))}
                  required
                  horizontal
                  error={errors.operationalStatus}
                  icon="📊"
                />
              );
            case 'quantity':
              return (
                <CustomTextInput
                  key={field}
                  label="الكمية"
                  value={formData.quantity}
                  onChangeText={(value: string) => updateFormField('quantity', value)}
                  keyboardType="numeric"
                  required={true}
                  error={errors.quantity}
                  icon="🔢"
                  multiline={false}
                  numberOfLines={1}
                />
              );
            case 'purchaseDate':
              return (
                <CustomDatePicker
                  key={field}
                  label="تاريخ الشراء"
                  value={formData.purchaseDate}
                  required
                  error={errors.purchaseDate}
                  icon="📅"
                />
              );
            case 'warrantyExpiryDate':
              return (
                <CustomDatePicker
                  key={field}
                  label="تاريخ انتهاء الضمان"
                  value={formData.warrantyExpiryDate}
                  error={errors.warrantyExpiryDate}
                  icon="🔰"
                  required={false}
                />
              );
            case 'serialNumber':
              return (
                <CustomTextInput
                  key={field}
                  label="الرقم التسلسلي"
                  value={formData.serialNumber}
                  onChangeText={(value: string) => updateFormField('serialNumber', value)}
                  error={errors.serialNumber}
                  icon="🔍"
                  keyboardType="default"
                  multiline={false}
                  numberOfLines={1}
                  required={false}
                />
              );
            case 'manufacturer':
              return (
                <CustomTextInput
                  key={field}
                  label="الشركة المصنعة"
                  value={formData.manufacturer}
                  onChangeText={(value: string) => updateFormField('manufacturer', value)}
                  error={errors.manufacturer}
                  icon="🏭"
                  keyboardType="default"
                  multiline={false}
                  numberOfLines={1}
                  required={false}
                />
              );
            case 'model':
              return (
                <CustomTextInput
                  key={field}
                  label="الطراز"
                  value={formData.model}
                  onChangeText={(value: string) => updateFormField('model', value)}
                  error={errors.model}
                  icon="📋"
                  keyboardType="default"
                  multiline={false}
                  numberOfLines={1}
                  required={false}
                />
              );
            case 'yearOfManufacture':
              return (
                <CustomTextInput
                  key={field}
                  label="سنة الصنع"
                  value={formData.yearOfManufacture}
                  onChangeText={(value: string) => updateFormField('yearOfManufacture', value)}
                  keyboardType="numeric"
                  error={errors.yearOfManufacture}
                  icon="📆"
                  multiline={false}
                  numberOfLines={1}
                  required={false}
                />
              );
            case 'purchasePrice':
              return (
                <CustomTextInput
                  key={field}
                  label="سعر الشراء (د.ج)"
                  value={formData.purchasePrice}
                  onChangeText={(value: string) => updateFormField('purchasePrice', value)}
                  keyboardType="numeric"
                  error={errors.purchasePrice}
                  icon="💲"
                  multiline={false}
                  numberOfLines={1}
                  required={false}
                />
              );
            case 'fuelType':
              return (
                <CustomSelect
                  key={field}
                  label="نوع الوقود"
                  value={formData.fuelType}
                  items={Object.entries(FUEL_TYPES).map(([value, { icon, name }]) => ({
                    label: name,
                    value,
                    icon,
                  }))}
                  error={errors.fuelType}
                  icon="⛽"
                  required={false}
                />
              );
            case 'fuelCapacity':
              return (
                <CustomTextInput
                  key={field}
                  label="سعة الوقود (لتر)"
                  value={formData.fuelCapacity}
                  onChangeText={(value: string) => updateFormField('fuelCapacity', value)}
                  keyboardType="numeric"
                  error={errors.fuelCapacity}
                  icon="🛢️"
                  multiline={false}
                  numberOfLines={1}
                  required={false}
                />
              );
            case 'powerOutput':
              return (
                <CustomTextInput
                  key={field}
                  label="قدرة المحرك"
                  value={formData.powerOutput}
                  onChangeText={(value: string) => updateFormField('powerOutput', value)}
                  error={errors.powerOutput}
                  icon="⚡"
                  keyboardType="default"
                  multiline={false}
                  numberOfLines={1}
                  required={false}
                />
              );
            case 'dimensions':
              return (
                <CustomTextInput
                  key={field}
                  label="الأبعاد"
                  value={formData.dimensions}
                  onChangeText={(value: string) => updateFormField('dimensions', value)}
                  error={errors.dimensions}
                  icon="📏"
                  keyboardType="default"
                  multiline={false}
                  numberOfLines={1}
                  required={false}
                />
              );
            case 'weight':
              return (
                <CustomTextInput
                  key={field}
                  label="الوزن (كغ)"
                  value={formData.weight}
                  onChangeText={(value: string) => updateFormField('weight', value)}
                  keyboardType="numeric"
                  error={errors.weight}
                  icon="⚖️"
                  multiline={false}
                  numberOfLines={1}
                  required={false}
                />
              );
            case 'location':
              return (
                <CustomTextInput
                  key={field}
                  label="موقع المعدة"
                  value={formData.location}
                  onChangeText={(value: string) => updateFormField('location', value)}
                  error={errors.location}
                  icon="📍"
                  keyboardType="default"
                  multiline={false}
                  numberOfLines={1}
                  required={false}
                />
              );
            case 'assignedOperator':
              return (
                <CustomTextInput
                  key={field}
                  label="المشغل المسؤول"
                  value={formData.assignedOperator}
                  onChangeText={(value: string) => updateFormField('assignedOperator', value)}
                  error={errors.assignedOperator}
                  icon="👨‍🔧"
                  keyboardType="default"
                  multiline={false}
                  numberOfLines={1}
                  required={false}
                />
              );
            case 'notes':
              return (
                <CustomTextInput
                  key={field}
                  label="ملاحظات"
                  value={formData.notes}
                  onChangeText={(value: string) => updateFormField('notes', value)}
                  multiline={true}
                  numberOfLines={3}
                  error={errors.notes}
                  icon="📝"
                  keyboardType="default"
                  required={false}
                />
              );
            case 'operatingInstructions':
              return (
                <CustomTextInput
                  key={field}
                  label="تعليمات التشغيل"
                  value={formData.operatingInstructions}
                  onChangeText={(value: string) => updateFormField('operatingInstructions', value)}
                  multiline={true}
                  numberOfLines={3}
                  error={errors.operatingInstructions}
                  icon="📖"
                  keyboardType="default"
                  required={false}
                />
              );
            case 'safetyGuidelines':
              return (
                <CustomTextInput
                  key={field}
                  label="إرشادات السلامة"
                  value={formData.safetyGuidelines}
                  onChangeText={(value: string) => updateFormField('safetyGuidelines', value)}
                  multiline={true}
                  numberOfLines={3}
                  error={errors.safetyGuidelines}
                  icon="⚠️"
                  keyboardType="default"
                  required={false}
                />
              );
            default:
              return null;
          }
        })}
      </View>
    );
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {formPages.map((_, index) => (
          <Animated.View 
            key={index} 
            style={[
              styles.progressStep, 
              {
                flex: 1,
                backgroundColor: index <= currentPage ? theme.colors.primary.base : theme.colors.neutral.border,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderPageHeader = () => {
    const currentPageData = formPages[currentPage];
    return (
      <View style={styles.pageHeader}>
        <MaterialCommunityIcons
          name={currentPageData.icon}
          style={[styles.pageIcon, { color: theme.colors.primary.base }]}
        />
      <View style={styles.pageTitleContainer}>
          <Text style={[styles.pageTitle, { color: theme.colors.neutral.textPrimary }]}>
            {currentPageData.title}
          </Text>
          <Text style={[styles.pageSubtitle, { color: theme.colors.neutral.textSecondary }]}>
            {currentPageData.subtitle}
      </Text>
        </View>
    </View>
  );
  };

  const renderFormProgress = () => {
  return (
      <View style={styles.formProgressContainer}>
        <Text style={[styles.formProgressText, { color: theme.colors.neutral.textPrimary }]}>
          {`الخطوة ${currentPage + 1} من ${formPages.length}`}
              </Text>
            </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
    paddingBottom: 48,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
      marginBottom: 32,
    alignItems: 'center',
      backgroundColor: theme.colors.neutral.surface,
      padding: 16,
      borderRadius: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
  },
  progressStep: {
      height: 8,
      marginHorizontal: 3,
      borderRadius: 4,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
      marginBottom: 24,
      backgroundColor: theme.colors.neutral.surface,
      padding: 16,
      borderRadius: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
  },
  pageIcon: {
      fontSize: 32,
    marginRight: 16,
      backgroundColor: theme.colors.primary.surface,
      padding: 12,
      borderRadius: 12,
      overflow: 'hidden',
  },
  pageTitleContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
      marginBottom: 6,
    textAlign: 'right',
  },
  pageSubtitle: {
      fontSize: 26,
    textAlign: 'right',
      opacity: 0.8,
  },
  formProgressContainer: {
    alignItems: 'center',
      marginBottom: 16,
      backgroundColor: theme.colors.neutral.surface,
      padding: 12,
      borderRadius: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
  },
  formProgressText: {
      fontSize: 26,
      fontWeight: '600',
      textAlign: 'center',
  },
  divider: {
    marginVertical: 16,
    height: 1,
  },
  formContent: {
    marginBottom: 24,
  },
  fieldsContainer: {
    gap: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputIcon: {
      fontSize: 24,
      marginLeft: 12,
      opacity: 0.9,
  },
  inputContainer: {
      marginBottom: 24,
      backgroundColor: theme.colors.neutral.surface,
      padding: 16,
      borderRadius: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
  },
  inputLabel: {
      fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
      marginBottom: 8,
      color: theme.colors.neutral.textPrimary,
  },
  textInput: {
    height: 50,
    textAlign: 'right',
      fontSize: 26,
  },
  textInputMultiline: {
    minHeight: 100,
    textAlign: 'right',
    fontSize: 16,
    paddingTop: 12,
  },
  inputError: {
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 13,
    marginTop: 6,
    marginRight: 4,
    textAlign: 'right',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    padding: 10,
    borderRadius: 8,
  },
  selectContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
      backgroundColor: theme.colors.neutral.background,
      padding: 12,
      borderRadius: 12,
  },
  horizontalSelect: {
    justifyContent: 'space-between',
  },
  selectButton: {
      marginBottom: 12,
      borderRadius: 12,
      width: '48%',
      flex: 0,
      paddingVertical: 12,
      paddingHorizontal: 8,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      minHeight: 72,
    },
    selectButtonContent: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 4,
    },
    selectButtonIcon: {
      fontSize: 24,
      marginBottom: 4,
  },
  selectButtonText: {
      fontWeight: '700',
      fontSize: 20,
      textAlign: 'center',
      flexWrap: 'wrap',
      lineHeight: 20,
  },
  datePickerButton: {
    borderRadius: 12,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  datePickerButtonText: {
    marginVertical: 2,
    fontWeight: 'normal',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
      gap: 20,
      marginTop: 32,
      paddingHorizontal: 8,
  },
  button: {
    flex: 1,
      paddingVertical: 12,
      borderRadius: 16,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 3,
  },
  buttonText: {
      fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
    selectedButton: {
      width: '100%',
      borderRadius: 12,
      marginBottom: 0,
    },
    selectedItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 12,
      paddingHorizontal: 16,
    },
    selectedItemIcon: {
      fontSize: 20,
    },
    selectedItemText: {
      fontSize: 20,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <StatusBar
        backgroundColor={theme.colors.neutral.background}
        barStyle={theme.colors.neutral.textPrimary === '#1A2F2B' ? 'dark-content' : 'light-content'}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
        >
          <View style={[styles.form, { backgroundColor: theme.colors.neutral.background }]}>
            {renderProgressBar()}
            {renderPageHeader()}
            {renderFormProgress()}
            
            <Divider style={[styles.divider, { backgroundColor: theme.colors.neutral.border }]} />
            
            <View style={styles.formContent}>
              {renderCurrentPageFields()}
            </View>

            {error && (
              <Text style={[styles.errorMessage, { 
                color: theme.colors.error,
                backgroundColor: `${theme.colors.error}10`
              }]}>
                {error}
              </Text>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={prevPage}
                style={[styles.button, { borderColor: theme.colors.primary.base }]}
                labelStyle={[styles.buttonText, { color: theme.colors.primary.base }]}
                disabled={loading}
              >
                {currentPage === 0 ? 'إلغاء' : 'السابق'}
              </Button>
              <Button
                mode="contained"
                onPress={nextPage}
                loading={loading}
                style={[styles.button, { backgroundColor: theme.colors.primary.base }]}
                labelStyle={[styles.buttonText, { color: theme.colors.neutral.surface }]}
                disabled={formSubmitting}
              >
                {currentPage === formPages.length - 1 ? (isEditing ? 'تحديث' : 'حفظ') : 'التالي'}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={dateField === 'purchaseDate' ? formData.purchaseDate : (formData.warrantyExpiryDate || new Date())}
          mode="date"
          display="default"
          onChange={handleDateChange}
          textColor={theme.colors.neutral.textPrimary}
        />
      )}
    </SafeAreaView>
  );
};

export default AddEquipment;