import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ViewStyle,
  Modal,
  Switch,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { usePesticide } from '../../../context/PesticideContext';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { Button as CustomButton } from '../../../components/Button';
import { StackNavigationProp } from '@react-navigation/stack';
import { StockStackParamList } from '../../../navigation/types';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Yup from 'yup';

type AddPesticideProps = {
  navigation: StackNavigationProp<StockStackParamList, 'AddPesticide'>;
};

const UNITS = [
  { label: 'كيلوغرام (kg)', value: 'kg' },
  { label: 'لتر (L)', value: 'L' },
  { label: 'مليلتر (mL)', value: 'mL' },
  { label: 'غرام (g)', value: 'g' },
];

interface FormPage {
  title: string;
  fields: string[];
}

const FORM_PAGES: FormPage[] = [
  {
    title: 'المعلومات الأساسية',
    fields: ['name', 'description', 'isNatural'],
  },
  {
    title: 'الكمية والسعر',
    fields: ['quantity', 'unit', 'price'],
  },
  {
    title: 'تفاصيل إضافية',
    fields: ['manufacturer', 'expiryDate'],
  },
  {
    title: 'التعليمات',
    fields: ['applicationInstructions', 'safetyPrecautions'],
  },
];

const categories: { value: StockCategory; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: 'seeds', label: 'البذور', icon: 'seed-outline' },
  { value: 'fertilizer', label: 'الأسمدة', icon: 'bottle-tonic-plus-outline' },
  { value: 'harvest', label: 'المحاصيل', icon: 'basket-outline' },
  { value: 'feed', label: 'الأعلاف', icon: 'food-outline' },
  { value: 'pesticide', label: 'المبيدات', icon: 'spray-bottle' },
  { value: 'equipment', label: 'المعدات', icon: 'tractor-variant' },
  { value: 'tools', label: 'الأدوات', icon: 'tools' }
];

const units: { value: StockUnit; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: 'kg', label: 'كيلوغرام', icon: 'scale' },
  { value: 'g', label: 'غرام', icon: 'scale' },
  { value: 'l', label: 'لتر', icon: 'bottle-soda' },
  { value: 'ml', label: 'مليلتر', icon: 'bottle-soda' },
  { value: 'units', label: 'وحدة', icon: 'package-variant' }
];

const qualityOptions: { value: 'good' | 'medium' | 'poor'; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }[] = [
  { value: 'good', label: 'جيد', icon: 'check-decagram', color: '#4CAF50' },
  { value: 'medium', label: 'متوسط', icon: 'alert-circle', color: '#FFC107' },
  { value: 'poor', label: 'سيء', icon: 'close-circle', color: '#F44336' }
];

const validationSchema = Yup.object().shape({
  name: Yup.string().required('اسم المنتج مطلوب'),
  quantity: Yup.number()
    .required('الكمية مطلوبة')
    .min(0, 'يجب أن تكون الكمية إيجابية'),
  unit: Yup.string().required('الوحدة مطلوبة'),
  category: Yup.string().required('الفئة مطلوبة'),
  lowStockThreshold: Yup.number()
    .required('الحد الأدنى للمخزون مطلوب')
    .min(0, 'يجب أن يكون الحد الأدنى إيجابياً'),
  location: Yup.string(),
  supplier: Yup.string(),
  price: Yup.number().nullable().min(0, 'يجب أن يكون السعر إيجابياً'),
  notes: Yup.string(),
  isNatural: Yup.boolean(),
  qualityStatus: Yup.string().oneOf(['good', 'medium', 'poor']).required('حالة الجودة مطلوبة'),
  batchNumber: Yup.string(),
  expiryDate: Yup.date().nullable()
});

