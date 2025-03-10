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
import { useSeed } from '../../../context/SeedContext';
import { StockSeed } from '../types';
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

type AddSeedScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddSeed'>;
  route: RouteProp<StockStackParamList, 'AddSeed'>;
};

const validationSchema = Yup.object().shape({
  name: Yup.string().required('اسم البذور مطلوب'),
  type: Yup.string().required('نوع البذور مطلوب'),
  quantity: Yup.number()
    .required('الكمية مطلوبة')
    .min(0, 'الكمية يجب أن تكون أكبر من أو تساوي 0'),
  unit: Yup.string().required('وحدة القياس مطلوبة'),
  price: Yup.number()
    .required('السعر مطلوب')
    .min(0, 'السعر يجب أن يكون أكبر من أو يساوي 0'),
  expiryDate: Yup.date().required('تاريخ الصلاحية مطلوب'),
});

const seedTypes = [
  { label: 'خضروات', value: 'vegetable' },
  { label: 'فواكه', value: 'fruit' },
  { label: 'حبوب', value: 'grain' },
  { label: 'زهور', value: 'flower' },
];

const AddSeedScreen: React.FC<AddSeedScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { seeds, addSeed, updateSeed, loading } = useSeed();
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);

  const seedId = route.params?.seedId;
  const existingSeed = seedId
    ? seeds.find(s => s.id === seedId)
    : null;

  const initialValues: Partial<StockSeed> = {
    name: existingSeed?.name || '',
    type: existingSeed?.type || seedTypes[0].value,
    quantity: existingSeed?.quantity || 0,
    unit: existingSeed?.unit || '',
    price: existingSeed?.price || 0,
    expiryDate: existingSeed?.expiryDate || new Date().toISOString(),
    variety: existingSeed?.variety || '',
    manufacturer: existingSeed?.manufacturer || '',
    batchNumber: existingSeed?.batchNumber || '',
    purchaseDate: existingSeed?.purchaseDate || new Date().toISOString(),
    location: existingSeed?.location || '',
    notes: existingSeed?.notes || '',
    supplier: existingSeed?.supplier || '',
    plantingInstructions: existingSeed?.plantingInstructions || '',
    germinationTime: existingSeed?.germinationTime || '',
    growingSeason: existingSeed?.growingSeason || '',
  };

  const handleSubmit = async (values: Partial<StockSeed>) => {
    try {
      if (seedId) {
        await updateSeed(seedId, values);
      } else {
        await addSeed(values);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حفظ البذور');
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
              {seedId ? 'تعديل البذور' : 'إضافة بذور جديدة'}
            </Text>

            <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                المعلومات الأساسية
              </Text>

              <TextInput
                label="اسم البذور"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                error={touched.name && errors.name}
              />

              <View style={styles.pickerContainer}>
                <Text style={[styles.label, { color: theme.colors.neutral.textSecondary }]}>
                  نوع البذور
                </Text>
                <Picker
                  selectedValue={values.type}
                  onValueChange={handleChange('type')}
                  style={[styles.picker, { color: theme.colors.neutral.textPrimary }]}
                >
                  {seedTypes.map(type => (
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

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowExpiryDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  تاريخ الصلاحية: {new Date(values.expiryDate || '').toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                معلومات إضافية
              </Text>

              <TextInput
                label="الصنف"
                value={values.variety}
                onChangeText={handleChange('variety')}
                onBlur={handleBlur('variety')}
              />

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
                  تاريخ الشراء: {new Date(values.purchaseDate || '').toLocaleDateString()}
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
                معلومات الزراعة
              </Text>

              <TextInput
                label="تعليمات الزراعة"
                value={values.plantingInstructions}
                onChangeText={handleChange('plantingInstructions')}
                onBlur={handleBlur('plantingInstructions')}
                multiline
                numberOfLines={3}
              />

              <TextInput
                label="وقت الإنبات"
                value={values.germinationTime}
                onChangeText={handleChange('germinationTime')}
                onBlur={handleBlur('germinationTime')}
              />

              <TextInput
                label="موسم النمو"
                value={values.growingSeason}
                onChangeText={handleChange('growingSeason')}
                onBlur={handleBlur('growingSeason')}
              />
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

          {showExpiryDatePicker && (
            <DateTimePicker
              value={new Date(values.expiryDate || '')}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowExpiryDatePicker(false);
                if (date) {
                  setFieldValue('expiryDate', date.toISOString());
                }
              }}
            />
          )}

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

export default AddSeedScreen; 