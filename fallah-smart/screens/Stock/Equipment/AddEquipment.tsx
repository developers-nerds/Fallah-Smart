import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Platform, StatusBar, Alert, I18nManager, KeyboardAvoidingView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEquipment } from '../../../context/EquipmentContext';
import { EQUIPMENT_TYPES, EQUIPMENT_STATUS, OPERATIONAL_STATUS, FUEL_TYPES, EquipmentType, EquipmentStatus, OperationalStatus, FuelType } from './constants';
import { formatDate } from '../../../utils/date';
import { Button, Divider, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn, ZoomIn, SlideInRight } from 'react-native-reanimated';
import { StockStackParamList } from '../../../navigation/types';
import { StockEquipment } from '../../Stock/types';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  icon: string;
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

export const AddEquipment: React.FC<AddEquipmentScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { addEquipment, equipment, updateEquipment } = useEquipment();
  const equipmentId = route.params?.equipmentId;
  const isEditing = !!equipmentId;
  const equipmentToEdit = isEditing ? equipment.find(item => item.id === equipmentId) : null;

  const [currentPage, setCurrentPage] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState<DateField>('purchaseDate');
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '' as EquipmentType,
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
    fuelType: '' as FuelType,
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

  // Define form pages with Arabic titles and subtitles
  const formPages: FormPage[] = [
    {
      title: 'المعلومات الأساسية',
      subtitle: 'أدخل المعلومات الأساسية للمعدة',
      icon: '🔧',
      fields: ['name', 'type', 'status', 'operationalStatus', 'quantity'],
    },
    {
      title: 'معلومات الشراء',
      subtitle: 'أدخل تفاصيل شراء المعدة',
      icon: '💰',
      fields: ['purchaseDate', 'warrantyExpiryDate', 'purchasePrice', 'serialNumber'],
    },
    {
      title: 'المعلومات التقنية',
      subtitle: 'أدخل المواصفات التقنية للمعدة',
      icon: '⚙️',
      fields: ['manufacturer', 'model', 'yearOfManufacture', 'fuelType', 'fuelCapacity', 'powerOutput', 'dimensions', 'weight'],
    },
    {
      title: 'معلومات التشغيل',
      subtitle: 'أدخل معلومات تشغيل المعدة',
      icon: '🛠️',
      fields: ['location', 'assignedOperator', 'notes', 'operatingInstructions', 'safetyGuidelines'],
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
        fuelType: equipmentToEdit.fuelType as FuelType || '' as FuelType,
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

      const equipmentData = {
        ...formData,
        quantity: parseInt(formData.quantity, 10),
        yearOfManufacture: formData.yearOfManufacture ? parseInt(formData.yearOfManufacture, 10) : undefined,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        fuelCapacity: formData.fuelCapacity ? parseFloat(formData.fuelCapacity) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
      };

      if (isEditing) {
        await updateEquipment(equipmentId, equipmentData);
        Alert.alert('تم بنجاح', 'تم تحديث المعدة بنجاح', [
          { text: 'حسناً', onPress: () => navigation.goBack() }
        ]);
      } else {
        await addEquipment(equipmentData);
        Alert.alert('تم بنجاح', 'تمت إضافة المعدة بنجاح', [
          { text: 'حسناً', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (err) {
      console.error('Error saving equipment:', err);
      setError('حدث خطأ أثناء حفظ المعدة، يرجى المحاولة مرة أخرى');
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
  const CustomTextInput = ({ label, value, onChangeText, keyboardType, multiline, numberOfLines, required, error, icon }) => (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.inputIcon}>{icon}</Text>
        <Text style={styles.inputLabel}>
          {label} {required && <Text style={{ color: '#E53935' }}>*</Text>}
        </Text>
      </View>
      <TextInput
        style={multiline ? styles.textInputMultiline : styles.textInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        placeholder={label}
        placeholderTextColor="#9E9E9E"
        error={!!error}
        mode="outlined"
        right={<TextInput.Icon icon="pencil" />}
        theme={{ 
          colors: { 
            background: '#FAFAFA',
            primary: '#4CAF50',
            text: '#212121'
          } 
        }}
        outlineColor="#E0E0E0"
        activeOutlineColor="#4CAF50"
        textAlign="right"
        textAlignVertical={multiline ? "top" : "center"}
        dense
      />
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );

  const CustomSelect = ({ label, value, items, required, error, horizontal = false, icon }) => (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.inputIcon}>{icon}</Text>
        <Text style={styles.inputLabel}>
          {label} {required && <Text style={{ color: '#E53935' }}>*</Text>}
        </Text>
      </View>
      <View style={[styles.selectContainer, horizontal && styles.horizontalSelect]}>
        {items.map((item) => (
          <Button
            key={item.value}
            mode={value === item.value ? "contained" : "outlined"}
            onPress={() => {
              if (label === 'نوع المعدة') {
                handleTypeSelect(item.value as EquipmentType);
              } else if (label === 'حالة المعدة') {
                handleStatusSelect(item.value as EquipmentStatus);
              } else if (label === 'الحالة التشغيلية') {
                handleOperationalStatusSelect(item.value as OperationalStatus);
              } else if (label === 'نوع الوقود') {
                handleFuelTypeSelect(item.value as FuelType);
              }
            }}
            style={[
              styles.selectButton,
              value === item.value && { backgroundColor: theme.colors.primary }
            ]}
            labelStyle={[
              styles.selectButtonText,
              value === item.value && { color: '#FFF' }
            ]}
          >
            {item.icon} {item.label}
          </Button>
        ))}
      </View>
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );

  const CustomDatePicker = ({ label, value, required, error, icon }) => (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.inputIcon}>{icon}</Text>
        <Text style={styles.inputLabel}>
          {label} {required && <Text style={{ color: '#E53935' }}>*</Text>}
        </Text>
      </View>
      <Button
        mode="outlined"
        onPress={() => showDatePickerModal(label === 'تاريخ الشراء' ? 'purchaseDate' : 'warrantyExpiryDate')}
        style={[styles.datePickerButton, error && styles.inputError]}
        labelStyle={styles.datePickerButtonText}
      >
        {value ? formatDate(value) : 'اختر تاريخ'}
      </Button>
      {error && (
        <Text style={styles.errorText}>
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
                  required
                  error={errors.name}
                  icon="🏷️"
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
                  required
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
                  required
                  error={errors.quantity}
                  icon="🔢"
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
                />
              );
            case 'notes':
              return (
                <CustomTextInput
                  key={field}
                  label="ملاحظات"
                  value={formData.notes}
                  onChangeText={(value: string) => updateFormField('notes', value)}
                  multiline
                  numberOfLines={3}
                  error={errors.notes}
                  icon="📝"
                />
              );
            case 'operatingInstructions':
              return (
                <CustomTextInput
                  key={field}
                  label="تعليمات التشغيل"
                  value={formData.operatingInstructions}
                  onChangeText={(value: string) => updateFormField('operatingInstructions', value)}
                  multiline
                  numberOfLines={3}
                  error={errors.operatingInstructions}
                  icon="📖"
                />
              );
            case 'safetyGuidelines':
              return (
                <CustomTextInput
                  key={field}
                  label="إرشادات السلامة"
                  value={formData.safetyGuidelines}
                  onChangeText={(value: string) => updateFormField('safetyGuidelines', value)}
                  multiline
                  numberOfLines={3}
                  error={errors.safetyGuidelines}
                  icon="⚠️"
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
            entering={FadeIn.delay(index * 100)}
            style={[
              styles.progressStep, 
              index <= currentPage ? 
                { backgroundColor: theme.colors.primary, width: `${100 / formPages.length - 2}%` } : 
                { backgroundColor: '#E0E0E0', width: `${100 / formPages.length - 2}%` }
            ]}
          />
        ))}
      </View>
    );
  };

  const renderPageHeader = () => (
    <Animated.View 
      entering={FadeInDown.springify()}
      style={styles.pageHeader}
    >
      <Animated.Text 
        entering={ZoomIn.springify()}
        style={styles.pageIcon}
      >
        {formPages[currentPage].icon}
      </Animated.Text>
      <View style={styles.pageTitleContainer}>
        <Text style={styles.pageTitle}>{formPages[currentPage].title}</Text>
        <Text style={styles.pageSubtitle}>{formPages[currentPage].subtitle}</Text>
      </View>
    </Animated.View>
  );

  const renderFormProgress = () => (
    <View style={styles.formProgressContainer}>
      <Text style={styles.formProgressText}>
        الصفحة {currentPage + 1} من {formPages.length}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle="dark-content"
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          style={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
        >
          <View style={styles.form}>
            {renderProgressBar()}
            {renderPageHeader()}
            {renderFormProgress()}
            
            <Divider style={styles.divider} />
            
            <View style={styles.formContent}>
              {renderCurrentPageFields()}
            </View>

            {error && (
              <Text style={styles.errorMessage}>
                {error}
              </Text>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={prevPage}
                style={styles.button}
                labelStyle={styles.buttonText}
                disabled={loading}
              >
                {currentPage === 0 ? 'إلغاء' : 'السابق'}
              </Button>
              <Button
                mode="contained"
                onPress={nextPage}
                loading={loading}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                labelStyle={[styles.buttonText, { color: '#FFF' }]}
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
        />
      )}
    </SafeAreaView>
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
    marginBottom: 24,
    alignItems: 'center',
  },
  progressStep: {
    height: 6,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 2,
    borderRadius: 3,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageIcon: {
    fontSize: 40,
    marginRight: 16,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pageTitleContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#212121',
    textAlign: 'right',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'right',
  },
  formProgressContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  formProgressText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  divider: {
    marginVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
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
    fontSize: 20,
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    color: '#424242',
  },
  textInput: {
    backgroundColor: '#FAFAFA',
    height: 50,
    textAlign: 'right',
    fontSize: 16,
  },
  textInputMultiline: {
    backgroundColor: '#FAFAFA',
    minHeight: 100,
    textAlign: 'right',
    fontSize: 16,
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#E53935',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#E53935',
    fontSize: 13,
    marginTop: 6,
    marginRight: 4,
    textAlign: 'right',
  },
  errorMessage: {
    color: '#E53935',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  selectContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  horizontalSelect: {
    justifyContent: 'space-between',
  },
  selectButton: {
    marginBottom: 8,
    borderRadius: 10,
    flex: 1,
    minWidth: '30%',
    borderColor: '#E0E0E0',
  },
  selectButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  datePickerButton: {
    borderColor: '#E0E0E0',
    borderRadius: 12,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  datePickerButtonText: {
    marginVertical: 2,
    color: '#212121',
    fontWeight: 'normal',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 4,
    textAlign: 'center',
  },
});

export default AddEquipment;