export const AddPesticide = ({ navigation }: AddPesticideProps) => {
  const theme = useTheme();
  const { createPesticide, loading } = usePesticide();
  const [currentPage, setCurrentPage] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: '',
    price: '',
    isNatural: false,
    manufacturer: '',
    expiryDate: '',
    applicationInstructions: '',
    safetyPrecautions: '',
  });
  const [error, setError] = useState<string | null>(null);
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withSpring(currentPage / (FORM_PAGES.length - 1));
  }, [currentPage]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        expiryDate: selectedDate.toISOString().split('T')[0],
      });
    }
  };

  const handleSubmit = async () => {
    if (currentPage < FORM_PAGES.length - 1) {
      setCurrentPage(currentPage + 1);
      return;
    }

    try {
      setError(null);
      await createPesticide({
        ...formData,
        quantity: Number(formData.quantity),
        price: Number(formData.price),
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pesticide');
    }
  };

  const renderField = (field: string) => {
    switch (field) {
      case 'name':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              اسم المبيد
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="أدخل اسم المبيد"
              placeholderTextColor={theme.colors.neutral.textSecondary}
            />
          </View>
        );

      case 'description':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الوصف
            </Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="أدخل وصف المبيد"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'quantity':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الكمية
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              placeholder="0"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              keyboardType="numeric"
            />
          </View>
        );

      case 'unit':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الوحدة
            </Text>
            <TouchableOpacity
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                borderColor: theme.colors.neutral.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }]}
              onPress={() => setShowUnitPicker(true)}
            >
              <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.neutral.textSecondary} />
              <Text style={{ color: formData.unit ? theme.colors.neutral.textPrimary : theme.colors.neutral.textSecondary }}>
                {formData.unit || 'اختر الوحدة'}
              </Text>
            </TouchableOpacity>
            <Modal
              visible={showUnitPicker}
              transparent
              animationType="slide"
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.pickerContainer, { backgroundColor: theme.colors.neutral.surface }]}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowUnitPicker(false)}>
                      <Text style={[styles.pickerButton, { color: theme.colors.primary.base }]}>إلغاء</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowUnitPicker(false)}>
                      <Text style={[styles.pickerButton, { color: theme.colors.primary.base }]}>تم</Text>
                    </TouchableOpacity>
                  </View>
                  <Picker
                    selectedValue={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    {UNITS.map((unit) => (
                      <Picker.Item key={unit.value} label={unit.label} value={unit.value} />
                    ))}
                  </Picker>
                </View>
              </View>
            </Modal>
          </View>
        );

      case 'price':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              السعر
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              placeholder="0"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              keyboardType="numeric"
            />
          </View>
        );

      case 'manufacturer':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              الشركة المصنعة
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.manufacturer}
              onChangeText={(text) => setFormData({ ...formData, manufacturer: text })}
              placeholder="أدخل اسم الشركة المصنعة"
              placeholderTextColor={theme.colors.neutral.textSecondary}
            />
          </View>
        );

      case 'expiryDate':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              تاريخ انتهاء الصلاحية
            </Text>
            <TouchableOpacity
              style={[styles.input, { 
                backgroundColor: theme.colors.neutral.surface,
                borderColor: theme.colors.neutral.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }]}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={24} color={theme.colors.neutral.textSecondary} />
              <Text style={{ color: formData.expiryDate ? theme.colors.neutral.textPrimary : theme.colors.neutral.textSecondary }}>
                {formData.expiryDate || 'اختر التاريخ'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.expiryDate ? new Date(formData.expiryDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>
        );

      case 'applicationInstructions':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              تعليمات الاستخدام
            </Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.applicationInstructions}
              onChangeText={(text) => setFormData({ ...formData, applicationInstructions: text })}
              placeholder="أدخل تعليمات الاستخدام"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'safetyPrecautions':
        return (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.neutral.textPrimary }]}>
              احتياطات السلامة
            </Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: theme.colors.neutral.surface,
                color: theme.colors.neutral.textPrimary,
                borderColor: theme.colors.neutral.border,
                textAlign: 'right'
              }]}
              value={formData.safetyPrecautions}
              onChangeText={(text) => setFormData({ ...formData, safetyPrecautions: text })}
              placeholder="أدخل احتياطات السلامة"
              placeholderTextColor={theme.colors.neutral.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'isNatural':
        return (
          <TouchableOpacity
            style={[styles.checkboxContainer, { borderColor: theme.colors.neutral.border }]}
            onPress={() => setFormData({ ...formData, isNatural: !formData.isNatural })}
          >
            <Text style={[styles.checkboxLabel, { color: theme.colors.neutral.textPrimary }]}>
              مبيد طبيعي
            </Text>
            <View style={[
              styles.checkbox,
              formData.isNatural && { backgroundColor: theme.colors.success }
            ]}>
              {formData.isNatural && (
                <Feather name="check" size={16} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.neutral.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.neutral.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.neutral.textPrimary }]}>
          {FORM_PAGES[currentPage].title}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={theme.colors.neutral.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.neutral.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: theme.colors.primary.base },
              progressStyle,
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.neutral.textSecondary }]}>
          الخطوة {currentPage + 1} من {FORM_PAGES.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {FORM_PAGES[currentPage].fields.map((field) => (
            <View key={field}>
              {renderField(field)}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <CustomButton
          title={currentPage === FORM_PAGES.length - 1 ? 'إنهاء' : 'التالي'}
          onPress={handleSubmit}
          variant="primary"
          loading={loading}
          style={{ flex: 1, marginLeft: currentPage > 0 ? 8 : 0 }}
        />
        {currentPage > 0 && (
          <CustomButton
            title="السابق"
            onPress={() => setCurrentPage(currentPage - 1)}
            variant="secondary"
            style={{ flex: 1, marginRight: 8 }}
          />
        )}
      </View>
    </View>
  );
};

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  } as ViewStyle,
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  progressContainer: {
    padding: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.neutral.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral.border,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.border,
  },
  pickerButton: {
    fontSize: 16,
    fontWeight: '600',
  },
}));

export default AddPesticide; 