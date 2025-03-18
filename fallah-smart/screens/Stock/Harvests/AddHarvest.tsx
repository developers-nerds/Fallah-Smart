import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useHarvest } from '../../../context/HarvestContext';
import { StockHarvest } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StockStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/Button';
import { Formik } from 'formik';
import * as Yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TextInput } from '../../../components/TextInput';
import { Picker } from '@react-native-picker/picker';
import { HARVEST_TYPES, QUALITY_TYPES } from './constants';

type AddHarvestScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddHarvest'>;
  route: RouteProp<StockStackParamList, 'AddHarvest'>;
};

const validationSchema = Yup.object().shape({
  cropName: Yup.string().required('الاسم مطلوب'),
  type: Yup.string().required('النوع مطلوب'),
  quantity: Yup.number()
    .required('الكمية مطلوبة')
    .min(0, 'يجب أن تكون الكمية أكبر من 0'),
  unit: Yup.string().required('الوحدة مطلوبة'),
  price: Yup.number()
    .required('السعر مطلوب')
    .min(0, 'يجب أن يكون السعر أكبر من 0'),
  harvestDate: Yup.date().required('تاريخ الحصاد مطلوب'),
});

const harvestTypes = [
  { label: 'خضروات', value: 'vegetable' },
  { label: 'فواكه', value: 'fruit' },
  { label: 'حبوب', value: 'grain' },
  { label: 'أعشاب', value: 'herb' },
];

