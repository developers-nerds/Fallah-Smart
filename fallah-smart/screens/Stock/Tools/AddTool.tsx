import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useTool } from '../../../context/ToolContext';
import { StockTool, ToolType, StockUnit } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInput } from '../../../components/TextInput';
import { Button } from '../../../components/Button';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';

type AddToolScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddTool'>;
};

interface FormData {
  name: string;
  quantity: string;
  unit: StockUnit;
  minQuantityAlert: string;
  price: string;
  type: ToolType;
  manufacturer: string;
  model: string;
  purchaseDate: Date | null;
  lastMaintenanceDate: Date | null;
  nextMaintenanceDate: Date | null;
  condition: 'new' | 'good' | 'fair' | 'poor';
  location: string;
  notes: string;
  supplier: string;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required('الاسم مطلوب'),
  quantity: Yup.number()
    .required('الكمية مطلوبة')
    .min(0, 'الكمية يجب أن تكون أكبر من 0'),
  unit: Yup.string().required('الوحدة مطلوبة'),
  minQuantityAlert: Yup.number()
    .required('حد التنبيه مطلوب')
    .min(0, 'حد التنبيه يجب أن يكون أكبر من 0'),
  price: Yup.number()
    .required('السعر مطلوب')
    .min(0, 'السعر يجب أن يكون أكبر من 0'),
  type: Yup.string().required('النوع مطلوب'),
  condition: Yup.string().required('الحالة مطلوبة'),
});

const initialFormData: FormData = {
  name: '',
  quantity: '',
  unit: 'piece',
  minQuantityAlert: '',
  price: '',
  type: 'hand',
  manufacturer: '',
  model: '',
  purchaseDate: null,
  lastMaintenanceDate: null,
  nextMaintenanceDate: null,
  condition: 'new',
  location: '',
  notes: '',
  supplier: '',
};

