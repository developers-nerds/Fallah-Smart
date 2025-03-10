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
import { useFertilizer } from '../../../context/FertilizerContext';
import { StockFertilizer } from '../types';
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

type AddFertilizerScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddFertilizer'>;
  route: RouteProp<StockStackParamList, 'AddFertilizer'>;
};

const validationSchema = Yup.object().shape({
  name: Yup.string().required('الاسم مطلوب'),
  type: Yup.string().required('النوع مطلوب'),
  quantity: Yup.number()
    .required('الكمية مطلوبة')
    .min(0, 'يجب أن تكون الكمية أكبر من 0'),
  unit: Yup.string().required('الوحدة مطلوبة'),
  price: Yup.number()
    .required('السعر مطلوب')
    .min(0, 'يجب أن يكون السعر أكبر من 0'),
  expiryDate: Yup.date().required('تاريخ الصلاحية مطلوب'),
});

const fertilizerTypes = [
  { label: 'عضوي', value: 'organic' },
  { label: 'غير عضوي', value: 'inorganic' },
  { label: 'حيوي', value: 'bio' },
];

const AddFertilizerScreen: React.FC<AddFertilizerScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { fertilizers, addFertilizer, updateFertilizer, loading } = useFertilizer();
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [existingFertilizer, setExistingFertilizer] = useState<StockFertilizer | null>(null);

  useEffect(() => {
    if (route.params?.fertilizerId) {
      const foundFertilizer = fertilizers.find(f => f.id === route.params.fertilizerId);
      if (foundFertilizer) {
        setExistingFertilizer(foundFertilizer);
      }
    }
  }, [fertilizers, route.params?.fertilizerId]);

  const initialValues: Partial<StockFertilizer> = {
    name: existingFertilizer?.name || '',
    type: existingFertilizer?.type || 'organic',
    quantity: existingFertilizer?.quantity || 0,
    unit: existingFertilizer?.unit || 'كيلوجرام',
    price: existingFertilizer?.price || 0,
    expiryDate: existingFertilizer?.expiryDate || new Date(),
    manufacturer: existingFertilizer?.manufacturer || '',
    batchNumber: existingFertilizer?.batchNumber || '',
    purchaseDate: existingFertilizer?.purchaseDate || new Date(),
    location: existingFertilizer?.location || '',
    supplier: existingFertilizer?.supplier || '',
    composition: existingFertilizer?.composition || '',
    npk: existingFertilizer?.npk || '',
    usageInstructions: existingFertilizer?.usageInstructions || '',
    notes: existingFertilizer?.notes || '',
  };

  const handleSubmit = async (values: Partial<StockFertilizer>) => {
    try {
      if (existingFertilizer) {
        await updateFertilizer(existingFertilizer.id, values);
      } else {
        await addFertilizer(values);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حفظ السماد');
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
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                error={touched.name && errors.name}
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
                  {fertilizerTypes.map(type => (
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
                label="الوحدة"
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
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowExpiryDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  تاريخ الصلاحية: {new Date(values.expiryDate).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
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
                label="رقم الدفعة"
                value={values.batchNumber}
                onChangeText={handleChange('batchNumber')}
                onBlur={handleBlur('batchNumber')}
              />
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowPurchaseDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  تاريخ الشراء: {new Date(values.purchaseDate).toLocaleDateString()}
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
                معلومات التركيب
              </Text>
              <TextInput
                label="التركيب"
                value={values.composition}
                onChangeText={handleChange('composition')}
                onBlur={handleBlur('composition')}
                multiline
                numberOfLines={2}
              />
              <TextInput
                label="نسبة NPK"
                value={values.npk}
                onChangeText={handleChange('npk')}
                onBlur={handleBlur('npk')}
              />
              <TextInput
                label="تعليمات الاستخدام"
                value={values.usageInstructions}
                onChangeText={handleChange('usageInstructions')}
                onBlur={handleBlur('usageInstructions')}
                multiline
                numberOfLines={3}
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

          {showExpiryDatePicker && (
            <DateTimePicker
              value={new Date(values.expiryDate)}
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

          {showPurchaseDatePicker && (
            <DateTimePicker
              value={new Date(values.purchaseDate)}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowPurchaseDatePicker(false);
                if (selectedDate) {
                  setFieldValue('purchaseDate', selectedDate);
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

export default AddFertilizerScreen; 