import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useEquipment } from '../../../context/EquipmentContext';
import { StockEquipment } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { TextInput } from '../../../components/TextInput';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Formik } from 'formik';
import * as Yup from 'yup';

type AddEquipmentScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddEquipment'>;
  route: RouteProp<StockStackParamList, 'AddEquipment'>;
};

const validationSchema = Yup.object().shape({
  name: Yup.string().required('اسم المعدة مطلوب'),
  type: Yup.string().required('نوع المعدة مطلوب'),
  quantity: Yup.number()
    .required('الكمية مطلوبة')
    .min(0, 'الكمية يجب أن تكون أكبر من أو تساوي 0'),
  unit: Yup.string().required('وحدة القياس مطلوبة'),
  price: Yup.number()
    .required('السعر مطلوب')
    .min(0, 'السعر يجب أن يكون أكبر من أو يساوي 0'),
  condition: Yup.string().required('حالة المعدة مطلوبة'),
});

const equipmentTypes = [
  { label: 'جرار', value: 'tractor' },
  { label: 'حصادة', value: 'harvester' },
  { label: 'ري', value: 'irrigation' },
  { label: 'تخزين', value: 'storage' },
  { label: 'معالجة', value: 'processing' },
];

const conditions = [
  { label: 'جديد', value: 'new' },
  { label: 'ممتاز', value: 'excellent' },
  { label: 'جيد', value: 'good' },
  { label: 'متوسط', value: 'fair' },
  { label: 'سيء', value: 'poor' },
];