const AddToolScreen: React.FC<AddToolScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { addTool, loading } = useTool();
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showLastMaintenanceDatePicker, setShowLastMaintenanceDatePicker] = useState(false);
  const [showNextMaintenanceDatePicker, setShowNextMaintenanceDatePicker] = useState(false);

  const handleSubmit = async (values: FormData) => {
    try {
      await addTool({
        name: values.name,
        quantity: Number(values.quantity),
        unit: values.unit,
        minQuantityAlert: Number(values.minQuantityAlert),
        price: Number(values.price),
        type: values.type,
        manufacturer: values.manufacturer.trim(),
        model: values.model.trim(),
        purchaseDate: values.purchaseDate?.toISOString(),
        lastMaintenanceDate: values.lastMaintenanceDate?.toISOString(),
        nextMaintenanceDate: values.nextMaintenanceDate?.toISOString(),
        condition: values.condition,
        location: values.location.trim(),
        notes: values.notes.trim(),
        supplier: values.supplier.trim(),
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إضافة الأداة');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <Formik
        initialValues={initialFormData}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, handleSubmit, errors, touched }) => (
          <View style={styles.form}>
            <TextInput
              label="اسم الأداة"
              value={values.name}
              onChangeText={(text) => setFieldValue('name', text)}
              error={touched.name && errors.name}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  label="الكمية"
                  value={values.quantity}
                  onChangeText={(text) => setFieldValue('quantity', text)}
                  keyboardType="numeric"
                  error={touched.quantity && errors.quantity}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  الوحدة
                </Text>
                <RNPickerSelect
                  value={values.unit}
                  onValueChange={(value) => setFieldValue('unit', value)}
                  items={[
                    { label: 'قطعة', value: 'piece' },
                    { label: 'كيلوغرام', value: 'kg' },
                    { label: 'غرام', value: 'g' },
                    { label: 'لتر', value: 'l' },
                    { label: 'ملليلتر', value: 'ml' },
                    { label: 'صندوق', value: 'box' },
                    { label: 'كيس', value: 'bag' },
                    { label: 'زجاجة', value: 'bottle' },
                    { label: 'علبة', value: 'can' },
                    { label: 'حزمة', value: 'pack' },
                    { label: 'لفة', value: 'roll' },
                    { label: 'متر', value: 'meter' },
                    { label: 'سنتيمتر', value: 'cm' },
                    { label: 'أخرى', value: 'other' },
                  ]}
                  style={{
                    inputIOS: {
                      fontSize: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      borderWidth: 1,
                      borderColor: theme.colors.neutral.border,
                      borderRadius: 8,
                      color: theme.colors.neutral.textPrimary,
                    },
                    inputAndroid: {
                      fontSize: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      borderWidth: 1,
                      borderColor: theme.colors.neutral.border,
                      borderRadius: 8,
                      color: theme.colors.neutral.textPrimary,
                    },
                  }}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  label="حد التنبيه"
                  value={values.minQuantityAlert}
                  onChangeText={(text) => setFieldValue('minQuantityAlert', text)}
                  keyboardType="numeric"
                  error={touched.minQuantityAlert && errors.minQuantityAlert}
                />
              </View>
              <View style={styles.halfInput}>
                <TextInput
                  label="السعر"
                  value={values.price}
                  onChangeText={(text) => setFieldValue('price', text)}
                  keyboardType="numeric"
                  error={touched.price && errors.price}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  النوع
                </Text>
                <RNPickerSelect
                  value={values.type}
                  onValueChange={(value) => setFieldValue('type', value)}
                  items={[
                    { label: 'يدوي', value: 'hand' },
                    { label: 'كهربائي', value: 'power' },
                    { label: 'حديقة', value: 'garden' },
                    { label: 'ري', value: 'irrigation' },
                    { label: 'حصاد', value: 'harvesting' },
                    { label: 'أخرى', value: 'other' },
                  ]}
                  style={{
                    inputIOS: {
                      fontSize: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      borderWidth: 1,
                      borderColor: theme.colors.neutral.border,
                      borderRadius: 8,
                      color: theme.colors.neutral.textPrimary,
                    },
                    inputAndroid: {
                      fontSize: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      borderWidth: 1,
                      borderColor: theme.colors.neutral.border,
                      borderRadius: 8,
                      color: theme.colors.neutral.textPrimary,
                    },
                  }}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  الحالة
                </Text>
                <RNPickerSelect
                  value={values.condition}
                  onValueChange={(value) => setFieldValue('condition', value)}
                  items={[
                    { label: 'جديد', value: 'new' },
                    { label: 'جيد', value: 'good' },
                    { label: 'متوسط', value: 'fair' },
                    { label: 'سيء', value: 'poor' },
                  ]}
                  style={{
                    inputIOS: {
                      fontSize: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      borderWidth: 1,
                      borderColor: theme.colors.neutral.border,
                      borderRadius: 8,
                      color: theme.colors.neutral.textPrimary,
                    },
                    inputAndroid: {
                      fontSize: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      borderWidth: 1,
                      borderColor: theme.colors.neutral.border,
                      borderRadius: 8,
                      color: theme.colors.neutral.textPrimary,
                    },
                  }}
                />
              </View>
            </View>

            <TextInput
              label="الشركة المصنعة"
              value={values.manufacturer}
              onChangeText={(text) => setFieldValue('manufacturer', text)}
            />

            <TextInput
              label="الموديل"
              value={values.model}
              onChangeText={(text) => setFieldValue('model', text)}
            />

            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowPurchaseDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  {values.purchaseDate
                    ? values.purchaseDate.toLocaleDateString()
                    : 'تاريخ الشراء'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowLastMaintenanceDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  {values.lastMaintenanceDate
                    ? values.lastMaintenanceDate.toLocaleDateString()
                    : 'تاريخ آخر صيانة'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowNextMaintenanceDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  {values.nextMaintenanceDate
                    ? values.nextMaintenanceDate.toLocaleDateString()
                    : 'تاريخ الصيانة القادمة'}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              label="الموقع"
              value={values.location}
              onChangeText={(text) => setFieldValue('location', text)}
            />

            <TextInput
              label="المورد"
              value={values.supplier}
              onChangeText={(text) => setFieldValue('supplier', text)}
            />

            <TextInput
              label="ملاحظات"
              value={values.notes}
              onChangeText={(text) => setFieldValue('notes', text)}
              multiline
              numberOfLines={4}
            />

            <View style={styles.buttonContainer}>
              <Button
                title="إلغاء"
                onPress={() => navigation.goBack()}
                variant="secondary"
              />
              <Button
                title="حفظ"
                onPress={() => handleSubmit()}
                loading={loading}
                disabled={loading}
              />
            </View>

            {showPurchaseDatePicker && (
              <DateTimePicker
                value={values.purchaseDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowPurchaseDatePicker(false);
                  if (date) {
                    setFieldValue('purchaseDate', date);
                  }
                }}
                maximumDate={new Date()}
              />
            )}

            {showLastMaintenanceDatePicker && (
              <DateTimePicker
                value={values.lastMaintenanceDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowLastMaintenanceDatePicker(false);
                  if (date) {
                    setFieldValue('lastMaintenanceDate', date);
                  }
                }}
                maximumDate={new Date()}
              />
            )}

            {showNextMaintenanceDatePicker && (
              <DateTimePicker
                value={values.nextMaintenanceDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowNextMaintenanceDatePicker(false);
                  if (date) {
                    setFieldValue('nextMaintenanceDate', date);
                  }
                }}
                minimumDate={new Date()}
              />
            )}
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  dateContainer: {
    gap: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: theme.colors.neutral.border,
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
}));

export default AddToolScreen; 