const AddHarvestScreen: React.FC<AddHarvestScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { harvests, addHarvest, updateHarvest, loading } = useHarvest();
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [existingHarvest, setExistingHarvest] = useState<StockHarvest | null>(null);

  useEffect(() => {
    if (route.params?.harvestId) {
      const foundHarvest = harvests.find(h => h.id === route.params.harvestId);
      if (foundHarvest) {
        setExistingHarvest(foundHarvest);
      }
    }
  }, [harvests, route.params?.harvestId]);

  const initialValues: Partial<StockHarvest> = {
    cropName: existingHarvest?.cropName || '',
    type: existingHarvest?.type || 'vegetable',
    quantity: existingHarvest?.quantity || 0,
    unit: existingHarvest?.unit || 'كيلوجرام',
    price: existingHarvest?.price || 0,
    harvestDate: existingHarvest?.harvestDate ? new Date(existingHarvest.harvestDate) : new Date(),
    storageLocation: existingHarvest?.storageLocation || '',
    quality: existingHarvest?.quality || 'standard',
    batchNumber: existingHarvest?.batchNumber || '',
    expiryDate: existingHarvest?.expiryDate ? new Date(existingHarvest.expiryDate) : undefined,
    storageConditions: existingHarvest?.storageConditions || '',
    certifications: existingHarvest?.certifications || '',
    notes: existingHarvest?.notes || '',
    minQuantityAlert: existingHarvest?.minQuantityAlert || 0,
    moisture: existingHarvest?.moisture || 0,
  };

  const handleSubmit = async (values: Partial<StockHarvest>) => {
    try {
      // Ensure the dates are in the correct format
      const formattedValues = {
        ...values,
        harvestDate: values.harvestDate instanceof Date ? 
          values.harvestDate.toISOString() : values.harvestDate,
        expiryDate: values.expiryDate instanceof Date ? 
          values.expiryDate.toISOString() : values.expiryDate
      };
      
      if (existingHarvest) {
        await updateHarvest(existingHarvest.id, formattedValues);
        Alert.alert('نجاح', 'تم تحديث المحصول بنجاح');
      } else {
        await addHarvest(formattedValues);
        Alert.alert('نجاح', 'تمت إضافة المحصول بنجاح');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error submitting harvest:', error);
      Alert.alert('خطأ', 'فشل في حفظ المحصول');
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
      enableReinitialize
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
          <View style={styles.content}>
            <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                المعلومات الأساسية
              </Text>
              <TextInput
                label="الاسم"
                value={values.cropName}
                onChangeText={handleChange('cropName')}
                onBlur={handleBlur('cropName')}
                error={touched.cropName && errors.cropName ? String(errors.cropName) : undefined}
              />
              <View style={styles.pickerContainer}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  النوع
                </Text>
                <Picker
                  selectedValue={values.type}
                  onValueChange={handleChange('type')}
                  style={[styles.picker, { color: theme.colors.neutral.textPrimary }]}
                >
                  {harvestTypes.map(type => (
                    <Picker.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Picker>
              </View>
              <TextInput
                label="الكمية"
                value={values.quantity?.toString()}
                onChangeText={handleChange('quantity')}
                onBlur={handleBlur('quantity')}
                error={touched.quantity && errors.quantity ? String(errors.quantity) : undefined}
                keyboardType="numeric"
              />
              <TextInput
                label="الوحدة"
                value={values.unit}
                onChangeText={handleChange('unit')}
                onBlur={handleBlur('unit')}
                error={touched.unit && errors.unit ? String(errors.unit) : undefined}
              />
              <TextInput
                label="السعر"
                value={values.price?.toString()}
                onChangeText={handleChange('price')}
                onBlur={handleBlur('price')}
                error={touched.price && errors.price ? String(errors.price) : undefined}
                keyboardType="numeric"
              />
              <TextInput
                label="الحد الأدنى للتنبيه"
                value={values.minQuantityAlert?.toString()}
                onChangeText={handleChange('minQuantityAlert')}
                onBlur={handleBlur('minQuantityAlert')}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowHarvestDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  تاريخ الحصاد: {values.harvestDate instanceof Date ? 
                    values.harvestDate.toLocaleDateString() : 
                    new Date(values.harvestDate as string).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                معلومات إضافية
              </Text>
              <TextInput
                label="موقع التخزين"
                value={values.storageLocation}
                onChangeText={handleChange('storageLocation')}
                onBlur={handleBlur('storageLocation')}
              />
              <View style={styles.pickerContainer}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  الجودة
                </Text>
                <Picker
                  selectedValue={values.quality}
                  onValueChange={handleChange('quality')}
                  style={[styles.picker, { color: theme.colors.neutral.textPrimary }]}
                >
                  <Picker.Item label="ممتاز" value="premium" />
                  <Picker.Item label="قياسي" value="standard" />
                  <Picker.Item label="ثانوي" value="secondary" />
                </Picker>
              </View>
              <TextInput
                label="رقم الدفعة"
                value={values.batchNumber}
                onChangeText={handleChange('batchNumber')}
                onBlur={handleBlur('batchNumber')}
              />
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowExpiryDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  تاريخ انتهاء الصلاحية: {values.expiryDate instanceof Date ? 
                    values.expiryDate.toLocaleDateString() : 
                    values.expiryDate ? new Date(values.expiryDate as string).toLocaleDateString() : 'غير محدد'}
                </Text>
              </TouchableOpacity>
              <TextInput
                label="نسبة الرطوبة (%)"
                value={values.moisture?.toString()}
                onChangeText={handleChange('moisture')}
                onBlur={handleBlur('moisture')}
                keyboardType="numeric"
              />
              <TextInput
                label="ظروف التخزين"
                value={values.storageConditions}
                onChangeText={handleChange('storageConditions')}
                onBlur={handleBlur('storageConditions')}
                multiline
                numberOfLines={2}
              />
              <TextInput
                label="الشهادات"
                value={values.certifications}
                onChangeText={handleChange('certifications')}
                onBlur={handleBlur('certifications')}
              />
            </View>

            <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                ملاحظات
              </Text>
              <TextInput
                value={values.notes}
                onChangeText={handleChange('notes')}
                onBlur={handleBlur('notes')}
                multiline
                numberOfLines={4}
                placeholder="أضف ملاحظات هنا..."
                placeholderTextColor={theme.colors.neutral.textSecondary}
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

          {showHarvestDatePicker && (
            <DateTimePicker
              value={values.harvestDate instanceof Date ? 
                values.harvestDate : new Date(values.harvestDate as string)}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowHarvestDatePicker(false);
                if (selectedDate) {
                  setFieldValue('harvestDate', selectedDate);
                }
              }}
            />
          )}

          {showExpiryDatePicker && (
            <DateTimePicker
              value={values.expiryDate instanceof Date ? 
                values.expiryDate : values.expiryDate ? new Date(values.expiryDate as string) : new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowExpiryDatePicker(false);
                if (selectedDate) {
                  setFieldValue('expiryDate', selectedDate);
                }
              }}
            />
          )}
        </ScrollView>
      )}
    </Formik>
  );
};

const styles = createThemedStyles(theme => ({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'right',
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'right',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  dateButton: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginVertical: 8,
  },
  dateButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
}));

export default AddHarvestScreen; 