const AddEquipmentScreen: React.FC<AddEquipmentScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { equipment, addEquipment, updateEquipment, loading } = useEquipment();
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showWarrantyDatePicker, setShowWarrantyDatePicker] = useState(false);
  const [showLastMaintenanceDatePicker, setShowLastMaintenanceDatePicker] = useState(false);
  const [showNextMaintenanceDatePicker, setShowNextMaintenanceDatePicker] = useState(false);

  const equipmentId = route.params?.equipmentId;
  const existingEquipment = equipmentId
    ? equipment.find(e => e.id === equipmentId)
    : null;

  const initialValues: Partial<StockEquipment> = {
    name: existingEquipment?.name || '',
    type: existingEquipment?.type || equipmentTypes[0].value,
    quantity: existingEquipment?.quantity || 0,
    unit: existingEquipment?.unit || '',
    price: existingEquipment?.price || 0,
    condition: existingEquipment?.condition || conditions[0].value,
    manufacturer: existingEquipment?.manufacturer || '',
    model: existingEquipment?.model || '',
    serialNumber: existingEquipment?.serialNumber || '',
    purchaseDate: existingEquipment?.purchaseDate || new Date().toISOString(),
    warrantyExpiryDate: existingEquipment?.warrantyExpiryDate || '',
    lastMaintenanceDate: existingEquipment?.lastMaintenanceDate || '',
    nextMaintenanceDate: existingEquipment?.nextMaintenanceDate || '',
    location: existingEquipment?.location || '',
    notes: existingEquipment?.notes || '',
    supplier: existingEquipment?.supplier || '',
  };

  const handleSubmit = async (values: Partial<StockEquipment>) => {
    try {
      if (equipmentId) {
        await updateEquipment(equipmentId, values);
      } else {
        await addEquipment(values);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حفظ المعدة');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.neutral.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.base} />
      </View>
    );
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.colors.neutral.textPrimary }]}>
              {equipmentId ? 'تعديل المعدة' : 'إضافة معدة جديدة'}
            </Text>

            <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                المعلومات الأساسية
              </Text>

              <TextInput
                label="اسم المعدة"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                error={touched.name && errors.name}
              />

              <View style={styles.pickerContainer}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  نوع المعدة
                </Text>
                <Picker
                  selectedValue={values.type}
                  onValueChange={handleChange('type')}
                  style={[styles.picker, { color: theme.colors.neutral.textPrimary }]}
                >
                  {equipmentTypes.map(type => (
                    <Picker.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Picker>
              </View>

              <TextInput
                label="الكمية"
                value={values.quantity?.toString()}
                onChangeText={handleChange('quantity')}
                onBlur={handleBlur('quantity')}
                error={touched.quantity && errors.quantity}
                keyboardType="numeric"
              />

              <TextInput
                label="وحدة القياس"
                value={values.unit}
                onChangeText={handleChange('unit')}
                onBlur={handleBlur('unit')}
                error={touched.unit && errors.unit}
              />

              <TextInput
                label="السعر"
                value={values.price?.toString()}
                onChangeText={handleChange('price')}
                onBlur={handleBlur('price')}
                error={touched.price && errors.price}
                keyboardType="numeric"
              />

              <View style={styles.pickerContainer}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  الحالة
                </Text>
                <Picker
                  selectedValue={values.condition}
                  onValueChange={handleChange('condition')}
                  style={[styles.picker, { color: theme.colors.neutral.textPrimary }]}
                >
                  {conditions.map(condition => (
                    <Picker.Item key={condition.value} label={condition.label} value={condition.value} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                معلومات إضافية
              </Text>

              <TextInput
                label="الشركة المصنعة"
                value={values.manufacturer}
                onChangeText={handleChange('manufacturer')}
                onBlur={handleBlur('manufacturer')}
              />

              <TextInput
                label="الموديل"
                value={values.model}
                onChangeText={handleChange('model')}
                onBlur={handleBlur('model')}
              />

              <TextInput
                label="الرقم التسلسلي"
                value={values.serialNumber}
                onChangeText={handleChange('serialNumber')}
                onBlur={handleBlur('serialNumber')}
              />

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowPurchaseDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  تاريخ الشراء: {new Date(values.purchaseDate || '').toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowWarrantyDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  تاريخ انتهاء الضمان: {values.warrantyExpiryDate ? new Date(values.warrantyExpiryDate).toLocaleDateString() : 'غير محدد'}
                </Text>
              </TouchableOpacity>

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
            </View>

            <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                معلومات الصيانة
              </Text>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowLastMaintenanceDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  تاريخ آخر صيانة: {values.lastMaintenanceDate ? new Date(values.lastMaintenanceDate).toLocaleDateString() : 'غير محدد'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowNextMaintenanceDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  تاريخ الصيانة القادمة: {values.nextMaintenanceDate ? new Date(values.nextMaintenanceDate).toLocaleDateString() : 'غير محدد'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                ملاحظات
              </Text>

              <TextInput
                label="ملاحظات"
                value={values.notes}
                onChangeText={handleChange('notes')}
                onBlur={handleBlur('notes')}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="حفظ"
                onPress={() => handleSubmit()}
                variant="primary"
              />
              <Button
                title="إلغاء"
                onPress={() => navigation.goBack()}
                variant="secondary"
              />
            </View>
          </View>

          {showPurchaseDatePicker && (
            <DateTimePicker
              value={new Date(values.purchaseDate || '')}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowPurchaseDatePicker(false);
                if (date) {
                  setFieldValue('purchaseDate', date.toISOString());
                }
              }}
            />
          )}

          {showWarrantyDatePicker && (
            <DateTimePicker
              value={values.warrantyExpiryDate ? new Date(values.warrantyExpiryDate) : new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowWarrantyDatePicker(false);
                if (date) {
                  setFieldValue('warrantyExpiryDate', date.toISOString());
                }
              }}
            />
          )}

          {showLastMaintenanceDatePicker && (
            <DateTimePicker
              value={values.lastMaintenanceDate ? new Date(values.lastMaintenanceDate) : new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowLastMaintenanceDatePicker(false);
                if (date) {
                  setFieldValue('lastMaintenanceDate', date.toISOString());
                }
              }}
            />
          )}

          {showNextMaintenanceDatePicker && (
            <DateTimePicker
              value={values.nextMaintenanceDate ? new Date(values.nextMaintenanceDate) : new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowNextMaintenanceDatePicker(false);
                if (date) {
                  setFieldValue('nextMaintenanceDate', date.toISOString());
                }
              }}
            />
          )}
        </ScrollView>
      )}
    </Formik>
  );
};

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  picker: {
    backgroundColor: theme.colors.neutral.background,
    borderRadius: 8,
  },
  dateButton: {
    padding: 12,
    backgroundColor: theme.colors.neutral.background,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateButtonText: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
}));

export default AddEquipmentScreen; 