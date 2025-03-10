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
import { useFeed } from '../../../context/FeedContext';
import { StockFeed } from '../types';
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

type AddFeedScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddFeed'>;
  route: RouteProp<StockStackParamList, 'AddFeed'>;
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

const feedTypes = [
  { label: 'تبن', value: 'hay' },
  { label: 'حبوب', value: 'grain' },
  { label: 'كريات', value: 'pellets' },
  { label: 'مكملات', value: 'supplement' },
];

const AddFeedScreen: React.FC<AddFeedScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { feeds, addFeed, updateFeed, loading } = useFeed();
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [existingFeed, setExistingFeed] = useState<StockFeed | null>(null);

  useEffect(() => {
    if (route.params?.feedId) {
      const foundFeed = feeds.find(f => f.id === route.params.feedId);
      if (foundFeed) {
        setExistingFeed(foundFeed);
      }
    }
  }, [feeds, route.params?.feedId]);

  const initialValues: Partial<StockFeed> = {
    name: existingFeed?.name || '',
    type: existingFeed?.type || 'hay',
    quantity: existingFeed?.quantity || 0,
    unit: existingFeed?.unit || 'كيلوجرام',
    price: existingFeed?.price || 0,
    expiryDate: existingFeed?.expiryDate || new Date(),
    manufacturer: existingFeed?.manufacturer || '',
    batchNumber: existingFeed?.batchNumber || '',
    purchaseDate: existingFeed?.purchaseDate || new Date(),
    location: existingFeed?.location || '',
    supplier: existingFeed?.supplier || '',
    nutritionalInfo: existingFeed?.nutritionalInfo || '',
    recommendedUsage: existingFeed?.recommendedUsage || '',
    targetAnimals: existingFeed?.targetAnimals || '',
    notes: existingFeed?.notes || '',
  };

  const handleSubmit = async (values: Partial<StockFeed>) => {
    try {
      if (existingFeed) {
        await updateFeed(existingFeed.id, values);
      } else {
        await addFeed(values);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حفظ العلف');
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
                  {feedTypes.map(type => (
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
                معلومات التغذية
              </Text>
              <TextInput
                label="المعلومات الغذائية"
                value={values.nutritionalInfo}
                onChangeText={handleChange('nutritionalInfo')}
                onBlur={handleBlur('nutritionalInfo')}
                multiline
                numberOfLines={3}
              />
              <TextInput
                label="الاستخدام الموصى به"
                value={values.recommendedUsage}
                onChangeText={handleChange('recommendedUsage')}
                onBlur={handleBlur('recommendedUsage')}
                multiline
                numberOfLines={3}
              />
              <TextInput
                label="الحيوانات المستهدفة"
                value={values.targetAnimals}
                onChangeText={handleChange('targetAnimals')}
                onBlur={handleBlur('targetAnimals')}
                multiline
                numberOfLines={2}
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

export default AddFeedScreen; 