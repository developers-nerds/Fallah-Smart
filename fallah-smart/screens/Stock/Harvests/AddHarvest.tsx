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

type AddHarvestScreenProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddHarvest'>;
  route: RouteProp<StockStackParamList, 'AddHarvest'>;
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
    name: existingHarvest?.name || '',
    type: existingHarvest?.type || 'vegetable',
    quantity: existingHarvest?.quantity || 0,
    unit: existingHarvest?.unit || 'كيلوجرام',
    price: existingHarvest?.price || 0,
    harvestDate: existingHarvest?.harvestDate || new Date(),
    variety: existingHarvest?.variety || '',
    location: existingHarvest?.location || '',
    quality: existingHarvest?.quality || '',
    storageConditions: existingHarvest?.storageConditions || '',
    harvestMethod: existingHarvest?.harvestMethod || '',
    yield: existingHarvest?.yield || '',
    weatherConditions: existingHarvest?.weatherConditions || '',
    notes: existingHarvest?.notes || '',
  };

  const handleSubmit = async (values: Partial<StockHarvest>) => {
    try {
      if (existingHarvest) {
        await updateHarvest(existingHarvest.id, values);
      } else {
        await addHarvest(values);
      }
      navigation.goBack();
    } catch (error) {
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
                onPress={() => setShowHarvestDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.colors.neutral.textPrimary }]}>
                  تاريخ الحصاد: {new Date(values.harvestDate).toLocaleDateString()}
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
                label="موقع الحصاد"
                value={values.location}
                onChangeText={handleChange('location')}
                onBlur={handleBlur('location')}
              />
              <TextInput
                label="الجودة"
                value={values.quality}
                onChangeText={handleChange('quality')}
                onBlur={handleBlur('quality')}
              />
              <TextInput
                label="ظروف التخزين"
                value={values.storageConditions}
                onChangeText={handleChange('storageConditions')}
                onBlur={handleBlur('storageConditions')}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={[styles.section, { backgroundColor: theme.colors.neutral.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.neutral.textPrimary }]}>
                معلومات الحصاد
              </Text>
              <TextInput
                label="طريقة الحصاد"
                value={values.harvestMethod}
                onChangeText={handleChange('harvestMethod')}
                onBlur={handleBlur('harvestMethod')}
                multiline
                numberOfLines={2}
              />
              <TextInput
                label="الإنتاجية"
                value={values.yield}
                onChangeText={handleChange('yield')}
                onBlur={handleBlur('yield')}
              />
              <TextInput
                label="الظروف الجوية"
                value={values.weatherConditions}
                onChangeText={handleChange('weatherConditions')}
                onBlur={handleBlur('weatherConditions')}
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

          {showHarvestDatePicker && (
            <DateTimePicker
              value={new Date(values.harvestDate)}
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

export default AddHarvestScreen; 